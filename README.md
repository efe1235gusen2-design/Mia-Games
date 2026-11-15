# Mia Entertainment – profil sayfası + mini oyunlar

guns.lol tarzı, tek sayfalık, tamamen statik bir site. Build gerekmez.

## Dosyalar

- `index.html` – ana sayfa (giriş ekranı + profil kartı)
- `mia.css` – ana sayfa stili (renkler en üstteki `:root` içinde)
- `script.js` – bağlantılar, mini oyun kartları, yazılar ve animasyonlar
- `assets/mia-entertainment.png` – giriş ekranındaki Mia Entertainment logosu
- `assets/mia-logo.png` – profil kartındaki site logosu
- `assets/favicon.png` – sekme ikonu
- `oyunlar/chomp/` – **Mia Chomp** (labirent oyunu)
- `oyunlar/platform/` – **Mia Platform** (yan kaydırmalı platform oyunu)
- `oyunlar/runner/` – **Mia Runner** (sonsuz koşu: kristallerin üstünden zıpla, dronların altından eğil)
- `oyunlar/oyun.css` – iki oyun sayfasının ortak stili

## Düzenleme

`script.js` dosyasının en üstünde:
- `FEATURED`: üstteki iki büyük kart (Sekizinci Müşteri / Mia Launcher)
- `MINI`: mini oyun kartları
- `LINKS`: alttaki butonlar
- `LINES`: daktilo efektiyle dönen yazılar

Şu an çoğu bağlantı ana siteye gidiyor. Doğru alt sayfa adreslerini `url` alanlarına yaz.

Logoları değiştirmek için `assets/` içindeki aynı isimli dosyaların üzerine yaz.

## GitHub Pages

1. Bu klasörün **içindeki** her şeyi reponun köküne yükle (`index.html` kökte olmalı).
2. Eski `style.css` ve `oyun/` klasörü artık kullanılmıyor, silebilirsin.
3. Settings → Pages → `Deploy from a branch` → `main` / `(root)` → Save.

## Oyunlar

- **Mia Chomp:** Ok tuşları / WASD veya parmakla kaydır. Her seviyede yeni labirent, dronlar giderek zorlaşır.
- **Mia Platform:** ← → / A D ile yürü, Boşluk / ↑ / W ile zıpla. Mobilde ekrandaki tuşlar görünür.

Rekorlar tarayıcıda (`localStorage`) saklanır.

## Giriş ekranı, ses ve fare takibi

- Giriş ekranında logo + ortalanmış durum yazısı + bar bulunur. Bar dolar, ~%44'te **hata** verir (kırmızı, titreme, hata sesi), düzelir ve %100 olunca sayfa **tıklama gerektirmeden** kendiliğinden açılır. Süreler `script.js` içindeki `PHASES` dizisindedir.
- Sesler Web Audio ile üretilir (harici dosya yok): bağlanma, tik, hata, düzelme, başarı, açılış, hover ve tık sesleri. Sağ üstteki 🔊 düğmesi sesi açar/kapatır (oyunlarla ortak ayar).
- Tarayıcılar sayfaya ilk dokunuştan/tuşa basıştan önce sesi engeller. Bu yüzden sayfa ziyaretçi hiçbir şeye basmasa da açılır, ses ise ilk tuş/dokunuş/tıkla devreye girer.
- Fare takibi: arka plandaki noktalar imlece çekilir ve çizgiyle bağlanır, imleci yumuşakça izleyen ışık halkası, geniş kutunun (`.layout`) fareye göre 3D bükülmesi, kart/butonlarda imleci izleyen parlama.

## Bağlantılar ve rekor tablosu

- `LINKS` içinde: Resmi Web Sitesi (ana sayfa), Sunucu Paketleri (`/sunucu-paketleri`), Reklam Ver (`/sponsorlu-sunucular`), Stüdyodan Haberler (`/haberler`), Discord, Instagram, Destek Merkezi, Hakkında (`/hakkimizda`).
- `oyunlar/istatistik.js`: iki oyunun ortak istatistik modülü. Ana sayfadaki **Rekor Tablosu** en iyi skor, en yüksek seviye, toplam ölüm, oynanan oyun, toplanan, yenilen düşman ve en iyi 5 skoru gösterir.
- Veriler `localStorage`'da (`mia-stats-v1`) tutulur, yani her ziyaretçi kendi cihazındaki rekorlarını görür. Herkesin birbiriyle yarıştığı ortak bir sıralama için sunucu tarafı (PHP + veritabanı) gerekir.

- **Mia Runner:** Boşluk / ↑ / W zıpla (basılı tut = daha yüksek), ↓ / S eğil. Mobilde ekrana dokun veya alttaki tuşları kullan. Her 500 puanda seviye atlanır, hız artar ve gece/gündüz değişir.

## Alan adı (www ile açılması)

`CNAME` dosyası `www.mia-games.lol` içerir; bu dosya reponun kökünde durmalı. GitHub Pages'te adresin başında `www` kalması için:
1. Settings → Pages → Custom domain alanına `www.mia-games.lol` yaz (apex `mia-games.lol` yazma) → Save, sonra Enforce HTTPS'i aç.
2. DNS: `www` için `CNAME` → `KULLANICIADI.github.io`; apex (`@`) için A kayıtları `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Böylece `mia-games.lol` yazanlar otomatik `www.mia-games.lol`'a gider.
3. Cloudflare kullanıyorsan Rules → Redirect Rules içinde `www`'yi apex'e yönlendiren bir kural varsa sil.
4. Tarayıcı eski yönlendirmeyi (301) önbelleğe alır; test için gizli sekme kullan.
