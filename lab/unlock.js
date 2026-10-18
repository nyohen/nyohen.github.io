// Play to unlock: in Projects, each play on the dot block (click / tap / Enter) unlocks the next part of the
// section's text. Locked parts are blurred, not removed: they stay in the page for screen readers and search, keep their space
// (no layout jump), and unlock on their own if someone tabs into them or clicks them. "Show all" unlocks the whole section.
// Progress is remembered in this browser. No JS or reduced motion: nothing is ever locked.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const KEY = 'nyg-unlock';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
  // each step is a list of elements that unlock together
  const STEPS = {
    projects: (sec) => { const cards = [...sec.querySelectorAll('#projects-list .proj')], rows = [...sec.querySelectorAll('[data-unlock-rows] li')];
      return [[sec.querySelector('.play-info .lead')], ...cards.map((c, i) => [c, rows[i]])]; },
  };
  document.querySelectorAll('[data-play]').forEach((play) => {
    const id = play.dataset.play; if (!STEPS[id]) return;   // Education is never locked (Noel, 2026-10-18)
    const sec = play.closest('section'), steps = STEPS[id](sec).map((s) => s.filter(Boolean)).filter((s) => s.length);
    const cv = play.querySelector('canvas[data-dots]'), num = play.querySelector('.play-n'), all = play.querySelector('.play-all'), hint = play.querySelector('.play-hint');
    if (hint) hint.dataset.t = hint.textContent;
    let n = Math.min(steps.length, saved[id] || 0);
    const show = (fresh) => {
      steps.forEach((els, i) => els.forEach((el) => { const on = i < n; el.classList.toggle('locked', !on); if (on && fresh && i === n - 1) { el.classList.add('unlocking'); setTimeout(() => el.classList.remove('unlocking'), 900); } }));
      if (num) num.textContent = `${n} / ${steps.length} unlocked`;
      if (all) all.hidden = n >= steps.length;
      if (hint) hint.textContent = n >= steps.length ? 'All unlocked' : hint.dataset.t;
      saved[id] = n; save();
    };
    const step = () => { if (n < steps.length) { n++; show(true); } };
    cv && cv.addEventListener('dots:play', step);
    all && all.addEventListener('click', () => { n = steps.length; show(true);   // the button hides itself: hand focus to the first unlocked part
      const first = steps[0] && steps[0][0]; if (first) { if (!first.hasAttribute('tabindex')) first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); } });
    steps.forEach((els, i) => els.forEach((el) => {
      el.addEventListener('focusin', () => { if (el.classList.contains('locked')) { n = Math.max(n, i + 1); show(false); } });
      el.addEventListener('click', (e) => { if (el.classList.contains('locked')) { e.preventDefault(); e.stopPropagation(); n = Math.max(n, i + 1); show(true); } }, true);
    }));
    show(false);
  });
})();
