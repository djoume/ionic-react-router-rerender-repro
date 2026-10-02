import { IonApp, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { config } from './config';
import { PAGES, TABS } from './pages';
import { count } from './renders';

setupIonicReact();

const useMaybeLocation = config.parentLoc ? useLocation : () => undefined;

// Ionic 8 + React Router 5. mount=routes: one <Route> per tab; mount=splat: a bare <Switch> child (the pre-RR6 fata-app shape).
const Tabs = () => {
  count('Tabs (outlet parent)');
  useMaybeLocation();
  // children form, like RR6's element: the page element is created here, not by <Route>
  const routes = TABS.map((t) => {
    const Page = PAGES[t];
    return (
      <Route key={t} path={`/${t}`} exact>
        <Page />
      </Route>
    );
  });
  const redirect = <Route key="root" exact path="/" render={() => <Redirect to="/home" />} />;
  return (
    <IonTabs>
      <IonRouterOutlet>
        {config.mount === 'splat' ? (
          <Switch>
            {routes}
            {redirect}
          </Switch>
        ) : (
          [...routes, redirect]
        )}
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        {TABS.map((t) => (
          <IonTabButton key={t} tab={t} href={`/${t}`}>
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
