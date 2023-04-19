import { cloneDeep } from "lodash";
import { ItemDoc, ItemDocInit, ItemList, ItemListInit, RecipeItem } from "./DBSchema";
import { GlobalDataState } from "./GlobalDataProvider";
import { GlobalSettings } from "./GlobalState";
import { getListGroupIDFromListOrGroupID, getRowTypeFromListOrGroupID } from "./Utilities";
import { translatedItemName } from "./translationUtilities";
import { RowType } from "./DataTypes";

export function isRecipeItemOnList({ recipeItem, listOrGroupID,globalData} : 
    {recipeItem: RecipeItem, listOrGroupID: string | null,
    globalData : GlobalDataState}): [boolean, string|null] {

    let inList = false;
    let itemID: string|null = null
    console.log("IRIOL: ",recipeItem,listOrGroupID);
    const listGroupID = getListGroupIDFromListOrGroupID(listOrGroupID as string,globalData.listCombinedRows);
    console.log("IRIOL: ListGroupID returned:",listGroupID);
    if (listGroupID === null) {return [inList,itemID]}
    let foundItem = globalData.itemDocs.find(item => (item.listGroupID == listGroupID && 
        (translatedItemName(item.globalItemID,item.name).toLocaleUpperCase() == recipeItem.name.toLocaleUpperCase() ||
// TODO : Add other plural checking once built
        item.globalItemID === recipeItem.globalItemID)
        ));
    console.log("IRIOL: foundItem",foundItem)    
    if (foundItem == undefined) {return [inList,itemID]}
    else { inList = true; itemID = foundItem._id as string}
    return [inList,itemID]
}
//TODO : We are relying on globalData, but after an update or add of item it won't change 
// within the outer loop/function calls so will fail 
export async function updateItemFromRecipeItem({itemID,listOrGroupID,recipeItem,globalData, settings, db}:
    {itemID: string, listOrGroupID: string | null, recipeItem: RecipeItem, globalData: GlobalDataState, 
        settings: GlobalSettings, db: PouchDB.Database}) : Promise<string> {
    
    let status="";
    if (!recipeItem.addToList) {return "Item "+recipeItem.name+" not selected to add."}
    let uomMismatch = false;
    let overwroteNote = false;
    let updateError = false;
    let foundItem = globalData.itemDocs.find(item => item._id === itemID);
    if (foundItem === undefined) {return "No item found to update for "+recipeItem.name};
    console.log("Original found item:",cloneDeep(foundItem));
    let rowType: RowType | null = getRowTypeFromListOrGroupID(listOrGroupID as string,globalData.listCombinedRows)
    let updItem: ItemDoc = cloneDeep(foundItem);
    // TODO: filter updating of lists based on whether adding to listgroup or list
    // should also check on setting?
    updItem.lists.forEach(itemList => {
        itemList.active = true;
        itemList.completed = false;
        if (recipeItem.note != "") {
            if (itemList.note = "") {
                itemList.note = recipeItem.note
            } else {
                overwroteNote = true;
                itemList.note = recipeItem.note
            }
        }
        if (itemList.uomName === recipeItem.shoppingUOMName) {
            itemList.quantity = recipeItem.shoppingQuantity
        } else {
            uomMismatch = true;
            itemList.quantity = recipeItem.shoppingQuantity
        }
    })
    console.log("Updated Item values:",cloneDeep(updItem))
    try {await db.put(updItem)}
    catch(err) {console.log("ERROR updating item:",err); updateError = true;}
    if (updateError) {
        status = "Error Updating item:" + updItem.name;
    } else {
        status = "Updated item successfully: " + updItem.name;
        if (uomMismatch) {
            status=status+"\nWARNING: Unit of measure mismatch on " + updItem.name + "(shopping UoM is "+recipeItem.shoppingUOMName+ ",list was different) - please check."
        }
        if (overwroteNote) {
            status=status+"\nWARNING: Note on item overwritten with recipe note"
        }
    }
    return status;

}

export async function createNewItemFromRecipeItem({listOrGroupID,recipeItem,globalData,settings, db} : 
    {listOrGroupID: string | null, recipeItem: RecipeItem, globalData: GlobalDataState, settings: GlobalSettings, db: PouchDB.Database}) : Promise<string> {

    let status="";
    if (!recipeItem.addToList) {return "Item "+recipeItem.name+" not selected to add."};
    let addError = false;
    let rowType: RowType | null = getRowTypeFromListOrGroupID(listOrGroupID as string,globalData.listCombinedRows)
    let existingGlobalItem = globalData.globalItemDocs.find(gi => gi._id === recipeItem.globalItemID)
    let newItem: ItemDoc = cloneDeep(ItemDocInit);
    // TODO: filter updating of lists based on whether adding to listgroup or list
    // should also check on setting?
    newItem.globalItemID = recipeItem.globalItemID;
    newItem.listGroupID = getListGroupIDFromListOrGroupID(listOrGroupID as string, globalData.listCombinedRows);
    newItem.name = recipeItem.name;
    globalData.listRows.filter(lr => lr.listGroupID === newItem.listGroupID).forEach(lr => {
        let newItemList :ItemList = cloneDeep(ItemListInit);
        newItemList.active = true;
        newItemList.completed = false;
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
    catch(err) {console.log("ERROR adding item:",err); addError = true;}
    if (addError) {
        status = "Error Adding item:" + newItem.name;
    } else {
        status = "Updated item successfully: " + newItem.name;
    }
    return status;
}

