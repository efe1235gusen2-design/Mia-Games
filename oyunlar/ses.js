/* Her iki oyunun kısa Web Audio efektleri; harici ses dosyası gerektirmez. */
(() => {
  const toggle = document.getElementById('sound-toggle');
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let enabled = true;
  try { enabled = localStorage.getItem('mia-games-sound') !== 'off'; } catch (e) {}

  function syncButton() {
    if (!toggle) return;
    toggle.textContent = enabled ? '🔊 Ses açık' : '🔇 Ses kapalı';
    toggle.setAttribute('aria-pressed', String(enabled));
  }

  function tone(freq, duration, delay = 0, type = 'sine', volume = 0.09) {
    if (!enabled || !AudioCtx) return;
    try {
      context ||= new AudioCtx();
      if (context.state === 'suspended') context.resume();
      const osc = context.createOscillator(), gain = context.createGain();
      const start = context.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain); gain.connect(context.destination);
      osc.start(start); osc.stop(start + duration + 0.02);
    } catch (e) { /* Ses desteği olmayan tarayıcıda oyun sessizce devam eder. */ }
  }

  const patterns = {
    start: () => { tone(523, .12); tone(659, .15, .1); },
    collect: () => tone(880, .11, 0, 'square', .075),
    jump: () => { tone(330, .12, 0, 'triangle', .08); tone(500, .12, .05, 'triangle', .08); },
    hit: () => { tone(220, .18, 0, 'sawtooth', .075); tone(140, .22, .12, 'sawtooth', .065); },
    gameover: () => { tone(392, .16); tone(330, .18, .16); tone(262, .28, .34); },
    stomp: () => tone(180, .1, 0, 'square', .075),
    power: () => { tone(660, .12); tone(880, .12, .09); tone(1100, .18, .18); },
    win: () => { tone(523, .14); tone(659, .14, .12); tone(784, .22, .24); },
  };

  toggle?.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem('mia-games-sound', enabled ? 'on' : 'off'); } catch (e) {}
    syncButton();
    if (enabled) patterns.start();
  });
  syncButton();
  window.MiaAudio = {
    play: name => patterns[name]?.(),
    unlock: () => {
      if (!AudioCtx) return;
      try { context ||= new AudioCtx(); if (context.state === 'suspended') context.resume(); } catch (e) {}
    },
  };
  addEventListener('pointerdown', () => window.MiaAudio.unlock(), { passive: true });

  // Oyun içindeyken tarayıcı kısayolları sayfadan çıkarmasın/oyunu bölmesin.
  addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    const browserCombo = (e.ctrlKey || e.metaKey || e.altKey) ||
      ['f5', 'f11', 'f12', 'backspace'].includes(key);
    if (browserCombo) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
})();
