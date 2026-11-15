/* Mia Platform – özgün yan kaydırmalı platform oyunu. Seviyeler tohumlu rastgele üretilir. */
(() => {
  const cv = document.getElementById('g'), ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);

  const TS = 32, H = 10, VW = 480, VH = 320;
  const G = 0.5, JUMP = -11, SPEED = 3.2, MAXFALL = 12;
  const PW = 22, PH = 28;

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }

  // ---------- Seviye üretimi ----------
  function buildLevel(n) {
    const r = rng(n * 104729 + 7);
    const diff = Math.min(n - 1, 6);
    const LEN = 100 + diff * 14;
    const W = LEN + 40;
    const tiles = Array.from({ length: H }, () => Array(W).fill(0));
    const gems = [], enemies = [];
    let top = 8, cx = 0;
    const ground = (x0, len, tr) => {
      for (let x = x0; x < x0 + len; x++) for (let y = tr; y < H; y++) tiles[y][x] = 1;
    };
    const gem = (gx, gy) => gems.push({ x: gx * TS + TS / 2, y: gy * TS + TS / 2, got: false });

    ground(0, 10, top); cx = 10;
    for (let i = 1; i <= 3; i++) gem(3 + i * 1.5, top - 2);

    while (cx < LEN) {
      const roll = r();
      if (roll < 0.22 + diff * 0.03) {                      // boşluk
        const gl = 2 + (r() < 0.4 + diff * 0.05 ? 1 : 0);
        for (let i = 0; i < gl; i++) gem(cx + i, top - 2 - 1.5 * Math.sin(Math.PI * (i + 0.5) / gl));
        cx += gl;
        const len = 4 + Math.floor(r() * 4);
        ground(cx, len, top); cx += len;
      } else if (roll < 0.45) {                              // basamak
        let nt = top + (r() < 0.5 ? -1 : 1);
        nt = Math.max(5, Math.min(8, nt)); top = nt;
        const len = 5 + Math.floor(r() * 5);
        ground(cx, len, top); gem(cx + 2, top - 2); cx += len;
      } else {                                               // düz zemin
        const len = 6 + Math.floor(r() * 6);
        ground(cx, len, top);
        for (let i = 1; i < len - 1; i += 2) if (r() < 0.6) gem(cx + i, top - 1.5);
        if (len >= 7 && r() < 0.5) {                         // aşağıdan geçilebilen platform
          const px = cx + 2;
          for (let i = 0; i < 3; i++) { tiles[top - 3][px + i] = 2; gem(px + i, top - 4.3); }
        }
        if (len >= 9 && r() < 0.35 + diff * 0.07) {
          enemies.push({
            x: (cx + Math.floor(len / 2)) * TS, y: top * TS - 22, w: 26, h: 22,
            vx: (r() < 0.5 ? -1 : 1) * (0.8 + diff * 0.1),
            minX: (cx + 2) * TS, maxX: (cx + len - 3) * TS - 26, alive: true,
          });
        }
        cx += len;
      }
    }
    ground(cx, 14, top);
    const goal = { x: (cx + 8) * TS, y: (top - 4) * TS, w: 10, h: 4 * TS };
    return { tiles, gems, enemies, W, goal };
  }

  // ---------- Durum ----------
  let L, p, camX = 0;
  let score = 0, lives = 3, level = 1, state = 'ready', freeze = 0, msg = '';
  let coyote = 0, jumpBuf = 0, tick = 0;
  const keys = { left: false, right: false, jump: false };
  const stars = Array.from({ length: 50 }, () => ({
    x: Math.random() * VW, y: Math.random() * VH * 0.8, s: Math.random() * 1.6 + 0.4, d: 0.1 + Math.random() * 0.3,
  }));
  let best = 0;
  try { best = +localStorage.getItem('mia-platform-best') || 0; } catch (e) {}

  const tile = (tx, ty) => {
    if (tx < 0 || tx >= L.W) return 1;
    if (ty < 0 || ty >= H) return 0;
    return L.tiles[ty][tx];
  };

  function hud() {
    $('score').textContent = 'Puan: ' + score;
    $('lives').textContent = '❤️'.repeat(Math.max(lives, 0)) + '♡'.repeat(Math.max(3 - lives, 0));
    $('level').textContent = 'Seviye ' + level;
    $('best').textContent = 'Rekor: ' + best;
  }

  function loadLevel(n) {
    L = buildLevel(n);
    p = { x: 2 * TS, y: 8 * TS - PH, w: PW, h: PH, vx: 0, vy: 0, onGround: false, face: 1 };
    camX = 0; coyote = 0; jumpBuf = 0;
  }

  function startGame() {
    score = 0; lives = 3; level = 1;
    loadLevel(1); state = 'play'; freeze = 30; msg = 'Hazır!'; hud();
  }

  function gameOver() {
    state = 'over';
    if (score > best) {
      best = score;
      try { localStorage.setItem('mia-platform-best', best); } catch (e) {}
    }
    hud();
  }

  function die() {
    lives--; hud();
    if (lives <= 0) { gameOver(); return; }
    loadLevel(level); freeze = 50; msg = 'Tekrar dene!';
  }

  function win() {
    score += 100; level++;
    loadLevel(level); freeze = 90; msg = 'Seviye ' + level; hud();
  }

  // ---------- Çarpışma ----------
  function collideX() {
    const x0 = Math.floor(p.x / TS), x1 = Math.floor((p.x + p.w - 1) / TS);
    const y0 = Math.floor(p.y / TS), y1 = Math.floor((p.y + p.h - 1) / TS);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (tile(tx, ty) !== 1) continue;
        if (p.vx > 0) p.x = tx * TS - p.w;
        else if (p.vx < 0) p.x = (tx + 1) * TS;
        p.vx = 0;
      }
    }
  }

  function collideY(prevBottom) {
    const x0 = Math.floor(p.x / TS), x1 = Math.floor((p.x + p.w - 1) / TS);
    const y0 = Math.floor(p.y / TS), y1 = Math.floor((p.y + p.h - 1) / TS);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tile(tx, ty);
        if (!t) continue;
        if (t === 1) {
          if (p.vy > 0) { p.y = ty * TS - p.h; p.vy = 0; p.onGround = true; }
          else if (p.vy < 0) { p.y = (ty + 1) * TS; p.vy = 0; }
        } else if (t === 2 && p.vy > 0 && prevBottom <= ty * TS + 0.001) {
          p.y = ty * TS - p.h; p.vy = 0; p.onGround = true;
        }
      }
    }
  }

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---------- Bir fizik adımı (60 Hz) ----------
  function step() {
    if (state !== 'play') return;
    if (freeze > 0) { freeze--; return; }
    tick++;

    const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    p.vx += (ax * SPEED - p.vx) * 0.3;
    if (Math.abs(p.vx) < 0.05) p.vx = 0;
    if (ax) p.face = ax;

    if (jumpBuf > 0) jumpBuf--;
    coyote = p.onGround ? 6 : Math.max(0, coyote - 1);
    if (jumpBuf > 0 && coyote > 0) { p.vy = JUMP; p.onGround = false; coyote = 0; jumpBuf = 0; }
    if (!keys.jump && p.vy < -4) p.vy = -4;

    p.vy = Math.min(p.vy + G, MAXFALL);
    p.x += p.vx; collideX();
    const pb = p.y + p.h;
    p.y += p.vy; p.onGround = false; collideY(pb);

    if (p.y > H * TS + 40) { die(); return; }

    // Düşmanlar
    for (const e of L.enemies) {
      if (!e.alive) continue;
      e.x += e.vx;
      if (e.x < e.minX) { e.x = e.minX; e.vx = Math.abs(e.vx); }
      if (e.x > e.maxX) { e.x = e.maxX; e.vx = -Math.abs(e.vx); }
      if (overlap(p, e)) {
        if (p.vy > 0 && pb <= e.y + 10) { e.alive = false; p.vy = -7; score += 50; hud(); }
        else { die(); return; }
      }
    }

    // Elmaslar
    for (const g of L.gems) {
      if (g.got) continue;
      if (Math.abs(g.x - (p.x + p.w / 2)) < 16 && Math.abs(g.y - (p.y + p.h / 2)) < 20) {
        g.got = true; score += 10; hud();
      }
    }

    // Bayrak
    if (overlap(p, L.goal)) { win(); return; }

    const target = Math.max(0, Math.min(L.W * TS - VW, p.x + p.w / 2 - VW / 2));
    camX += (target - camX) * 0.15;
  }

  // ---------- Çizim ----------
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawPlayer() {
    const x = p.x - camX, y = p.y;
    const g = ctx.createLinearGradient(x, y, x + p.w, y + p.h);
    g.addColorStop(0, '#ff4fa3'); g.addColorStop(1, '#8b5cf6');
    ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 10;
    ctx.fillStyle = g; rr(ctx, x, y, p.w, p.h, 6); ctx.fill();
    ctx.shadowBlur = 0;
    const f = p.face * 1.5;
    for (const ex of [5, 13]) {
      ctx.fillStyle = '#fff'; ctx.fillRect(x + ex, y + 8, 5, 7);
      ctx.fillStyle = '#1a0b2e'; ctx.fillRect(x + ex + 1.5 + f * 0.6, y + 10, 2.5, 4);
    }
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 1); ctx.lineTo(x + 4, y - 8); ctx.lineTo(x + 8, y - 4); ctx.lineTo(x + 11, y - 10);
    ctx.lineTo(x + 14, y - 4); ctx.lineTo(x + 18, y - 8); ctx.lineTo(x + 18, y - 1);
    ctx.closePath(); ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, VW, VH);

    // Yıldızlar (paralaks)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      const sx = (((s.x - camX * s.d) % VW) + VW) % VW;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin((tick + s.x) / 30);
      ctx.fillRect(sx, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // Zemin ve platformlar
    const x0 = Math.floor(camX / TS), x1 = x0 + Math.ceil(VW / TS) + 1;
    for (let ty = 0; ty < H; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tile(tx, ty);
        if (!t || tx >= L.W) continue;
        const px = tx * TS - camX, py = ty * TS;
        if (t === 1) {
          ctx.fillStyle = '#2a1a55'; ctx.fillRect(px, py, TS, TS);
          ctx.fillStyle = 'rgba(139,92,246,0.25)'; ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
          if (tile(tx, ty - 1) === 0) { ctx.fillStyle = '#ff4fa3'; ctx.fillRect(px, py, TS, 3); }
        } else {
          ctx.fillStyle = '#c77dff'; ctx.fillRect(px, py, TS, 8);
          ctx.fillStyle = '#ff4fa3'; ctx.fillRect(px, py, TS, 2);
        }
      }
    }

    // Elmaslar
    for (const g of L.gems) {
      if (g.got) continue;
      const gx = g.x - camX, gy = g.y + Math.sin((tick + g.x) / 15) * 2;
      if (gx < -20 || gx > VW + 20) continue;
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8; ctx.fillStyle = '#67e8f9';
      ctx.beginPath(); ctx.moveTo(gx, gy - 8); ctx.lineTo(gx + 7, gy); ctx.lineTo(gx, gy + 8); ctx.lineTo(gx - 7, gy);
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    }

    // Düşmanlar
    for (const e of L.enemies) {
      if (!e.alive) continue;
      const ex = e.x - camX;
      if (ex < -40 || ex > VW + 40) continue;
      ctx.fillStyle = '#ff3b6b'; rr(ctx, ex, e.y, e.w, e.h, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(ex + 5, e.y + 6, 6, 6); ctx.fillRect(ex + 15, e.y + 6, 6, 6);
      ctx.fillStyle = '#1a0b2e'; ctx.fillRect(ex + 7 + Math.sign(e.vx), e.y + 8, 3, 4); ctx.fillRect(ex + 17 + Math.sign(e.vx), e.y + 8, 3, 4);
      ctx.fillStyle = '#7a0a2a'; ctx.fillRect(ex + 3, e.y + 4, 8, 2); ctx.fillRect(ex + 15, e.y + 4, 8, 2);
    }

    // Bayrak
    const gl = L.goal, gx = gl.x - camX;
    if (gx > -60 && gx < VW + 60) {
      ctx.fillStyle = '#e8e8f5'; ctx.fillRect(gx, gl.y, 4, gl.h);
      ctx.fillStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(gx + 4, gl.y + 4); ctx.lineTo(gx + 34, gl.y + 18); ctx.lineTo(gx + 4, gl.y + 32);
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    }

    drawPlayer();

    // Mesajlar
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (state === 'ready' || state === 'over') {
      ctx.fillStyle = 'rgba(5,8,25,0.7)'; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#f4eefc';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(state === 'over' ? 'Oyun bitti · ' + score : 'Mia Platform', VW / 2, VH / 2 - 20);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(state === 'over' ? 'Tekrar için dokun / bir tuşa bas' : 'Başlamak için dokun / bir tuşa bas', VW / 2, VH / 2 + 14);
    } else if (freeze > 0 && msg) {
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(5,8,25,0.9)'; ctx.strokeText(msg, VW / 2, VH / 2 - 40);
      ctx.fillStyle = '#ffd166'; ctx.fillText(msg, VW / 2, VH / 2 - 40);
    }
  }

  // ---------- Girdi ----------
  const KM = {
    ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump',
  };
  function press(k) {
    if (state !== 'play') startGame();
    if (k === 'jump' && !keys.jump) jumpBuf = 6;
    keys[k] = true;
  }
  function release(k) { keys[k] = false; }

  addEventListener('keydown', e => {
    const k = KM[e.key];
    if (!k) return;
    e.preventDefault();
    press(k);
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) release(k); });
  cv.addEventListener('pointerdown', () => { if (state !== 'play') startGame(); });
  document.querySelectorAll('#pad button').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); press(k); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => release(k)));
  });

  // ---------- Döngü (sabit 60 Hz adım) ----------
  loadLevel(1); hud();
  let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= 16.667) { step(); acc -= 16.667; }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if (window.__MIA_TEST) {
    window.__MIA_TEST({
      step, draw, startGame, loadLevel, keys, TS, H, tile,
      setLevel: n => { level = n; loadLevel(n); hud(); },
      press, release,
      get: () => ({ state, score, lives, level, p, L, freeze }),
    });
  }
})();
