/* משבצת — service worker
 * קבצי האפליקציה: קודם מהרשת (כדי שעדכונים יגיעו מיד), ובלי אינטרנט מהמטמון.
 * גופנים של Google: מהמטמון, ומתעדכנים ברקע.
 * להעלות את VERSION כשמוסיפים או מוחקים קבצים מהרשימה.
 */
const VERSION = 'v4';
const APP_CACHE = `msh-app-${VERSION}`;
const FONT_CACHE = 'msh-fonts';
const APP_FILES = [
  './',
  'index.html',
  'math.js',
  'english.js',
  'hebrew.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('msh-app-') && k !== APP_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONT_CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (url.origin !== location.origin) return;
  // עותק אחד לכל קובץ, בלי ?… (למשל ?fbclid= מוואטסאפ/פייסבוק): אחרת נשמרים כמה עותקים, ובלי אינטרנט עלול לעלות עותק ישן של הדף
  const key = url.origin + url.pathname;
  e.respondWith(
    fetch(req)
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(APP_CACHE).then(c => c.put(key, copy)); } return r; })
      .catch(async () => (await caches.match(key)) ||
        (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
