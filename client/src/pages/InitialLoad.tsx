import { IonHeader, IonPage, IonTitle, IonToolbar, IonLoading } from '@ionic/react';
import { useContext, useEffect, useRef} from 'react';
import { usePouch } from 'use-pouchdb';
import { useLists } from '../components/Usehooks';
import { ConnectionStatus, RemoteDBStateContext } from '../components/RemoteDBState';
import { navigateToFirstListID } from '../components/RemoteUtilities';
import { initialSetupActivities } from '../components/Utilities';

type InitialLoadProps = {
  history : any
}

const InitialLoad: React.FC<InitialLoadProps> = (props: InitialLoadProps) => {
    const { remoteDBState, remoteDBCreds, setConnectionStatus} = useContext(RemoteDBStateContext);
    const { listRowsLoaded, listRows } = useLists()
    const db=usePouch();
    const screenLoading = useRef(true);
  
    useEffect(() => {
        async function initialStartup() {
            await initialSetupActivities(db as PouchDB.Database, String(remoteDBCreds.dbUsername));
            screenLoading.current=false;
            await navigateToFirstListID(db,props.history,remoteDBCreds,listRows);
            setConnectionStatus(ConnectionStatus.initialNavComplete);
        }
        if (listRowsLoaded) {
            if ((remoteDBState.connectionStatus === ConnectionStatus.loginComplete)) {
                initialStartup();
            } 
        }      
    },[db, listRows, props.history, remoteDBCreds, remoteDBState.connectionStatus, listRowsLoaded])   

    useEffect(() => {
        async function dismissToLogin() {
            screenLoading.current = false;
            setConnectionStatus(ConnectionStatus.onLoginScreen);
            props.history.push("/login");
        }
        if (remoteDBState.connectionStatus === ConnectionStatus.navToLoginScreen) {
            dismissToLogin();
        }
    },[remoteDBState.connectionStatus])

    return (
    <IonPage>
        <IonHeader>
            <IonToolbar>
                <IonTitle id="initialloadtitle">Loading...</IonTitle>
                <IonLoading isOpen={screenLoading.current} onDidDismiss={() => {screenLoading.current=false;}} 
                            message="Logging In..." />
            </IonToolbar>
        </IonHeader>
    </IonPage>

    )

}

export default InitialLoad;
