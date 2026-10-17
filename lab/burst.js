// Click burst (idea from gchf.kr's click effect; our own code): every click throws a small ring of dots and rings out
// from the pointer that fade in about half a second. Drawn on one transparent canvas that never takes clicks.
// Off for people who ask their OS for less motion. Colours come from the page: --burst-a (filled) and --burst-b (rings).
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'), g = cv.getContext('2d');
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '9999' });
  document.body.appendChild(cv);
  const css = getComputedStyle(document.documentElement);
  const A = (css.getPropertyValue('--burst-a') || '#ff4b1f').trim(), B = (css.getPropertyValue('--burst-b') || '#0b0b0b').trim();
  let dots = [], raf = 0, dpr = 1;
  const fit = () => { dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  fit(); addEventListener('resize', fit);
  const LIFE = 520;
  const step = (now) => {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
    dots = dots.filter((d) => now - d.t0 < LIFE);
    for (const d of dots) {
      const k = (now - d.t0) / LIFE, e = 1 - Math.pow(1 - k, 3);          // ease-out: fast start, gentle stop
      const x = d.x + Math.cos(d.a) * d.v * e, y = d.y + Math.sin(d.a) * d.v * e + 18 * k * k, r = d.r * (1 - .55 * k);
      g.globalAlpha = 1 - k * k; g.beginPath(); g.arc(x, y, Math.max(.5, r), 0, 6.283);
      if (d.ring) { g.lineWidth = 1.6; g.strokeStyle = B; g.stroke(); } else { g.fillStyle = A; g.fill(); }
    }
    g.globalAlpha = 1;
    raf = dots.length ? requestAnimationFrame(step) : 0;
  };
  addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const n = 14, now = performance.now();
    for (let i = 0; i < n; i++) {
      dots.push({ x: e.clientX, y: e.clientY, t0: now, a: (i / n) * 6.283 + (Math.random() - .5) * .5,
                  v: 34 + Math.random() * 30, r: 3.2 + Math.random() * 3.2, ring: i % 2 === 1 });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: true });
})();
