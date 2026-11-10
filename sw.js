// pdf-ep service worker: makes the app work offline after the first visit.
// Bump CACHE when you change vendor/ files, icons or other assets so old copies are dropped.
const CACHE='pdf-ep-v1';
const CORE=['./','index.html','manifest.webmanifest','favicon.svg','favicon-32.png','apple-touch-icon.png','icon-192.png','icon-512.png','preview.jpg',
  'vendor/pdf-lib.min.js','vendor/pdf.min.js','vendor/pdf.worker.min.js','vendor/jszip.min.js',
  'vendor/fonts/montserrat-500.woff2','vendor/fonts/montserrat-800.woff2'];
self.addEventListener('install',e=>{
  // add files one by one so a missing optional file (e.g. preview.jpg) does not break the install
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  if(r.mode==='navigate'){
    // page: newest copy when online, saved copy when offline
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html').then(m=>m||caches.match('./'))));
    return;
  }
  if(u.pathname.includes('/vendor/')){
    // libraries and font never change for a given file name: saved copy first
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
    return;
  }
  // everything else: show the saved copy now, refresh it in the background
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});
