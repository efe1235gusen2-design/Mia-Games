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
