(() => {
  //page has loaded html
  registerSW();
  addListeners();
})();

function registerSW() {
  navigator.serviceWorker.register('./sw.js');
}

function addListeners() {
  document.querySelector('main').addEventListener('click', handleButtons);
}

function handleButtons(ev) {
  let btn = ev.target.closest('button');
  if (!btn) return;
  let type = btn.id.replace('btn', '');
  //only do a fetch if there is a service worker
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) {
      fetch('./colors/color/api/example?color=' + type.toLowerCase())
        .then((resp) => {
          if (!resp.ok) throw new Error('Bad Color Fetch: ' + resp.status + ' ' + resp.statusText);
          return resp.json();
        })
        .then((data) => {
          console.log(data);
          let html = buildBoxes(data);
          document.getElementById('colorResults').innerHTML = html;
        })
        .catch((err) => {
          console.warn(err.message);
        });
    } else {
      console.log('no service worker yet');
    }
  });
}

function buildBoxes(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  return data
    .map((item) => {
      return `<div class="box" style="background-color:hsl(${item.hue}, ${item.sat}, ${item.light})">
      hsl(${item.hue}, ${item.sat}, ${item.light})
    </div>`;
    })
    .join('');
}
