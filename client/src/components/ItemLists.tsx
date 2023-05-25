import {  IonButton,  IonItem, IonLabel, IonCheckbox, IonIcon, 
    IonGrid, IonRow, IonCol, IonText, CheckboxCustomEvent,  } from '@ionic/react';
import { pencilOutline } from 'ionicons/icons';
import { Fragment, useContext, useState, SetStateAction } from 'react';
import { sortedItemLists, listIsDifferentThanCommon } from './ItemUtilities';
import { ItemDoc,  ListDoc } from './DBSchema';
import ItemListsModal from '../components/ItemListsModal';
import { cloneDeep } from 'lodash';
import { ModalState, ModalStateInit } from '../components/DataTypes';
import './ItemLists.css';
import { GlobalDataContext } from './GlobalDataProvider';
import { useTranslation } from 'react-i18next';

export type ItemListsProps = { 
    stateItemDoc: ItemDoc,
    setStateItemDoc: React.Dispatch<SetStateAction<ItemDoc>>,
    addCategoryPopup: () => void,
    addUOMPopup: () => void
}
    
const ItemLists: React.FC<ItemListsProps> = (props: ItemListsProps) => {
    const [modalState, setModalState] = useState<ModalState>(ModalStateInit)
    const globalData = useContext(GlobalDataContext)
    const { t } = useTranslation()
    
    function selectList(listID: string, updateVal: boolean) {
        let newItemDoc=cloneDeep(props.stateItemDoc);
        let listFound=false
        for (let i = 0; i < newItemDoc.lists.length; i++) {
            if (newItemDoc.lists[i].listID === listID) {
            newItemDoc.lists[i].active = updateVal;
            listFound=true;
            if(updateVal) {newItemDoc.lists[i].boughtCount++}
            }    
        }
        if (!listFound) {
            let listobj={
            listID: listID,
            boughtCount: 0,
            active: updateVal,
            checked: false
            }
            newItemDoc.lists.push(listobj);
        }
        props.setStateItemDoc(newItemDoc);
    }
        
    function editListModal(listID: string) {
        let listIdx = 0;
        for (let i = 0; i < props.stateItemDoc.lists.length; i++) {
          if (props.stateItemDoc.lists[i].listID === listID) { listIdx=i; break;}
        }
        let listFoundIdx=globalData.listDocs.findIndex((element: ListDoc) => (element._id === listID));
        let listName = (listFoundIdx === -1) ? "" : globalData.listDocs[listFoundIdx].name
        setModalState(prevState => ({...prevState,isOpen: true, selectedListId: listID, 
          selectedListName: listName, selectedListIdx: listIdx, itemList: cloneDeep(props.stateItemDoc.lists[listIdx])}));
    }

    let listsElem=[];
    let listsInnerElem=[];
    listsInnerElem.push(<IonRow key="listlabelrow">
        <IonCol size="10"><IonLabel key="listlabel" position='stacked'>{t('itemtext.item_is_on_these_lists')}</IonLabel></IonCol>
        <IonCol size="2"><IonLabel key="resetlabel" position="stacked">{t('general.edit')}</IonLabel></IonCol></IonRow>
    )
    let sortedLists = sortedItemLists(props.stateItemDoc.lists,globalData.listDocs);
    
    for (let i = 0; i < sortedLists.length; i++) {
      let listID = sortedLists[i].listID;
      let itemFoundIdx=globalData.listDocs.findIndex((element: ListDoc) => (element._id === listID));
      if (itemFoundIdx !== -1) {
        let itemActive=(sortedLists[i].active);
        let listName=globalData.listDocs[itemFoundIdx].name;
        listsInnerElem.push(
          <IonRow key={listID} className={listIsDifferentThanCommon(sortedLists,i) ? "highlighted-row ion-no-padding" : "ion-no-padding"}>
            <IonCol className="ion-no-padding" size="1"><IonCheckbox aria-label="" onIonChange={(e: CheckboxCustomEvent) => selectList(listID,Boolean(e.detail.checked))} checked={itemActive}></IonCheckbox></IonCol>
            <IonCol className="ion-no-padding ion-align-self-center" size="9"><IonLabel>{listName}</IonLabel></IonCol>
            <IonCol className="ion-no-padding" size="2"><IonButton onClick={() => {editListModal(listID)}} ><IonIcon icon={pencilOutline}></IonIcon></IonButton></IonCol>
          </IonRow>
        )
      }
    }
    listsElem.push(<IonItem key="listlist"><IonGrid>{listsInnerElem}</IonGrid></IonItem>)
    listsElem.push(<IonItem key="diffNote"><IonText className="small-note-text">{t('itemtext.highlighted_lists_diff_values')}</IonText></IonItem>)
  
    return (
        <Fragment key="itemlists">
        {listsElem}
        <ItemListsModal stateItemDoc={props.stateItemDoc} setStateItemDoc={props.setStateItemDoc} 
                        modalState={modalState} setModalState={setModalState}
                        addCategoryPopup={props.addCategoryPopup} addUOMPopup={props.addUOMPopup} />
        </Fragment>
    )

}

export default ItemLists;