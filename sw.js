/* Service Worker: מאפשר לאפליקציה לעבוד Offline אחרי הביקור הראשון */
const CACHE = "cpp-trainer-v2";
const ASSETS = ["./", "./index.html", "./icon.png", "./icon.svg", "./manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  // ניווט לדף: קודם רשת (כדי לקבל עדכונים), ואם אין אינטרנט — מהמטמון
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy));
          return resp;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // שאר הקבצים: קודם מטמון, אחרת רשת
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cached =>
      cached ||
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return resp;
      })
    )
  );
});
