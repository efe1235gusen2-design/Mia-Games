/* Mia Chomp – özgün labirent oyunu. Her seviye rastgele (ama sabit tohumlu) bir labirentte geçer. */
(() => {
  const cv = document.getElementById('g'), ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);

  const T = 24, N = 17, W = T * N;                 // karo boyutu, ızgara, tuval
  const START = { x: 9, y: 15 };
  const HOMES = [{ x: 7, y: 7 }, { x: 9, y: 7 }, { x: 7, y: 9 }, { x: 9, y: 9 }];
  const COLS = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6'];
  const SMART = [0.55, 0.7, 0.4, 0.85];
  const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const KEYS = {
    ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  };

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }

  // Tohumlu labirent: recursive backtracker + birkaç ekstra geçit (döngü)
  function buildMaze(seed) {
    const r = rng(seed * 7919 + 13);
    const g = Array.from({ length: N }, () => Array(N).fill(1));
    const cells = (N - 1) / 2;
    const seen = Array.from({ length: cells }, () => Array(cells).fill(false));
    const stack = [[0, 0]];
    seen[0][0] = true; g[1][1] = 0;
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => [cx + dx, cy + dy, dx, dy])
        .filter(([x, y]) => x >= 0 && y >= 0 && x < cells && y < cells && !seen[y][x]);
      if (!nb.length) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)];
      seen[ny][nx] = true;
      g[2 * ny + 1][2 * nx + 1] = 0;
      g[2 * cy + 1 + dy][2 * cx + 1 + dx] = 0;
      stack.push([nx, ny]);
    }
    for (let i = 0; i < 24; i++) {
      const x = 1 + Math.floor(r() * (N - 2)), y = 1 + Math.floor(r() * (N - 2));
      if ((x % 2) + (y % 2) === 1) g[y][x] = 0;
    }
    return g;
  }

  let maze, wallCv, pellets, left = 0;
  let level = 1, score = 0, lives = 3, state = 'ready', freeze = 0, fright = 0, msg = '';
  let P, ghosts = [], want = null;
  let best = 0;
  try { best = +localStorage.getItem('mia-chomp-best') || 0; } catch (e) {}

  const mk = (x, y) => ({ x, y, tx: x, ty: y, t: 1, dx: 0, dy: 0 });
  const open = (x, y) => x >= 0 && y >= 0 && x < N && y < N && maze[y][x] === 0;
  const isWall = (x, y) => x < 0 || y < 0 || x >= N || y >= N || maze[y][x] === 1;
  const pos = e => ({ x: e.x + (e.tx - e.x) * e.t, y: e.y + (e.ty - e.y) * e.t });

  function hud() {
    $('score').textContent = 'Puan: ' + score;
    $('lives').textContent = '❤️'.repeat(Math.max(lives, 0)) + '♡'.repeat(Math.max(3 - lives, 0));
    $('level').textContent = 'Seviye ' + level;
    $('best').textContent = 'Rekor: ' + best;
  }

  function newLevel() {
    maze = buildMaze(level);
    pellets = Array.from({ length: N }, (_, y) => Array.from({ length: N }, (_, x) => (maze[y][x] === 0 ? 1 : 0)));
    pellets[START.y][START.x] = 0;
    HOMES.forEach(h => { pellets[h.y][h.x] = 0; });
    [[1, 1], [N - 2, 1], [1, N - 2], [N - 2, N - 2]].forEach(([x, y]) => { pellets[y][x] = 2; });
    left = 0;
    pellets.forEach(row => row.forEach(v => { if (v) left++; }));

    // Duvarları bir kez önceden çiz
    wallCv = document.createElement('canvas');
    wallCv.width = wallCv.height = W;
    const c = wallCv.getContext('2d');
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (maze[y][x] !== 1) continue;
        c.fillStyle = 'rgba(60,30,120,0.55)';
        c.fillRect(x * T, y * T, T, T);
        c.strokeStyle = 'rgba(255,79,163,0.8)';
        c.lineWidth = 2;
        c.beginPath();
        if (!isWall(x, y - 1)) { c.moveTo(x * T, y * T + 1); c.lineTo(x * T + T, y * T + 1); }
        if (!isWall(x, y + 1)) { c.moveTo(x * T, y * T + T - 1); c.lineTo(x * T + T, y * T + T - 1); }
        if (!isWall(x - 1, y)) { c.moveTo(x * T + 1, y * T); c.lineTo(x * T + 1, y * T + T); }
        if (!isWall(x + 1, y)) { c.moveTo(x * T + T - 1, y * T); c.lineTo(x * T + T - 1, y * T + T); }
        c.stroke();
      }
    }
  }

  function resetPositions() {
    P = mk(START.x, START.y);
    want = null; fright = 0;
    ghosts = [];
    const n = Math.min(1 + level, 4);
    for (let i = 0; i < n; i++) {
      const g = mk(HOMES[i].x, HOMES[i].y);
      g.home = HOMES[i]; g.wait = 40 + i * 70; g.col = COLS[i];
      g.smart = Math.min(0.92, SMART[i] + level * 0.03);
      ghosts.push(g);
    }
  }

  function startGame() {
    score = 0; lives = 3; level = 1;
    newLevel(); resetPositions();
    state = 'play'; freeze = 40; msg = 'Hazır!';
    window.MiaAudio?.play('start');
    hud();
  }

  function gameOver() {
    state = 'over';
    window.MiaAudio?.play('gameover');
    if (score > best) {
      best = score;
      try { localStorage.setItem('mia-chomp-best', best); } catch (e) {}
    }
    hud();
  }

  // Bir varlığı ilerlet; karo merkezine varınca choose() ile yeni yön seç
  function advance(e, speed, choose) {
    let rem = speed;
    while (rem > 0) {
      if (e.t >= 1) {
        e.x = e.tx; e.y = e.ty; e.t = 1;
        const d = choose(e);
        if (!d) return;
        e.dx = d[0]; e.dy = d[1];
        e.tx = e.x + d[0]; e.ty = e.y + d[1]; e.t = 0;
      }
      const need = 1 - e.t;
      if (rem >= need) { e.t = 1; rem -= need; } else { e.t += rem; rem = 0; }
    }
  }

  function pChoose(p) {
    if (want && open(p.x + want[0], p.y + want[1])) return want;
    if ((p.dx || p.dy) && open(p.x + p.dx, p.y + p.dy)) return [p.dx, p.dy];
    return null;
  }

  function gChoose(g) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => open(g.x + d[0], g.y + d[1]));
    let cand = dirs.filter(d => !(d[0] === -g.dx && d[1] === -g.dy));
    if (!cand.length) cand = dirs;
    if (!cand.length) return null;
    const pp = pos(P);
    const dist = d => (g.x + d[0] - pp.x) ** 2 + (g.y + d[1] - pp.y) ** 2;
    if (fright > 0) {
      cand.sort((a, b) => dist(b) - dist(a));
      return Math.random() < 0.7 ? cand[0] : cand[Math.floor(Math.random() * cand.length)];
    }
    if (Math.random() < g.smart) { cand.sort((a, b) => dist(a) - dist(b)); return cand[0]; }
    return cand[Math.floor(Math.random() * cand.length)];
  }

  function die() {
    window.MiaAudio?.play('hit');
    lives--; hud();
    if (lives <= 0) { gameOver(); return; }
    resetPositions(); freeze = 70; msg = 'Yakalandın!';
  }

  function nextLevel() {
    window.MiaAudio?.play('win');
    level++; newLevel(); resetPositions(); freeze = 80; msg = 'Seviye ' + level; hud();
  }

  function update(k) {
    if (state !== 'play') return;
    if (freeze > 0) { freeze -= k; return; }
    if (fright > 0) fright -= k;

    // Ters yöne anında dönüş
    if (want && P.t < 1 && want[0] === -P.dx && want[1] === -P.dy) {
      const ox = P.x, oy = P.y;
      P.x = P.tx; P.y = P.ty; P.tx = ox; P.ty = oy;
      P.t = 1 - P.t; P.dx = -P.dx; P.dy = -P.dy;
    }
    advance(P, 0.1 * k, pChoose);

    const pp = pos(P);
    const rx = Math.round(pp.x), ry = Math.round(pp.y);
    if (Math.abs(pp.x - rx) < 0.4 && Math.abs(pp.y - ry) < 0.4 && pellets[ry] && pellets[ry][rx]) {
      const v = pellets[ry][rx];
      pellets[ry][rx] = 0; left--;
      score += v === 2 ? 50 : 10;
      if (v === 2) fright = Math.max(150, 360 - level * 25);
      window.MiaAudio?.play(v === 2 ? 'power' : 'collect');
      hud();
      if (left <= 0) { nextLevel(); return; }
    }

    const gs = Math.min(0.095, 0.07 + level * 0.005);
    for (const g of ghosts) {
      if (g.wait > 0) { g.wait -= k; continue; }
      advance(g, (fright > 0 ? 0.05 : gs) * k, gChoose);
    }

    for (const g of ghosts) {
      if (g.wait > 0) continue;
      const gp = pos(g);
      if (Math.hypot(gp.x - pp.x, gp.y - pp.y) < 0.6) {
        if (fright > 0) {
          score += 200; hud(); window.MiaAudio?.play('stomp');
          g.x = g.tx = g.home.x; g.y = g.ty = g.home.y; g.t = 1; g.dx = g.dy = 0; g.wait = 150;
        } else { die(); return; }
      }
    }
  }

  // ---------- Çizim ----------
  function drawPlayer() {
    const p = pos(P), cx = (p.x + 0.5) * T, cy = (p.y + 0.5) * T;
    const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 11);
    grad.addColorStop(0, '#ffb3d9'); grad.addColorStop(1, '#8b5cf6');
    ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 12;
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 9.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // gözler
    const ox = P.dx * 1.5, oy = P.dy * 1.5;
    for (const sx of [-3.6, 3.6]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx + sx + ox, cy - 1 + oy, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a0b2e';
      ctx.beginPath(); ctx.arc(cx + sx + ox * 1.6, cy - 1 + oy * 1.6, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    // taç
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 9); ctx.lineTo(cx - 6, cy - 15); ctx.lineTo(cx - 3, cy - 11);
    ctx.lineTo(cx, cy - 16); ctx.lineTo(cx + 3, cy - 11); ctx.lineTo(cx + 6, cy - 15);
    ctx.lineTo(cx + 6, cy - 9); ctx.closePath(); ctx.fill();
  }

  function drawGhost(g) {
    const p = pos(g), cx = (p.x + 0.5) * T, cy = (p.y + 0.5) * T;
    let col = g.col;
    const scared = fright > 0 && g.wait <= 0;
    if (scared) col = (fright < 120 && Math.floor(fright / 8) % 2) ? '#ffffff' : '#3b4cca';
    ctx.globalAlpha = g.wait > 0 ? 0.45 : 1;
    ctx.shadowColor = col; ctx.shadowBlur = 10;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 10, cy); ctx.lineTo(cx, cy + 10); ctx.lineTo(cx - 10, cy);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    // tek göz
    ctx.fillStyle = scared ? '#fff' : '#0a0612';
    ctx.beginPath(); ctx.ellipse(cx, cy, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = scared ? '#0a0612' : '#fff';
    ctx.beginPath(); ctx.arc(cx + g.dx * 1.8, cy + g.dy * 1.8, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function banner(text, sub) {
    ctx.fillStyle = 'rgba(5,8,25,0.7)'; ctx.fillRect(0, 0, W, W);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f4eefc';
    ctx.font = 'bold 30px system-ui, sans-serif'; ctx.fillText(text, W / 2, W / 2 - 24);
    ctx.font = '16px system-ui, sans-serif'; ctx.fillText(sub, W / 2, W / 2 + 14);
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, W);
    ctx.drawImage(wallCv, 0, 0);
    const pulse = 0.5 + 0.5 * Math.sin(now / 180);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = pellets[y][x];
        if (!v) continue;
        const cx = (x + 0.5) * T, cy = (y + 0.5) * T;
        if (v === 1) {
          ctx.fillStyle = '#f4eefc';
          ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = '#ff4fa3'; ctx.shadowColor = '#ff4fa3'; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(cx, cy, 5 + 2 * pulse, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }
    ghosts.forEach(drawGhost);
    drawPlayer();

    if (state === 'ready') banner('Mia Chomp', 'Başlamak için dokun / bir tuşa bas');
    else if (state === 'over') banner('Oyun bitti · ' + score, 'Tekrar için dokun / bir tuşa bas');
    else if (freeze > 0 && msg) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(5,8,25,0.9)'; ctx.strokeText(msg, W / 2, W / 2);
      ctx.fillStyle = '#ffd166'; ctx.fillText(msg, W / 2, W / 2);
    }
  }

  // ---------- Girdi ----------
  function setDir(name) {
    want = DIRS[name];
    if (state !== 'play') startGame();
  }
  addEventListener('keydown', e => {
    const k = KEYS[e.key];
    if (k) { e.preventDefault(); setDir(k); }
    else if ((e.key === 'Enter' || e.key === ' ') && state !== 'play') startGame();
  });

  let sx = 0, sy = 0, swiping = false;
  cv.addEventListener('pointerdown', e => {
    sx = e.clientX; sy = e.clientY; swiping = true;
    if (state !== 'play') startGame();
  });
  cv.addEventListener('pointermove', e => {
    if (!swiping) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 22) {
      want = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
      sx = e.clientX; sy = e.clientY;
    }
  });
  addEventListener('pointerup', () => { swiping = false; });
  document.querySelectorAll('#pad button').forEach(b => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); setDir(b.dataset.d); });
  });

  // ---------- Döngü ----------
  newLevel(); resetPositions(); hud();
  let last = performance.now();
  function loop(now) {
    const k = Math.min(3, (now - last) / 16.667);
    last = now;
    update(k);
    draw(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  if (window.__MIA_TEST) {
    window.__MIA_TEST({
      update, startGame, draw, setDir,
      get: () => ({ state, score, lives, level, left, fright, P, ghosts, maze, pellets }),
    });
  }
})();
