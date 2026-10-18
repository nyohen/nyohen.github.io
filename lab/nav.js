// Smooth scrolling (Lenis, from jsDelivr) + the fixed bottom bar (samgoddard.co.uk's footer-bar idea, our own code).
// - Lenis only with a mouse wheel/trackpad (touch stays native) and never with reduced motion (then: plain jumps, no smoothing).
// - Same-page links (#projects, ...) glide; focus moves to the section so keyboard users land there too.
// - While the case-study panel is open Lenis stops (the page behind cannot scroll) and the panel scrolls natively.
// - Bottom bar: the section in view is marked (● + underline, aria-current); on narrow screens "Menu" opens a sheet upward.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement;
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true, anchors: false });
    document.querySelectorAll('.cpanel, .sys-card, .fb-sheet').forEach((e) => e.setAttribute('data-lenis-prevent', ''));
  }
  window.SITE = { lenis };

  // --- same-page links glide (case-study links [data-case] are handled by the panel) ---
  const go = (id, push) => {
    const el = id === 'top' ? null : document.getElementById(id); if (id !== 'top' && !el) return false;
    if (lenis) lenis.scrollTo(el || 0, { duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
    else if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); else scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    const target = el || document.getElementById('top');
    if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
    if (push) history.pushState(null, '', '#' + id);
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.hasAttribute('data-case') || a.classList.contains('skip') || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1); if (!id) return;
    if (go(id, true)) { e.preventDefault(); closeSheet(); }
  });

  // --- panel open: page behind stops; closed: resumes ---
  if (lenis) new MutationObserver(() => (root.classList.contains('cpanel-open') ? lenis.stop() : lenis.start())).observe(root, { attributes: true, attributeFilter: ['class'] });

  // --- page transition: only when going to the Blog (the CSS @view-transition would otherwise animate every same-site link) ---
  addEventListener('pageswap', (e) => { try { if (e.viewTransition && !/^\/blog\//.test(new URL(e.activation.entry.url).pathname)) e.viewTransition.skipTransition(); } catch (x) {} });

  // --- Light / Dark switch (bottom bar): dark is the default; html[data-theme], saved in localStorage; the <head> script applies it before paint ---
  const tb = document.querySelector('.fb-theme'), meta = document.querySelector('meta[name=theme-color]');
  const setTheme = (dark, anim) => {
    if (anim && !reduce) { root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 450); }
    dark ? (root.dataset.theme = 'dark') : delete root.dataset.theme;
    if (meta) meta.setAttribute('content', dark ? '#16151a' : '#efe8dc');
    if (tb) tb.setAttribute('aria-checked', String(dark));
    try { localStorage.setItem('nyg-theme2', dark ? 'dark' : 'light'); } catch (e) {}
    dispatchEvent(new CustomEvent('themechange', { detail: dark ? 'dark' : 'light' })); };
  if (tb) { tb.hidden = false; tb.setAttribute('aria-checked', String(root.dataset.theme === 'dark')); tb.addEventListener('click', () => setTheme(root.dataset.theme !== 'dark', true)); }

  // --- bottom bar ---
  const bar = document.querySelector('.fbar'); if (!bar) return;
  const btn = bar.querySelector('.fb-menu'), sheet = bar.querySelector('.fb-sheet'), now = bar.querySelector('.fb-now');
  const links = [...bar.querySelectorAll('.fb-c a[data-s]')];
  function closeSheet() { if (btn.getAttribute('aria-expanded') === 'true') { btn.setAttribute('aria-expanded', 'false'); bar.classList.remove('open'); } }
  btn.addEventListener('click', () => { const open = btn.getAttribute('aria-expanded') !== 'true'; btn.setAttribute('aria-expanded', String(open)); bar.classList.toggle('open', open);
    if (open) { const cur = sheet.querySelector('[aria-current]') || sheet.querySelector('a'); cur && cur.focus(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && bar.classList.contains('open')) { closeSheet(); btn.focus(); } });
  document.addEventListener('pointerdown', (e) => { if (bar.classList.contains('open') && !bar.contains(e.target)) closeSheet(); });
  sheet.addEventListener('focusout', () => setTimeout(() => { if (!bar.contains(document.activeElement)) closeSheet(); }, 0));
  const mark = (id) => links.forEach((a) => { const on = a.dataset.s === id; on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    if (on && now) now.textContent = a.textContent.replace('●', '').trim(); });
  // current section = the last one whose top has passed 45% of the screen. "Index" (#top is all of <main>) is the hero section.
  // (It used an IntersectionObserver on #top, which never fires again on the way back up, so "How I build" stayed lit.)
  const targets = links.map((a) => [a.dataset.s, a.dataset.s === 'top' ? document.querySelector('main > section') : document.getElementById(a.dataset.s)]).filter(([, el]) => el);
  let curId = '', q = 0;
  const check = () => { q = 0; const line = innerHeight * 0.45; let id = targets[0] ? targets[0][0] : 'top';
    for (const [s, el] of targets) if (el.getBoundingClientRect().top <= line) id = s;
    if (id !== curId) { curId = id; mark(id); } };
  addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(check); }, { passive: true });
  addEventListener('resize', check); check();
})();
