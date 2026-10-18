// Section entrances: they play each time a section comes into view, scrolling down or back up (it resets once fully off
// screen, out of sight). Our own code.
//   every section: the rule above it draws in, the title rises out of a mask, the mono labels decode (like the boot screen)
//   hero:       name line, headline, the at-a-glance rows and the buttons cascade in (after the boot screen lifts)
//   projects:   cards rise one after the other; their stats count up (a locked card counts when it unlocks)
//   experience / education: the orange dashes draw, bullets follow one by one, dates decode
//   toolkit:    each group's line draws, its label decodes, the skills pop in one at a time
//   contact:    the email's underline draws across, the links rise, the big outlined name wipes in
// Only transform / clip-path / opacity / background-size change, so nothing shifts. No JS or reduced motion: everything
// is simply there (the hiding CSS only applies under html.rv, which this file adds).
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const root = document.documentElement; root.classList.add('rv');
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stagger = (els, step = 70, from = 0) => els.forEach((e, i) => e.style.setProperty('--i', String(from + i)) || e.style.setProperty('--step', step + 'ms'));

  // decode: letters flicker through glyphs and settle left to right (same length, mono font = no width change)
  const GL = '01#*+=/<>[]';
  const decode = (el, dur = 520) => { const txt = el.textContent; if (!txt.trim() || el.dataset.dec || el.children.length) return;   // only plain text (Click/Tap spans stay intact) el.dataset.dec = '1';
    const t0 = performance.now(), n = txt.length;
    const f = (now) => { const k = Math.min(1, (now - t0) / dur), fixed = Math.floor(k * n);
      el.textContent = [...txt].map((c, i) => (i < fixed || c === ' ' ? c : GL[(Math.random() * GL.length) | 0])).join('');
      if (k < 1) requestAnimationFrame(f); else el.textContent = txt; };
    requestAnimationFrame(f); };

  // count up: every number inside the element runs from 0 to its value ("417 / 417", "0 / 994", "36")
  const count = (el, dur = 1100) => { if (el.dataset.cnt) return; el.dataset.cnt = '1'; const txt = el.textContent, t0 = performance.now();
    const f = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = txt.replace(/\d+/g, (m) => String(Math.round(+m * e))); if (k < 1) requestAnimationFrame(f); else el.textContent = txt; };
    requestAnimationFrame(f); };

  // set up stagger indexes and split the toolkit lists into items
  stagger($$('.hero-text > *'), 90);
  stagger($$('#glance > *'), 50, 3);
  $$('#projects-list .proj').forEach((c, i) => c.style.setProperty('--i', String(i)));
  $$('.job').forEach((j) => stagger($$('.pts li', j), 90, 1));
  $$('.skills > div').forEach((g, gi) => { g.style.setProperty('--i', String(gi));
    const p = g.querySelector('p:not(.mono)'); if (!p || p.dataset.split) return; p.dataset.split = '1';
    const items = p.textContent.split(', ');
    p.innerHTML = items.map((t, i) => `<span class="sk" style="--j:${i}">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}${i < items.length - 1 ? ',' : ''}</span>`).join(' '); });
  stagger($$('#contact .links > a'), 80);

  const play = (sec) => {
    if (sec.classList.contains('in')) return; sec.classList.add('in');
    $$('.side, .play-strip > span:first-child, .skills p.mono, .job .meta span, .proj .kind, .dots-cap > span:nth-child(2)', sec).forEach((e, i) => setTimeout(() => decode(e), 120 + i * 60));
    $$('.proj', sec).forEach((card) => {   // stats count once the card is readable
      const go = () => setTimeout(() => { if (sec.classList.contains('in')) $$('dl dt', card).forEach((dt) => count(dt)); }, 300 + (+card.style.getPropertyValue('--i') || 0) * 160);
      if (!card.classList.contains('locked')) go();
      else if (!card.dataset.mo) { card.dataset.mo = '1'; new MutationObserver((ms, mo) => { if (!card.classList.contains('locked')) { mo.disconnect(); go(); } }).observe(card, { attributes: true, attributeFilter: ['class'] }); } });
  };
  const reset = (sec) => { if (sec.classList.contains('in')) sec.classList.remove('in'); };   // off screen: the motion plays again; labels and stats decode / count only the first time
  const sections = $$('main > section');
  let booting = root.classList.contains('boot'); const queued = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return;
    if (booting) queued.add(e.target); else play(e.target); }), { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  const out = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) { queued.delete(e.target); reset(e.target); } }), { threshold: 0 });
  sections.forEach((s) => { io.observe(s); out.observe(s); });
  if (booting) new MutationObserver((ms, mo) => { if (!root.classList.contains('boot')) { mo.disconnect(); booting = false; queued.forEach(play); } })
    .observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('beforeprint', () => sections.forEach((s) => s.classList.add('in')));   // printing shows everything
})();
