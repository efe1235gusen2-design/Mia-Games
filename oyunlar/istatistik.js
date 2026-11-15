/* Mini oyun istatistikleri: bu cihazda/tarayıcıda (localStorage) tutulur. */
(() => {
  const KEY = 'mia-stats-v1';
  const GAMES = { chomp: 'Mia Chomp', platform: 'Mia Platform', runner: 'Mia Runner' };
  const blank = () => ({ plays: 0, deaths: 0, best: 0, bestLevel: 1, collected: 0, kills: 0, total: 0, top: [] });

  function load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    for (const g in GAMES) d[g] = Object.assign(blank(), d[g]);
    // Eski sürümden kalan tekil rekorları kaybetme
    for (const g in GAMES) {
      try { d[g].best = Math.max(d[g].best, +localStorage.getItem('mia-' + g + '-best') || 0); } catch (e) {}
    }
    return d;
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function upd(game, fn) { if (!GAMES[game]) return; const d = load(); fn(d[game]); save(d); }

  window.MiaStats = {
    games: GAMES,
    all: load,
    get: g => load()[g],
    start:   g => upd(g, s => { s.plays++; }),
    death:   g => upd(g, s => { s.deaths++; }),
    collect: (g, n = 1) => upd(g, s => { s.collected += n; }),
    kill:    g => upd(g, s => { s.kills++; }),
    level:   (g, lv) => upd(g, s => { if (lv > s.bestLevel) s.bestLevel = lv; }),
    over:    (g, score, lv) => upd(g, s => {
      s.total += score;
      if (lv > s.bestLevel) s.bestLevel = lv;
      if (score > s.best) s.best = score;
      if (score > 0) {
        s.top.push({ s: score, l: lv, t: Date.now() });
        s.top.sort((a, b) => b.s - a.s);
        s.top = s.top.slice(0, 5);
      }
    }),
  };
})();
