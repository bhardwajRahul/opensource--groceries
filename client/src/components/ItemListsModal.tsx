import { IonTitle,  IonButton, IonList, IonInput, IonSelect, IonCheckbox, IonIcon,
    IonSelectOption, IonTextarea, IonGrid, IonRow, IonCol, IonText, IonModal, IonToolbar, IonButtons } from '@ionic/react';
import { addCircleOutline, closeCircleOutline, saveOutline } from 'ionicons/icons';    
import { SetStateAction } from 'react';    
import {  ModalState, ModalStateInit } from '../components/DataTypes';
import {  CategoryDocs, ItemDoc, ItemList} from '../components/DBSchema';
import { cloneDeep } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { translatedCategoryName, translatedUOMName } from './translationUtilities';
import { useGlobalDataStore } from './GlobalData';

type ModalProps = {
    stateItemDoc: ItemDoc,
    setStateItemDoc: React.Dispatch<SetStateAction<ItemDoc>>,
    modalState: ModalState,
    setModalState: React.Dispatch<SetStateAction<ModalState>>,
    addCategoryPopup: () => void,
    addUOMPopup: () => void
}
  
const ItemListsModal: React.FC<ModalProps> = (props: ModalProps) => {
    const listDocs = useGlobalDataStore((state) => state.listDocs);
    const categoryDocs = useGlobalDataStore((state) => state.categoryDocs);
    const uomDocs = useGlobalDataStore((state) => state.uomDocs);
    const { t } = useTranslation()
    
    function saveModal() {
      const newItemLists: ItemList[] = cloneDeep(props.stateItemDoc.lists);
      for (let i = 0; i < newItemLists.length; i++) {
        if (newItemLists[i].listID === props.modalState.selectedListId) {
          newItemLists[i]=cloneDeep(props.modalState.itemList); break;
        }
      }
      props.setStateItemDoc(prevState => ({...prevState, lists : newItemLists}))
      props.setModalState(cloneDeep(ModalStateInit));
    }
    
    function cancelModal() {
      props.setModalState(cloneDeep(ModalStateInit));
    }
    
    function getActiveCategories(): CategoryDocs {
      const catDocs: CategoryDocs = [];
      const thisListDoc = listDocs.find(ld => ld._id === props.modalState.selectedListId);
      if (thisListDoc === undefined) {return catDocs;}
      for (const cat of thisListDoc.categories) {
        const thisCat = categoryDocs.find(cds => cds._id === cat);
        if (thisCat !== undefined) {catDocs.push(thisCat)}
      }
      return catDocs.sort(function (a,b) {
        return translatedCategoryName(a._id,a.name).toUpperCase().localeCompare(translatedCategoryName(b._id,b.name).toUpperCase())});
    }

    return ( 
    <IonModal key="item-modal" id="item-list" isOpen={props.modalState.isOpen}>
     <IonTitle className="modal-title">{t('general.editing')} {props.modalState.selectedListName} {t('itemtext.list_values')}</IonTitle>
     <IonList>
        <IonGrid>
          <IonRow>
            <IonCol size="4">{t('general.active')}</IonCol>
            <IonCol size="4">{t('general.completed')}</IonCol>
            <IonCol size="4">{t('general.stocked_here')}</IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4"><IonCheckbox aria-label="" labelPlacement="end" checked={props.modalState.itemList.active} onIonChange={(e) => props.setModalState(prevState =>({...prevState,itemList: {...prevState.itemList, active: e.detail.checked}}) )}></IonCheckbox></IonCol>
            <IonCol size="4"><IonCheckbox aria-label="" labelPlacement="end" checked={props.modalState.itemList.completed} onIonChange={(e) => props.setModalState(prevState =>({...prevState,itemList: {...prevState.itemList,completed: e.detail.checked}}) )}></IonCheckbox></IonCol>
            <IonCol size="4"><IonCheckbox aria-label="" labelPlacement="end" checked={props.modalState.itemList.stockedAt} onIonChange={(e) => props.setModalState(prevState =>({...prevState,itemList: {...prevState.itemList,stockedAt: e.detail.checked}}) )}></IonCheckbox></IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="10">
              <IonSelect label={t('general.category') as string} labelPlacement="stacked" interface="popover" onIonChange={(ev) => props.setModalState(prevState => ({...prevState, itemList: {...prevState.itemList, categoryID: ev.detail.value}}))} value={props.modalState.itemList.categoryID}>
                  <IonSelectOption key="cat-undefined" value={null}>{t('general.uncategorized')}</IonSelectOption>
                  {getActiveCategories().map((cat) => { return (
                      <IonSelectOption key={cat._id} value={cat._id}>
                        {translatedCategoryName(cat._id as string,cat.name)}
                      </IonSelectOption>
                  )})}
              </IonSelect>
            </IonCol>
            <IonCol size="2">
              <IonButton fill="default" onClick={() => {props.addCategoryPopup()}}>
                <IonIcon icon={addCircleOutline} ></IonIcon>
              </IonButton>  
            </IonCol>       
          </IonRow>
          <IonRow>
            <IonCol size="3">
              <IonInput key="modal-qty" label={t("general.quantity") as string} labelPlacement="stacked" type="number" min="0" value={props.modalState.itemList.quantity} onIonInput={(e) => props.setModalState(prevState => ({...prevState,itemList: {...prevState.itemList,quantity: Number(e.detail.value)}}))}></IonInput>
            </IonCol>
            <IonCol size="7">
              <IonSelect label={t('general.uom_abbrev') as string} labelPlacement="stacked" interface="popover" onIonChange={(ev) => props.setModalState(prevState => ({...prevState, itemList: {...prevState.itemList, uomName: ev.detail.value}}))} value={props.modalState.itemList.uomName}>
                  <IonSelectOption key="uom-undefined" value={null}>{t('general.no_uom')}</IonSelectOption>
                  {uomDocs.filter(uom => (["system",props.stateItemDoc.listGroupID].includes(uom.listGroupID))).map((uom) => (
                    <IonSelectOption key={uom.name} value={uom.name}>
                      {translatedUOMName(uom._id as string,uom.description,uom.pluralDescription)}
                    </IonSelectOption>
                  ))}
              </IonSelect>
            </IonCol>
            <IonCol size="2">
              <IonButton fill="default" onClick={() => {props.addUOMPopup()}}><IonIcon icon={addCircleOutline}></IonIcon></IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="9">
              <IonText>{t('itemtext.item_was_purchased_from_here')} {props.modalState.itemList.boughtCount} {t('general.times')}</IonText>
            </IonCol>
            <IonCol size="3">
            <IonButton onClick={() => props.setModalState(prevState => ({...prevState, itemList: {...prevState.itemList, boughtCount: 0}}))}>{t('general.reset')}</IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
            <IonTextarea label={t('general.note') as string} labelPlacement='stacked' value={props.modalState.itemList.note} onIonChange={(e) => props.setModalState(prevState => ({...prevState,itemList: {...prevState.itemList,note: String(e.detail.value)}}))}></IonTextarea>
            </IonCol> 
          </IonRow>
        </IonGrid>  
      </IonList>
      <IonToolbar>       
        <IonButtons slot="secondary"> 
          <IonButton fill="outline" color="secondary" key="modal-close" onClick={() => cancelModal()}><IonIcon icon={closeCircleOutline}></IonIcon>{t("general.cancel")}</IonButton>
        </IonButtons>
        <IonButtons slot="end">
          <IonButton fill="solid" color="primary" className="primary-button" key="modalok" onClick={() => saveModal()}><IonIcon icon={saveOutline}></IonIcon>{t("general.save")}</IonButton>
        </IonButtons>
      </IonToolbar>
    </IonModal>
    )
}

export default ItemListsModal;

  