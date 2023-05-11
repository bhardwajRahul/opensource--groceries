import { IonContent, IonPage, IonList, IonItem,
        IonButton, useIonAlert, IonInput,
        IonRadioGroup, IonRadio, IonCheckbox, isPlatform, IonItemDivider, IonSelect, IonSelectOption, IonButtons, IonToolbar, IonText } from '@ionic/react';
import { useContext, useEffect, useRef, useState } from 'react';        
import { usePouch } from 'use-pouchdb';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import './Settings.css';
import { InitSettings } from '../components/DBSchema';
import { GlobalStateContext } from '../components/GlobalState';
import { initialRemoteDBState, RemoteDBStateContext,  } from '../components/RemoteDBState';
import { HistoryProps, UserInfo, initUserInfo } from '../components/DataTypes';
import { maxAppSupportedSchemaVersion, appVersion , GlobalSettings, AddListOptions} from '../components/DBSchema';
import PageHeader from '../components/PageHeader';
import { useTranslation } from 'react-i18next';
import { languageDescriptions } from '../i18n';
import { isEmpty, isEqual } from 'lodash';
import { checkUserByEmailExists, emailPatternValidation, fullnamePatternValidation, updateUserInfo } from '../components/Utilities';
import { cloneDeep } from 'lodash';
import Loading from '../components/Loading';

type ErrorInfo = {
  isError: boolean,
  fullNameError: string,
  emailError: string,
  formError: string
}

const ErrorInfoInit: ErrorInfo = {
  isError: false,
  fullNameError: "",
  emailError: "",
  formError: ""
}

const Settings: React.FC<HistoryProps> = (props: HistoryProps) => {
  const db = usePouch();
  const [presentAlert] = useIonAlert();
  const {globalState, settingsLoading, updateSettingKey} = useContext(GlobalStateContext);
  const { remoteDBCreds, setDBCredsValue, remoteDBState, setRemoteDBState } = useContext(RemoteDBStateContext);
  const [localSettings, setLocalSettings] = useState<GlobalSettings>(InitSettings)
  const [localSettingsInitialized,setLocalSettingsInitialized] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>(initUserInfo);
  const [errorInfo,setErrorInfo] = useState<ErrorInfo>(cloneDeep(ErrorInfoInit));
  const { t, i18n } = useTranslation();
  const screenLoading = useRef(false);

  useEffect( () => {
    if (!localSettingsInitialized && globalState.settingsLoaded) {
      setLocalSettings(prevState=>(globalState.settings));
      setUserInfo({name: String(remoteDBCreds.dbUsername), email: String(remoteDBCreds.email), fullname: String(remoteDBCreds.fullName)})
      setLocalSettingsInitialized(true);
    }
  },[globalState.settings,localSettingsInitialized,globalState.settingsLoaded, remoteDBCreds.fullName, remoteDBCreds.email, remoteDBCreds.dbUsername])

  if ( settingsLoading || !globalState.settingsLoaded || !localSettingsInitialized)  {
    return ( <Loading isOpen={screenLoading.current} message={t("general.loading")} />)
//    setIsOpen={() => {screenLoading.current = false}} /> )
  };

  async function destroyDB() {
    await db.destroy();
    let credsStr=JSON.stringify({});
    await Preferences.set({key: 'dbcreds', value: credsStr})
    if (!(isPlatform("desktop") || isPlatform("electron"))) {App.exitApp()}
    setRemoteDBState(initialRemoteDBState);
    window.location.replace('/');
    return false;
  }

  function destroyDBPopup() {
    presentAlert({
      header: t("error.warning"),
      subHeader: '',
      message: t("general.want_remove_local_database"),
      buttons: [
        {
          text:t("general.cancel"),
          role: 'cancel',
          handler: () => {}},
        {
        text: t("general.remove"),
        role: 'confirm',
        handler: () => {destroyDB()}}
        ]
    })
  }

  function changeSetting(key: string, value: AddListOptions | boolean | number) {
    updateSettingKey(key,value);
    setLocalSettings(prevState => ({...prevState,[key]: value}));
  }

  async function doUpdateUserInfo() {
    let errorFound=false;
    setErrorInfo(prevState=>({...prevState,emailError: "", fullNameError:"",formError: "",isError: false}));
    if (isEmpty(userInfo.email) || !emailPatternValidation(String(userInfo.email))) {
      errorFound=true;setErrorInfo(prevState=>({...prevState,emailError:t("error.invalid_email_format"),isError: true}))
    }
    if (isEmpty(userInfo.fullname) || !fullnamePatternValidation(String(userInfo.fullname))) {
      errorFound=true;setErrorInfo(prevState=>({...prevState,emailError:t("error.invalid_fullname_format"),isError: true}))      
    }
    if (errorFound) return;
    if (isEqual(userInfo,{name: remoteDBCreds.dbUsername, email: remoteDBCreds.email, fullname: remoteDBCreds.fullName})) {
      setErrorInfo(prevState=>({...prevState,formError: "No changes made, not updating"}))
      return;
    }
    if (userInfo.email !== remoteDBCreds.email) {
        let checkExists = await checkUserByEmailExists(userInfo.email,remoteDBCreds);
        if (checkExists.userExists && checkExists.username !== remoteDBCreds.dbUsername) {
          setErrorInfo(prevState=>({...prevState,emailError: "Email already exists under different user", isError: true}));
          return;
        }
    }
    let updateSuccess = await updateUserInfo(String(remoteDBCreds.apiServerURL),remoteDBState.accessJWT,userInfo)
    if (!updateSuccess) {
      setErrorInfo(prevState=>({...prevState,formError: "Error updating user info, retry"}));
      return
    }
    setDBCredsValue("email",userInfo.email);
    setDBCredsValue("fullName",userInfo.fullname);    
    setErrorInfo(prevState=>({...prevState,formError: "User Info Saved"}));
  }

  const curLanguage = i18n.resolvedLanguage;

  return (
    <IonPage>
      <PageHeader title={t("general.settings")} />
      <IonContent fullscreen>
        <IonList lines="none">
          <IonItemDivider class="category-divider">{t("general.app_info")}</IonItemDivider>
          <IonItem class="shorter-item-some-padding">{t("general.app_version")} : {appVersion}</IonItem>
          <IonItem class="shorter-item-some-padding">{t("general.database_schema_version")}: {maxAppSupportedSchemaVersion}</IonItem>
          <IonItemDivider class="category-divider">{t("general.user_info")}</IonItemDivider>
          <IonItem class="shorter-item-no-padding">
            <IonInput class="shorter-input shorter-input2" type="text" disabled={true} labelPlacement="stacked" label={t("general.user_id") as string} value={userInfo.name} />
          </IonItem>
          <IonItem class="shorter-item-no-padding">
            <IonInput type="text" labelPlacement="stacked" label={t("general.name") as string}
                      value={userInfo.fullname} errorText={errorInfo.fullNameError}
                      className={(errorInfo.isError ? "ion-invalid": "ion-valid")+(" ion-touched shorter-input shorter-input2") }
                      onIonInput={(ev) => {
                        setUserInfo(prevState=>({...prevState,fullname: String(ev.detail.value)}));
                        setErrorInfo(prevState=>({...prevState,isTouched: true}))}} />
          </IonItem>
          <IonItem class="shorter-item-no-padding">
            <IonInput type="text" labelPlacement="stacked" label={t("general.email") as string}
                      value={userInfo.email} errorText={errorInfo.emailError}
                      className={(errorInfo.isError ? "ion-invalid": "ion-valid")+(" ion-touched shorter-input shorter-input2") }
                      onIonInput={(ev) => {
                        setUserInfo(prevState=>({...userInfo,email: String(ev.detail.value)}));
                        setErrorInfo(prevState=>({...prevState,isTouched: true})) }} />
          </IonItem>
          <IonItem><IonText>{errorInfo.formError}</IonText></IonItem>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton fill="solid" size="small" color="danger" onClick={() => destroyDBPopup()} key="deletedb">{t("general.delete_local_data")}</IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton fill="solid" size="small" color="primary" onClick={() => doUpdateUserInfo()} key="updateuser">{t("general.update_user_info")}</IonButton>
            </IonButtons>
          </IonToolbar>
          <IonItemDivider>{t("general.add_other_list_options")}</IonItemDivider> 
          <IonRadioGroup value={localSettings?.addListOption} onIonChange={(e) => changeSetting("addListOption",e.detail.value)}>
          <IonItem class="shorter-item-some-padding myindented" key="addallauto">
            <IonRadio class="indent-setting" justify="space-between" labelPlacement="start" value={AddListOptions.addToAllListsAutomatically}>{t("general.add_same_group_auto")}</IonRadio>
          </IonItem>
          <IonItem class="shorter-item-some-padding" key="addcategoryauto">
            <IonRadio class="indent-setting" justify="space-between" labelPlacement="start" value={AddListOptions.addToListsWithCategoryAutomatically}>{t("general.add_same_categories_auto")}</IonRadio>
          </IonItem>
          <IonItem class="shorter-item-some-padding" key="dontaddauto">
            <IonRadio class="indent-setting" justify="space-between" labelPlacement="start" value={AddListOptions.dontAddAutomatically}>{t("general.dont_add_auto")}</IonRadio>
          </IonItem>
          </IonRadioGroup>
          <IonItemDivider>{t("general.other_settings")}</IonItemDivider>
          <IonItem class="shorter-item-no-padding" key="language">
            <IonSelect class="shorter-select shorter-select2" label={t("general.language") as string} interface="popover" onIonChange={(e) => i18n.changeLanguage(e.detail.value)} value={curLanguage}>
                {languageDescriptions.map((lng: any) => (
                    <IonSelectOption key={"language-"+lng.key} value={lng.key}>
                      {lng.name}
                    </IonSelectOption>
                ))}
            </IonSelect>
          </IonItem>
          <IonItem class="shorter-item-some-padding" key="removesettings">
            <IonCheckbox justify="space-between" labelPlacement="start" checked={localSettings.removeFromAllLists} onIonChange={(e) => changeSetting("removeFromAllLists",e.detail.checked)}>{t("general.remove_items_all_lists_purchased")}</IonCheckbox>
          </IonItem>
          <IonItem class="shorter-item-some-padding" key="deletesettings">
            <IonCheckbox justify="space-between" labelPlacement="start" checked={localSettings.completeFromAllLists} onIonChange={(e) => changeSetting("completeFromAllLists",e.detail.checked)}>{t("general.delete_all_lists_when_deleting_completed")}</IonCheckbox>
          </IonItem>
          <IonItem class="shorter-item-some-padding" key="searchsettings">
            <IonCheckbox justify="space-between" labelPlacement="start" checked={localSettings.includeGlobalInSearch} onIonChange={(e) => changeSetting("includeGlobalInSearch",e.detail.checked)}>{t("general.include_globalitems_in_search")}</IonCheckbox>
          </IonItem>
          <IonItem class="shorter-item-no-padding" key="dayslog">
            <IonInput class="shorter-input shorter-input2" label={t("general.days_conflict_log_to_view") as string} labelPlacement="start" type="number" min="0" max="25" onIonInput={(e) => changeSetting("daysOfConflictLog", Number(e.detail.value))} value={Number(localSettings?.daysOfConflictLog)}></IonInput>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
