/* ====== BURAYI KENDİNE GÖRE DÜZENLE ====== */
const BASE = 'https://www.mia-entertainment.com.tr';

// Üstteki iki büyük kart
const FEATURED = [
  { title: 'Sekizinci Müşteri', desc: 'Psikolojik korku · Mia Original', url: BASE },
  { title: 'Mia Launcher',      desc: 'Minecraft için tek yerden yönetim', url: BASE },
];

// Mini oyunlar (bu sitenin içinde açılır)
const MINI = [
  { title: '🔮 Mia Chomp',    desc: 'Labirent · peletleri topla, dronlardan kaç', url: 'oyunlar/chomp/' },
  { title: '🎮 Mia Platform', desc: 'Platform · elmasları topla, bayrağa ulaş',   url: 'oyunlar/platform/' },
];

// Alttaki bağlantı butonları
const LINKS = [
  { icon: '🌐', label: 'Resmi Web Sitesi',                 url: BASE },
  { icon: '📦', label: 'Sunucu Paketleri & Mod Paylaşımı', url: BASE },
  { icon: '📰', label: 'Stüdyodan Haberler',               url: BASE },
  { icon: '💬', label: 'Discord',                          url: BASE + '/discord' },
  { icon: '📸', label: 'Instagram',                        url: BASE + '/instagram' },
  { icon: '🛟', label: 'Destek Merkezi',                   url: BASE + '/destek' },
];

// Daktilo efektiyle dönen yazılar
const LINES = [
  'Bağımsız teknoloji ve oyun geliştirme',
  'Teknolojiyle yeni fikirler hayata geçir.',
  'Teknoloji, yazılım ve oyun.',
];
/* ========================================= */

const $ = id => document.getElementById(id);

// Kartları ve bağlantıları oluştur
$('featured').innerHTML = FEATURED.map(f =>
  `<a class="feat" href="${f.url}" target="_blank" rel="noopener"><b>${f.title}</b><small>${f.desc}</small></a>`
).join('');

$('mini').innerHTML = MINI.map(f =>
  `<a class="feat" href="${f.url}"><b>${f.title}</b><small>${f.desc}</small></a>`
).join('');

$('links').innerHTML = LINKS.map(l =>
  `<a href="${l.url}" target="_blank" rel="noopener"><span class="ic">${l.icon}</span>${l.label}<span class="arrow">→</span></a>`
).join('');

// Eğlencelik, tamamen yerel açılış animasyonu: gerçek sunucu bağlantısı yapılmaz.
function enter() {
  $('splash').classList.add('gone');
  $('page').classList.remove('hidden');
  typeLoop();
}
const splashStatus = $('splash-status');
const progress = $('loading-progress');
const progressBar = document.querySelector('.loading-track');
function setProgress(value) {
  progress.style.width = value + '%';
  progressBar.setAttribute('aria-valuenow', value);
}
setTimeout(() => { setProgress(32); }, 700);
setTimeout(() => {
  splashStatus.textContent = 'Hata: Sunucu kahve molasında ☕';
  splashStatus.classList.add('error');
  setProgress(46);
}, 1500);
setTimeout(() => {
  splashStatus.textContent = 'Sorun bulundu: Sunucuya kahve veriliyor...';
  splashStatus.classList.remove('error');
  splashStatus.classList.add('fixing');
  setProgress(72);
}, 2700);
setTimeout(() => {
  splashStatus.textContent = 'Tamamdır! Otomatik giriş yapılıyor 🚀';
  splashStatus.classList.remove('fixing');
  splashStatus.classList.add('success');
  setProgress(100);
}, 4000);
setTimeout(enter, 5200);

// Daktilo efekti
let li = 0, ci = 0, del = false, started = false;
function typeLoop() {
  if (started) return;
  started = true;
  (function tick() {
    const s = LINES[li];
    $('typed').textContent = s.slice(0, ci);
    if (!del && ci === s.length) { del = true; return setTimeout(tick, 1700); }
    if (del && ci === 0) { del = false; li = (li + 1) % LINES.length; }
    ci += del ? -1 : 1;
    setTimeout(tick, del ? 28 : 60);
  })();
}

// Fareyle hafif 3D eğilme (dokunmatikte kapalı)
const card = $('card');
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let targetX = 0, targetY = 0, tiltFrame = 0;
  addEventListener('pointermove', e => {
    targetX = (e.clientX / innerWidth - 0.5) * 8;
    targetY = -(e.clientY / innerHeight - 0.5) * 8;
    if (tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      card.style.setProperty('--ry', targetX.toFixed(2) + 'deg');
      card.style.setProperty('--rx', targetY.toFixed(2) + 'deg');
      tiltFrame = 0;
    });
  });
  addEventListener('pointerleave', () => {
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rx', '0deg');
  });
}

// Parçacıklı arka plan
const cv = $('bg'), ctx = cv.getContext('2d');
let w, h, ps = [];
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  w = innerWidth; h = innerHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.min(110, Math.round(w * h / 16000));
  ps = Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.6 + 0.6,
    c: Math.random() < 0.5 ? '255,79,163' : '139,92,246',
  }));
}
function frame() {
  ctx.clearRect(0, 0, w, h);
  for (const p of ps) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    ctx.fillStyle = `rgba(${p.c},0.85)`;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
      const d = Math.hypot(dx, dy);
      if (d < 110) {
        ctx.strokeStyle = `rgba(${ps[i].c},${(1 - d / 110) * 0.28})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke();
      }
    }
  }
  requestAnimationFrame(frame);
}
addEventListener('resize', resize);
resize();
frame();
