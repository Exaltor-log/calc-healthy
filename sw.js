// Service worker: aplikasi tetap bisa dibuka tanpa internet,
// tapi saat ada internet semua berkas diambil versi terbarunya lebih dulu.
var VERSI = "snapeat-v3";
var BERKAS = ["./", "./index.html", "./manifest.webmanifest", "./ikon-192.png", "./ikon-512.png", "./ikon-maskable.png",
  "./tab-hari.png", "./tab-riwayat.png", "./tab-foto.png", "./tab-teman.png", "./tab-saya.png"];

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

self.addEventListener("fetch", function(e){
  var url = new URL(e.request.url);

  // Permintaan ke Google tidak pernah disimpan, harus selalu langsung ke jaringan.
  if (url.hostname.indexOf("googleapis.com") >= 0) return;
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Jaringan dulu untuk semua berkas milik aplikasi, termasuk ikon.
  // Salinan lokal hanya dipakai kalau jaringan gagal.
  e.respondWith(
    fetch(e.request).then(function(r){
      if (r && r.ok) {
        var salinan = r.clone();
        caches.open(VERSI).then(function(c){ c.put(e.request, salinan); });
      }
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(t){
        return t || caches.match("./index.html");
      });
    })
  );
});
