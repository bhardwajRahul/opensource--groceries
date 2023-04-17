import { IonContent, IonPage, IonButton, IonList, IonInput, 
 IonItem, IonLabel, NavContext, IonIcon, useIonAlert, IonToolbar, IonButtons, IonItemDivider, IonGrid, IonRow, IonCol, IonCheckbox, IonSelect, IonSelectOption} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import { useUpdateGenericDocument, useCreateGenericDocument, useDeleteGenericDocument,
   useGetOneDoc, useItems, useRecipes } from '../components/Usehooks';
import { cloneDeep } from 'lodash';
import { PouchResponse, HistoryProps, ListRow, RowType, RecipeFormat} from '../components/DataTypes';
import { ItemDoc, ItemList, CategoryDoc, InitCategoryDoc, RecipeDoc, InitRecipeDoc, RecipeItem } from '../components/DBSchema';
import { addOutline, closeOutline, saveOutline, trashOutline } from 'ionicons/icons';
import ErrorPage from './ErrorPage';
import { Loading } from '../components/Loading';
import { GlobalDataContext } from '../components/GlobalDataProvider';
import PageHeader from '../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { translatedItemName } from '../components/translationUtilities';

type PageState = {
  recipeDoc: RecipeDoc,
  recipeFormat: RecipeFormat,
  formError: string,
  selectedListOrGroupID: string | null
}

const RecipeImport: React.FC<HistoryProps> = (props: HistoryProps) => {
  const [pageState, setPageState] = useState<PageState>({
      recipeDoc: InitRecipeDoc,recipeFormat: RecipeFormat.tandoor,
      formError: "", selectedListOrGroupID: null
  })
  const [presentAlert,dismissAlert] = useIonAlert();
  const createRecipe = useCreateGenericDocument();
  const { recipeDocs, recipesLoading, recipesError } = useRecipes();
  const { dbError: itemError, itemRowsLoaded, itemRows } = useItems({selectedListGroupID: null, isReady: true, 
        needListGroupID: false, activeOnly: false, selectedListID: null, selectedListType: RowType.list});
  const {goBack, navigate} = useContext(NavContext);
  const screenLoading = useRef(true);
  const globalData = useContext(GlobalDataContext);
  const { t } = useTranslation();

  useEffect( () => {
    if (pageState.selectedListOrGroupID === null && globalData.listRowsLoaded && globalData.listCombinedRows.length > 0) {
      setPageState(prevState=>({...prevState,selectedListOrGroupID:globalData.listCombinedRows[0].listOrGroupID}))
    }
  },[globalData.listRowsLoaded,globalData.listCombinedRows])

  if ( globalData.listError || itemError ){ return (
    <ErrorPage errorText={t("error.loading_recipe_import") as string}></ErrorPage>
    )};

  if (  globalData.categoryLoading || !pageState.recipeDoc || !globalData.listRowsLoaded || !itemRowsLoaded)  {
    return ( <Loading isOpen={screenLoading.current} message={t("general.loading_recipe_import")} />)
//    setIsOpen={() => {screenLoading.current = false}} /> )
  };
  
  screenLoading.current=false;

  async function updateThisRecipe() {
    setPageState(prevState=>({...prevState,formError:""}))
    if (pageState.recipeDoc.name === undefined || pageState.recipeDoc.name === "" || pageState.recipeDoc.name === null) {
      setPageState(prevState=>({...prevState,formError:t("error.must_enter_a_name") as string}))
      return false;
    }
    let recipeDup=false;
    (recipeDocs).forEach((doc) => {
      if ((doc._id !== pageState.recipeDoc._id) && (doc.name.toUpperCase() === pageState.recipeDoc.name.toUpperCase())) {
        recipeDup = true;
      }
    });
    if (recipeDup) {
      setPageState(prevState=>({...prevState,formError:t("error.duplicate_recipe_name") as string}))
      return
    }
    let result: PouchResponse;
    result = await createRecipe(pageState.recipeDoc);
    if (result.successful) {
        goBack("/recipes");
    } else {
        setPageState(prevState=>({...prevState,formError:(t("error.updating_recipe") as string) + " " + result.errorCode + " : " + result.errorText + ". " + (t("error.please_retry") as string)}))
    } 
  }

  let jsonFormatOptions: JSX.Element[] = [];
  Object.entries(RecipeFormat).forEach(([key,value]) => {
    jsonFormatOptions.push(
      <IonSelectOption key={key} value={key}>{value}</IonSelectOption>
    )
  })
  
  return (
    <IonPage>
      <PageHeader title={t("general.importing_recipe")+ pageState.recipeDoc.name } />
      <IonContent>
          <IonList>
            <IonItem key="name">
              <IonInput label={t("general.name") as string} labelPlacement="stacked" type="text" placeholder={t("general.new_placeholder") as string} onIonInput={(e) => setPageState(prevState=>({...prevState, recipeDoc: {...prevState.recipeDoc,name: String(e.detail.value)}}))} value={pageState.recipeDoc.name}></IonInput>
            </IonItem>
            <IonItem key="filetype">
              <IonSelect label={t("general.recipe_import_type") as string} interface="popover" onIonChange={(ev) => {setPageState(prevState=>({...prevState,recipeFormat:ev.detail.value}))}} value={pageState.recipeFormat}>
                  {jsonFormatOptions}
              </IonSelect>
            </IonItem>
            <IonItem key="fileimport">
              <IonButton>{t('general.import_file')}</IonButton>
              <input type="file" />
            </IonItem>
            <IonItem key="addtolist">
                <IonButton>{t("general.add_items_to")}</IonButton>
                <IonSelect class="select-list-selector" aria-label="" interface="popover" onIonChange={(ev) => (setPageState(prevState=>({...prevState,selectedListOrGroupID: ev.detail.value})))} value={pageState.selectedListOrGroupID}>
                  { globalData.listCombinedRows.map(lcr => (
                  <IonSelectOption disabled={lcr.rowKey==="G-null"} className={lcr.rowType === RowType.list ? "indented" : ""} key={lcr.listOrGroupID} value={lcr.listOrGroupID}>
                    {lcr.rowName}
                  </IonSelectOption>
                  ))
                  }
                </IonSelect>
            </IonItem>
          </IonList>
          <IonItem>{pageState.formError}</IonItem>
          <IonToolbar>
           <IonButtons slot="secondary">
           <IonButton fill="outline" color="secondary" onClick={() => goBack("/recipes")}><IonIcon slot="start" icon={closeOutline}></IonIcon>{t("general.cancel")}</IonButton>
          </IonButtons>
          <IonButtons slot="end">
          <IonButton fill="solid" color="primary" onClick={() => updateThisRecipe()}>
              <IonIcon slot="start" icon={(addOutline)}></IonIcon>
              {t("general.add")}
            </IonButton>
          </IonButtons>
          </IonToolbar>
      </IonContent>
    </IonPage>
  );
};

export default RecipeImport;
