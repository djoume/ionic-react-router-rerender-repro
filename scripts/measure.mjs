// Usage: npm run build && npm run measure [-- --throttle=4 --switches=10 --only=splat --extra=rows=1000]
import { chromium, devices } from 'playwright';
import { preview } from 'vite';

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const THROTTLE = Number(arg('throttle', '1'));
const SWITCHES = Number(arg('switches', '10'));
const ONLY = arg('only', '');
const EXTRA = arg('extra', '');
const TABS = ['home', 'feed', 'leaders', 'rewards', 'profile'];

const VARIANTS = [
  'mount=routes&hooks=none',
  'mount=routes&hooks=location',
  'mount=routes&hooks=params',
  'mount=routes&hooks=navigate',
  'mount=routes&hooks=ionrouter',
  'mount=routes&hooks=none&parentLoc=1',
  'mount=routes&hooks=none&parentLoc=1&memo=1',
  'mount=routes&hooks=params&memo=1',
  'mount=routes&hooks=location&memo=1',
  'mount=splat&hooks=none',
  'mount=splat&hooks=location',
  'mount=splat&hooks=params',
  'mount=splat&hooks=none&parentLoc=1',
].filter((v) => !ONLY || v.includes(ONLY));

const server = await preview({ preview: { port: 4317, strictPort: true } });
const base = 'http://localhost:4317';
const browser = await chromium.launch();

const settle = (page) =>
  page.evaluate(
    () => new Promise((r) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 400)),
  );

const go = async (page, tab) => {
  await page.click(`ion-tab-button[tab="${tab}"]`);
  await page.waitForURL((u) => u.pathname === `/${tab}`);
  await page.waitForSelector(`[data-page="${tab}"]:not(.ion-page-hidden)`, { state: 'attached' });
  await settle(page);
};

const snapshot = (page) =>
  page.evaluate(() => {
    const r = { ...window.__renders };
    const lt = window.__longtasks.splice(0);
    return { renders: r, pages: window.__mountedPages(), longtasks: lt };
  });

const results = [];
for (const variant of VARIANTS) {
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__longtasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__longtasks.push(Math.round(e.duration));
    }).observe({ type: 'longtask', buffered: true });
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (THROTTLE > 1) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  }
  await page.goto(`${base}/home?${variant}${EXTRA ? `&${EXTRA}` : ''}`);
  await page.waitForSelector('[data-page="home"]', { state: 'attached' });
  await settle(page);
  // Warm-up: visit every tab once so each one is in the outlet's stack.
  for (const t of TABS.slice(1)) await go(page, t);
  const switches = [];
  for (let i = 0; i < SWITCHES; i++) {
    const tab = TABS[i % TABS.length];
    await page.evaluate(() => {
      window.__resetRenders();
      window.__longtasks.length = 0;
    });
    await go(page, tab);
    const s = await snapshot(page);
    const pageNames = new Set(TABS);
    const pagesRendered = Object.entries(s.renders).filter(([k]) => pageNames.has(k));
    const childRendered = Object.entries(s.renders).filter(([k]) => k.includes('.'));
    switches.push({
      to: tab,
      total: Object.values(s.renders).reduce((a, b) => a + b, 0),
      pageRenders: Object.fromEntries(pagesRendered),
      childRenders: childRendered.reduce((a, [, v]) => a + v, 0),
      childNames: childRendered.map(([k]) => k),
      mounted: s.pages.length,
      invisible: s.pages.filter((p) => p.invisible).map((p) => p.page),
      maxLongtask: Math.max(0, ...s.longtasks),
      longtasks: s.longtasks,
    });
  }
  const avg = (f) => +(switches.reduce((a, s) => a + f(s), 0) / switches.length).toFixed(1);
  const row = {
    variant,
    mounted: Math.max(...switches.map((s) => s.mounted)),
    pagesRenderedPerSwitch: avg((s) => Object.keys(s.pageRenders).length),
    pageRendersPerSwitch: avg((s) => Object.values(s.pageRenders).reduce((a, b) => a + b, 0)),
    childRendersPerSwitch: avg((s) => s.childRenders),
    totalPerSwitch: avg((s) => s.total),
    maxTotal: Math.max(...switches.map((s) => s.total)),
    maxLongtask: Math.max(...switches.map((s) => s.maxLongtask)),
    invisibleAfter: switches.at(-1).invisible.join(','),
    errors: errors.length,
  };
  results.push({ ...row, switches });
  console.log(JSON.stringify(row));
  await context.close();
}

await browser.close();
await server.close();
const fs = await import('node:fs');
fs.writeFileSync(`results-throttle${THROTTLE}${EXTRA ? `-${EXTRA.replace(/[&=]/g, '_')}` : ''}.json`, JSON.stringify(results, null, 2));
console.table(results.map(({ switches, ...r }) => r));
