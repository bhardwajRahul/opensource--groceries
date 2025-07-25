import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonItemGroup,
  IonItemDivider, IonButton, IonButtons, IonFab, IonFabButton, IonIcon, IonCheckbox, IonLabel, IonSelect,
  IonSelectOption, IonInput, IonPopover, IonAlert,IonMenuButton, useIonToast, 
  useIonAlert, 
  CheckboxChangeEventDetail} from '@ionic/react';
import { add,chevronUp,documentTextOutline,searchOutline } from 'ionicons/icons';
import React, { useState, useEffect, useContext, useRef, KeyboardEvent, useCallback, JSX } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import './Items.css';
import { useUpdateGenericDocument, useCreateGenericDocument, useItems } from '../components/Usehooks';
import { GlobalStateContext } from '../components/GlobalState';
import { AddListOptions, DefaultColor } from '../components/DBSchema';
import { ItemSearch, SearchState, PageState, ListCombinedRow, HistoryProps, RowType, ItemSearchType, CategoryRows, SearchStateInit, ListSelectRow} from '../components/DataTypes'
import { ItemDoc, ItemDocs, ItemListInit, ItemList, ItemDocInit, CategoryDoc, UomDoc, GlobalItemDocs } from '../components/DBSchema';
import { getAllSearchRows, getItemRows, filterSearchRows, checkNameInGlobalItems, useListSelectRows } from '../components/ItemUtilities';
import SyncIndicator from '../components/SyncIndicator';
import ErrorPage from './ErrorPage';
import { Loading } from '../components/Loading';
import { isEqual, debounce, cloneDeep } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import log from "../components/logger";
import { navigateToFirstListID } from '../components/RemoteUtilities';
import { Capacitor } from '@capacitor/core';
import { translatedItemName } from '../components/translationUtilities';
import { useGlobalDataStore } from '../components/GlobalData';

const Items: React.FC<HistoryProps> = () => {
  const { mode: routeMode, id: routeListID  } = useParams<{mode: string, id: string}>();
  const [searchRows,setSearchRows] = useState<ItemSearch[]>();
  const [searchState,setSearchState] = useState<SearchState>(SearchStateInit);
  const [pageState, setPageState] = useState<PageState>({selectedListOrGroupID: routeListID,
          selectedListType: (routeMode === "list" ? RowType.list : RowType.listGroup) ,
          ignoreCheckOffWarning: false,
          groupIDforSelectedList: null,
          itemRows: [], categoryRows: [],showAlert: false, alertHeader: "", alertMessage: ""});
  const searchRef=useRef<HTMLIonInputElement>(null);
  const enterKeyValueRef=useRef<string>("");
  const doingUpdate=useRef(false);
  const [presentToast] = useIonToast();
  const [presentAlert, dismissAlert] = useIonAlert();
  const updateItemInList = useUpdateGenericDocument();
  const addNewItem = useCreateGenericDocument();
  const screenLoading = useRef(true);
  const { dbError: baseItemError, itemRowsLoaded: baseItemRowsLoaded, itemRows: baseItemDocs} = useItems(
      {selectedListGroupID: pageState.groupIDforSelectedList,
        isReady: (pageState.groupIDforSelectedList !== null && pageState.selectedListOrGroupID !== null),
        needListGroupID: true, activeOnly: true, selectedListID: pageState.selectedListOrGroupID,
        selectedListType: pageState.selectedListType});
  const { dbError: baseSearchError, itemRowsLoaded: baseSearchItemRowsLoaded, itemRows: baseSearchItemDocs} = useItems(
    {selectedListGroupID: pageState.groupIDforSelectedList,
      isReady: (pageState.groupIDforSelectedList !== null && pageState.selectedListOrGroupID !== null),
      needListGroupID: true, activeOnly: false, selectedListID: pageState.selectedListOrGroupID,
      selectedListType: pageState.selectedListType});
  const error = useGlobalDataStore((state) => state.error);
  const isLoading = useGlobalDataStore((state) => state.isLoading);
  const listDocs = useGlobalDataStore((state) => state.listDocs);
  const listCombinedRows = useGlobalDataStore((state) => state.listCombinedRows);
  const listRows = useGlobalDataStore((state) => state.listRows);
  const listRowsLoaded = useGlobalDataStore((state) => state.listRowsLoaded);
  const uomDocs = useGlobalDataStore((state) => state.uomDocs);
  const categoryDocs = useGlobalDataStore((state) => state.categoryDocs);
  const itemDocs = useGlobalDataStore((state) => state.itemDocs);
  const globalItemDocs = useGlobalDataStore((state) => state.globalItemDocs);
  const { globalState,setStateInfo: setGlobalStateInfo, updateSettingKey} = useContext(GlobalStateContext);
  const {t} = useTranslation();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const scrollTopRef = useRef(0);
  const shouldScroll = useRef(false);
  const history = useHistory();
  const listSelectRows = useListSelectRows();

  const getGroupIDForList = useCallback( (listID: string | null) => {
    if (routeMode === "group") { return pageState.selectedListOrGroupID};
    let retGID = null;
    for (let i = 0; i < listRows.length; i++) {
      if (listRows[i].listDoc._id === listID) { retGID=String(listRows[i].listGroupID); break}
    }
    return retGID;
  },[pageState.selectedListOrGroupID,listRows,routeMode])

  useEffect( () => {
    if ( listRowsLoaded && listCombinedRows.filter(lcr => (lcr.listOrGroupID === routeListID)).length === 0) {
      navigateToFirstListID(history, listRows, listCombinedRows, null);
    } else { 
      setPageState(prevState => ({...prevState,selectedListOrGroupID: routeListID, selectedListType: (routeMode === "group" ? RowType.listGroup : RowType.list)}))
    }
  },[routeListID,routeMode,listCombinedRows,listRows,listRowsLoaded,history])

  useEffect( () => {
    if (listRowsLoaded) {
      setPageState(prevState => ({...prevState,groupIDforSelectedList: getGroupIDForList(pageState.selectedListOrGroupID)}))
    }
  },[listRowsLoaded,pageState.selectedListOrGroupID,getGroupIDForList])

  useEffect( () => {
    if (baseItemRowsLoaded && listRowsLoaded && !isLoading) {
      setPageState( (prevState) => {
        const [newItemRows,newCategoryRows] = getItemRows(baseItemDocs as ItemDocs, listCombinedRows, categoryDocs as CategoryDoc[], uomDocs as UomDoc[], pageState.selectedListType, pageState.selectedListOrGroupID, prevState.categoryRows, globalState.categoryColors)
        return (
        { ...prevState,
        doingUpdate: false,
        itemRows: newItemRows, categoryRows: newCategoryRows
          })
      });
    }
  },[baseItemRowsLoaded, listRowsLoaded, isLoading, 
    uomDocs, baseItemDocs, listCombinedRows, categoryDocs, pageState.selectedListOrGroupID, pageState.selectedListType, globalState.categoryColors]);

  useEffect( () => {
    if (baseSearchItemRowsLoaded && !isLoading) {
      setSearchState(prevState => ({...prevState,isOpen: false, isFocused: false}));
      setSearchRows(getAllSearchRows(baseSearchItemDocs as ItemDocs,pageState.selectedListOrGroupID, pageState.selectedListType, listDocs, globalItemDocs as GlobalItemDocs, globalState.settings));
    }
  },[baseSearchItemRowsLoaded, isLoading, globalItemDocs, baseSearchItemDocs, pageState.selectedListOrGroupID, pageState.selectedListType, listDocs, globalState.settings])

  const filterAndCheckRows = useCallback((searchCriteria: string, setFocus : boolean) => {
    const filterRows=filterSearchRows(searchRows, searchCriteria)
    let toOpen=true;
    if (filterRows.length === 0 || !setFocus) {
      toOpen=false;
    }
    let toFocus=setFocus;
    if (toOpen) { toFocus = true};
    setSearchState(prevState => ({...prevState, searchCriteria: searchCriteria, filteredSearchRows: filterRows, isOpen: toOpen, isFocused: toFocus }));
  },[searchRows])

  useEffect( () => {
    filterAndCheckRows(searchState.searchCriteria,searchState.isFocused);
  },[searchRows,searchState.isFocused,searchState.searchCriteria,filterAndCheckRows])

  const shouldBeActive = useCallback( (itemList: ItemList, newRow: boolean, allItemLists: ItemList[]): boolean => {
    if (!newRow && !itemList.stockedAt) {
      if (pageState.selectedListType === RowType.list && itemList.listID === pageState.selectedListOrGroupID) {
        return true;
      } else {
        return false;
      }
    }
    if (globalState.settings.addListOption === AddListOptions.dontAddAutomatically) {
      if (pageState.selectedListType === RowType.listGroup) {
         return true;
      } else {
        if (newRow) {
          return (itemList.listID === pageState.selectedListOrGroupID)
        } else {
          return itemList.active || (itemList.listID === pageState.selectedListOrGroupID)
        }
      }
    }
    if (globalState.settings.addListOption === AddListOptions.addToAllListsAutomatically) {
      return true;
    } 
    // Add list option = by category
    if (pageState.selectedListType === RowType.list) {
      if (itemList.listID === pageState.selectedListOrGroupID) {
        return true;
      }
    }
    // add by category mode, either in listgroup mode or are in list mode and we are on a different list
    if (itemList.categoryID === null) {
      if (newRow) {return false}
      let allUncategorized=true;
      for (const il of allItemLists) {
        if (il.categoryID !== null) {allUncategorized=false}
      }
      return allUncategorized;
    }
    const matchingListRow = listRows.find((lr) => lr.listDoc._id === itemList.listID)
    if (matchingListRow === undefined) {return false}
    if (matchingListRow.listDoc.categories.includes(String(itemList.categoryID))) {
      return true;
    }
    return false;
  },[globalState.settings.addListOption,listRows,pageState.selectedListOrGroupID,pageState.selectedListType])

  const addExistingItemToList = useCallback(async (itemSearch: ItemSearch) : Promise<{success: boolean, errorHeader: string, errorMessage: string}> => {

    /*  scenarios:
      
    Item exist check:
      if global item, check for same name or same globalitemID in listgroup
      If local item, check for same name or item id in listgroup

      * Item exists
          * Item is active on all lists -- error
          * Item is active on no lists -- in listgroup, update all to active, in list, check setting, same as below
          * Item is active on some lists -- in listgroup mode, update item to active on all
                                            in list mode, depending on setting to "add to all", update item to active on all or just one
      * Item does not exist
          * Add item, set to active based on listgroup mode/list selected -- data comes from global item if needed
 */

    const response = { success: true, errorHeader: "", errorMessage: ""};

    let testItemDoc: ItemDoc | undefined = undefined;
    testItemDoc = cloneDeep(itemDocs.find((item) => ((item._id === itemSearch.itemID && item.listGroupID === pageState.groupIDforSelectedList) || 
              (item.name === itemSearch.itemName && item.listGroupID === pageState.groupIDforSelectedList))) );

    const addingNewItem = (testItemDoc === undefined);

    if (!addingNewItem) {
      if (testItemDoc!.lists.filter(il => il.active && !il.completed).length === testItemDoc!.lists.length) {
        response.success = false;
        response.errorHeader = t("error.header_adding_item");
        response.errorMessage = t("error.item_exists_current_list");
        return response;
      }
    }
    const newItem: ItemDoc = cloneDeep(ItemDocInit);
    if (addingNewItem) {
      let activeCount = 0;
      if (itemSearch.itemType === ItemSearchType.Global) {
        newItem.globalItemID = itemSearch.globalItemID;
        newItem.listGroupID = pageState.groupIDforSelectedList;
        newItem.name = itemSearch.itemName;
        newItem.pluralName = translatedItemName(itemSearch.globalItemID,newItem.name,newItem.name,2);
        listRows.forEach((lr) => {
          if (lr.listGroupID === pageState.groupIDforSelectedList) {
            const newItemList: ItemList = cloneDeep(ItemListInit); // sets to active true by default
            newItemList.listID = String(lr.listDoc._id);
            if (lr.listDoc.categories.includes(String(itemSearch.globalItemCategoryID))) {
              newItemList.categoryID = itemSearch.globalItemCategoryID
            }
            newItemList.uomName = itemSearch.globalItemUOM;
            newItemList.quantity = 1;
            newItemList.active = shouldBeActive(newItemList,true,[]);
            activeCount = newItemList.active ? (activeCount + 1) : activeCount;
            newItem.lists.push(newItemList);
          }
        })
      }  
      else { 
        newItem.globalItemID = null;
        newItem.listGroupID = pageState.groupIDforSelectedList;
        newItem.name = itemSearch.itemName;
        listRows.forEach((lr) => {
          if (lr.listGroupID === pageState.groupIDforSelectedList) {
            const newItemList: ItemList = cloneDeep(ItemListInit);
            newItemList.listID = String(lr.listDoc._id);
            newItemList.quantity = 1;
            newItemList.active = shouldBeActive(newItemList,true,[]);
            activeCount = newItemList.active ? (activeCount + 1) : activeCount;
            newItem.lists.push(newItemList);
          }
        })
      }  
      if (activeCount === 0) {
        await presentAlert({header: t("error.header_warning_adding_item"), message: t("error.warning_none_set_active"), buttons: [t("general.ok")]})
      }
      const itemAdded = await addNewItem(newItem);
      if (!itemAdded.successful) {
        response.success=false;
        response.errorHeader = t("error.header_adding_item");
        response.errorMessage = t("error.adding_item");
      }
      return response;
    }
// Finished adding new item where it didn't exist. Now update existing item, active on no or some lists
    let activeCount = 0;
    const origLists = cloneDeep(testItemDoc!.lists);
    testItemDoc!.lists.forEach(il => {
      il.active = shouldBeActive(il,false,origLists);
      activeCount = il.active ? (activeCount + 1) : activeCount;
      if (il.active) { il.completed = false;}
    })
    if (!isEqual(origLists,testItemDoc!.lists)) {
      const result = await updateItemInList(testItemDoc);
      if (activeCount === 0) {
        await presentAlert({header: t("error.header_warning_adding_item"), message: t("error.warning_none_set_active"), buttons: [t("general.ok")]})
      }
      if (!result.successful) {
        response.success=false;
        response.errorHeader = t("error.header_adding_item.");
        response.errorMessage = t("error.updating_item");
        return response;
      }
    }
    return response;
    },[addNewItem,itemDocs,listRows,pageState.groupIDforSelectedList,presentAlert,shouldBeActive,t,updateItemInList])

  const isItemAlreadyInList = useCallback( (itemName: string,completedOnly: boolean): [boolean,ItemDoc|null] => {
    if (itemName === "") {return [false,null];}
    const existingItem = (baseItemDocs as ItemDocs).find((el) => 
      (itemName.toLocaleUpperCase() === translatedItemName(String(el._id),el.name,el.pluralName,1).toLocaleUpperCase() ||
       itemName.toLocaleUpperCase() === translatedItemName(String(el._id),el.name,el.pluralName,2).toLocaleUpperCase()
        )
       );
    if (existingItem === undefined) {return [false,null];}
    if (!completedOnly) {return [true,existingItem];}
    // Have an existing item... checking completed flag
    if (pageState.selectedListType === RowType.list) {
      const itemList = existingItem.lists.find(il => il.listID === pageState.selectedListOrGroupID);
      if (itemList === undefined) {return [false,null];}
      return [itemList.active && itemList.completed,existingItem];
    }
    // Listgroup mode
    let allCompleted=true;
    for (let i = 0; i < existingItem.lists.length; i++) {
        if (!existingItem.lists[i].completed) {allCompleted=false; break;}
    }
    return [allCompleted,existingItem];
  },[baseItemDocs,pageState.selectedListOrGroupID,pageState.selectedListType])

  const addNewItemToList = useCallback( async (itemName: string) => {
      const [isItemAlreadyInListAsCompleted,compItem] = isItemAlreadyInList(itemName,true);
      if (isItemAlreadyInListAsCompleted && compItem !== null) {
        const itemSearch: ItemSearch = {
          itemID: String(compItem?._id),
          itemName: translatedItemName(String(compItem._id),compItem.name,compItem.pluralName),
          itemType: compItem.globalItemID === null ? ItemSearchType.Local : ItemSearchType.Global,
          globalItemID: compItem.globalItemID,
          globalItemCategoryID: null,
          globalItemUOM: null,
          quantity: 1,
          boughtCount: 0
        }
        const {success,errorHeader,errorMessage}  = await addExistingItemToList(itemSearch);
        setSearchState(prevState => ({...prevState, searchCriteria: "", filteredSearchRows: [], isOpen: false, isFocused: false}));
        if (!success) {
          setPageState(prevState => ({...prevState,showAlert: true, alertHeader: errorHeader, alertMessage: errorMessage}));
        }      
        return;
      }
      const [isItemAlreadyInListAtAll,] = isItemAlreadyInList(itemName,false); 
      if (isItemAlreadyInListAtAll) {
        setPageState(prevState => ({...prevState, showAlert: true, alertHeader: t("error.adding_to_list") , alertMessage: t("error.item_exists_current_list")}))
        setSearchState(prevState => ({...prevState, isOpen: false, searchCriteria: "", filteredSearchRows: [], isFocused: false}))
      } else {
        setGlobalStateInfo("itemMode","new");
        setGlobalStateInfo("callingListID",pageState.selectedListOrGroupID);
        setGlobalStateInfo("callingListType",pageState.selectedListType);
        const [,globalItemID] = checkNameInGlobalItems(globalItemDocs,itemName,itemName);
        setGlobalStateInfo("newItemGlobalItemID",globalItemID)
        setGlobalStateInfo("newItemName",itemName);
        setSearchState(prevState => ({...prevState, isOpen: false,searchCriteria:"",filteredSearchRows: [],isFocused: false}))
        history.push("/item/new/");
      }
    }
  ,[history,isItemAlreadyInList,addExistingItemToList,pageState.selectedListOrGroupID,pageState.selectedListType,setGlobalStateInfo,t,globalItemDocs])
  
  useEffect( () => {
    function beforeInputData(e:InputEvent) {
      if (e && e.data && e.data.includes("\n")) {
          enterKeyValueRef.current= e.data.trim().length > 1 ? e.data.trim() : "";
          addNewItemToList(searchState.searchCriteria);
      }
    }
    if (searchRef && searchRef.current && (Capacitor.getPlatform() === "android")) {
      const localRef=searchRef.current;
      localRef.addEventListener('beforeinput',beforeInputData,false)
      return () => {
          localRef.removeEventListener('beforeinput',beforeInputData,false)
      }
    }
  },[addNewItemToList,searchState.searchCriteria])

  const warnCheckingOffItemsInListGroup = useCallback( (): Promise<boolean> => {
    return new Promise((resolve,) => {
      presentAlert({
        header: t("error.checking_items_list_group_header"),
        subHeader: t("error.checking_items_list_group_detail"),
        buttons: [ { text: t("general.cancel"), role: "Cancel" ,
                    handler: () => {dismissAlert(); resolve(false)}},
                    { text: t("general.continue_ignore"), role: "confirm",
                    handler: () => {setPageState(prevState => ({...prevState,ignoreCheckOffWarning: true})); dismissAlert(); resolve(true);}}]
      });
      })
  },[dismissAlert,presentAlert,t])    
  
  const completeItemRow = useCallback( async(id: string, event: CustomEvent<CheckboxChangeEventDetail>) => {
    if (pageState.selectedListType === RowType.listGroup && !pageState.ignoreCheckOffWarning) {
      if (! (await warnCheckingOffItemsInListGroup())) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event.target as any).checked = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event.target as any).disabled = false;
        doingUpdate.current = false;
        return;
      }
    }
    const newStatus = event.detail.checked;
    // make the update in the database, let the refresh of the view change state
    const itemDoc: ItemDoc = cloneDeep(baseItemDocs.find(element => (element._id === id))) as ItemDoc;
    let listChanged=false;
    itemDoc.lists.forEach((list: ItemList) => {
      let updateThisList=false;
      if (pageState.selectedListOrGroupID === list.listID) { updateThisList = true;}
      if (pageState.selectedListType === RowType.listGroup) { updateThisList = true};
      if (pageState.selectedListType === RowType.list &&
          globalState.settings.removeFromAllLists)
          { updateThisList = true;}
      if (updateThisList) {
        list.completed = Boolean(newStatus);
        if (newStatus) {
          list.boughtCount=list.boughtCount+1;
        }
        listChanged=true;
      }
    });
    if (listChanged) {
      const response = await updateItemInList(itemDoc);
      if (!response.successful) {
        presentToast({message: t("error.updating_item_completed"), duration: 1500, position: "middle"})
      }
    }
    doingUpdate.current = false;
    shouldScroll.current = true;
  },[baseItemDocs,globalState.settings.removeFromAllLists,pageState.ignoreCheckOffWarning,pageState.selectedListOrGroupID,
     pageState.selectedListType,presentToast,warnCheckingOffItemsInListGroup,t,updateItemInList])

  const completeItemRowStub = useCallback( async (id: string, event: CustomEvent<CheckboxChangeEventDetail>) => {
    const completeRowFunc = debounce((did: string,devent: CustomEvent<CheckboxChangeEventDetail>) => completeItemRow(did,devent),350,{leading: true, trailing: false})
    completeRowFunc(id,event);
  },[completeItemRow])

  if (baseItemError || baseSearchError || error ) {
    log.error("Error loading items:",cloneDeep({baseItemError,baseSearchError,error}));
    return (
    <ErrorPage errorText={t("general.loading_item_info_restart") as string}></ErrorPage>
  )}

/*   if (!baseItemRowsLoaded || !baseSearchItemRowsLoaded || !listRowsLoaded || categoryLoading || globalData.globalItemsLoading || uomLoading || pageState.doingUpdate )  {
    return ( <Loading isOpen={screenLoading.current} message={t("general.loading_items")} /> )
//    setIsOpen={() => {screenLoading.current = false}} /> )
  };
 */

// Reduce states that cause showing of loading screen to reduce page blink effect when clicking on-off items
  
   if (!listRowsLoaded || isLoading )  {
    return ( <Loading isOpen={screenLoading.current} message={t("general.loading_items")} /> )
  };
  
  screenLoading.current=false;

  function updateSearchCriteria(event: CustomEvent) {
    if (event.detail.value !== enterKeyValueRef.current) {
        setSearchState(prevState => ({...prevState, searchCriteria: event.detail.value, isFocused:true}));
        filterAndCheckRows(event.detail.value,true)
        enterKeyValueRef.current="";
    } else {
        setSearchState(prevState => ({...prevState,isFocused: false, isOpen: false, searchCriteria: ""}));
    }
  }

  function searchKeyPress(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter") {
      addNewItemToList(searchState.searchCriteria.trim());
      enterKeyValueRef.current= searchState.searchCriteria.trim().length > 1 ? searchState.searchCriteria.trim() : "";
    }
  }

  function leaveSearchBox() {
    setSearchState(prevState => ({...prevState, isOpen: false, isFocused: false}));
  }

  function enterSearchBox() {
    if (listRows.filter(lr => (lr.listGroupID === pageState.groupIDforSelectedList)).length <=0) {
      return;
    }
    let toOpen=true;
    if (searchState.filteredSearchRows.length === 0) { toOpen = false}
    setSearchState(prevState => ({...prevState, isFocused: true,isOpen: toOpen}));
  }
    
  async function chooseSearchItem(item: ItemSearch) {
    const {success,errorHeader,errorMessage}  = await addExistingItemToList(item);
    setSearchState(prevState => ({...prevState, searchCriteria: "", filteredSearchRows: [], isOpen: false, isFocused: false}));
    if (!success) {
      setPageState(prevState => ({...prevState,showAlert: true, alertHeader: errorHeader, alertMessage: errorMessage}));
    }      
  }


  function selectList(listOrGroupID: string) {
    if (listOrGroupID === "null" ) { return }
    const combinedRow: ListCombinedRow | undefined = listCombinedRows.find(lcr => lcr.listOrGroupID === listOrGroupID);
    if (combinedRow === undefined) {return};
    const newListType: RowType = combinedRow.rowType;
    const [newItemRows,newCategoryRows] = getItemRows(baseItemDocs as ItemDocs, listCombinedRows, categoryDocs as CategoryDoc[], uomDocs as UomDoc[], newListType, listOrGroupID, [], globalState.categoryColors)
    setPageState({...pageState, selectedListOrGroupID: listOrGroupID, selectedListType: newListType, itemRows: newItemRows, categoryRows: newCategoryRows });
    updateSettingKey("savedListID",listOrGroupID);
    if (combinedRow.rowType === RowType.list) {
      history.push('/items/list/'+combinedRow.listDoc._id);
    } else {
      history.push('/items/group/'+combinedRow.listGroupID);
    }
  }

  async function deleteCompletedItemsPrompt() {
       await presentAlert({
        header: t("general.confirm"),
        subHeader: t("general.confirm_remove_completed_items"),
        buttons: [ { text: t("general.cancel"), role: "Cancel" ,
                    handler: () => dismissAlert()},
                    { text: t("general.ok"), role: "Confirm",
                    handler: () => {deleteCompletedItems()}}]
      })
  }

  async function deleteCompletedItems() {
    (baseItemDocs as ItemDocs).forEach(async (itemDoc) => {
        const updatedItem: ItemDoc=cloneDeep(itemDoc);
        let itemUpdated = false;
        for (let i = 0; i < updatedItem.lists.length; i++) {
          const willUpdate = (updatedItem.lists[i].listID === pageState.selectedListOrGroupID || globalState.settings.completeFromAllLists) && updatedItem.lists[i].completed;
          if (!willUpdate) {continue}
          updatedItem.lists[i].active = false;
          itemUpdated = true;
        }
        if (itemUpdated) {
          const result = await updateItemInList(updatedItem);
          if (!result.successful) {
            presentToast({message: t("error.deleting_items_list"),
              duration: 1500, position: "middle"})
          }          
        }
    });
  }

  function collapseExpandCategory(catID: string | null, completed: boolean) {
    const newCatRows: CategoryRows = cloneDeep(pageState.categoryRows);
    const foundCat = newCatRows.find((catRow) => (catRow.id === catID && catRow.completed === completed))
    if (foundCat === undefined) {log.debug("No Matching Category to Collapse"); return};
    foundCat.collapsed = !foundCat.collapsed;
    setPageState(prevState => ({...prevState,categoryRows: newCatRows}));
  }

  function getCategoryExpanded(catID: string | null, completed: boolean) {
    const foundCat = pageState.categoryRows.find((catRow) => (catRow.id === catID && catRow.completed === completed))
    if (foundCat === undefined) {return true};
    return (!foundCat.collapsed)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popOverProps: any = {
    side: "bottom",
    isOpen: searchState.isOpen,
    keyboardClose: false,
    onDidDismiss: () => {leaveSearchBox()},
  }
  if (listRows && listRows.filter(lr => (lr.listGroupID === pageState.groupIDforSelectedList)).length >0) {
    popOverProps.trigger = "item-search-box-id"
  }
  const popOverElem = (
    <IonPopover key="popoverseach" {...popOverProps}>
    <IonContent><IonList key="popoverItemList">
      {(searchState.filteredSearchRows).map((item: ItemSearch) => (
        <IonItem button key={pageState.selectedListOrGroupID+"-poilist-"+item.itemID} onClick={() => {chooseSearchItem(item)}}>{item.itemName}</IonItem>
      ))}
    </IonList></IonContent>
    </IonPopover>
  )

  const alertElem = (
    <IonAlert
      key="mainerroralert"
      isOpen={pageState.showAlert}
      onDidDismiss={() => {setPageState(prevState => ({...prevState,showAlert: false, alertHeader:"",alertMessage:""}));}}
      header={pageState.alertHeader}
      message={pageState.alertMessage}
      buttons={[String(t("general.ok"))]}
    />
  )

  const headerElem=(
    <IonHeader key="pageheader"><IonToolbar key="pagetoolbar" id="items-page-header"><IonButtons key="headerbuttons" slot="start"><IonMenuButton key="headermenubutton" className={"ion-no-padding small-menu-button"} /></IonButtons>
    <IonTitle key="pagetitle" className="ion-no-padding item-outer"></IonTitle>
        <IonItem id="item-list-selector-id" className="item-list-selector" key="listselectoritem">
        <IonSelect key="listselectorselect" id="select-list-selector-id" className="select-list-selector" label={t("general.items_on") as string} aria-label={t("general.items_on") as string} interface="popover"
              onIonChange={(ev) => selectList(ev.detail.value)} value={pageState.selectedListOrGroupID} >
            {listSelectRows !== undefined ? listSelectRows.filter(lcr => (!lcr.hidden && !lcr.listGroupRecipe)).map((listSelectRow: ListSelectRow) => (
                <IonSelectOption disabled={listSelectRow.rowKey==="G-null"}
                    className={" "+ (listSelectRow.rowType === RowType.list ? "indented " : "listgroup ") + (listSelectRow.hasUncheckedItems ? "has-unchecked" : "no-unchecked" )}
                    key={listSelectRow.listOrGroupID} value={listSelectRow.listOrGroupID}>
                  {listSelectRow.rowName}
                </IonSelectOption>
            )) : <></>}
          </IonSelect>
         <SyncIndicator addPadding={false}/>
         </IonItem>
         {/* <IonItem>
          <ItemsSearch rowSelected={chooseSearchItem} addItemWithoutRow={addNewItemToList}/>
         </IonItem> */}
        <IonItem key="searchbar" className="item-search">
           <IonIcon icon={searchOutline}  slot="start"/>
           <IonInput key="itemsearchbox" id="item-search-box-id" aria-label="" className="ion-no-padding input-search" debounce={5} ref={searchRef} value={searchState.searchCriteria} inputmode="text" enterkeyhint="enter"
              disabled={listRows !== undefined ? listRows.filter(lr => (lr.listGroupID === pageState.groupIDforSelectedList)).length <=0 : true}
              clearInput={true}  placeholder={t("general.search") as string} fill="solid"
              onKeyDown= {(e) => searchKeyPress(e)}
              onIonInput={(e) => updateSearchCriteria(e)}
              onClick={() => enterSearchBox()}
/*                Not sure why, but when you have this specific setsearchstate, it captures the click on the item in the popover and nothing works /*
/*               onIonBlur={(e) => { setSearchState(prevState => ({...prevState,isFocused: false}))}} */           >   
           </IonInput>
          {/* <IonButton onClick={()=> clickedSearchCheck()}><IonIcon icon={checkmark} /></IonButton> */}
        </IonItem>
        {popOverElem}
        {alertElem}
    </IonToolbar></IonHeader>)

  const fabContent =  (
      <IonFab key="fab" slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton key="fabbutton" onClick={() => addNewItemToList("")}>
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
      </IonFab>)

  if (listRows && listRows.filter(lr => (lr.listGroupID === pageState.groupIDforSelectedList)).length <=0) {return(
    <IonPage>
      {headerElem}
      <IonContent>
        <IonItem key="nonefound">
          <IonLabel key="nothinghere">{t("error.please_create_list_before_adding_items")}</IonLabel>
          <IonButton routerLink='/list/new/new'>{t("general.create_new_list")}</IonButton>
        </IonItem>
      </IonContent>
    </IonPage>
  )};

  if (pageState.itemRows.length <=0 )  {return(
    <IonPage>{headerElem}<IonContent><IonItem key="nonefound"><IonLabel key="nothinghere">{t("error.no_items_on_list")}</IonLabel></IonItem></IonContent>{fabContent}</IonPage>
  )};

  const listContent=[];

  function addCurrentRows(listCont: JSX.Element[], curRows: JSX.Element[], catID: string | null, catName: string, catColor: string, completed: boolean | null) {
    if (catColor === "primary") {catColor = "#777777"}
    const isExpanded = getCategoryExpanded(catID,Boolean(completed));
    dividerCount++;
    const dividerProps = {
      className: "ion-justify-content-between category-divider item-category-divider " + 
          (dividerCount === 1 ? " first-category " : "") +
          (catID === null ? " uncategorized-color" : ""),
      style: {}
    }
    if (catID !== null) {
      dividerProps.style = {"borderBottom":"4px solid "+catColor}
    }
    listCont.push(
        <IonItemGroup key={"cat"+String(catID)+Boolean(completed).toString()}>
          <IonItemDivider key={"itemdivider"+String(catID)+Boolean(completed)} {...dividerProps} >
              <IonLabel className="ion-no-padding ion-float-left" slot="start" key={"itemdividercol1"+String(catID)+Boolean(completed)}>{catName}</IonLabel>
              <IonIcon slot="end" className={"ion-float-right collapse-icon" + (isExpanded ? " category-collapsed" : " category-expanded")} key={"itemdividericon"+String(catID)+Boolean(completed)} icon={chevronUp} size="large" onClick={() => {collapseExpandCategory(catID,Boolean(completed))}} />
          </IonItemDivider>
        {curRows}
        </IonItemGroup>
    )
  }

  function getCompletedDivider(count: number) {
    return (
      <IonItemGroup key="completeddividergroup">
        <IonItemDivider key="Completed" className={"category-divider item-category-divider "+(count===0 ? "first-category": "")}>
          <IonLabel key="completed-divider-label">{t("general.completed")}</IonLabel>
          <IonButton key="completeddividerbutton" slot="end" onClick={() => deleteCompletedItemsPrompt()}>{t("general.delete_completed_items")}</IonButton>
        </IonItemDivider>
      </IonItemGroup>)
  }

  let dividerCount = 0;
  let lastCategoryID : string | null = null;
  let lastCategoryName="<INITIAL>";
  let lastCategoryColor=DefaultColor;
  let lastCategoryFinished: boolean | null = null;
  let currentRows=[];
  let createdFinished=false;
  for (let i = 0; i < pageState.itemRows.length; i++) {
    const item = pageState.itemRows[i];
    if ((lastCategoryName !== item.categoryName )||(lastCategoryFinished !== item.completed)) {
      if (currentRows.length > 0) {
        addCurrentRows(listContent,currentRows,lastCategoryID,lastCategoryName,lastCategoryColor,lastCategoryFinished);
        currentRows=[];
      }
      lastCategoryID = item.categoryID;
      lastCategoryName=item.categoryName;
      lastCategoryColor=item.categoryColor;
      lastCategoryFinished=item.completed;
    }
    const rowVisible = getCategoryExpanded(item.categoryID,Boolean(item.completed));
    currentRows.push(
      <IonItem className={"itemrow-outer "+(rowVisible ? "itemrow-display" : "itemrow-hidden")} key={"itemouter"+pageState.itemRows[i].itemID} >
        <IonCheckbox key={"itemcheckbox"+pageState.itemRows[i].itemID} aria-label=""
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onIonChange={(e: CustomEvent<CheckboxChangeEventDetail>) => {if (!doingUpdate.current) { (e.target as any).disabled = true; doingUpdate.current=true; completeItemRowStub(item.itemID,e)}}}
          color={"medium"} disabled={doingUpdate.current}
          checked={Boolean(item.completed)} className={"item-on-list "+ (item.completed ? "item-completed" : "")}>
        </IonCheckbox>
        <IonItem className={"itemrow-inner"+(item.completed ? " item-completed": "")} routerLink={"/item/edit/"+item.itemID}
          key={"iteminner"+pageState.itemRows[i].itemID}>
            {item.itemName + (item.quantityUOMDesc === "" ? "" : " ("+ item.quantityUOMDesc+")")}
            {item.hasNote ? <IonIcon key={"itemnoteicon"+pageState.itemRows[i].itemID} className="note-icon" icon={documentTextOutline}></IonIcon> : <></>}
        </IonItem>
      </IonItem>);
    if (lastCategoryFinished && !createdFinished) {
      listContent.push(getCompletedDivider(dividerCount));
      dividerCount++;
      createdFinished=true;
    }
  }
  addCurrentRows(listContent,currentRows,lastCategoryID,lastCategoryName,lastCategoryColor,lastCategoryFinished);
  if (!createdFinished) {listContent.push(getCompletedDivider(dividerCount)); dividerCount++;};
  const contentElem=(<IonList key="overallitemlist" className="ion-no-padding ion-items-list" lines="none">{listContent}</IonList>)

  function resumeScroll() {
    const content = contentRef.current;
    if (content) {
      try {content!.scrollToPoint(0,scrollTopRef.current);}
      catch {log.debug("Error resuming scroll...")}
    }
  }

  if (shouldScroll) {
    resumeScroll();
    shouldScroll.current = false;
  }

  return (
    <IonPage>
      {headerElem}
      <IonContent key="itemscontent" ref={contentRef} scrollEvents={true} onIonScroll={(e) => {scrollTopRef.current = e.detail.scrollTop}}>
          {contentElem}
      </IonContent>
      {fabContent}
    </IonPage>
  );
};

export default Items;
