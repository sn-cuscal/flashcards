/* createApp.jsx — framework entry point. An app supplies its config + datasets;
   this mounts the shared App inside the iOS device frame and wires the responsive
   scaler that keeps the fixed-size frame fitted to the viewport. */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { IOSDevice } from './components/IOSFrame.jsx'
import { App } from './App.jsx'
import './styles.css'

// the frame is authored at a fixed 402×874; scale it to fit the window
function fitFrame() {
  const scaler = document.getElementById("scaler");
  if (!scaler) return;
  const s = Math.min((window.innerHeight - 28) / 874, (window.innerWidth - 20) / 402, 1);
  scaler.style.transform = "scale(" + s + ")";
}

export function createApp({ config, data, quiz, mount = "#root" }) {
  if (config.documentTitle) document.title = config.documentTitle;

  const el = typeof mount === "string" ? document.querySelector(mount) : mount;
  createRoot(el).render(
    <IOSDevice>
      <App config={config} data={data} quiz={quiz} />
    </IOSDevice>
  );

  window.addEventListener("resize", fitFrame);
  fitFrame();
}
