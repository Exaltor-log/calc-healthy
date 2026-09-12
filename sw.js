// Service worker: aplikasi tetap bisa dibuka tanpa internet,
// tapi versi terbaru selalu diambil lebih dulu saat ada internet.
var VERSI = "kalori";
var BERKAS = ["./", "./index.html", "./manifest.webmanifest", "./ikon-192.png", "./ikon-512.png", "./ikon-maskable.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSI)
      .then(function(c){ return c.addAll(BERKAS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(daftar){
      return Promise.all(daftar.map(function(k){ return k===VERSI ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function simpan(permintaan, jawaban){
  var salinan = jawaban.clone();
  caches.open(VERSI).then(function(c){ c.put(permintaan, salinan); });
  return jawaban;
}

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);

  // Permintaan ke Google tidak pernah disimpan, harus selalu langsung ke jaringan.
  if (url.hostname.indexOf("googleapis.com") >= 0) return;
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  var kodeAplikasi = e.request.mode === "navigate"
    || /\.(html|js|webmanifest)$/.test(url.pathname);

  if (kodeAplikasi) {
    // Jaringan dulu: kalau ada internet, versi terbaru yang dipakai.
    // Kalau tidak ada, jatuh ke salinan terakhir yang tersimpan.
    e.respondWith(
      fetch(e.request)
        .then(function(r){ return r && r.ok ? simpan(e.request, r) : r; })
        .catch(function(){
          return caches.match(e.request).then(function(t){ return t || caches.match("./index.html"); });
        })
    );
    return;
  }

  // Gambar dan berkas lain: ambil dari simpanan dulu supaya cepat.
  e.respondWith(
    caches.match(e.request).then(function(t){
      return t || fetch(e.request).then(function(r){ return r && r.ok ? simpan(e.request, r) : r; });
    })
  );
});
