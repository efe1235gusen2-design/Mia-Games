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

// ---------- Ses (Web Audio, harici dosya yok) ----------
const Sound = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, enabled = true, lastHover = 0;
  try { enabled = localStorage.getItem('mia-games-sound') !== 'off'; } catch (e) {}

  function ensure() {
    if (!AC) return null;
    if (!ctx) { try { ctx = new AC(); } catch (e) { return null; } }
    return ctx;
  }
  function unlock() {
    const c = ensure();
    if (c && c.state !== 'running') c.resume().catch(() => {});
  }
  // Tarayıcılar ilk etkileşimden önce sesi engeller; ilk tuş/dokunuş/tık sesi açar.
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(ev =>
    addEventListener(ev, unlock, { capture: true, passive: true }));
  unlock();

  function tone(freq, dur, delay = 0, type = 'sine', vol = 0.05, slideTo = null) {
    if (!enabled) return;
    const c = ensure(); if (!c || c.state !== 'running') return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function whoosh() {
    if (!enabled) return;
    const c = ensure(); if (!c || c.state !== 'running') return;
    try {
      const len = Math.floor(c.sampleRate * 0.7), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
      src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.6);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.68);
      src.connect(f); f.connect(g); g.connect(c.destination); src.start(t);
    } catch (e) {}
  }
  const fx = {
    tick:    () => tone(700 + Math.random() * 200, 0.04, 0, 'square', 0.012),
    connect: () => { tone(440, 0.1, 0, 'triangle', 0.05); tone(660, 0.14, 0.1, 'triangle', 0.05); },
    error:   () => { tone(220, 0.22, 0, 'sawtooth', 0.06, 110); tone(196, 0.22, 0.24, 'sawtooth', 0.06, 90); tone(150, 0.4, 0.48, 'sawtooth', 0.05, 70); },
    fix:     () => { tone(392, 0.12, 0, 'triangle', 0.05); tone(523, 0.12, 0.12, 'triangle', 0.05); },
    success: () => { tone(523, 0.14, 0, 'sine', 0.06); tone(659, 0.14, 0.12, 'sine', 0.06); tone(784, 0.14, 0.24, 'sine', 0.06); tone(1047, 0.3, 0.36, 'sine', 0.06); },
    open:    whoosh,
    hover:   () => { const n = performance.now(); if (n - lastHover > 70) { lastHover = n; tone(1200, 0.035, 0, 'sine', 0.012); } },
    click:   () => tone(520, 0.07, 0, 'triangle', 0.04, 780),
  };
  const btn = document.getElementById('sound-btn');
  function sync() { if (btn) { btn.textContent = enabled ? '🔊' : '🔇'; btn.setAttribute('aria-pressed', String(enabled)); } }
  btn?.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem('mia-games-sound', enabled ? 'on' : 'off'); } catch (e) {}
    sync(); if (enabled) fx.connect();
  });
  sync();
  return { play: name => fx[name]?.() };
})();

// Bağlantı/hover/tık sesleri
document.addEventListener('pointerover', e => { if (e.target.closest('.feat, .links a')) Sound.play('hover'); });
document.addEventListener('pointerdown', e => { if (e.target.closest('.feat, .links a, #sound-btn')) Sound.play('click'); });

// ---------- Giriş ekranı: bar dolar -> hata verir -> düzelir -> dolar -> sayfa kendiliğinden açılır ----------
// Kullanıcının tıklamasına gerek yok; giriş ekranı tıkları yutar.
const splash = $('splash');
const splashStatus = $('splash-status');
const progress = $('loading-progress');
const progressBar = document.querySelector('.loading-track');
const pct = $('splash-pct');
['click', 'mousedown', 'dblclick', 'contextmenu', 'auxclick'].forEach(ev =>
  splash.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); }, true));

let entered = false;
function enter() {
  if (entered) return;
  entered = true;
  Sound.play('open');
  splash.classList.add('gone');
  $('page').classList.remove('hidden');
  typeLoop();
}
function setProgress(v) {
  v = Math.max(0, Math.min(100, v));
  progress.style.width = v.toFixed(1) + '%';
  progressBar.setAttribute('aria-valuenow', Math.round(v));
  pct.textContent = Math.round(v) + '%';
}
function setState(state, text) {
  splashStatus.className = state || '';
  progressBar.className = 'loading-track' + (state ? ' ' + state : '');
  splashStatus.textContent = text;
}

// Aşamalar: [süre ms, başlangıç %, bitiş %]
const PHASES = [
  { name: 'connect', ms: 1700, from: 0,  to: 44  },
  { name: 'error',   ms: 1400, from: 44, to: 44  },
  { name: 'fix',     ms: 1500, from: 44, to: 80  },
  { name: 'finish',  ms: 850,  from: 80, to: 100 },
  { name: 'hold',    ms: 600,  from: 100, to: 100 },
];
const ease = t => 1 - Math.pow(1 - t, 2.2);
let phaseIdx = -1, phaseStart = 0, lastTick = 0;
function startPhase(i, now) {
  phaseIdx = i; phaseStart = now;
  const n = PHASES[i].name;
  if (n === 'connect') { setState('', 'Sunucuya bağlanılıyor...'); Sound.play('connect'); }
  if (n === 'error')   { setState('error', 'Hata: Sunucu kahve molasında ☕'); Sound.play('error'); }
  if (n === 'fix')     { setState('fixing', 'Sorun bulundu: Sunucuya kahve veriliyor...'); Sound.play('fix'); }
  if (n === 'finish')  { setState('success', 'Tamamdır! Otomatik giriş yapılıyor 🚀'); Sound.play('success'); }
}
function loadFrame(now) {
  if (entered) return;
  if (phaseIdx < 0) startPhase(0, now);
  let p = PHASES[phaseIdx];
  let t = (now - phaseStart) / p.ms;
  if (t >= 1) {
    if (phaseIdx === PHASES.length - 1) { setProgress(100); return enter(); }
    startPhase(phaseIdx + 1, now);
    p = PHASES[phaseIdx]; t = 0;
  }
  let v = p.from + (p.to - p.from) * ease(Math.min(t, 1));
  // Hata anında bar hafifçe titrer ama geri gitmez
  if (p.name === 'error') v += Math.sin(now / 55) * 0.35;
  setProgress(v);
  if (p.name !== 'error' && p.name !== 'hold' && now - lastTick > 140) { lastTick = now; Sound.play('tick'); }
  requestAnimationFrame(loadFrame);
}
setProgress(0);
requestAnimationFrame(loadFrame);
// Sekme arka plandaysa rAF durur; yine de sayfa açılsın.
setTimeout(enter, 12000);

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

// Fare takibi: kart eğilir, ışık imleci izler, kartlarda spot ışığı gezer
const card = $('card');
const glow = $('cursor-glow');
const mouse = { x: -9999, y: -9999, gx: 0, gy: 0, on: false };
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let tiltFrame = 0, tx = 0, ty = 0;
  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!mouse.on) { mouse.on = true; mouse.gx = e.clientX; mouse.gy = e.clientY; glow.classList.add('on'); }
    const el = e.target.closest && e.target.closest('.feat, .links a, .card');
    if (el) {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }
    tx = (e.clientX / innerWidth - 0.5) * 8;
    ty = -(e.clientY / innerHeight - 0.5) * 8;
    if (tiltFrame) return;
    tiltFrame = requestAnimationFrame(() => {
      card.style.setProperty('--ry', tx.toFixed(2) + 'deg');
      card.style.setProperty('--rx', ty.toFixed(2) + 'deg');
      tiltFrame = 0;
    });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => {
    mouse.on = false; mouse.x = mouse.y = -9999; glow.classList.remove('on');
    card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg');
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
  if (mouse.on) {
    mouse.gx += (mouse.x - mouse.gx) * 0.14; mouse.gy += (mouse.y - mouse.gy) * 0.14;
    glow.style.transform = `translate3d(${mouse.gx}px, ${mouse.gy}px, 0)`;
  }
  for (const p of ps) {
    if (mouse.on) {
      const mdx = mouse.x - p.x, mdy = mouse.y - p.y, md = Math.hypot(mdx, mdy);
      if (md < 170 && md > 1) { p.vx += (mdx / md) * 0.012; p.vy += (mdy / md) * 0.012; }
    }
    p.vx *= 0.995; p.vy *= 0.995;
    const sp = Math.hypot(p.vx, p.vy); if (sp > 1.1) { p.vx *= 1.1 / sp; p.vy *= 1.1 / sp; }
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
  if (mouse.on) {
    for (const p of ps) {
      const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (d < 170) {
        ctx.strokeStyle = `rgba(255,79,163,${(1 - d / 170) * 0.55})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
  }
  requestAnimationFrame(frame);
}
addEventListener('resize', resize);
resize();
frame();
