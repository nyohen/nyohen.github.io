// Music: our own, generated live with the Web Audio API, so nobody else owns it (Noel: "non-copyright music") and there is no file to download.
// Three moods that follow the story, crossfading over a few seconds (window.nygSound.mood(name), called by boot.js):
//   space: the boot screen. A slow A-minor pad through a breathing low-pass filter (Am9 → Fmaj7 → Cmaj7 → G6), sub bass, sparse echoing plucks.
//   dark:  Darkon arrives (Noel: scarier). An impact, then dissonant clusters (tritone + minor second) lurching by half steps, a beating sub-bass
//          drone, a fast heartbeat, bell tolls, eerie noise sweeps and dissonant pings.
//   home:  the site is up. Warm, relaxing C major (Cmaj9 → Am7 → Fmaj7 → G6sus), brighter, with soft music-box plucks.
// Off by default (browsers block sound until a click, and surprise audio is rude). Two minimal toggles share one state: "Sound" in the
// bottom bar (stays on the main site) and "♪ sound" on the boot screen. Every load starts OFF (Noel); nothing is remembered.
// It pauses while the tab is hidden.
(() => {
  const KEY = 'nyg-sound', root = document.documentElement;
  const AC = window.AudioContext || window.webkitAudioContext;
  const btns = () => document.querySelectorAll('.fb-sound, .boot-sound');
  let cur = root.classList.contains('boot') ? 'space' : 'home';
  window.nygSound = { mood: (n) => setMood(n) };
  if (!AC) { btns().forEach((b) => b.remove()); window.nygSound.mood = () => {}; return; }
  const MOODS = {
    space: { beat: 0.6, bar: 16, chords: [[45, 52, 55, 59, 60], [41, 48, 52, 57, 64], [48, 55, 59, 64, 67], [43, 50, 52, 59, 62]], cut: 900, notes: [69, 72, 74, 76, 79, 81, 84], p: [0.4, 0.12] },
    dark: { beat: 0.7, bar: 8, chords: [[38, 44, 50, 51], [39, 45, 51, 52], [38, 44, 50, 51], [37, 43, 49, 50]], cut: 430, saw: 0.03, notes: [74, 75, 80, 81, 86], p: [0.14, 0.06], heart: 2, toll: true, drone: true, sweep: true },
    home: { beat: 0.55, bar: 16, chords: [[48, 55, 59, 62, 64], [45, 52, 55, 60, 64], [41, 48, 52, 57, 64], [43, 50, 55, 57, 62]], cut: 1500, notes: [72, 74, 76, 79, 81, 84, 86], p: [0.5, 0.15], soft: true },
  };
  let ctx = null, master = null, bus = null, echo = null, timer = 0, on = false, step = 0, chord = 0, next = 0;
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);

  const build = () => {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 3.5), ir = ctx.createBuffer(2, len, ctx.sampleRate);   // reverb: a decaying noise tail
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6; }
    const verb = ctx.createConvolver(), wet = ctx.createGain(); verb.buffer = ir; wet.gain.value = 0.5;
    bus = ctx.createGain(); bus.connect(master); bus.connect(verb); verb.connect(wet); wet.connect(master);
    echo = ctx.createDelay(1.5); echo.delayTime.value = 0.45; const fb = ctx.createGain(); fb.gain.value = 0.38; echo.connect(fb); fb.connect(echo); echo.connect(bus);
    for (const [name, M] of Object.entries(MOODS)) {   // each mood has its own fader and filter, so they can crossfade
      M.out = ctx.createGain(); M.out.gain.value = name === cur ? 1 : 0; M.out.connect(bus);
      M.f = ctx.createBiquadFilter(); M.f.type = 'lowpass'; M.f.frequency.value = M.cut; M.f.Q.value = 0.6; M.f.connect(M.out);
      const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = 0.045; depth.gain.value = M.cut * 0.45; lfo.connect(depth); depth.connect(M.f.frequency); lfo.start(); }   // the filter breathes
  };
  const env = (g, t, a, peak, hold, rel) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + Math.max(0, hold)); g.gain.linearRampToValueAtTime(0, t + a + Math.max(0, hold) + rel); };
  const osc = (type, f, t, end, to) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(to); o.start(t); o.stop(end); return o; };
  const pad = (M, notes, t, dur) => notes.forEach((m) => [-6, 6].forEach((cents, k) => { const g = ctx.createGain(); env(g, t, 2.5, k ? (M.saw || 0.012) : 0.03, dur - 5, 3); g.connect(M.f);
    osc(k ? 'sawtooth' : 'triangle', hz(m), t, t + dur + 0.1, g).detune.value = cents; }));
  const bass = (M, m, t, dur) => { const g = ctx.createGain(); env(g, t, 2, 0.09, dur - 4.5, 2.5); g.connect(M.out); osc('sine', hz(m - 12), t, t + dur + 0.1, g); };
  const pluck = (M, m, t) => { const g = ctx.createGain(), len = M.soft ? 1.1 : 1.6; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(M.soft ? 0.035 : 0.045, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0004, t + len);
    g.connect(M.out); g.connect(echo); osc('sine', hz(m), t, t + len + 0.1, g); osc(M.soft ? 'sine' : 'triangle', hz(m + 12), t, t + len + 0.1, g); };
  const heart = (M, t) => [0, 0.22].forEach((d, i) => { const g = ctx.createGain(), o = ctx.createOscillator(); o.type = 'sine';   // lub-dub: a low thump that drops in pitch
    o.frequency.setValueAtTime(72, t + d); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.25); g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(i ? 0.16 : 0.24, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.4);
    o.connect(g); g.connect(M.out); o.start(t + d); o.stop(t + d + 0.45); });
  const toll = (M, m, t) => { const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + 5);   // a bell: inharmonic partials
    g.connect(M.out); [1, 2.76, 5.4].forEach((r) => osc('sine', hz(m) * r, t, t + 5.1, g)); };
  const drone = (M, m, t, dur) => { const g = ctx.createGain(); env(g, t, 1.5, 0.07, dur - 3, 1.5); g.connect(M.out);   // two low saws a hair apart: a slow, sick beating
    [0, 0.9].forEach((d) => { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = hz(m) + d; f.type = 'lowpass'; f.frequency.value = 160; o.connect(f); f.connect(g); o.start(t); o.stop(t + dur + 0.1); }); };
  let noise = null;
  const sweep = (M, t, dur) => { if (!noise) { noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = noise; src.loop = true; f.type = 'bandpass'; f.Q.value = 9;   // a wind that rises and falls
    f.frequency.setValueAtTime(180, t); f.frequency.exponentialRampToValueAtTime(1400, t + dur * 0.6); f.frequency.exponentialRampToValueAtTime(220, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + dur * 0.5); g.gain.linearRampToValueAtTime(0, t + dur); src.connect(f); f.connect(g); g.connect(M.out); src.start(t); src.stop(t + dur + 0.1); };
  const impact = (M, t) => { const g = ctx.createGain(), o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(24, t + 1.6);   // his arrival: a huge low hit
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 2.4); o.connect(g); g.connect(M.out); o.start(t); o.stop(t + 2.5); sweep(M, t, 2.2); toll(M, 26, t); };
  const schedule = () => {   // look ahead 0.4 s, so timing never depends on the main thread
    while (next < ctx.currentTime + 0.4) { const M = MOODS[cur];
      if (step % M.bar === 0) { const c = M.chords[chord++ % M.chords.length]; pad(M, c, next, M.bar * M.beat + 3); bass(M, c[0], next, M.bar * M.beat + 2); if (M.toll) toll(M, c[0] + 12, next + M.beat * 4); }
      if (M.heart && step % (M.heart === 2 ? 2 : 4) === 0) heart(M, next);
      if (M.drone && step % M.bar === 0) drone(M, M.chords[(chord - 1) % M.chords.length][0] - 12, next, M.bar * M.beat + 1);
      if (M.sweep && step % M.bar === 2) sweep(M, next, M.beat * 5);
      if (Math.random() < M.p[step % 2]) pluck(M, M.notes[(Math.random() * M.notes.length) | 0], next);
      step++; next += M.beat; } };
  const setMood = (n) => { if (!MOODS[n] || n === cur) return; const old = MOODS[cur]; cur = n; if (!ctx) return;
    const t = ctx.currentTime; [[old.out, 0], [MOODS[n].out, 1]].forEach(([g, v]) => { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(v, t + 3); });   // 3 s crossfade
    step = 0; chord = 0; next = Math.max(next, t + 0.05); if (n === 'dark') impact(MOODS.dark, t + 0.05); };

  const paint = () => btns().forEach((b) => { b.setAttribute('aria-checked', String(on)); const w = b.querySelector('.sw'); if (w) w.textContent = on ? 'on' : 'off'; b.hidden = false; });
  const start = () => { if (!ctx) build(); ctx.resume(); const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0.22, t + 2);
    for (const [name, M] of Object.entries(MOODS)) { M.out.gain.cancelScheduledValues(t); M.out.gain.setValueAtTime(name === cur ? 1 : 0, t); }
    if (!timer) { next = t + 0.1; step = 0; timer = setInterval(schedule, 100); schedule(); } };
  const stop = () => { if (!ctx) return; const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => { if (!on) { clearInterval(timer); timer = 0; ctx.suspend(); } }, 900); };
  const set = (v) => { on = v; root.classList.toggle('sound-on', on); paint(); on ? start() : stop(); };
  btns().forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); set(!on); }));

  try { localStorage.removeItem(KEY); } catch (e) {}   // (an earlier version remembered 'on'; that showed ON after a reload but stayed silent until a click)
  paint();
  document.addEventListener('visibilitychange', () => { if (!ctx || !on) return; document.hidden ? ctx.suspend() : ctx.resume(); });
})();
