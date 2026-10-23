const CACHE = 'athletic-tracker-v14';
const ASSETS = ['./index.html','./mobile.css','./mobile.js','./hybrid.js','./calisthenics.js','./extras.js','./speed.js','./manual.js','./race.js','./outdoor.js','./icon.svg','./icon-180-v3.png','./manifest.json','./icon-192-v3.png','./icon-512-v3.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('athletic-tracker-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Serve the installed app shell together. A partial network response must not
  // drop navigation/logging scripts or mix code from different releases.
  const requestURL = new URL(event.request.url);
  const shellURL = requestURL.pathname.endsWith('/') ? new URL('./index.html', self.registration.scope).href : requestURL.origin + requestURL.pathname;
  if (ASSETS.some(asset => new URL(asset, self.registration.scope).href === shellURL)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(shellURL)) || fetch(event.request)));
    return;
  }
  // A stalled connection must not prevent the installed app opening its cache.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  event.respondWith(fetch(event.request, {signal: controller.signal}).then(response => {
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(()=>caches.match(event.request).then(cached=>cached || (event.request.mode==='navigate' ? caches.match('./index.html') : Response.error()))).finally(()=>clearTimeout(timeout)));
});
