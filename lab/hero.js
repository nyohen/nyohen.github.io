// Hero band: the name cut out of the page as torn letters (gchf idea), with a live 2D drawing showing through.
// mountHero(band, 'galaxy' | 'signal'). The page colour covers everything except the letters. Light: 2D canvas only.
// Motion stops by itself (WCAG 2.2.2, no pause button needed): it plays ~5 s after load, eases to a still frame, and plays
// another ~5 s when the pointer enters the band or it is tapped. Off screen the clock pauses. Reduced motion: one still frame.
window.mountHero = (band, mode) => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim() || '#efe8dc';
  band.classList.add('hero-band');
  band.innerHTML = `<canvas aria-hidden="true"></canvas><svg aria-hidden="true"><defs>
      <filter id="tear" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="30" xChannelSelector="R" yChannelSelector="G"/></filter>
      <mask id="cut" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="#fff"/><g filter="url(#tear)"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#000"
        font-family="Archivo, Inter Tight, sans-serif" font-weight="900" letter-spacing="-.05em">NOEL</text></g></mask></defs>
      <rect width="100%" height="100%" fill="${paper}" mask="url(#cut)"/></svg><span class="sr">Noel</span>`;
  const cv = band.querySelector('canvas'), g = cv.getContext('2d'), text = band.querySelector('text');
  let W = 0, H = 0;
  // the word is sized from its measured box so the whole of NOEL (and its torn edge) fits the band at every width:
  // measure at 100px, scale to the band minus a margin for the tear (the displacement filter moves edges up to ~15px)
  const fit = () => { const r = band.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
    const pad = 18; text.setAttribute('font-size', 100); let bw = 0; try { bw = text.getBBox().width; } catch (e) {}
    const byW = bw > 0 ? 100 * (W - pad * 2) / bw : W * .33, byH = (H - pad * 2) / .74;   // capitals are ~.74 of the font size
    text.setAttribute('font-size', Math.max(10, Math.min(byW, byH))); text.setAttribute('y', H * .5); };
  new ResizeObserver(() => { fit(); if (!raf) draw[mode](tt); }).observe(band); fit();
  if (document.fonts) document.fonts.ready.then(() => { fit(); if (!raf) draw[mode](tt); });   // Archivo arrives after first paint
  // galaxy: a 2D spiral of light in the site's two accents (orange + project blue, stars warm-white to blue); signal: thick flowing lines with packets
  const STARS = Array.from({ length: 2600 }, (_, i) => { const r = Math.pow(Math.random(), 1.5), arm = (i % 4) / 4 * Math.PI * 2; return { r, a: arm + r * 5.2 + (Math.random() - .5) * .5, s: .6 + Math.random() * 2.2, h: Math.random() }; });
  const draw = {
    galaxy(t) {
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#131217'; g.fillRect(0, 0, W, H);
      const cx = W * .5, cy = H * .5, R = Math.max(W, H) * .62;
      [['255,75,31', .2, .35], ['138,164,255', .8, .6], ['255,75,31', .55, .15]].forEach(([c, x, y]) => { const gr = g.createRadialGradient(W * x, H * y, 0, W * x, H * y, W * .35); gr.addColorStop(0, `rgba(${c},.55)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
      g.globalCompositeOperation = 'lighter';
      for (const s of STARS) { const a = s.a + t * (.12 / (.3 + s.r)), x = cx + Math.cos(a) * s.r * R, y = cy + Math.sin(a) * s.r * R * .42;
        const warm = 1 - s.r; g.fillStyle = `rgba(${(138 + 117 * warm) | 0},${(164 + 72 * warm) | 0},${(255 - 41 * warm) | 0},${.35 + .5 * Math.abs(Math.sin(t * 2 + s.h * 20))})`;
        g.fillRect(x, y, s.s, s.s); }
      const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * .25); core.addColorStop(0, 'rgba(255,220,190,.95)'); core.addColorStop(.35, 'rgba(255,140,80,.35)'); core.addColorStop(1, 'rgba(255,140,80,0)');
      g.fillStyle = core; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    },
    signal(t) {
      g.fillStyle = '#131217'; g.fillRect(0, 0, W, H);
      const rows = 30;
      for (let r = 0; r < rows; r++) { const y = (r + .5) * H / rows, hot = r % 5 === 2, sp = .6 + r * .03;
        g.strokeStyle = hot ? 'rgba(255,75,31,.95)' : 'rgba(138,164,255,.8)'; g.lineWidth = Math.max(3, H / rows * .45);
        g.beginPath(); for (let x = 0; x <= W; x += 24) { const yy = y + Math.sin(x * .006 + t * sp + r) * 14; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
        const px = ((t * 120 * (1 + (r % 3) * .4) + r * 97) % (W + 200)) - 100; g.fillStyle = hot ? '#ff4b1f' : '#e9ff3a'; g.beginPath(); g.arc(px, y + Math.sin(px * .006 + t * sp + r) * 14, 6, 0, 7); g.fill(); }
    },
  };
  // time only advances while playing; speed eases in over .4 s and out over the last 1.5 s, so it settles instead of freezing
  const PLAY = 5000, IN = 400, OUT = 1500;
  let visible = true, raf = 0, tt = still ? 3 : 0, last = performance.now(), start = last, until = still ? 0 : last + PLAY, left = 0;
  const speed = (now) => Math.min(1, (now - start) / IN, Math.max(0, (until - now) / OUT));
  const loop = (now) => { raf = 0; const v = speed(now); tt += Math.min(.1, (now - last) / 1000) * v; last = now; draw[mode](tt);
    if (visible && now < until) raf = requestAnimationFrame(loop); };
  const play = () => { if (still) return; const now = performance.now(); start = now - speed(now) * IN; until = now + PLAY;   // carries on from the current speed
    if (visible && !raf) { last = now; raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([e]) => { const now = performance.now(); visible = e.isIntersecting;
    if (!visible) { left = Math.max(0, until - now); if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    else if (left > 0) { until = now + left; left = 0; last = now; if (!raf) raf = requestAnimationFrame(loop); } }).observe(band);
  band.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') play(); });
  band.addEventListener('click', play);   // tap on touch screens (and click with a mouse)
  raf = requestAnimationFrame(loop);
};
