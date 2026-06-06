/* createApp.jsx — framework entry point. An app supplies its config + datasets;
   this mounts the shared App, wrapped in the responsive DesktopShell, into the
   page root. The shell is mobile-first: the app fills the viewport on phones and
   renders as a centred portrait column with a branded panel on wider screens. */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { DesktopShell } from './components/DesktopShell.jsx'
import { App } from './App.jsx'
import './styles.css'

export function createApp({ config, data, quiz, mount = "#root" }) {
  if (config.documentTitle) document.title = config.documentTitle;

  const el = typeof mount === "string" ? document.querySelector(mount) : mount;
  createRoot(el).render(
    <DesktopShell config={config} data={data} quiz={quiz}>
      <App config={config} data={data} quiz={quiz} />
    </DesktopShell>
  );
}
