import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useFind } from 'use-pouchdb';
import './Lists.css';
//import { IToDoList } from '../components/DataTypes';

const Lists: React.FC = () => {

  const { docs, loading, error } = useFind({
  index: {
    fields: ["type","name"]
  },
  selector: {
    type: "list",
    name: { $exists: true }
  },
  sort: [ "type", "name" ]
  })

  if (loading) { return (
    <IonPage><IonHeader><IonToolbar><IonTitle>Loading...</IonTitle></IonToolbar></IonHeader></IonPage>
  )}

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Shopping Lists</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Shopping Lists</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonList lines="full">
               {docs.map((doc) => (
                  <IonItem key={(doc as any)._id} >
                    <IonButton slot="start" class="textButton" fill="clear" routerLink={("/items/" + (doc as any)._id)}>{(doc as any).name}</IonButton>
                    <IonButton routerLink={"/list/" + (doc as any)._id} slot="end">
                      Edit
                    </IonButton>
                    <IonButton routerLink={"/categoriesseqlist/" + (doc as any)._id} slot="end">
                      Categories
                    </IonButton>
                  </IonItem>  
            ))}
        </IonList>
      </IonContent>
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
        <IonFabButton>
          <IonIcon icon={add}></IonIcon>
        </IonFabButton>
      </IonFab>
    </IonPage>
  );
};

export default Lists;
