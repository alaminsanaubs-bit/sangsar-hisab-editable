
const CACHE_NAME = "sangsar-editable-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// অ্যাপের প্রয়োজনীয় ফাইল ক্যাশে রাখা
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        APP_FILES.map(async file => {
          try {
            const response = await fetch(file, {
              cache: "reload"
            });

            if (response.ok) {
              await cache.put(file, response);
            }
          } catch (error) {
            console.log("ফাইল ক্যাশে রাখা যায়নি:", file);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

// পুরোনো ক্যাশে মুছে নতুন ক্যাশে চালু
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );

      await self.clients.claim();
    })()
  );
});

// অনলাইন থাকলে নতুন ফাইল নেওয়া, অফলাইনে ক্যাশে ব্যবহার
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async response => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("./", response.clone());
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(event.request) ||
            await caches.match("./") ||
            await caches.match("./index.html")
          );
        })
    );

    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(async response => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }

        return response;
      })
      .catch(async () => {
        return await caches.match(event.request) ||
          Response.error();
      })
  );
});
