import { IonContent, IonPage, IonButton, IonList, IonInput, 
 IonItem, NavContext, IonIcon, useIonAlert, IonToolbar, IonButtons, IonItemDivider, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonFooter, IonTextarea, useIonLoading, IonText} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import { useUpdateGenericDocument, useCreateGenericDocument, useDeleteGenericDocument,
   useGetOneDoc, useItems } from '../components/Usehooks';
import { cloneDeep } from 'lodash-es';
import { PouchResponse, HistoryProps, RowType} from '../components/DataTypes';
import { RecipeDoc, InitRecipeDoc, RecipeItem, ItemDoc, ItemDocInit, RecipeInstruction } from '../components/DBSchema';
import { add, addCircleOutline, closeCircleOutline, saveOutline, trashOutline } from 'ionicons/icons';
import ErrorPage from './ErrorPage';
import { Loading } from '../components/Loading';
import { GlobalStateContext } from '../components/GlobalState';
import PageHeader from '../components/PageHeader';
import RecipeItemSearch, { RecipeSearchData } from '../components/RecipeItemSearch';
import { useTranslation } from 'react-i18next';
import { translatedItemName } from '../components/translationUtilities';
import './Recipe.css';
import { findMatchingGlobalItem } from '../components/importUtilities';
import { createNewItemFromRecipeItem, isRecipeItemOnList, updateItemFromRecipeItem } from '../components/recipeUtilities';
import { RecipeItemInit } from '../components/DBSchema';
import RecipeModal from '../components/RecipeModal';
import log from "../components/logger";
import RecipeItemRows from '../components/RecipeItemRows';
import { checkNameInGlobalItems } from '../components/ItemUtilities';
import { useGlobalDataStore } from '../components/GlobalData';

type PageState = {
  recipeDoc: RecipeDoc,
  needInitDoc: boolean,
  deletingRecipe: boolean,
  selectedListOrGroupID: string | null
  selectedItemIdx: number,
  modalOpen: boolean,
  addingInProcess: boolean,
}

enum ErrorLocation  {
   Name, General
}
const FormErrorInit = { [ErrorLocation.Name]:       {errorMessage:"", hasError: false},
                        [ErrorLocation.General]:    {errorMessage:"", hasError: false}
                    }

const Recipe: React.FC<HistoryProps> = () => {
  const { mode, id: routeID } = useParams<{mode: string, id: string}>();
  const routeRecipeID: string|null = (mode === "new") ? null : routeID;
  const [pageState, setPageState] = useState<PageState>({
      recipeDoc: cloneDeep(InitRecipeDoc),needInitDoc: true,
      deletingRecipe: false, selectedListOrGroupID: null, selectedItemIdx: 0,
      modalOpen: false, addingInProcess: false
  })
  const [formErrors,setFormErrors] = useState(FormErrorInit);
  const [presentAlert] = useIonAlert();
  const [presentLoading, dismissLoading] = useIonLoading();
  const updateRecipe  = useUpdateGenericDocument();
  const createRecipe = useCreateGenericDocument();
  const deleteRecipe = useDeleteGenericDocument();
  const { doc: recipeDoc, loading: recipeLoading, dbError: recipeError} = useGetOneDoc(routeRecipeID);
  const recipeDocs = useGlobalDataStore((state) => state.recipeDocs);
  const loading = useGlobalDataStore((state) => state.isLoading);
  const error = useGlobalDataStore((state) => state.error);
  const db = useGlobalDataStore((state) => state.db);
  const listRowsLoaded = useGlobalDataStore((state) => state.listRowsLoaded);
  const recipeListGroup = useGlobalDataStore((state) => state.recipeListGroup);
  const listCombinedRows = useGlobalDataStore((state) => state.listCombinedRows);
  const globalData = useGlobalDataStore();
  const { dbError: itemError, itemRowsLoaded } = useItems({selectedListGroupID: null, isReady: true, 
        needListGroupID: false, activeOnly: false, selectedListID: null, selectedListType: RowType.list});
  const {goBack} = useContext(NavContext);
  const screenLoading = useRef(true);
  const { globalState } =useContext(GlobalStateContext);
  const { t } = useTranslation();
  const [ present] = useIonAlert();

  useEffect( () => {
    if (!recipeLoading && pageState.needInitDoc) {
      let newRecipeDoc: RecipeDoc 
      if (mode === "new" && pageState.needInitDoc) {
        newRecipeDoc = cloneDeep(InitRecipeDoc);
        newRecipeDoc.listGroupID = String(recipeListGroup);
      } else {
        newRecipeDoc = recipeDoc;
      }
      setPageState(prevState => ({...prevState, needInitDoc: false, recipeDoc: newRecipeDoc}))
    }
  },[recipeLoading,recipeDoc,mode,pageState.needInitDoc,recipeListGroup]);

  useEffect( () => {
    if (pageState.selectedListOrGroupID === null && listRowsLoaded && listCombinedRows.length > 0) {
      setPageState(prevState=>({...prevState,selectedListOrGroupID:listCombinedRows[0].listOrGroupID}))
    }
  },[listRowsLoaded,listCombinedRows,pageState.selectedListOrGroupID])

  if ( error !== null || itemError || ( mode !== "new" && recipeError) ) { return (
    <ErrorPage errorText={t("error.loading_recipe") as string}></ErrorPage>
    )};

  if ( recipeLoading || loading || !pageState.recipeDoc || pageState.deletingRecipe || !listRowsLoaded || !itemRowsLoaded || pageState.addingInProcess)  {
    return ( <Loading isOpen={screenLoading.current} message={t("general.loading_recipe")} />)
//    setIsOpen={() => {screenLoading.current = false}} /> )
  };
  
  screenLoading.current=false;

  async function updateThisRecipe() {
    setFormErrors(FormErrorInit);
    if (pageState.recipeDoc.name === undefined || pageState.recipeDoc.name === "" || pageState.recipeDoc.name === null) {
      setFormErrors(prevState => ({...prevState,[ErrorLocation.Name]: {errorMessage: t("error.must_enter_a_name"), hasError: true }}));
      return false;
    }
    let recipeDup=false;
    (recipeDocs).forEach((doc) => {
      if ((doc._id !== pageState.recipeDoc._id) && (doc.name.toUpperCase() === pageState.recipeDoc.name.toUpperCase())) {
        recipeDup = true;
      }
    });
    if (recipeDup) {
      setFormErrors(prevState => ({...prevState,[ErrorLocation.Name]: {errorMessage: t("error.duplicate_recipe_name"), hasError: true }}));
      return
    }
    let result: PouchResponse;
    if ( mode === "new") {
      result = await createRecipe(pageState.recipeDoc);
    } else {
      result = await updateRecipe(pageState.recipeDoc);
    }
    if (result.successful) {
        goBack("/recipes");
    } else {
        setFormErrors(prevState => ({...prevState,[ErrorLocation.General]: {errorMessage: (t("error.updating_recipe") as string) + " " + result.errorCode + " : " + result.errorText + ". " + (t("error.please_retry") as string), hasError: true }}));
    } 
  }
  
  async function deleteRecipeFromDB() {
   const recDelResponse = await deleteRecipe(pageState.recipeDoc);
   if (!recDelResponse.successful) {
    setFormErrors(prevState => ({...prevState,[ErrorLocation.General]: {errorMessage: t("error.unable_delete_recipe"), hasError: true }}));

    setPageState(prevState=>({...prevState,deletingRecipe: false}))
     return;
   }
    goBack("/recipes");
    setPageState(prevState=>({...prevState,deletingRecipe: false}))
  }

  async function deletePrompt() {
    setPageState(prevState=>({...prevState,deletingRecipe: true}));
    presentAlert({
      header: t("general.delete_this_recipe"),
      subHeader: t("general.really_delete_recipe"),
      buttons: [ { text: t("general.cancel"), role: "Cancel" ,
                  handler: () => setPageState(prevState=>({...prevState,deletingRecipe:false}))},
                  { text: t("general.delete"), role: "confirm",
                  handler: () => deleteRecipeFromDB()}]
    })
    }
  
  function editItemModal(index: number) {
    setPageState(prevState=>({...prevState,modalOpen: true,selectedItemIdx: index}))
  }

  function updateRecipeName(name: string) {
    log.debug("URN",name);
    const updRecipeDoc: RecipeDoc = cloneDeep(pageState.recipeDoc);
    let globalItemID: null | string = null;
    let newRecipeName: string = "";
    [globalItemID,newRecipeName] = findMatchingGlobalItem(name);  
    if (globalItemID == null) {
        newRecipeName= name;
    }
    updRecipeDoc.items[pageState.selectedItemIdx].name = newRecipeName;
    updRecipeDoc.items[pageState.selectedItemIdx].globalItemID = globalItemID;
    setPageState(prevState=>({...prevState,recipeDoc: updRecipeDoc}));
  }

  function updateRecipeStep(index: number, step: string) {
    const updRecipeSteps: RecipeInstruction[] = cloneDeep(pageState.recipeDoc.instructions);
    updRecipeSteps[index].stepText=step;
    setPageState(prevState=>({...prevState,recipeDoc: {...prevState.recipeDoc,instructions: updRecipeSteps}}))
  }

  function deleteRecipeStep(index: number) {
    const updRecipeSteps: RecipeInstruction[] = cloneDeep(pageState.recipeDoc.instructions);
    updRecipeSteps.splice(index,1);
    setPageState(prevState=>({...prevState,recipeDoc:{...prevState.recipeDoc,instructions: updRecipeSteps}}));
  }

  function addRecipeStep() {
    const updRecipeSteps: RecipeInstruction[] = cloneDeep(pageState.recipeDoc.instructions);
    updRecipeSteps.push({stepText: ""});
    setPageState(prevState=>({...prevState,recipeDoc:{...prevState.recipeDoc,instructions: updRecipeSteps}}));
  }

  function addExistingRecipeItem(id: string, data: RecipeSearchData) {
    const updItems: RecipeItem[] = cloneDeep(pageState.recipeDoc.items);
    const newItem:RecipeItem = cloneDeep(RecipeItemInit);
    newItem.addToList = true;
    newItem.globalItemID = data.globalItemID;
    newItem.name=translatedItemName(id,data.name,data.name);    
    updItems.push(newItem)
    setPageState(prevState=>({...prevState,recipeDoc:{...prevState.recipeDoc,items: updItems}}))
  }

  function addNewRecipeItem(name: string) {
    const updItems: RecipeItem[] = cloneDeep(pageState.recipeDoc.items);
    const newItem:RecipeItem = cloneDeep(RecipeItemInit);
    const [globalExists,globalID] = checkNameInGlobalItems(globalData.globalItemDocs,name,name);
    let globalShoppingUOM = null;
    if (globalExists) {
      const globalItem=globalData.globalItemDocs.find(gi => (gi._id === globalID));
      if (globalItem !== undefined) {globalShoppingUOM = globalItem.defaultUOM;}
    }
    newItem.addToList = true;
    newItem.globalItemID = globalID;
    newItem.shoppingUOMName = globalShoppingUOM;
    newItem.name=name;
    updItems.push(newItem)
    setPageState(prevState=>({...prevState,recipeDoc:{...prevState.recipeDoc,items: updItems}}))
  }

  async function addItemsToList() {
    await present({
      header: t("general.add_recipe_to_list"),
      subHeader: t("general.add_items_in_recipe",{recipeName: pageState.recipeDoc.name}),
      buttons: [
          { text: t("general.cancel"), role: "cancel", handler: () => {}},
          { text: t("general.ok"), role: "confirm", handler: () => {addItemsToListDB()}},
          ],
    })
  }

  async function addItemsToListDB() {
    presentLoading(t("general.adding_recipe_to_list") as string);
    let statusComplete = t("general.status_adding_recipe");
    setPageState(prevState=>({...prevState,addingInProcess: true}));
    for (let i = 0; i < pageState.recipeDoc.items.length; i++) {
      const item = pageState.recipeDoc.items[i];
      const newListItem: ItemDoc = cloneDeep(ItemDocInit);
      newListItem.globalItemID = item.globalItemID;
      newListItem.name = item.name;
      if (db !== null) {
        const [inList, itemID] = await isRecipeItemOnList({recipeItem: item, listOrGroupID: pageState.selectedListOrGroupID});
        if (inList && itemID !== null && db !== null) {
          const status=await updateItemFromRecipeItem({itemID: itemID, listOrGroupID: pageState.selectedListOrGroupID,
                recipeItem: item, settings: globalState.settings })
          if (status !== "") {statusComplete = statusComplete + "\n" + status};   
        } else {
          const status=await createNewItemFromRecipeItem({listOrGroupID: pageState.selectedListOrGroupID,
                recipeItem: item, settings: globalState.settings })
          if (status !== "") {statusComplete = statusComplete + "\n" + status};     
       }
      }
    }
    dismissLoading();
    setPageState(prevState=>({...prevState,addingInProcess: false}));
    await present({
      header: t("general.recipe_items_added_to_list"),
      message: statusComplete,
      cssClass: "import-status-alert",
      buttons: [
        {text: t("general.ok")}
      ]
    })
  }

  const recipeItem = pageState.selectedItemIdx >= (pageState.recipeDoc.items.length) ? 
      null : pageState.recipeDoc.items[pageState.selectedItemIdx];

  return (
    <IonPage>
      <PageHeader title={t("general.editing_recipe")+" "+pageState.recipeDoc.name } />
      <IonContent>
        { recipeItem !== null ?
          <RecipeModal 
            isOpen={pageState.modalOpen}
            setIsOpenFalse={() => setPageState(prevState => ({...prevState,modalOpen: false}))}
            recipeItem={recipeItem}
            recipeDoc={pageState.recipeDoc}
            selectedItemIdx={pageState.selectedItemIdx}
            updateRecipeDoc={(newDoc: RecipeDoc) => {setPageState(prevState => ({...prevState,recipeDoc: newDoc}))}}
            updateRecipeName={(name: string) =>{updateRecipeName(name)}}
          /> : <></>
        }
          <IonList className="ion-no-padding">
            <IonItem key="name">
              <IonInput label={t("general.name") as string} labelPlacement="stacked" type="text"
                        placeholder={t("general.new_placeholder") as string}
                        onIonInput={(e) => setPageState(prevState=>({...prevState, recipeDoc: {...prevState.recipeDoc,name: String(e.detail.value)}}))}
                        value={pageState.recipeDoc.name}
                        className={"ion-touched "+(formErrors[ErrorLocation.Name].hasError ? "ion-invalid": "")}
                        errorText={formErrors[ErrorLocation.Name].errorMessage}>
              </IonInput>
            </IonItem>
            <IonItem key="recipelistgroup">
            <IonSelect label="Recipe list group:" className="select-list-selector" aria-label=""
                        interface="popover" disabled={mode !== "new"}
                        onIonChange={(ev) => (setPageState(prevState=>({...prevState,recipeDoc: {...prevState.recipeDoc, listGroupID: ev.detail.value}})))}
                        value={pageState.recipeDoc.listGroupID}>              
                  { globalData.listCombinedRows.filter(lcr => (!lcr.hidden && lcr.listGroupRecipe)).map(lcr => (
                  <IonSelectOption disabled={lcr.rowKey==="G-null"} className={lcr.rowType === RowType.list ? "indented" : ""} key={lcr.listOrGroupID} value={lcr.listOrGroupID}>
                    {lcr.rowName}
                  </IonSelectOption>
                  ))
                  }
                </IonSelect>
            </IonItem>
            <IonItemDivider className="category-divider">{t("general.items_in_recipe")}</IonItemDivider>
            <RecipeItemRows 
              recipeDoc={pageState.recipeDoc}
              updateRecipeDoc={(newDoc: RecipeDoc) => {setPageState(prevState => ({...prevState,recipeDoc: newDoc}))}}
              editItemModal={(index) =>{editItemModal(index)}}
            />
            <RecipeItemSearch rowSelected={addExistingRecipeItem} addItemWithoutRow={addNewRecipeItem}/>
            <IonItemDivider className="category-divider">{t("general.recipe_steps")}</IonItemDivider>
            <IonItem key="recipesteps">
              <IonGrid>
                { pageState.recipeDoc.instructions.map((step,index) => (
                  <IonRow key={"step-"+index}>
                    <IonCol size="11"><IonTextarea autoGrow={true} aria-label="" className="recipe-step" value={step.stepText} onIonInput={(ev) => updateRecipeStep(index,String(ev.detail.value))}></IonTextarea></IonCol>
                    <IonCol size="1"><IonButton onClick={() => deleteRecipeStep(index)} fill="clear"><IonIcon icon={trashOutline}/></IonButton></IonCol>
                  </IonRow>
                  ))
                }
                <IonRow key="addastep">
                  <IonCol><IonButton onClick={() => addRecipeStep()}><IonIcon icon={add} /></IonButton></IonCol>
                </IonRow>
              </IonGrid>
            </IonItem>
          </IonList>
          </IonContent>
          <IonFooter>
            {formErrors[ErrorLocation.General].hasError ? <IonItem className="shorter-item-some-padding" lines="none"><IonText color="danger">{formErrors[ErrorLocation.General].errorMessage}</IonText></IonItem> : <></>}
            <IonGrid>
              <IonRow className="ion-justify-content-center ion-align-items-center">
                <IonCol size="5">
                  <IonButton size="small" className='extra-small-button'  onClick={() => addItemsToList()}>{t("general.add_items_to")}</IonButton>
                </IonCol>
                <IonCol size="7">
                <IonSelect className="select-list-selector" aria-label="" interface="popover" onIonChange={(ev) => (setPageState(prevState=>({...prevState,selectedListOrGroupID: ev.detail.value})))} value={pageState.selectedListOrGroupID}>
                  { globalData.listCombinedRows.filter(lcr => (!lcr.hidden && !lcr.listGroupRecipe)).map(lcr => (
                  <IonSelectOption disabled={lcr.rowKey==="G-null"} className={lcr.rowType === RowType.list ? "indented" : ""} key={lcr.listOrGroupID} value={lcr.listOrGroupID}>
                    {lcr.rowName}
                  </IonSelectOption>
                  ))
                  }
                </IonSelect>
                </IonCol>
              </IonRow>  
            </IonGrid>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton fill="outline" color="danger" onClick={() => deletePrompt()}><IonIcon slot="start" icon={trashOutline}></IonIcon>{t("general.delete")}</IonButton>
            </IonButtons>
            <IonButtons slot="secondary">
            <IonButton fill="outline" color="secondary" onClick={() => goBack("/recipes")}><IonIcon slot="start" icon={closeCircleOutline}></IonIcon>{t("general.cancel")}</IonButton>
            </IonButtons>
            <IonButtons slot="end">
            <IonButton fill="solid" color="primary" className="primary-button" onClick={() => updateThisRecipe()}>
                <IonIcon slot="start" icon={(mode === "new" ? addCircleOutline : saveOutline)}></IonIcon>
                {(mode === "new") ? t("general.add") : t("general.save")}
              </IonButton>
            </IonButtons>
            </IonToolbar>
          </IonFooter>
    </IonPage>
  );
};

export default Recipe;
