import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import { albumsOutline, listOutline, settingsOutline, nutritionOutline } from 'ionicons/icons';
import Lists from './pages/Lists';
import List from "./pages/List";
import Items from './pages/Items';
import Item from './pages/Item';
import CategoriesSeqList from './pages/CategoriesSeqList';
import Categories from './pages/Categories';
import Category from './pages/Category';
import Settings from './pages/Settings';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';


import { Provider } from 'use-pouchdb';
import PouchDB from 'pouchdb';
import find from 'pouchdb-find';

setupIonicReact();

const App: React.FC = () => {
  PouchDB.plugin(find);
  const [db, setDB] = useState(() => new PouchDB('local', {revs_limit: 10, auto_compaction: true}))
  const [remotedb,setRemotedb] = useState(() => new PouchDB(process.env.REACT_APP_COUCHDB_URL))
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect( () =>
  {
    const sync = db
      .sync(remotedb, {live: true, retry: true})
      .on('paused', () => { setIsSyncing(false)})
      .on('active', () => { setIsSyncing(true)})
      .on('denied', () => { console.log("permission error")})
  
    return () =>  { sync.cancel()}
  
  }, [db, remotedb])

  return (
  <IonApp>
    <Provider pouchdb={db}>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/lists">
            <Lists />
          </Route>
          <Route path="/items/:id" component={Items}>
          </Route>
          <Route path="/item/:id" component={Item}>
          </Route>
          <Route exact path="/categories">
            <Categories />
          </Route>
          <Route path="/category/:id" component={Category}>
          </Route>
          <Route path="/categoriesseqlist/:id" component={CategoriesSeqList}>
          </Route>
          <Route path="/settings">
            <Settings />
          </Route>
          <Route exact path="/">
            <Redirect to="/lists" />
          </Route>
          <Route path="/list/:id" component={List}>
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="lists" href="/lists">
            <IonIcon icon={albumsOutline} />
            <IonLabel>Lists</IonLabel>
          </IonTabButton>
          <IonTabButton tab="items" href="/items">
            <IonIcon icon={listOutline} />
            <IonLabel>Items</IonLabel>
          </IonTabButton>
          <IonTabButton tab="categories" href="/categories">
            <IonIcon icon={nutritionOutline} />
            <IonLabel>Categories</IonLabel>
          </IonTabButton>
          <IonTabButton tab="settings" href="/settings">
            <IonIcon icon={settingsOutline} />
            <IonLabel>Settings</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
    </Provider>    
  </IonApp>
  )
};

export default App;
