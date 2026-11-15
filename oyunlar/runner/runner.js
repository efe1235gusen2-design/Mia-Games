/* Mia Runner – özgün sonsuz koşu oyunu. Kristallerin üstünden zıpla, dronların altından eğil. */
(() => {
  const cv = document.getElementById('g'), ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);

  const VW = 640, VH = 240, GROUND = 196;
  const GRAV = 0.68, JUMP_V = 12.6;
  const PX = 70, PW = 34, PH = 42, DH = 24;

  let state = 'ready', score = 0, bonus = 0, dist = 0, speed = 6, level = 1;
  let py = 0, vy = 0, ducking = false, jumpBuf = 0, frame = 0, overT = 0, msg = '', msgT = 0, newBest = false;
  let obstacles = [], gems = [], spawnIn = 260, night = 0, nightTarget = 0;
  const keys = { jump: false, down: false };

  let best = 0;
  try { best = Math.max(+localStorage.getItem('mia-runner-best') || 0, window.MiaStats ? MiaStats.get('runner').best : 0); } catch (e) {}

  // Arka plan öğeleri (yalnızca görsel)
  const stars = Array.from({ length: 36 }, () => ({ x: Math.random() * VW, y: Math.random() * 110, r: Math.random() * 1.3 + .4, s: Math.random() * .25 + .05 }));
  const specks = Array.from({ length: 26 }, () => ({ x: Math.random() * VW, y: GROUND + 8 + Math.random() * 30, w: Math.random() * 8 + 3 }));
  const peaks = (() => { const a = []; for (let x = 0; x <= VW; x += 40) a.push(128 + Math.sin(x * .031) * 18 + Math.cos(x * .017) * 14); a[a.length - 1] = a[0]; return a; })();
  let mtn = 0, starX = 0;

  function hud() {
    $('score').textContent = 'Puan: ' + score;
    $('level').textContent = 'Seviye ' + level;
    $('best').textContent = 'Rekor: ' + best;
  }

  function startGame() {
    score = 0; bonus = 0; dist = 0; speed = 6; level = 1; py = 0; vy = 0; ducking = false; jumpBuf = 0;
    obstacles = []; gems = []; spawnIn = 260; nightTarget = 0; msg = ''; msgT = 0; newBest = false; frame = 0;
    state = 'play';
    window.MiaStats?.start('runner');
    window.MiaAudio?.play('start');
    hud();
  }

  function gameOver() {
    state = 'over'; overT = 45;
    window.MiaStats?.death('runner');
    window.MiaStats?.over('runner', score, level);
    window.MiaAudio?.play('hit');
    window.MiaAudio?.play('gameover');
    if (score > best) {
      best = score; newBest = true;
      try { localStorage.setItem('mia-runner-best', best); } catch (e) {}
    }
    hud();
  }

  // ---------- Üretim ----------
  function spawn() {
    const x = VW + 24;
    const gap = speed * 40 + 70 + Math.random() * (speed * 22 + 60);
    const droneOk = score >= 250 && Math.random() < 0.3;
    if (droneOk) {
      const high = Math.random() < 0.3;
      obstacles.push({ type: 'drone', x, y: high ? GROUND - 98 : GROUND - 58, w: 44, h: 26, passed: false });
    } else {
      const n = 1 + (Math.random() < 0.35 ? 1 : 0) + (score > 400 && Math.random() < 0.25 ? 1 : 0);
      const parts = Array.from({ length: n }, () => ({ w: 16 + Math.random() * 8, h: 28 + Math.random() * 18 }));
      const w = parts.reduce((s, p) => s + p.w + 2, 0);
      obstacles.push({ type: 'crystal', x, y: 0, w, h: Math.max(...parts.map(p => p.h)), parts, passed: false });
    }
    if (Math.random() < 0.45) gems.push({ x: x + gap * 0.5, y: GROUND - (26 + Math.random() * 62), got: false });
    spawnIn = gap;
  }

  // ---------- Mantık ----------
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function playerRect() {
    const h = ducking ? DH : PH, bottom = GROUND - py;
    return { x: PX + 6, y: bottom - h + 6, w: PW - 12 + (ducking ? 6 : 0), h: h - 8 };
  }

  function step() {
    frame++;
    night += (nightTarget - night) * 0.02;
    if (msgT > 0) msgT--;
    if (state === 'over') { overT = Math.max(0, overT - 1); return; }
    mtn = (mtn + (state === 'play' ? speed : 1.2) * 0.12) % VW;
    starX = (starX + 0.1) % VW;
    for (const s of specks) { s.x -= (state === 'play' ? speed : 1.2); if (s.x < -12) s.x += VW + 24; }
    if (state !== 'play') return;

    speed = Math.min(13.5, speed + 0.0022);
    dist += speed;
    score = Math.floor(dist / 12) + bonus;
    const lv = 1 + Math.floor(score / 500);
    if (lv > level) {
      level = lv; nightTarget = level % 2 === 0 ? 1 : 0;
      msg = 'Seviye ' + level; msgT = 70; window.MiaAudio?.play('win');
    }

    // Oyuncu
    if (jumpBuf > 0) jumpBuf--;
    if (jumpBuf > 0 && py === 0) { vy = JUMP_V; jumpBuf = 0; window.MiaAudio?.play('jump'); }
    if (py > 0 || vy > 0) {
      if (!keys.jump && vy > 4.5) vy = 4.5;           // tuşu bırakırsan kısa zıplama
      vy -= GRAV + (keys.down ? 1.1 : 0);              // havadayken ↓ ile hızlı düşüş
      py += vy;
      if (py <= 0) { py = 0; vy = 0; }
    }
    ducking = keys.down && py === 0;

    // Dünya
    spawnIn -= speed;
    if (spawnIn <= 0) spawn();
    for (const o of obstacles) o.x -= speed;
    for (const g of gems) g.x -= speed;
    const pr = playerRect();
    for (const o of obstacles) {
      const r = o.type === 'drone'
        ? { x: o.x + 5, y: o.y + 5, w: o.w - 10, h: o.h - 10 }
        : { x: o.x + 3, y: GROUND - o.h + 5, w: o.w - 6, h: o.h - 5 };
      if (hit(pr, r)) { gameOver(); return; }
      if (!o.passed && o.x + o.w < PX) {
        o.passed = true; bonus += 5; window.MiaStats?.kill('runner');
      }
    }
    for (const g of gems) {
      if (g.got) continue;
      if (hit(pr, { x: g.x - 10, y: g.y - 10, w: 20, h: 20 })) {
        g.got = true; bonus += 50; window.MiaStats?.collect('runner'); window.MiaAudio?.play('collect');
      }
    }
    obstacles = obstacles.filter(o => o.x + o.w > -30);
    gems = gems.filter(g => !g.got && g.x > -30);
    if (frame % 6 === 0) hud();
  }

  // ---------- Çizim ----------
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function drawBackground() {
    const top = mix([27, 15, 58], [5, 3, 14], night), bot = mix([74, 15, 61], [26, 10, 44], night);
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, rgb(top)); g.addColorStop(1, rgb(bot));
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    // yıldızlar
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = (0.25 + night * 0.7) * (0.6 + 0.4 * Math.sin(frame * 0.03 + s.x));
      ctx.fillRect(((s.x - starX * s.s * 20) % VW + VW) % VW, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    // ay/güneş
    const mx = 520 - (frame * 0.02) % 40, my = 52;
    ctx.save(); ctx.shadowColor = night > .5 ? '#cfd6ff' : '#ff4fa3'; ctx.shadowBlur = 28;
    ctx.fillStyle = night > .5 ? '#e9ecff' : '#ff7ab8'; ctx.beginPath(); ctx.arc(mx, my, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // dağlar (paralaks)
    ctx.fillStyle = rgb(mix([42, 18, 78], [14, 8, 30], night));
    for (let t = -1; t <= 1; t++) {
      ctx.beginPath(); ctx.moveTo(t * VW - mtn, GROUND);
      peaks.forEach((y, i) => ctx.lineTo(t * VW - mtn + i * 40, y + 30));
      ctx.lineTo(t * VW - mtn + VW, GROUND); ctx.closePath(); ctx.fill();
    }
    // zemin
    const gg = ctx.createLinearGradient(0, GROUND, 0, VH);
    gg.addColorStop(0, rgb(mix([40, 20, 70], [18, 10, 34], night))); gg.addColorStop(1, '#0a0612');
    ctx.fillStyle = gg; ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.fillStyle = '#ff4fa3'; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 8; ctx.fillRect(0, GROUND, VW, 2); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (const s of specks) ctx.fillRect(s.x, s.y, s.w, 2);
  }

  function drawPlayer() {
    const bottom = GROUND - py, run = py === 0 && state === 'play';
    const w = ducking ? PW + 8 : PW, bodyH = ducking ? 20 : 30, legH = ducking ? 4 : 12;
    const x = PX - (ducking ? 4 : 0), bodyTop = bottom - legH - bodyH + 2;
    // gölge
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(PX + PW / 2, GROUND + 4, 16 - py * 0.05, 3, 0, 0, Math.PI * 2); ctx.fill();
    // bacaklar
    ctx.fillStyle = '#5b2fd1';
    const step = Math.floor(frame / 5) % 2;
    if (run && !ducking) { ctx.fillRect(x + 7, bottom - 12, 7, step === 0 ? 8 : 12); ctx.fillRect(x + w - 14, bottom - 12, 7, step === 1 ? 8 : 12); }
    else { ctx.fillRect(x + 7, bottom - legH, 7, legH); ctx.fillRect(x + w - 14, bottom - legH, 7, legH); }
    // gövde
    const g = ctx.createLinearGradient(x, bodyTop, x + w, bodyTop + bodyH);
    g.addColorStop(0, '#ff4fa3'); g.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = g; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 10; rr(ctx, x, bodyTop, w, bodyH, 8); ctx.fill(); ctx.shadowBlur = 0;
    // göz
    const ex = x + w - 15, ey = bodyTop + (ducking ? 5 : 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(ex, ey, 9, 9);
    ctx.fillStyle = '#1a0b2e'; ctx.fillRect(ex + 4, ey + 2, 4, 5);
    // taç
    ctx.fillStyle = '#ffd166';
    const cx = x + w / 2 - 8, cy = bodyTop - 1;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 2, cy - 8); ctx.lineTo(cx + 6, cy - 3); ctx.lineTo(cx + 8, cy - 10); ctx.lineTo(cx + 10, cy - 3); ctx.lineTo(cx + 14, cy - 8); ctx.lineTo(cx + 16, cy); ctx.closePath(); ctx.fill();
  }

  function drawObstacle(o) {
    if (o.type === 'drone') {
      const bob = Math.sin(frame * 0.15 + o.x * .02) * 2, y = o.y + bob;
      ctx.save(); ctx.shadowColor = '#ff3b6b'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff3b6b'; rr(ctx, o.x, y + 6, o.w, o.h - 8, 9); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fff'; ctx.fillRect(o.x + 8, y + 12, 7, 7); ctx.fillRect(o.x + 22, y + 12, 7, 7);
      ctx.fillStyle = '#1a0b2e'; ctx.fillRect(o.x + 9, y + 14, 3, 4); ctx.fillRect(o.x + 23, y + 14, 3, 4);
      const rw = 10 + Math.abs(Math.sin(frame * 0.9)) * 12;
      ctx.fillStyle = '#e8e8f5'; ctx.fillRect(o.x + o.w / 2 - rw, y + 1, rw * 2, 3); ctx.fillRect(o.x + o.w / 2 - 2, y + 3, 4, 4);
    } else {
      let x = o.x;
      for (const p of o.parts) {
        const g = ctx.createLinearGradient(x, GROUND - p.h, x + p.w, GROUND);
        g.addColorStop(0, '#37d9ff'); g.addColorStop(1, '#6d3df0');
        ctx.save(); ctx.shadowColor = '#37d9ff'; ctx.shadowBlur = 10; ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x + p.w * 0.2, GROUND - p.h * 0.7); ctx.lineTo(x + p.w / 2, GROUND - p.h);
        ctx.lineTo(x + p.w * 0.8, GROUND - p.h * 0.7); ctx.lineTo(x + p.w, GROUND); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.moveTo(x + p.w / 2, GROUND - p.h); ctx.lineTo(x + p.w * 0.38, GROUND - p.h * 0.55); ctx.lineTo(x + p.w / 2, GROUND - p.h * 0.2); ctx.closePath(); ctx.fill();
        x += p.w + 2;
      }
    }
  }

  function drawGem(g) {
    const sx = Math.abs(Math.cos(frame * 0.06 + g.x * 0.01)) * 0.7 + 0.3;
    ctx.save(); ctx.translate(g.x, g.y + Math.sin(frame * 0.08 + g.x) * 3); ctx.scale(sx, 1);
    ctx.shadowColor = '#37d9ff'; ctx.shadowBlur = 12; ctx.fillStyle = '#7defff';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function draw() {
    drawBackground();
    for (const g of gems) drawGem(g);
    for (const o of obstacles) drawObstacle(o);
    drawPlayer();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (state === 'ready' || state === 'over') {
      ctx.fillStyle = 'rgba(5,8,25,0.68)'; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#f4eefc'; ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText(state === 'over' ? 'Oyun bitti · ' + score : 'Mia Runner', VW / 2, VH / 2 - 26);
      if (state === 'over' && newBest) { ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px system-ui, sans-serif'; ctx.fillText('🏆 Yeni rekor!', VW / 2, VH / 2 + 2); }
      ctx.fillStyle = '#f4eefc'; ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(state === 'over' ? 'Tekrar için dokun / Boşluk' : 'Başlamak için dokun / Boşluk', VW / 2, VH / 2 + 30);
    } else if (msgT > 0) {
      ctx.font = 'bold 22px system-ui, sans-serif'; ctx.globalAlpha = Math.min(1, msgT / 20);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(5,8,25,0.9)'; ctx.strokeText(msg, VW / 2, 36);
      ctx.fillStyle = '#ffd166'; ctx.fillText(msg, VW / 2, 36); ctx.globalAlpha = 1;
    }
  }

  // ---------- Girdi ----------
  const KM = { ' ': 'jump', ArrowUp: 'jump', w: 'jump', W: 'jump', ArrowDown: 'down', s: 'down', S: 'down' };
  function press(k) {
    if (state !== 'play') {
      if (state === 'over' && overT > 0) return;
      startGame();
    }
    if (k === 'jump') { if (!keys.jump) jumpBuf = 8; keys.jump = true; }
    else keys[k] = true;
  }
  function release(k) { keys[k] = false; }
  addEventListener('keydown', e => {
    const k = KM[e.key]; if (!k) return;
    e.preventDefault(); if (e.repeat) return; press(k);
  });
  addEventListener('keyup', e => { const k = KM[e.key]; if (k) release(k); });
  cv.addEventListener('pointerdown', e => { e.preventDefault(); press('jump'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => release('jump')));
  document.querySelectorAll('#pad button').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); press(k); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => release(k)));
  });
  // Sekme değişince oyun donsun/ölmesin
  document.addEventListener('visibilitychange', () => { keys.jump = keys.down = false; });

  // ---------- Döngü (sabit 60 Hz adım) ----------
  hud();
  let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= 16.667) { step(); acc -= 16.667; }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if (window.__MIA_TEST) {
    window.__MIA_TEST({ step, draw, startGame, press, release, keys, get: () => ({ state, score, level, speed, py, obstacles, gems, bonus }) });
  }
})();
