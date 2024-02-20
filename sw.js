const version = 1;
const cacheName = `demoCache-${version}`;
const staticFiles = ['./', './index.html', './css/main.css', './js/main.js'];
const colorCache = `colors-${cacheName}`;

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(staticFiles);
    })
  );
});
self.addEventListener('activate', (ev) => {
  //delete old caches
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((key) => key !== cacheName && key !== colorCache))
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
});

self.addEventListener('fetch', (ev) => {
  const isOnline = navigator.onLine;
  const url = new URL(ev.request.url);
  const domain = url.hostname;
  const path = url.pathname;
  const isColors = path.includes('colors');
  const params = new URLSearchParams(url.search);

  if (isOnline) {
    if (isColors) {
      //pretend to fetch a color cache it and return it
      let color = params.get('color');
      let hue;
      switch (color) {
        case 'red':
          //0-30
          hue = Math.floor(Math.random() * 30);
          break;
        case 'blue':
          //190-240
          hue = Math.floor(Math.random() * 50) + 190;
          break;
        case 'green':
          //90-150
          hue = Math.floor(Math.random() * 60) + 90;
          break;
        case 'orange':
          //35 -55
          hue = Math.floor(Math.random() * 20) + 35;
          break;
        default:
          hue = Math.floor(Math.random() * 360);
      }
      let sat = Math.floor(Math.random() * 50) + 25;
      let light = Math.floor(Math.random() * 50) + 25;
      let id = crypto.randomUUID();
      let clr = {
        id: id,
        hue: hue,
        sat: `${sat}%`,
        light: `${light}%`,
      };
      let file = new File([JSON.stringify(clr)], `${id}.json`, { type: 'application/json' });
      let req = new Request(`${id}.json`);
      let resp = new Response(file);
      ev.respondWith(
        caches
          .open(colorCache)
          .then((cache) => {
            //save a copy in the cache for later
            return cache.put(req, resp.clone());
          })
          .then(() => {
            //send the color json response back to the browser
            return resp;
          })
      );
    } else {
      ev.respondWith(
        fetch(ev.request).catch((err) => {
          return new Response(null, { status: 404 });
        })
      );
    }
  } else {
    if (isColors) {
      //return all the cached colors
      console.log(isOnline, path);
      ev.respondWith(
        caches
          .open(colorCache)
          .then((cache) => {
            return cache.keys();
          })
          .then((keys) => {
            //retrieve all the files from the cache
            console.log(keys.length, 'color json files');
            return Promise.all(keys.map((key) => caches.match(key)));
          })
          .then((responses) => {
            //read the json from all the file response objects
            console.log(responses);
            return Promise.all(responses.map((response) => response.json()));
          })
          .then((objects) => {
            //objects is an array that combined all the json into a single response object
            console.log({ objects });
            let combinedFile = new File([JSON.stringify(objects)], 'combined.json', { type: 'application/json' });
            let combinedResponse = new Response(combinedFile);
            return combinedResponse;
          })
          .catch((err) => {
            return new Response(null, { status: 437, statusText: 'Invalid Color Data' });
          })
      );
    } else {
      ev.respondWith(
        caches.match(ev.request).catch((err) => {
          return new Response(null, { status: 404 });
        })
      );
    }
  }
});
