import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, statSync } from 'node:fs'
import { resolve, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const appsDir = resolve(rootDir, 'apps')

// Each app is a directory under apps/ containing an index.html. The directory
// path becomes the URL path, so apps/aws/AIF-C01/ is served at /aws/AIF-C01/.
// Discovery is recursive so a new exam app needs no config change.
function findApps(dir) {
  const entries = {}
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      Object.assign(entries, findApps(full))
    } else if (name === 'index.html') {
      const key = relative(appsDir, dir).split(sep).join('/')
      entries[key] = full
    }
  }
  return entries
}

export default defineConfig({
  // Serve from apps/ so the app directory is the URL root (strips the apps/ prefix).
  root: 'apps',
  // Relative asset URLs so the build works under any GitHub Pages sub-path
  // (https://<user>.github.io/<repo>/aws/AIF-C01/) without hard-coding the repo name.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@framework': resolve(rootDir, 'src/framework'),
      '@game': resolve(rootDir, 'src/game'),
      '@shared': resolve(rootDir, 'live/shared'),
    },
  },
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: findApps(appsDir) },
  },
  server: {
    // allow importing the shared framework, which lives outside the apps/ root
    fs: { allow: [rootDir] },
  },
})
