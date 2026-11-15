# sitemiz

Minimal ana sayfa + tarayıcıda çalışan küçük bir oyun ("Yıldız Yakala"). Tamamen statik: build gerekmez.

## Dosyalar

- `index.html` – ana sayfa (tek bağlantı: "sadece oyun")
- `style.css` – ortak stil ve yıldızlı arka plan (renkler en üstteki `:root` içinde)
- `oyun/index.html` – oyun

## GitHub Pages ile yayınlama

1. GitHub'da yeni bir repo oluştur (örn. `sitemiz`).
2. Bu dosyaları repoya yükle (`Add file → Upload files`) veya `git push` ile gönder.
3. Repo → **Settings → Pages** → *Source*: `Deploy from a branch`, *Branch*: `main` / `(root)` → **Save**.
4. Birkaç dakika sonra site `https://KULLANICI_ADIN.github.io/sitemiz/` adresinde yayında olur.

Kendi alan adını bağlamak için aynı sayfadaki **Custom domain** alanını kullan.

## Özelleştirme

- Arka plan/renkler: `style.css` içindeki `--bg1`, `--bg2`, `--bg3`, `--accent`
- Site adı: `index.html` ve `oyun/index.html` içindeki `<title>`
- Oyun zorluğu: `oyun/index.html` içinde `speed` ve `spawn` değerleri
