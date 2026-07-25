import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readdirSync, writeFileSync, statSync } from 'fs';
import { join, posix } from 'path';

// One platform service worker: at build time, enumerate everything in dist/ (the shell
// bundle, the chess sub-app at /chess/, Korean's content at /korean/, icons) and write a
// cache-first sw.js that precaches it all — so the whole platform works offline.
function precacheSW(): Plugin {
  return {
    name: 'platform-precache-sw',
    apply: 'build',
    closeBundle() {
      const dist = 'dist';
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const e of readdirSync(join(dist, dir))) {
          const rel = dir ? posix.join(dir, e) : e;
          if (statSync(join(dist, rel)).isDirectory()) walk(rel);
          // The big art collection (art/coll/, ~50MB) is NOT precached — it would bloat
          // install/offline storage. It caches lazily on first view instead (below).
          else if (rel !== 'sw.js' && !rel.startsWith('art/coll/')) files.push('./' + rel);
        }
      };
      walk('');
      const version = 'dl-' + files.length + '-' + files.join('|').length; // content-derived, stable
      const assets = JSON.stringify(files);
      const sw =
        `const V='${version}';const ASSETS=${assets};` +
        `self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)))});` +
        `self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>(x!==V&&x!=='dl-art')&&caches.delete(x)))).then(()=>self.clients.claim()))});` +
        `self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;` +
        `const lazyArt=e.request.url.includes('/art/coll/');` +
        `e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{` +
        `if(lazyArt&&res.ok){const cl=res.clone();caches.open('dl-art').then(c=>c.put(e.request,cl));}` +
        `return res;}).catch(()=>caches.match('./index.html'))))});`;
      writeFileSync(join(dist, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), precacheSW()],
  build: { target: 'es2022', outDir: 'dist' },
});
