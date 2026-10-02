# Ionic React 9: hidden tab pages re-render on every navigation

Minimal repro for `@ionic/react-router` 9.0.6 + `react-router-dom` 6.30: with one
`<Route>` per page inside `IonRouterOutlet`, every visited page stays mounted
(expected: Ionic keeps the stack), and every mounted page that reads a React
Router context re-renders on each navigation, hidden or not. Pages that use
`useParams` or `useNavigate` render **3 times per tab switch**, all of them.

## Run

```sh
npm install
npm run dev            # open http://localhost:5173/home?mount=routes&hooks=params
npm run build && npm run measure   # Playwright, Pixel 5 viewport, prints a table
npm run measure -- --throttle=4 --extra=work=5000000 --switches=5   # CPU x4 + long tasks
```

The yellow overlay shows the config, mounted pages and per-component render
counts (also on `window.__renders`; `window.__resetRenders()` zeroes them).

## Query params (read once at load)

| param         | values                                         | meaning                                                                                             |
| ------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `mount`       | `routes` (default), `splat`                    | one `<Route>` per tab, or one `<Route path="/*" element={<Routes>…</Routes>} />` view               |
| `hooks`       | `none`, `location`, `params`, `navigate`, `ionrouter` | which hook each page calls                                                                 |
| `memo`        | `1`                                            | wrap pages in `React.memo`                                                                          |
| `parentLoc=1` | `1`                                            | the component that renders `IonRouterOutlet` calls `useLocation()`, so route elements are re-created |
| `rows`/`work` | number                                         | rows in each page's list / synthetic CPU work per child render                                      |

## Steps

1. Open `/home?mount=routes&hooks=params`, click each tab once.
2. Click `home`, then `feed`: every page (all 5, 4 of them hidden) renders 3 times.
3. Repeat with `hooks=none`: 0 renders. With `mount=splat`: only the shown page renders.

## Expected

Hidden pages do not re-render when another tab is shown, or at most once.

## Cause

`ReactRouterViewStack.renderViewItem` (packages/react-router/src/ReactRouter/ReactRouterViewStack.tsx)
wraps every view in `<RouteContext.Provider value={routeContextValue}>` with a
new `routeContextValue` object each time `StackManager` renders. `StackManager`
renders 3 times per navigation (IonRouter re-renders on `useLocation()`, which
also gives a fresh `RouteManagerContext` value that bypasses `PureComponent`;
then `setRouteInfo`; then `handlePageTransition`'s `forceUpdate()`), so every
`RouteContext` consumer (`useParams`, `useNavigate`, `useMatch`, `useResolvedPath`,
`<Link>`…) in every mounted view re-renders 3 times. `React.memo` cannot help:
the re-render comes from context, not props.

`mount=splat` is a workaround, but unpatched 9.0.6 has a known bug with a single
splat view (ionic-team/ionic-framework#31525, pages left `ion-page-invisible`
after root navigations); this tabs-only repro does not trigger it.

`v8-rr5/` is the same app on `@ionic/react` 8.8.19 + `react-router-dom` 5.3.4 for
comparison (`cd v8-rr5 && npm install && npm run build && npm run measure`).
