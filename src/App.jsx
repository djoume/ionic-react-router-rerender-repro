import { IonApp, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { config } from './config';
import { PAGES, TABS } from './pages';
import { count } from './renders';

setupIonicReact();

const useMaybeLocation = config.parentLoc ? useLocation : () => undefined;

// Creates the <Route element={…}> elements. It re-renders on navigation only with ?parentLoc=1.
const Tabs = () => {
  count('Tabs (outlet parent)');
  useMaybeLocation();
  const routes = TABS.map((t) => {
    const Page = PAGES[t];
    return <Route key={t} path={`/${t}`} element={<Page />} />;
  });
  const redirect = <Route key="root" path="/" element={<Navigate to="/home" replace />} />;
  return (
    <IonTabs>
      <IonRouterOutlet>
        {config.mount === 'splat' ? (
          <Route
            path="/*"
            element={
              <Routes>
                {routes}
                {redirect}
              </Routes>
            }
          />
        ) : (
          [...routes, redirect]
        )}
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        {TABS.map((t) => (
          <IonTabButton key={t} tab={t} href={`/${t}`} data-tab={t}>
            <IonLabel>{t}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
    </IonTabs>
  );
};

export const App = () => (
  <IonApp>
    <IonReactRouter>
      <Tabs />
    </IonReactRouter>
  </IonApp>
);
