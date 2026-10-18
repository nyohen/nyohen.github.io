// Boot screen, every page load (~3.7 s; Noel: slower than the first 2.6 s, then a touch faster than 4.2 s). Our own design:
//   - the cat's dots fly in from scattered page-style stars (orange / blue / cream) and settle into a dot-matrix cat (our mark);
//   - an ear twitches, the eyes blink; the name decodes letter by letter under it; a dotted progress bar fills;
//   - corners: "NYG // portfolio" + live Toronto time on top, a typed boot log (real facts from content.js) and Skip below;
//   - exit: the cat's dots burst outward, then a box opens from the centre and grows past the edges, softly revealing the site.
// Any key, click, tap, wheel or Skip ends it at once. Skipped for reduced motion and with no JS (the inline script in <head>
// adds html.boot; ?boot=0 skips it for testing). position: fixed, so nothing on the page moves. CSS hides it at 4 s if this fails.
(() => {
  const root = document.documentElement, el = document.querySelector('.boot-screen');
  if (!el) return;
  if (!root.classList.contains('boot')) { el.remove(); return; }
  const R = (a, b) => a + Math.random() * (b - a);
  // o = eye, n = nose (orange), w = whisker (dim), # = fur; rows 0-2 hold the ears
  const CAT = [
    '....#...........#....',
    '....##.........##....',
    '....###.......###....',
    '....#############....',
    '...###############...',
    '...###############...',
    'ww.###oo#####oo###.ww',
    '...###oo#####oo###...',
    'ww.#######n#######.ww',
    '....#############....',
    '.....###########.....',
    '.......#######.......',
  ];
  const P = 10, W = CAT[0].length * P, H = CAT.length * P, STAR = ['var(--hot)', 'var(--k-project)', 'var(--on-deep)'];
  const groups = { fur: '', earL: '', earR: '', eyes: '' };
  CAT.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return;
    const a = R(0, 6.283), d = R(260, 620);   // starts scattered around the screen like the page's stars
    const st = `--sx:${(Math.cos(a) * d).toFixed(0)}px;--sy:${(Math.sin(a) * d).toFixed(0)}px;--ex:${(Math.cos(a) * d * 1.6).toFixed(0)}px;--ey:${(Math.sin(a) * d * 1.6).toFixed(0)}px;--c:${STAR[(Math.random() * 3) | 0]};--d:${(R(0, 0.75) + y * 0.022).toFixed(3)}s`;
    const c = `<circle cx="${x * P + P / 2}" cy="${y * P + P / 2}" r="${ch === 'w' ? 2.2 : 3.6}" class="${ch === 'o' || ch === 'n' ? 'hot' : ch === 'w' ? 'dim' : ''}" style="${st}"/>`;
    if (ch === 'o') groups.eyes += c; else if (y < 3) groups[x < 10 ? 'earL' : 'earR'] += c; else groups.fur += c; }));
  el.querySelector('.boot-cat').innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><g class="earL">${groups.earL}</g><g class="earR">${groups.earR}</g>${groups.fur}<g class="eyes">${groups.eyes}</g></svg>`;

  // live Toronto time in the corner
  const clock = el.querySelector('.boot-clock');
  const tor = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  if (clock) clock.textContent = `Toronto ${tor()}`;

  // name decodes from random glyphs, left to right
  const nameEl = el.querySelector('.boot-name'), NAME = nameEl.dataset.name, GL = '01#*+=/<>[]{}NYG';
  // typed boot log (facts from content.js)
  const LOG = ['waking the cat ........ ok', 'casefile · 417/417 corrupted claims flagged', 'rootcause · 52 automated tests', `toronto · ${tor()} · open to winter + summer 2027`, 'ready'];
  const logEl = el.querySelector('.boot-log');
  const num = el.querySelector('.boot-n'), bar = el.querySelector('.boot-bar');
  bar.innerHTML = '<i></i>'.repeat(24);
  const pips = [...bar.children];
  const t0 = performance.now(), LEN = 3300;
  let done = false, raf = 0, shownLog = -1;
  const tick = (now) => {
    const ms = now - t0, k = Math.min(1, ms / LEN), e = k * k * (3 - 2 * k);
    num.textContent = String(Math.round(e * 100)).padStart(3, '0');
    pips.forEach((p, i) => p.classList.toggle('on', i < Math.round(e * pips.length)));
    const nk = Math.max(0, Math.min(1, (ms - 1050) / 1200)), fixed = Math.floor(nk * NAME.length);   // 1.05–2.25 s
    nameEl.textContent = [...NAME].map((ch, i) => (i < fixed || ch === ' ' ? ch : ms < 1050 && i > 0 ? ' ' : GL[(Math.random() * GL.length) | 0])).join('');
    const li = Math.min(LOG.length - 1, Math.floor((ms - 250) / 620));   // one log line every 0.62 s
    if (li > shownLog && ms > 300) { shownLog = li; const p = document.createElement('p'); p.textContent = `> ${LOG[li]}`; logEl.appendChild(p); }
    if (!done) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  const end = () => { if (done) return; done = true; cancelAnimationFrame(raf); el.classList.add('out');
    ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((t) => removeEventListener(t, end, true));
    setTimeout(() => el.classList.add('lift'), 340);   // the box opens (1.25 s, CSS)
    setTimeout(() => root.classList.remove('boot'), 860);   // page scrolls again and the hero cascades in while the box grows
    setTimeout(() => { const had = el.contains(document.activeElement); el.remove(); if (had) { const s = document.querySelector('.skip'); s && s.focus(); } }, 1640); };   // keyboard focus lands on 'Skip to content', not <body>
  setTimeout(end, LEN + 150);
  ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((t) => addEventListener(t, end, { capture: true, passive: true }));
})();
