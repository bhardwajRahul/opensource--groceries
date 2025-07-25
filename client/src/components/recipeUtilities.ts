import { cloneDeep, isEmpty } from "lodash-es";
import { ItemDoc, ItemDocInit, ItemList, ItemListInit, RecipeItem } from "./DBSchema";
import { AddListOptions, GlobalSettings } from "./DBSchema";
import { getListGroupIDFromListOrGroupID, getRowTypeFromListOrGroupID} from "./Utilities";
import { translatedItemName, translatedUOMShortName } from "./translationUtilities";
import { RowType } from "./DataTypes";
import { getCommonKey } from "./ItemUtilities";
import { t } from 'i18next';
import log from './logger';
import { useGlobalDataStore } from "./GlobalData";

export async function isRecipeItemOnList({ recipeItem, listOrGroupID} : 
    {recipeItem: RecipeItem, listOrGroupID: string | null}): Promise<[boolean, string|null]> {
    const itemDocs = useGlobalDataStore.getState().itemDocs;
    const listCombinedRows = useGlobalDataStore.getState().listCombinedRows;
    let inList = false;
    let itemID: string|null = null
    const listGroupID = getListGroupIDFromListOrGroupID(listOrGroupID as string,listCombinedRows);
    if (listGroupID === null) {return [inList,itemID]}
    let itemExists=true;
    const itemResults = itemDocs.filter((item) => item.listGroupID = listGroupID);
    if (itemResults.length === 0) {itemExists=false;};
    if (itemExists && itemResults.length < 1) { itemExists = false};
    let foundItem: ItemDoc | null = null;
    if (itemExists) {
        for (let i = 0; i < itemResults.length; i++) {
            const item = cloneDeep(itemResults[i]) as ItemDoc;
            if (Object.prototype.hasOwnProperty.call(item, "pluralName")) {
                item.pluralName = isEmpty(item.pluralName) ? "" : item.pluralName
            } else {
                item.pluralName = item.name;
            }
            if (translatedItemName(item.globalItemID,item.name,item.name,1).toLocaleUpperCase() === recipeItem.name.toLocaleUpperCase() ||
                translatedItemName(item.globalItemID,item.name,item.name,2).toLocaleUpperCase() === recipeItem.name.toLocaleUpperCase() ||
                translatedItemName(item.globalItemID,item.pluralName!,item.pluralName,1).toLocaleUpperCase() === recipeItem.name.toLocaleUpperCase() ||
                translatedItemName(item.globalItemID,item.pluralName!,item.pluralName,2).toLocaleUpperCase() === recipeItem.name.toLocaleUpperCase() ||
                (item.globalItemID !== null && (item.globalItemID === recipeItem.globalItemID) )) {
                    foundItem = cloneDeep(item);
            } 
        }
    }
    if (foundItem === null) {return [inList,itemID]}
    else { inList = true; itemID = foundItem._id as string}
    return [inList,itemID]
}

export async function updateItemFromRecipeItem({itemID,listOrGroupID,recipeItem,settings}:
    {itemID: string, listOrGroupID: string | null, recipeItem: RecipeItem, settings: GlobalSettings}) : Promise<string> {
    
    const db = useGlobalDataStore.getState().db;
    const listCombinedRows = useGlobalDataStore.getState().listCombinedRows;
    const listDocs = useGlobalDataStore.getState().listDocs;
    const uomDocs = useGlobalDataStore.getState().uomDocs;

    if (db === null) {return "No Database Available"};
    let status="";
    if (!recipeItem.addToList) {return (t("error.recipe_item_not_selected_to_add",{recipeName: recipeItem.name}) as string) }
    let uomMismatch = false;
    let existingUOM = null;
    let overwroteNote = false;
    let updateError = false;
    let foundItem = null;
    let itemExists=true;
    try {foundItem = await db.get(itemID)}
    catch(err) {log.error("Could not retrieve item",err);itemExists=false};
    if (itemExists && foundItem == null) {itemExists =false}
    if (!itemExists) {return t("error.no_item_found_update_recipe",{itemName: recipeItem.name}) as string};
    const rowType: RowType | null = getRowTypeFromListOrGroupID(listOrGroupID as string,listCombinedRows)
    const listGroupID = getListGroupIDFromListOrGroupID(String(listOrGroupID),listCombinedRows);
    const updItem: ItemDoc = cloneDeep(foundItem) as ItemDoc;
    updItem.lists.forEach(itemList => {
        if (!itemList.stockedAt) {return}
        if (settings.addListOption === AddListOptions.dontAddAutomatically && 
            rowType === RowType.list &&
            itemList.listID !== listOrGroupID) { return }
        itemList.active = true;
        itemList.completed = false;
        if (recipeItem.note !== "") {
            if (itemList.note === "") {
                itemList.note = recipeItem.note;
            } else {
                overwroteNote = true;
                itemList.note = recipeItem.note;
            }
        }
        existingUOM = getCommonKey(updItem,"uomName",listDocs)
        if ( existingUOM === recipeItem.shoppingUOMName) {
            itemList.quantity = recipeItem.shoppingQuantity
        } else {
            uomMismatch = true;
//            itemList.quantity = recipeItem.shoppingQuantity  -- May not want to update if different
            if (itemList.note === "") {
                itemList.note = t("error.uom_mismatch_recipe_import_note",{quantity: recipeItem.shoppingQuantity, uom: translatedUOMShortName(recipeItem.shoppingUOMName,uomDocs,String(listGroupID),recipeItem.shoppingQuantity) });
            }
        }
    })
    try {await db.put(updItem)}
    catch(err) {log.error("Updating item:",err); updateError = true;}
    if (updateError) {
        status = t("error.updating_item_x",{name: updItem.name});
    } else {
        status = t("general.updated_item_successfully",{name: updItem.name});
        if (uomMismatch && (!isEmpty(recipeItem.shoppingUOMName) || !isEmpty(existingUOM))) {
            status=status+ "\n"+t("error.uom_mismatch_recipe_import_status",{name: updItem.name, shoppingUom: translatedUOMShortName(recipeItem.shoppingUOMName,uomDocs,String(listGroupID)), listUom: translatedUOMShortName(String(existingUOM),uomDocs,String(listGroupID))});
        }
        if (overwroteNote) {
            status=status+"\n"+t("error.recipe_note_overwritten")
        }
    }
    return status;

}

export async function createNewItemFromRecipeItem({listOrGroupID,recipeItem,settings} : 
    {listOrGroupID: string | null, recipeItem: RecipeItem, settings: GlobalSettings}) : Promise<string> {
    const db = useGlobalDataStore.getState().db;
    const globalItemDocs = useGlobalDataStore.getState().globalItemDocs;
    const listCombinedRows = useGlobalDataStore.getState().listCombinedRows;
    const listRows = useGlobalDataStore.getInitialState().listRows;
    
    if (db === null) {return "DB is Not Available"};
    let status="";
    if (!recipeItem.addToList) {return (t("error.recipe_item_not_selected_to_add",{recipeName: recipeItem.name}) as string)};
    let addError = false;
    const rowType: RowType | null = getRowTypeFromListOrGroupID(listOrGroupID as string,listCombinedRows)
    const existingGlobalItem = globalItemDocs.find(gi => gi._id === recipeItem.globalItemID)
    const newItem: ItemDoc = cloneDeep(ItemDocInit);
    newItem.globalItemID = recipeItem.globalItemID;
    newItem.listGroupID = getListGroupIDFromListOrGroupID(listOrGroupID as string, listCombinedRows);
    newItem.name = recipeItem.name;
    listRows.filter(lr => lr.listGroupID === newItem.listGroupID).forEach(lr => {
        const newItemList :ItemList = cloneDeep(ItemListInit);
        if (settings.addListOption === AddListOptions.dontAddAutomatically && 
            rowType === RowType.list &&
            lr.listDoc._id !== listOrGroupID) {
                newItemList.active = false
            } else {
                newItemList.active = true;
                newItemList.completed = false;
            }
        newItemList.note = recipeItem.note;
        if (existingGlobalItem !== undefined) {
            newItemList.categoryID = existingGlobalItem.defaultCategoryID
        } else {
            newItemList.categoryID = null;
        }    
        newItemList.listID = lr.listDoc._id as string;
        newItemList.stockedAt = true;
        newItemList.quantity = recipeItem.shoppingQuantity;
        if (recipeItem.shoppingUOMName !== null && recipeItem.shoppingUOMName !== "") {
            newItemList.uomName = recipeItem.shoppingUOMName
        } else if (existingGlobalItem !== undefined){
            newItemList.uomName = existingGlobalItem.defaultUOM
        }
        newItem.lists.push(newItemList);
    })
    try {await db.post(newItem)}
    catch(err) {log.error("Adding item:",err); addError = true;}
    if (addError) {
        status = t("general.error_adding_item_x",{name: newItem.name});
    } else {
        status = t("general.added_item_successfully",{name: newItem.name});
    }
    return status;
}

