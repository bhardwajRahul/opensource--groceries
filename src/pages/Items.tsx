import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonItemGroup, IonItemDivider, IonButton, IonFab, IonFabButton, IonIcon, IonCheckbox } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useDoc, useFind } from 'use-pouchdb';
import { cloneDeep } from 'lodash';
import './Items.css';
import { useUpdateCompleted } from '../components/itemhooks';

interface ItemsPageProps
  extends RouteComponentProps<{
    id: string;
  }> {}

const Items: React.FC<ItemsPageProps> = ({ match }) => {

  interface ItemRow {
    itemID: string,
    itemName: string,
    categoryID: string,
    categoryName: string,
    categorySeq: number,
    quantity: number,
    completed: boolean | null
  }

  const [stateItemRows,setStateItemRows] = useState<ItemRow[]>([]);
  const [doingUpdate,setDoingUpdate] = useState(false);
  const updateCompleted = useUpdateCompleted();
  const { docs: itemDocs, loading: itemLoading, error: itemError } = useFind({
    index: {
      fields: ["type","name","lists"]
    },
    selector: {
      type: "item",
      name: { $exists: true },
      lists: { $elemMatch: { "listID": match.params.id , "active" : true} }
    },
    sort: [ "type", "name", "lists" ]
    })
    const { doc: listDoc, loading: listLoading, state: listState, error: listError } = useDoc(match.params.id);
    const { docs: categoryDocs, loading: categoryLoading, error: categoryError } = useFind({
      index: { fields: [ "type","name"] },
      selector: { type: "category", name: { $exists: true}},
      sort: [ "type","name"]
    })

    useEffect( () => {
      if (!itemLoading && !listLoading && !categoryLoading) {
        setStateItemRows(getItemRows());
        setDoingUpdate(false);
      }
    },[itemLoading, listLoading, categoryLoading, itemDocs, listDoc, categoryDocs]);
    
    function getItemRows() {
      let itemRows: Array<ItemRow> =[];
      itemDocs.forEach((itemDoc: any) => {
        let itemRow: ItemRow = {
          itemID:"",
          itemName:"",
          categoryID: "",
          categoryName: "",
          categorySeq: 0,
          quantity: 0,
          completed: false
        };
      
        itemRow.itemID = itemDoc._id;
        itemRow.itemName = itemDoc.name;
        itemRow.categoryID = itemDoc.categoryID;
        if (itemRow.categoryID == null) {
          itemRow.categoryName = "Uncategorized";
          itemRow.categorySeq = -1
        } else {
          itemRow.categoryName = (categoryDocs.find(element => (element._id === itemDoc.categoryID)) as any).name;
          itemRow.categorySeq = ((listDoc as any).categories.findIndex((element: any) => (element === itemDoc.categoryID)));  
        }
        itemRow.quantity = itemDoc.quantity;
        itemRow.completed = itemDoc.lists.find((element: any) => (element.listID === match.params.id)).completed;
        itemRows.push(itemRow);
      })
    
      itemRows.sort((a,b) => (
        (Number(a.completed) - Number(b.completed)) || (a.categorySeq - b.categorySeq) ||
        (a.itemName.localeCompare(b.itemName))
      ))
      return (itemRows)
    }

  if (itemLoading || listLoading || categoryLoading || doingUpdate || stateItemRows.length <=0 )  {return(
    <IonPage><IonHeader><IonToolbar><IonTitle>Loading...</IonTitle></IonToolbar></IonHeader></IonPage>
  )};  

  function completeItemRow(id: String, newStatus: boolean | null) {
     let newItemRows: Array<ItemRow>=cloneDeep(stateItemRows);
    let itemSeq = newItemRows.findIndex(element => (element.itemID === id))
    newItemRows[itemSeq].completed = newStatus;
    // get itemdoc from itemDocs
    let itemDoc = itemDocs.find(element => (element._id === id))
    let updateInfo = {
      itemDoc: itemDoc,
      updateAll: true,
      newStatus: newStatus,
      listID: match.params.id
    }
    setDoingUpdate(true);
    updateCompleted(updateInfo);
  }

  let listContent=[];

  function addCurrentRows(listCont: any, curRows: any, catID: string, catName: string, completed: boolean | null) {
    listCont.push(
        <IonItemGroup key={catID+Boolean(completed).toString()}>
        <IonItemDivider key={catID+Boolean(completed).toString()}>{catName}</IonItemDivider>
          {curRows}
      </IonItemGroup>
    )
  }

  let lastCategoryID="<INITIAL>";
  let lastCategoryName="<INITIAL>";
  let lastCategoryFinished: boolean | null = null;
  let currentRows=[];
  let createdFinished=false;
  const completedDivider=(<IonItemDivider key="Completed">Completed</IonItemDivider>);
  for (let i = 0; i < stateItemRows.length; i++) {
    const item = stateItemRows[i];
    if ((lastCategoryID !== item.categoryID )||(lastCategoryFinished !== item.completed)) { 
      if (currentRows.length > 0) {
        addCurrentRows(listContent,currentRows,lastCategoryID,lastCategoryName,lastCategoryFinished);
        currentRows=[];
      }
      if (item.categoryID === null) {
        lastCategoryID = "Uncategorized"
      }
      else {
        lastCategoryID = item.categoryID;
      }
      lastCategoryName=item.categoryName;
      lastCategoryFinished=item.completed;   
    }
    currentRows.push(
      <IonItem key={stateItemRows[i].itemID} >
        <IonCheckbox slot="start" onIonChange={(e: any) => completeItemRow(stateItemRows[i].itemID,e.detail.checked)} checked={Boolean(stateItemRows[i].completed)}></IonCheckbox>
        <IonButton fill="clear" class="textButton" routerLink= {"/item/"+stateItemRows[i].itemID}>{stateItemRows[i].itemName + " "+ stateItemRows[i].quantity.toString() }</IonButton>
      </IonItem>);
    if (lastCategoryFinished && !createdFinished) {
      listContent.push(completedDivider);
      createdFinished=true;
    }    
  }
  addCurrentRows(listContent,currentRows,lastCategoryID,lastCategoryName,lastCategoryFinished);
  if (!createdFinished) {listContent.push(completedDivider)};
  let contentElem=(<IonList lines="full">{listContent}</IonList>)

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Items on List : {(listDoc as any).name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Items On List: {(listDoc as any).name}</IonTitle>
          </IonToolbar>
        </IonHeader>
          {contentElem}
      </IonContent>
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton>
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
      </IonFab>
    </IonPage>
  );
};

export default Items;