// Captured once at load: tab navigation drops the query string.
const q = new URLSearchParams(window.location.search);

export const config = {
  // routes: each tab is its own <Route> child of IonRouterOutlet
  // splat:  one <Route path="/*" element={<Routes>…</Routes>} /> view
  mount: q.get('mount') ?? 'routes',
  // none | location | params | navigate | ionrouter
  hooks: q.get('hooks') ?? 'none',
  memo: q.get('memo') === '1',
  // 1: the component that renders IonRouterOutlet calls useLocation(), so the
  // <Route element={…}> elements are re-created on every navigation
  parentLoc: q.get('parentLoc') === '1',
  // rows in each page's List child: raises the cost of one page render
  rows: Number(q.get('rows') ?? 50),
  // synthetic CPU work (loop iterations) per child render, without extra DOM
  work: Number(q.get('work') ?? 0),
};
window.__config = config;
