// Module-level render counter: incremented during render, read by the overlay and Playwright.
export const renders = {};
export const count = (name) => {
  renders[name] = (renders[name] ?? 0) + 1;
};
export const resetRenders = () => {
  for (const k of Object.keys(renders)) delete renders[k];
};
window.__renders = renders;
window.__resetRenders = resetRenders;
window.__mountedPages = () =>
  [...document.querySelectorAll('[data-page]')].map((el) => ({
    page: el.dataset.page,
    hidden: el.classList.contains('ion-page-hidden'),
    invisible: el.classList.contains('ion-page-invisible'),
  }));
