import { useCallback, useState, useEffect, useContext, useRef } from 'react'
import { usePouch, useFind } from 'use-pouchdb'
import { cloneDeep, pull } from 'lodash';
import { RemoteDBStateContext, SyncStatus } from './RemoteDBState';
import { FriendRow,InitFriendRow, ResolvedFriendStatus, ListRow, PouchResponse, PouchResponseInit, initUserInfo, ListCombinedRow, RowType, UsersInfo } from './DataTypes';
import { FriendDocs,FriendStatus, ListGroupDoc, ListDoc, ListDocs, ListGroupDocs, ListDocInit, ItemDocs, ItemDoc, ItemList, ItemListInit} from './DBSchema';
import { GlobalStateContext } from './GlobalState';
import { getUsersInfo } from './Utilities';
import { getCommonKey } from './ItemUtilities';
import { GlobalDataContext } from './GlobalDataProvider';

export function useGetOneDoc(docID: string | null) {
  const db = usePouch();
  const changesRef = useRef<any>();
  const [doc,setDoc] = useState<any>(null);
  const [dbError, setDBError] = useState(false);
  const loadingRef = useRef(true);

  async function getDoc(id: string | null) {
      if (id == null) { loadingRef.current = false; return};
      loadingRef.current = true;
      changesRef.current = db.changes({since: 'now', live: true, include_docs: true, doc_ids: [id]})
      .on('change', function(change) { setDoc(change.doc); })
      let success=true; setDBError(false);
      let docRet = null;
      try  {docRet = await db.get(id);}
      catch(err) {success=false; setDBError(true);}
      loadingRef.current = false;
      if (success) {setDoc(docRet)};
    }
    
  useEffect( () => {
      getDoc(docID)
      return ( () => { if (changesRef.current) {changesRef.current.cancel()};})  
  },[docID])  

  return {dbError, loading: loadingRef.current, doc};
}

export function useUpdateGenericDocument() {
  const db = usePouch();
  return useCallback(
    async (updatedDoc: any) => {
          let curDateStr=(new Date()).toISOString()
          updatedDoc.updatedAt = curDateStr;
          let response: PouchResponse = cloneDeep(PouchResponseInit);
          try { response.pouchData = await db.put(updatedDoc); }
          catch(err) { response.successful = false; response.fullError = err; console.log("ERROR:",err);}
          if (!response.pouchData.ok) { response.successful = false;}
      return response
    },[db])
}

export function useCreateGenericDocument() {
  const db = usePouch();
  return useCallback(
    async (updatedDoc: any) => {
          let curDateStr=(new Date()).toISOString()
          updatedDoc.updatedAt = curDateStr;
          let response: PouchResponse = cloneDeep(PouchResponseInit);
          try { response.pouchData = await db.post(updatedDoc);}
          catch(err) { response.successful = false; response.fullError = err;}
          if (!response.pouchData.ok) { response.successful = false;}
      return response
    },[db])
}

export function useDeleteGenericDocument() {
  const db = usePouch();
  return useCallback(
    async (updatedDoc: any) => {
          let response: PouchResponse = cloneDeep(PouchResponseInit);
          try { response.pouchData = await db.remove(updatedDoc);}
          catch(err) { response.successful = false; response.fullError = err;}
          if (!response.pouchData.ok) { response.successful = false;}
      return response
    },[db])
}

export function useDeleteItemsInListGroup() {
  const db=usePouch()

  return useCallback(
    async (listGroupID: string) => {
      let response: PouchResponse = cloneDeep(PouchResponseInit);
      let itemResults = await db.find({
        selector: {
          type: "item",
          name: { $exists: true },
          listGroupID: listGroupID}
      })
      for (let i = 0; i < itemResults.docs.length; i++) {
        const itemDoc: any = itemResults.docs[i];
        try {await db.remove(itemDoc)}
        catch(err) { response.successful= false; response.fullError = err; }
        }
      return response;
    },[db]) 
}

export function useDeleteListFromItems() {
  const db=usePouch()

  return useCallback(
    async (listID: string) => {
      let response: PouchResponse = cloneDeep(PouchResponseInit);
      let itemResults = await db.find({
        selector: {
          type: "item",
          name: { $exists: true },
          lists: { $elemMatch: { "listID": listID } }
        }
      })
      for (let i = 0; i < itemResults.docs.length; i++) {
        const itemDoc: ItemDoc = itemResults.docs[i] as ItemDoc;
        const newLists = []
        for (let j = 0; j < itemDoc.lists.length; j++) {
          if (itemDoc.lists[j].listID !== listID) {
            newLists.push(itemDoc.lists[j])
          }
        }
        itemDoc.lists = newLists;
        try {await db.put(itemDoc)}
        catch(err) {response.successful = false; response.fullError = err; }
      }
      return response;
    },[db]) 
}

export function useDeleteCategoryFromItems() {
  const db=usePouch()
  return useCallback(
    async (catID: string) => {
      let response: PouchResponse = cloneDeep(PouchResponseInit);
      let itemResults;
      try {
          itemResults = await db.find({
          selector: {
            type: "item",
            name: { $exists: true },
            categoryID: catID
          }
          })
      } catch(err) {response.successful=false; response.fullError="Could not find items"; return response}
      if (itemResults !== undefined && itemResults.hasOwnProperty('docs')) {
        for (let i = 0; i < itemResults.docs.length; i++) {
          const itemDoc: ItemDoc = cloneDeep(itemResults.docs[i]);
          itemDoc.lists.forEach(list => {
            list.categoryID = null;
          });
          try { await db.put(itemDoc) }
          catch(err) {response.successful = false; response.fullError = err; }
        }  
      }
      return response;
    },[db]) 
}

export function useDeleteCategoryFromLists() {
  const db=usePouch()
  return useCallback(
    async (catID: string) => {
      let response: PouchResponse = cloneDeep(PouchResponseInit);
      let listResults;
      try {
          listResults = await db.find({
          selector: {
            type: "list",
            name: { $exists: true },
            categories: { $elemMatch : { $eq: catID} }
          }
          })
      } catch(err) {response.successful=false; response.fullError="Could not find items"; return response}
      if (listResults !== undefined && listResults.hasOwnProperty('docs')) {
        for (let i = 0; i < listResults.docs.length; i++) {
          const listDoc: ListDoc = cloneDeep(listResults.docs[i]);
          let newCats = cloneDeep(listDoc.categories);
          pull(newCats,catID);
          listDoc.categories = newCats;
          try {await db.put(listDoc)}
          catch(err) {response.successful = false; response.fullError = err; }
        }  
      }
      return response;
    },[db]) 
}

export function useLists() : {dbError: boolean, listsLoading: boolean, listDocs: any, listRowsLoaded: boolean, listRows: ListRow[], listCombinedRows: ListCombinedRow[]} {
  const { remoteDBCreds } = useContext(RemoteDBStateContext);
  const [listRows,setListRows] = useState<ListRow[]>([]);
  const [listCombinedRows,setListCombinedRows] = useState<ListCombinedRow[]>([]);
  const [listRowsLoaded, setListRowsLoaded] = useState(false);
  const [dbError, setDBError] = useState(false);
  const globalData = useContext(GlobalDataContext);
  const [ perfms, setperfms] = useState(performance.now());

  useEffect(() => {
    console.log("uselists first render");
    setperfms(performance.now());
  },[])

//  console.log("WHY ul render: ", cloneDeep({listRows, listCombinedRows,listRowsLoaded,listRowsLoading,dbError,globalData}))
  console.log("UL render, time from initial:",performance.now()-perfms);

  function buildListRows() {
    let blrms = performance.now(); console.log("starting blr...");
    let curListDocs: ListDocs = cloneDeep(globalData.listDocs);
    let newListRows: ListRow[] = [];
    curListDocs.forEach((listDoc) => {
      let listGroupID=null;
      let listGroupName="";
      let listGroupDefault=false;
      let listGroupOwner = "";
      for (let i = 0; i < globalData.listGroupDocs.length; i++) {
        const lgd = (globalData.listGroupDocs[i] as ListGroupDoc);
        if (lgd.listGroupOwner !== remoteDBCreds.dbUsername || lgd.sharedWith.includes(remoteDBCreds.dbUsername)) {
          continue;
        }
        if ( listDoc.listGroupID === lgd._id ) {
          listGroupID=lgd._id
          listGroupName=lgd.name
          listGroupDefault=lgd.default;
          listGroupOwner=lgd.listGroupOwner;
        }
      }
      if (listGroupID == null) { return };
      let listRow: ListRow ={
        listGroupID: listGroupID,
        listGroupName: listGroupName,
        listGroupDefault: listGroupDefault,
        listGroupOwner: listGroupOwner,
        listDoc: listDoc,
      }
      newListRows.push(listRow);
    });

    newListRows.sort(function (a: ListRow, b: ListRow) {
      return a.listDoc.name.toUpperCase().localeCompare(b.listDoc.name.toUpperCase());
    })

    setListRows(newListRows);
    const sortedListGroups: ListGroupDocs = cloneDeep(globalData.listGroupDocs).filter( 
      (lgd: ListGroupDoc) => lgd.listGroupOwner === remoteDBCreds.dbUsername ||
            lgd.sharedWith.includes(String(remoteDBCreds.dbUsername))
    );
    sortedListGroups.sort(function (a: ListGroupDoc, b: ListGroupDoc) {
      return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
    });

    let newCombinedRows: ListCombinedRow[] = [];
    sortedListGroups.forEach((listGroup: ListGroupDoc) => {
      let groupRow: ListCombinedRow = {
          rowType : RowType.listGroup,
          rowName : listGroup.name,
          rowKey: "G-"+listGroup._id,
          listOrGroupID: String(listGroup._id),
          listGroupID : String(listGroup._id),
          listGroupName : listGroup.name,
          listGroupOwner: listGroup.listGroupOwner,
          listGroupDefault: listGroup.default,
          listDoc: ListDocInit
        }
      newCombinedRows.push(groupRow);
      for (let i = 0; i < newListRows.length; i++) {
        const listRow = newListRows[i];
        if (listGroup._id === listRow.listGroupID) {
          let listListRow: ListCombinedRow = {
            rowType: RowType.list,
            rowName: listRow.listDoc.name,
            rowKey: "L-"+listRow.listDoc._id,
            listOrGroupID: String(listRow.listDoc._id),
            listGroupID: listRow.listGroupID,
            listGroupName: listRow.listGroupName,
            listGroupOwner: listRow.listGroupOwner,
            listGroupDefault: listRow.listGroupDefault,
            listDoc: listRow.listDoc
          }
          newCombinedRows.push(listListRow);    
        } 
      }  
    });
    // now add any ungrouped (error) lists:
    let testRow = newListRows.find(el => (el.listGroupID === null))
    if (testRow !== undefined) {
      let groupRow: ListCombinedRow = {
        rowType : RowType.listGroup, rowName : testRow.listGroupName,
        rowKey: "G-null", listOrGroupID: null, listGroupID : null,
        listGroupName : testRow.listGroupName, listGroupDefault: false, listGroupOwner: null,
        listDoc: ListDocInit
      }
      newCombinedRows.push(groupRow);
      newListRows.forEach(newListRow => {
        if (newListRow.listGroupID == null) {
          let listlistRow: ListCombinedRow = {
            rowType: RowType.list, rowName: newListRow.listDoc.name,
            rowKey: "L-"+newListRow.listDoc._id, listOrGroupID: String(newListRow.listDoc._id),listGroupID: null,
            listGroupName: newListRow.listGroupName, listGroupOwner: null, listGroupDefault: false,
            listDoc: newListRow.listDoc
          }
          newCombinedRows.push(listlistRow);  
        }
      })
    }
    setListCombinedRows(newCombinedRows);
    console.log("ending blr...",performance.now()-blrms)
  }

  useEffect( () => {
    let somethingms = performance.now(); console.log("somethingchanged");
    if (globalData.listsLoading || globalData.listGroupsLoading) { setListRowsLoaded(false); return };
    if (globalData.listError !== null || globalData.listGroupError !== null) { setDBError(true); return};
    setDBError(false);
    if ( !globalData.listsLoading && !globalData.listGroupsLoading && !listRowsLoaded)  {
      setListRowsLoaded(false);
      buildListRows();
      setListRowsLoaded(true);
    }
    console.log("somethingchangedtime:",performance.now()-somethingms);
  },[globalData.listError, globalData.listGroupError, globalData.listsLoading,
    globalData.listDocs, globalData.listGroupDocs, globalData.listGroupsLoading])

  return ({dbError, listsLoading: globalData.listsLoading, listDocs: globalData.listDocs, listRowsLoaded, listRows, listCombinedRows});
}

export function useItems({selectedListGroupID,isReady, needListGroupID, activeOnly = false, selectedListID = null, selectedListType = RowType.list,} :
                   {selectedListGroupID: string | null, isReady: boolean, needListGroupID: boolean, activeOnly: boolean, selectedListID: string | null, selectedListType: RowType})
      : {dbError: boolean, itemsLoading: boolean, itemRowsLoading: boolean, itemRowsLoaded: boolean, itemRows: ItemDocs} {
  const [itemRows,setItemRows] = useState<ItemDocs>([]);
  const [itemRowsLoaded, setItemRowsLoaded] = useState(false);
  const [itemRowsLoading, setItemRowsLoading] = useState(false);
  const [dbError, setDBError] = useState(false);
  const { listError: listDBError, listCombinedRows, listRowsLoaded, listDocs, itemsLoading, itemDocs, itemError } = useContext(GlobalDataContext)
  
  function buildItemRows() {
    let curItemDocs: ItemDocs = cloneDeep(itemDocs);
    let newItemRows: ItemDocs = [];
    curItemDocs.forEach((itemDoc: ItemDoc) => {
      if (selectedListGroupID === null || itemDoc.listGroupID === selectedListGroupID) {
        let listGroupIdx=listCombinedRows.findIndex((lr: ListCombinedRow) => (itemDoc.listGroupID === lr.listGroupID && lr.rowType === RowType.listGroup))
        if (listGroupIdx !== -1) {
          let addToList = true;
          if (activeOnly) {
            if (selectedListType !== RowType.listGroup) {
              addToList=false;
              itemDoc.lists.forEach((il) => {
                if (il.listID === selectedListID && il.active) { addToList=true}
              })
            } else {
              let activeCommon = getCommonKey(itemDoc,"active",listDocs);
              if (!Boolean(activeCommon)) {
                addToList = false;
              }
            }
          }
          if (addToList) {       
            newItemRows.push(itemDoc);
          }
        }
      }
    })
    newItemRows.sort(function (a: ItemDoc, b: ItemDoc) {
      return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
    });
    setItemRows(newItemRows);
  }

  function checkAndBuild() {
    if (itemsLoading || !listRowsLoaded || !isReady || (isReady && selectedListGroupID === null && needListGroupID)) { setItemRowsLoaded(false); return };
    if (itemError !== null || listDBError) { setDBError(true); return;}
    setDBError(false);
    if ( !itemsLoading && listRowsLoaded)  {
      setItemRowsLoading(true);
      setItemRowsLoaded(false);
      buildItemRows();
      setItemRowsLoading(false)
      setItemRowsLoaded(true);
    }
  }

  useEffect( () => {
    checkAndBuild();
  },[isReady,itemError, listDBError,itemsLoading,listRowsLoaded,itemDocs, listCombinedRows, selectedListGroupID, selectedListID, selectedListType, needListGroupID])

//  console.log("UI Inputs:",cloneDeep({selectedListGroupID,isReady, needListGroupID, activeOnly, selectedListID, selectedListType}));
//  console.log("UI returning:",cloneDeep({dbError, itemsLoading, itemRowsLoaded,itemRows, itemDocs}));
  return ({dbError, itemsLoading, itemRowsLoading, itemRowsLoaded, itemRows});
}

export enum UseFriendState {
  init = 0,
  baseFriendsChanged = 0,
  baseFriendsLoading = 1,
  baseFriendsLoaded = 2,
  rowsLoading = 3,
  rowsLoaded = 4,
  error = 99
}

export function useFriends(username: string) : { useFriendState: UseFriendState, friendRows: FriendRow[]} {
  const [friendRows,setFriendRows] = useState<FriendRow[]>([]);
  const { remoteDBState, remoteDBCreds } = useContext(RemoteDBStateContext);
  const [useFriendState,setUseFriendState] = useState(UseFriendState.init);
  const { docs: friendDocs, state: friendState } = useFind({
    index: { fields: ["type","friendID1","friendID2"]},
    selector: { "$and": [ {
        "type": "friend",
        "friendID1": { "$exists": true },
        "friendID2": { "$exists" : true} }, 
        { "$or" : [{"friendID1": username},{"friendID2": username}]}
    ]  
    },
    sort: [ "type", "friendID1", "friendID2" ],
//    fields: [ "type", "friendID1", "friendID2", "friendStatus"]
    })

    useEffect( () => {
      if (useFriendState === UseFriendState.baseFriendsLoaded) {
        if (remoteDBState.syncStatus === SyncStatus.active || remoteDBState.syncStatus === SyncStatus.paused) {
          setUseFriendState((prevState) => UseFriendState.rowsLoading);
          loadFriendRows();
        }  
      }
    },[useFriendState,remoteDBState.syncStatus])

    useEffect( () => {
      if (friendState === "error") {setUseFriendState((prevState) => UseFriendState.error); return};
      if (friendState === "loading") {setUseFriendState((prevState) => UseFriendState.baseFriendsLoading)};
      if (friendState === "done" && useFriendState === UseFriendState.baseFriendsLoading) {
        setUseFriendState((prevState) => UseFriendState.baseFriendsLoaded);
      } 
    },[friendState] )

    async function loadFriendRows() {
      let userIDList : { userIDs: string[]} = { userIDs: []};
      (friendDocs as FriendDocs).forEach((element) => {
        if (element.friendStatus !== FriendStatus.Deleted) {
          if(username === element.friendID1) {userIDList.userIDs.push(element.friendID2)}
          else {userIDList.userIDs.push(element.friendID1)}
        }
      });
      const usersInfo: UsersInfo = await getUsersInfo(userIDList,String(remoteDBCreds.apiServerURL), String(remoteDBState.accessJWT));
      setFriendRows(prevState => ([]));
      if (usersInfo.length > 0) {
        (friendDocs as FriendDocs).forEach((friendDoc) => {
          let friendRow : FriendRow = cloneDeep(InitFriendRow);
          friendRow.friendDoc=cloneDeep(friendDoc);
          if (friendRow.friendDoc.friendID1 === remoteDBCreds.dbUsername)
            { friendRow.targetUserName = friendRow.friendDoc.friendID2}
          else { friendRow.targetUserName = friendRow.friendDoc.friendID1}
          let user=usersInfo.find((el) => el?.name === friendRow.targetUserName)
          if (user == undefined) {user = cloneDeep(initUserInfo)};
          if (friendDoc.friendStatus === FriendStatus.WaitingToRegister) {
            friendRow.targetEmail = friendDoc.inviteEmail
          } else {
            friendRow.targetEmail = String(user?.email);
          }
          friendRow.targetFullName = String(user?.fullname);
          if (friendDoc.friendStatus === FriendStatus.PendingFrom1 || friendDoc.friendStatus === FriendStatus.PendingFrom2) {
            if ((remoteDBCreds.dbUsername === friendDoc.friendID1 && friendDoc.friendStatus === FriendStatus.PendingFrom2) || 
                (remoteDBCreds.dbUsername === friendDoc.friendID2 && friendDoc.friendStatus === FriendStatus.PendingFrom1))
            {
              friendRow.friendStatusText = "Confirm?"
              friendRow.resolvedStatus = ResolvedFriendStatus.PendingConfirmation;
            } else {
              friendRow.friendStatusText = "Requested";
              friendRow.resolvedStatus = ResolvedFriendStatus.Requested;
            }
          } else if (friendDoc.friendStatus === FriendStatus.Confirmed) {
            friendRow.friendStatusText = "Confirmed";
            friendRow.resolvedStatus = ResolvedFriendStatus.Confirmed;
          } else if (friendDoc.friendStatus === FriendStatus.WaitingToRegister) {
            friendRow.friendStatusText = "Needs to Register";
            friendRow.resolvedStatus = ResolvedFriendStatus.WaitingToRegister
          }
          setFriendRows(prevArray => [...prevArray, friendRow])
        })
      }
      setUseFriendState((prevState) => UseFriendState.rowsLoaded);
    }

    return({useFriendState: useFriendState, friendRows});
}

export function useConflicts() : { conflictsError: boolean, conflictDocs: any[], conflictsLoading: boolean} {
  const { remoteDBCreds } = useContext(RemoteDBStateContext);
  const { globalState } = useContext(GlobalStateContext);
  const [mostRecentDate,setMostRecentDate] = useState<Date>(new Date());

  const { docs: conflictDocs, loading: conflictsLoading, error: dbError } = useFind({
    index: { fields: ["type","docType","updatedAt"]},
    selector: { type: "conflictlog", docType: { $exists: true }, updatedAt: { $gt: mostRecentDate.toISOString()} },
    sort: [ "type", "docType","updatedAt" ]
  })

  useEffect( () => {
    const oneDayOldDate=new Date();
    oneDayOldDate.setDate(oneDayOldDate.getDate()-Number(globalState.settings.daysOfConflictLog));
    const lastConflictsViewed = new Date(String(remoteDBCreds.lastConflictsViewed))
    setMostRecentDate((lastConflictsViewed > oneDayOldDate) ? lastConflictsViewed : oneDayOldDate);  
  },[remoteDBCreds.lastConflictsViewed,globalState.settings.daysOfConflictLog])

  return({conflictsError: dbError !== null, conflictDocs, conflictsLoading});
}

export function useAddListToAllItems() {
  const db = usePouch();
  return useCallback(
    async ({listGroupID, listID, listDocs} : {listGroupID: string, listID: string, listDocs: ListDocs}) => {
          console.log(cloneDeep({listGroupID,listID,listDocs}));
          let updateSuccess=true;
          let itemRecords: PouchDB.Find.FindResponse<ItemDoc>
          itemRecords = await db.find({
            selector: { type: "item", 
                        name: { $exists: true},
                        listGroupID: listGroupID},
            sort: [ "type","name"]
          }) as PouchDB.Find.FindResponse<ItemDoc>;
          for (let i = 0; i < itemRecords.docs.length; i++) {
            console.log("adding list to item: ",itemRecords.docs[i].name)
            const item = itemRecords.docs[i];
            console.log("item: ", cloneDeep(item));
            let itemUpdated=false;
            let listIdx = item.lists.findIndex((l: ItemList) => l.listID === listID)
            console.log("listIdx is: ",listIdx)
            if (listIdx === -1) {
              let newList = cloneDeep(ItemListInit);
              newList.listID = listID;
              newList.active = getCommonKey(item,"active",listDocs);
              newList.categoryID = getCommonKey(item,"categoryID",listDocs);
              newList.completed = getCommonKey(item,"completed",listDocs);
              newList.note = getCommonKey(item,"note",listDocs);
              newList.quantity = getCommonKey(item,"quantity",listDocs);
              newList.stockedAt = getCommonKey(item,"stockedAt",listDocs);
              newList.uomName = getCommonKey(item,"uomName",listDocs);
              console.log("created new list:",cloneDeep(newList));
              item.lists.push(newList);
              itemUpdated=true;
            }
            if (itemUpdated) {
              console.log("item updated, about to updat/add:",cloneDeep(item));
              let curDateStr=(new Date()).toISOString()
              item.updatedAt = curDateStr;
              let updateResponse = await db.put(item);
              if (!updateResponse.ok) {updateSuccess = false;}
            }
          }
      return updateSuccess;
    },[db])
}
