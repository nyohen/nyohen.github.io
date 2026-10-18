// Stars across the whole page (extends the NOEL galaxy). One fixed canvas behind the text but over section backgrounds.
// Rebuilt 2026-10-18 after "stars lag and circle the wrong place", then "make the ring obvious, stars should track the titles":
// - The loop never stops for scrolling. Every frame it reads the live viewport box (getBoundingClientRect) of the section
//   title nearest 40% of the screen, so the ring moves with the title while Lenis scrolls the page (canvas is fixed = same space).
// - Between titles the stars run in a winding lane down the right side, flowing down as you scroll down (up when you scroll up).
// - New title: the stars peel off one after another (nearest first, over 0.6 s). Each blends from its live source (the lane,
//   or the old ring as it scrolls away) into one curve (0.9 s): on in the scroll direction, a swing toward the title, then onto
//   the ring along its own direction. Smoothstep blend + ease-out progress = no kick when it leaves, no stop when it joins,
//   and every point is recomputed each frame from live rects, so it stays smooth while the page scrolls. Back to the lane
//   (no title on screen) uses the same blend.
// - The ring is a tight ellipse just outside the words; captured stars are brighter and a little bigger, so it reads as a ring.
// - Orbits forever (Noel's choice); "Stars" in the bottom bar pauses it (WCAG 2.2.2), remembered in localStorage.
// - Reduced motion: a sparse still starfield. Hidden tab / open case panel: no frames.
(() => {
  const R = (a, b) => a + Math.random() * (b - a);
  let mode = 'field';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement;
  const small = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  const cv = document.createElement('canvas'); cv.className = 'starfield'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, D = 1;
  const fit = () => { D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * D); cv.height = Math.round(H * D); g.setTransform(D, 0, 0, D, 0, 0); };
  fit();
  // [on cream, on dark]: hot orange, project blue, warm white (a warm brown on cream, where white would vanish)
  const COL = [['216,56,15', '255,122,84'], ['47,67,176', '138,164,255'], ['120,84,52', '239,232,220']];
  const N = reduce ? (small ? 50 : 90) : (small ? 300 : 560);   // Noel: more stars on the path, easier to see
  const GROUPS = 3;   // three orbit speeds; inside a group the angles are evenly spaced, so the ring's centre is the title's centre
  const P = Array.from({ length: N }, (_, i) => { const r = Math.random(), grp = i % GROUPS, k = Math.floor(i / GROUPS), per = Math.ceil(N / GROUPS);
    return { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, ox: 0, oy: 0, go: 0, wa: 0, wb: 0, sy: null, sb: null, grp, ang: (k / per) * 6.2832 + grp * 0.7, ring: Math.random(),
      fx: Math.random() * W, fy: Math.random() * H, w: 7 + Math.random() * 4, ph: Math.random() * 6.283, z: 0.35 + Math.random(),
      s: Math.random() < 0.12 ? 2.4 : 1.2 + Math.random() * 0.9, c: r < 0.4 ? 0 : r < 0.75 ? 1 : 2, a: 0.45 + Math.random() * 0.4 }; });

  // dark areas get the light star colours. The hero band is mostly cream paper, so it counts as cream.
  let darkEls = [], zones = [];
  let blockEls = [], blocks = [];   // the dot blocks have their own skies, so page stars stay off them
  const findDark = () => { darkEls = [...document.querySelectorAll('.row.invert, .slab, .dots-box, .scene')]; blockEls = [...document.querySelectorAll('canvas[data-dots]')]; };
  const readZones = () => { zones = []; blocks = []; for (const e of darkEls) { const r = e.getBoundingClientRect(); if (r.bottom > 0 && r.top < H) zones.push(r); }
    for (const e of blockEls) { const r = e.getBoundingClientRect(); if (r.bottom > 0 && r.top < H) blocks.push(r); } };
  const inBlock = (x, y) => { for (const r of blocks) if (x >= r.left - 3 && x <= r.right + 3 && y >= r.top - 3 && y <= r.bottom + 3) return 1; return 0; };
  // text stays readable: a star over a line of text draws at a fifth of its strength (line boxes, cached in page coordinates)
  const TEXT = 'main p:not(.side), main li, main h1, main h3, main dl, .contact .mail, .job .meta, .dots-cap';
  let texts = [], vtext = [];
  const readTexts = () => { texts = []; const sy = scrollY; for (const e of document.querySelectorAll(TEXT)) { const rg = document.createRange(); rg.selectNodeContents(e);
    for (const r of rg.getClientRects()) if (r.width > 2 && r.height > 2) texts.push([r.left - 4, r.top + sy - 3, r.right + 4, r.bottom + sy + 3]); } };
  const inText = (x, y) => { for (const r of vtext) if (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) return 1; return 0; };
  const inDark = (x, y) => { if (root.dataset.theme === 'dark') return 1; for (const r of zones) if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return 1; return 0; };

  // targets: the hero name line, then each section's h2 (the box of the words, not the full-width block)
  const textRect = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); };
  let cands = [];
  const findCands = () => { const hero = document.querySelector('main > section:first-of-type'), who = document.querySelector('.hero-text .who');
    cands = [...(hero && who ? [{ sec: hero, title: who }] : []), ...[...document.querySelectorAll('section.row')].map((s) => ({ sec: s, title: s.querySelector('h2') })).filter((c) => c.title)]; };
  const ok = (r) => r.width > 0 && r.bottom > 40 && r.top < H - 90;
  const score = (r) => Math.abs((r.top + r.bottom) / 2 - H * 0.5);
  let cur = null, curR = null;
  const pick = () => {   // the title nearest 40% of the screen; keeps the current one unless another is clearly nearer (no flicker)
    let best = null, bs = 1e9, br = null, cs = 1e9;
    for (const c of cands) { const r = textRect(c.title); if (!ok(r)) continue; const s = score(r); if (c === cur) { cs = s; curR = r; } if (s < bs) { bs = s; best = c; br = r; } }
    if (cur && cs < 1e9 && cs - bs < 30) return { c: cur, r: curR };
    return best ? { c: best, r: br } : null;
  };

  const draw = (fade) => {
    g.clearRect(0, 0, W, H); readZones(); g.lineCap = 'round';
    const sy = scrollY; vtext = texts.filter((r) => r[3] > sy && r[1] < sy + H).map((r) => [r[0], r[1] - sy, r[2], r[3] - sy]);
    for (const p of P) { if (p.x < -4 || p.x > W + 4 || p.y < -4 || p.y > H + 4 || inBlock(p.x, p.y)) continue; const d = inDark(p.x, p.y), over = inText(p.x, p.y);
      const ring = p.lk || 0, lane = 1 - Math.min(1, ring), a = Math.min(1, p.a * (d ? 0.95 : 0.9) + lane * 0.15 + ring * 0.3) * fade * (over ? 0.2 : 1), rgb = COL[p.c][d], sp = Math.hypot(p.vx, p.vy);
      if (ring < 1 && sp > 140 && sp < 4000 && !over) {   // moving fast (in the lane or in flight): a short streak shows its path
        const L = Math.min(26, sp * 0.03) / sp;   // capped so fast flights don't smear over the text
        g.strokeStyle = `rgba(${rgb},${(a * 0.55).toFixed(3)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.vx * L, p.y - p.vy * L); g.stroke(); }
      const s = p.s + lane * 0.5 + ring * 0.6;   // on the path: a touch bigger and brighter
      g.fillStyle = `rgba(${rgb},${a.toFixed(3)})`; g.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
  };
  const ready = () => { findDark(); findCands(); readTexts(); };
  setInterval(() => { if (!document.hidden) readTexts(); }, 1500);   // reveals, unlocks and fonts move text a little

  // pause (bottom bar "Motion" button, shared with the dot blocks through window.MOTION)
  let paused = false; try { paused = localStorage.getItem('nyg-motion') === 'off'; } catch (e) {}
  window.MOTION = window.MOTION || { paused, set(v) { this.paused = v; try { localStorage.setItem('nyg-motion', v ? 'off' : 'on'); } catch (e) {} dispatchEvent(new CustomEvent('motionchange', { detail: v })); } };

  if (reduce) {   // still stars; redrawn on scroll only so their colour matches what is behind them
    let q = 0; const paint = () => { q = 0; draw(1); };
    const ask = () => { if (!q) q = requestAnimationFrame(paint); };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', () => { fit(); P.forEach((p) => { p.x = Math.random() * W; p.y = Math.random() * H; }); ask(); });
    addEventListener('load', () => { ready(); ask(); }); ready(); ask();
    window.STARS = { add() {}, debug: () => ({ mode: 'still', target: null, P }) };
    return;
  }

  let raf = 0, last = performance.now(), t = 0, lastY = scrollY, vel = 0, spin = 0, fade = 0, switchAt = 0, flow = 0, flyDir = 1, prev = null, flowV = 60;
  // the star's slot on its title's ring (viewport px): a tight ellipse just outside the words, turning slowly
  const ringPos = (p, r, amp) => {   // also returns the ring's direction of travel at that slot (for joining it smoothly)
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    const ax = Math.min(r.width / 2 * 1.15 + 20 + p.ring * 10, Math.max(cx - 6, 40), Math.max(W - cx - 6, 40)), ay = r.height / 2 + 10 + p.ring * 6;   // close to the words, on screen, clear of nearby lines
    const th = p.ang + spin * (0.8 + p.grp * 0.2), wob = 1 + 0.05 * amp * Math.sin(th * 3 + t * 5 + p.ph);
    const tx = -Math.sin(th) * ax, ty = Math.cos(th) * ay, tl = Math.hypot(tx, ty) || 1;
    return [cx + Math.cos(th) * ax * wob, cy + Math.sin(th) * ay * wob, tx / tl, ty / tl];
  };
  const lanePos = (p, i) => {   // the winding lane down the right side of the screen
    const span = H + 60, yy = (((i / P.length) * span + flow) % span + span) % span - 30;
    return [W * (small ? 0.87 : 0.83) + Math.sin(yy * 0.007 + t * 0.6) * W * 0.035 + (p.ring - 0.5) * (small ? 44 : 130), yy + (p.ring - 0.5) * 16];   // Noel: a wider path
  };
  const bez = (a, b, c, d, u) => { const v = 1 - u; return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d; };
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000), f = dt * 60; last = now; t += dt;
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (dy - vel) * Math.min(1, 0.15 * f);
    const amp = Math.min(1, Math.abs(vel) / 30);
    fade = Math.min(1, fade + dt * 1.5);
    spin += dt * (0.32 + 0.9 * amp);
    const tg = pick(), tc = tg ? tg.c : null;
    if (tc !== cur) {   // new target (a title, or none = the lane): every star blends from where it is now into its new path
      prev = cur; cur = tc; switchAt = now; mode = tc ? 'ring' : 'field'; flyDir = vel < -0.3 ? -1 : 1;
      const pr = prev ? textRect(prev.title) : null;
      const cx = tc ? (tg.r.left + tg.r.right) / 2 : 0, cy = tc ? (tg.r.top + tg.r.bottom) / 2 : 0;
      const order = P.map((p, i) => [tc ? Math.hypot(cx - p.x, cy - p.y) : i, i]).sort((a, b) => a[0] - b[0]);
      order.forEach(([, i], k) => { const p = P[i], [ax, ay] = pr ? ringPos(p, pr, amp) : lanePos(p, i);
        p.go = (k / P.length) * (tc ? 0.6 : 0.4); p.ox = p.x - ax; p.oy = p.y - ay; p.sy = ay; p.wa = 0; p.wb = 0; p.sb = lanePos(p, i)[1]; });   // nearest first; offset from the source fades out
    }
    const since = (now - switchAt) / 1000, DUR = 0.9;
    flowV += ((60 + Math.abs(vel) * 9) * (vel < -0.3 ? -1 : 1) - flowV) * Math.min(1, dt * 2.5);   // eased, so speeding up or reversing never jerks the lane
    flow += flowV * dt;   // the lane moves down the page as you scroll down (up when you scroll up)
    const pr = prev ? textRect(prev.title) : null;
    let busy = false;
    for (let i = 0; i < P.length; i++) { const p = P[i], ox = p.x, oy = p.y;
      const tau = Math.max(0, Math.min(1, (since - p.go) / DUR)); if (tau < 1) busy = true;
      const w = tau * tau * (3 - 2 * tau);                       // blend weight: 0 → 1 with zero slope at both ends (no kick, no stop)
      const g = 1 - (1 - tau) * (1 - tau);                       // progress along the curve: fast start, eases out onto the ring
      let [ax, ay] = pr && tau < 1 ? ringPos(p, pr, amp) : lanePos(p, i);   // source, live: the old ring (moving with the page) or the lane
      ay += p.wa; if (p.sy != null && Math.abs(ay - p.sy) > H * 0.5) { const j = Math.sign(ay - p.sy) * (H + 60); p.wa -= j; ay -= j; }   // unwrap: a lane slot that wraps round
      p.sy = ay;                                                                                                       // keeps going off-screen instead
      ax += p.ox * (1 - w); ay += p.oy * (1 - w);
      let bx, by;
      if (tg) { const [sx, sy, txn, tyn] = ringPos(p, tg.r, amp);
        // one curve: on in the scroll direction, swing toward the title, arrive along the ring's own direction
        bx = bez(ax, ax, sx - txn * 150, sx, g); by = bez(ay, ay + flyDir * 220, sy - tyn * 150, sy, g); p.lk = w; }
      else { [bx, by] = lanePos(p, i); p.lk = 0;
        if (w < 1) { by += p.wb; if (p.sb != null && Math.abs(by - p.sb) > H * 0.5) { const j = Math.sign(by - p.sb) * (H + 60); p.wb -= j; by -= j; } p.sb = by; } else p.wb = 0; }
      p.x = ax + (bx - ax) * w; p.y = ay + (by - ay) * w;
      p.vx = (p.x - ox) / Math.max(dt, 1e-3); p.vy = (p.y - oy) / Math.max(dt, 1e-3);
    }
    if (!busy && prev) prev = null;   // the move is over: only the new path matters now
    draw(fade);
    loop();
  };
  const running = () => !document.hidden && !root.classList.contains('cpanel-open') && !window.MOTION.paused;
  function loop() { if (!raf && running()) raf = requestAnimationFrame(frame); }
  const wake = () => { if (!raf && running()) { last = performance.now(); lastY = scrollY; raf = requestAnimationFrame(frame); } };
  let q = 0; const still = () => { if (!running() && !q) q = requestAnimationFrame(() => { q = 0; draw(1); }); };   // paused: colours still follow the page
  addEventListener('scroll', still, { passive: true });
  addEventListener('resize', () => { fit(); findCands(); readTexts(); wake(); still(); });
  document.addEventListener('visibilitychange', wake);
  addEventListener('motionchange', () => { wake(); still(); });
  addEventListener('themechange', () => { wake(); still(); });
  new MutationObserver(wake).observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('load', () => { ready(); wake(); });
  const btn = document.querySelector('.fb-stars');   // "STARS ❚❚ / ▶" in the bottom bar (WCAG 2.2.2)
  const showBtn = () => { if (!btn) return; const p = window.MOTION.paused; btn.setAttribute('aria-pressed', String(p)); btn.lastElementChild.textContent = p ? '▶' : '❚❚'; };
  if (btn) { btn.hidden = false; btn.addEventListener('click', () => window.MOTION.set(!window.MOTION.paused)); addEventListener('motionchange', showBtn); showBtn(); }
  ready(); wake(); if (window.MOTION.paused) { fade = 1; still(); }
  window.STARS = { add() {}, debug: () => ({ mode: window.MOTION.paused ? 'paused' : mode, target: cur ? cur.title.textContent.slice(0, 40) : null, P }) };
})();
