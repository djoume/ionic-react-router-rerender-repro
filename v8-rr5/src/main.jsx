import '@ionic/react/css/core.css';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { config } from './config';
import { renders } from './renders';

createRoot(document.getElementById('root')).render(<App />);

// Overlay updated from outside React so it does not add renders of its own.
const overlay = document.createElement('pre');
overlay.style.cssText =
  'position:fixed;top:56px;right:0;z-index:99999;margin:0;padding:4px;font:10px monospace;background:rgba(255,255,200,.92);pointer-events:none;max-height:60vh;overflow:hidden';
document.body.appendChild(overlay);
setInterval(() => {
  const pages = window.__mountedPages();
  const total = Object.values(renders).reduce((a, b) => a + b, 0);
  overlay.textContent =
    `${JSON.stringify(config)}\nmounted .ion-page: ${pages.length}\ntotal renders: ${total}\n` +
    Object.entries(renders)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
}, 250);
