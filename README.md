# Mia Entertainment – profil sayfası

guns.lol tarzı, tek sayfalık, tamamen statik bir sayfa. Build gerekmez.

## Dosyalar

- `index.html` – sayfa iskeleti
- `style.css` – tasarım (renkler en üstteki `:root` içinde)
- `script.js` – bağlantılar, yazılar ve animasyonlar (en üstteki bölümden düzenle)
- `assets/mia-logo.png` – **buraya kendi logonu koy** (yoksa "M" harfi görünür)

## Düzenleme

`script.js` dosyasının en üstünde:
- `FEATURED`: üstteki iki büyük kart (oyun / launcher)
- `LINKS`: alttaki butonlar
- `LINES`: daktilo efektiyle dönen yazılar

Şu an çoğu bağlantı ana siteye gidiyor. Doğru alt sayfa adreslerini `url` alanlarına yaz.

## GitHub Pages

1. Eski dosyaları sil veya üzerine yaz, bu klasörün **içindeki** dosyaları reponun köküne yükle (`index.html` kökte olmalı).
2. Settings → Pages → `Deploy from a branch` → `main` / `(root)` → Save.
3. Özel domain için Settings → Pages → Custom domain.
