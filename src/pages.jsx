import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonRouter } from '@ionic/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { config } from './config';
import { count } from './renders';

const useRouterHook = () => {
  switch (config.hooks) {
    case 'location':
      return useLocation().pathname;
    case 'params':
      return JSON.stringify(useParams());
    case 'navigate':
      useNavigate();
      return 'navigate';
    case 'ionrouter':
      return useIonRouter().routeInfo?.pathname;
    default:
      return 'no hooks';
  }
};

const burn = (n) => {
  let sink = 0;
  for (let i = 0; i < n; i++) sink += Math.sqrt(i);
  window.__sink = sink;
};

const Child = ({ page, name, rows }) => {
  count(`${page}.${name}`);
  burn(config.work);
  return (
    <ul>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i}>
          {name} row {i}
        </li>
      ))}
    </ul>
  );
};

const makePage = (page) => {
  const Page = () => {
    count(page);
    const hookValue = useRouterHook();
    return (
      <IonPage data-page={page}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{page}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>hook: {hookValue}</p>
          <Child page={page} name="Summary" rows={3} />
          <Child page={page} name="List" rows={config.rows} />
          <Child page={page} name="Footer" rows={2} />
        </IonContent>
      </IonPage>
    );
  };
  Page.displayName = page;
  return config.memo ? React.memo(Page) : Page;
};

export const TABS = ['home', 'feed', 'leaders', 'rewards', 'profile'];
export const PAGES = Object.fromEntries(TABS.map((t) => [t, makePage(t)]));
