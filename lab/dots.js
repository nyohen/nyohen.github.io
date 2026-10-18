// Dot-matrix blocks in samgoddard.co.uk's style (measured on the live site: 5 px grid, round dots that grow when bright,
// 21 brightness steps, a faint dot on every grid point, near-black screen). Our own code and our own drawings.
//   garden    (projects)  click / tap / Enter plants a flower, or grows the one you click near
//   fireworks (education) launches on its own every few seconds; click / tap / Enter launches one at that spot
//   sunset    (contact)   Sam's sinking-sun-over-water look, but it follows the real sun in Toronto (?time=HH:MM to test):
//                         sunrise / day (birds cross) / sunset / night (moon, stars, fish jump). Click the water: a fish jumps;
//                         click the sky by day: a bird flies off. Sea life at any hour: dolphins leap (sometimes a pod),
//                         a shark fin cuts across with a wake, a school of fish swims under the surface (your cursor scatters it),
//                         a whale surfaces and spouts.
// Your clicks show in the site's orange or blue (Sam colours them per visitor). Counters are per day, this browser only.
// Motion: each block runs only while on screen and has its own pause button (WCAG 2.2.2). Reduced motion: still frames.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = 5, LV = 20, TAU = Math.PI * 2;
  const R = (a, b) => a + Math.random() * (b - a);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const COL = ['rgb(222, 216, 206)', 'rgb(255, 106, 64)', 'rgb(138, 164, 255)'];   // base warm grey, then the two click colours
  const BG = '#131217';

  // ---- counters per day (Toronto date), like Sam's "0 dolphins spotted today" ----
  const KEY = 'nyg-dots', today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const counts = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o.date === today() ? o : { date: today() }; } catch (e) { return { date: today() }; } };
  const bump = (k) => { const o = counts(); o[k] = (o[k] || 0) + 1; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} return o[k]; };

  class Board {
    constructor(cv, scene) {
      this.cv = cv; this.g = cv.getContext('2d'); this.scene = scene; this.items = []; this.vis = false; this.paused = false; this.dirty = true; this.ptr = null; this.hue = 1;
      this.cap = cv.closest('.dots-box').querySelector('.dots-cap') || cv.closest('.scene').querySelector('.dots-cap');
      this.resize();
      const at = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; this.ptr = at(e); this.scene.move && this.scene.move(this, ...this.ptr); this.dirty = true; wake(); });
      cv.addEventListener('pointerleave', () => { this.ptr = null; this.dirty = true; wake(); });
      cv.addEventListener('pointerdown', (e) => this.click(...at(e)));
      cv.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); const k = this.scene.keyAt ? this.scene.keyAt(this) : [R(0.2, 0.8), R(0.2, 0.8)]; this.click(k[0] * this.w, k[1] * this.h); } });
      const pb = this.cap && this.cap.querySelector('.dots-pause');
      if (pb) { if (reduce) pb.hidden = true;
        pb.addEventListener('click', () => { this.paused = !this.paused; pb.setAttribute('aria-pressed', String(this.paused)); pb.firstElementChild.textContent = this.paused ? '▶' : '❚❚'; this.last = performance.now(); this.dirty = true; wake(); }); }
    }
    resize() {
      const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      this.w = Math.max(20, r.width); this.h = Math.max(20, r.height); this.cv.width = Math.round(this.w * d); this.cv.height = Math.round(this.h * d); this.g.setTransform(d, 0, 0, d, 0, 0);
      this.cols = Math.ceil(this.w / S); this.rows = Math.ceil(this.h / S); const n = this.cols * this.rows;
      this.v = new Float32Array(n); this.r = new Float32Array(n); this.c = new Uint8Array(n);
      this.scene.init(this); this.dirty = true;
    }
    put(i, v, r, c) { if (v > this.v[i]) { this.v[i] = v; if (c !== undefined) this.c[i] = c; } if (r > this.r[i]) this.r[i] = r; }
    at(px, py, v, r = 1, c) {   // light the grid dot nearest a point in CSS px
      const x = Math.round(px / S), y = Math.round(py / S); if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return; this.put(y * this.cols + x, v, r, c); }
    click(x, y) { const hue = this.hue = this.hue === 1 ? 2 : 1; const k = this.scene.click(this, x, y, hue); if (k) this.count(k); this.dirty = true; wake();
      this.cv.dispatchEvent(new CustomEvent('dots:play'));   // unlock.js reveals the next part of the section
      if (reduce && this.scene.settle) setTimeout(() => { this.scene.settle(this); this.dirty = true; wake(); }, 1500); }   // reduced motion: the still result shows, then clears
    count(k) { const n = bump(k); this.label(k, n); }
    label(k, n) { const el = this.cap && this.cap.querySelector('.n'); if (el && this.scene.label) el.textContent = this.scene.label(k, n === undefined ? (counts()[k] || 0) : n); }
    render(t, dt) {
      const { v, r, c, cols, rows, g } = this; v.fill(0.04); r.fill(1); c.fill(0);
      this.scene.field(this, t, dt);
      g.fillStyle = this.scene.bg ? this.scene.bg(this) : BG; g.fillRect(0, 0, this.w, this.h);
      const B = this.bk || (this.bk = Array.from({ length: 3 * (LV + 1) }, () => []));
      for (const b of B) b.length = 0;
      for (let i = 0; i < v.length; i++) B[c[i] * (LV + 1) + Math.round(Math.min(1, v[i]) * LV)].push(i);
      for (let k = 0; k < B.length; k++) { const b = B[k]; if (!b.length) continue; const lv = k % (LV + 1); if (!lv) continue;
        g.fillStyle = COL[(k / (LV + 1)) | 0]; g.globalAlpha = lv / LV; g.beginPath();
        for (const i of b) { const x = (i % cols) * S + 2.5, y = ((i / cols) | 0) * S + 2.5, rr = Math.min(2.2, r[i]); g.moveTo(x + rr, y); g.arc(x, y, rr, 0, TAU); }
        g.fill(); }
      g.globalAlpha = 1;
      if (this.ptr) { const x = Math.round(this.ptr[0]), y = Math.round(this.ptr[1]); g.fillStyle = COL[this.hue === 1 ? 2 : 1]; g.fillRect(x - 7, y - 1, 15, 2); g.fillRect(x - 1, y - 7, 2, 15); }   // plus cursor in the colour your next click gets
      this.dirty = false;
    }
  }

  // ================= garden =================
  // Top-down flowers over grass. Three flower kinds (daisy, sunflower, four-leaf clover), all our own shapes.
  const flower = (b, f, t) => {
    const z = b.k * f.size * f.op, sw = Math.sin(t * f.sw + f.ph);
    const cx = f.x + f.px + sw * 1.5 * z, cy = f.y + f.py + Math.cos(t * f.sw * 0.9 + f.ph) * 1.2 * z;
    const petals = [], rot = f.rot + t * f.spin + sw * 0.06;
    if (f.kind === 0) for (let i = 0; i < f.n; i++) { const a = rot + i * TAU / f.n; petals.push([cx + Math.cos(a) * 13 * z, cy + Math.sin(a) * 13 * z, 9 * z, 5.5 * z, a]); }
    else if (f.kind === 1) for (let i = 0; i < f.n; i++) { const a = rot + i * TAU / f.n; petals.push([cx + Math.cos(a) * 18 * z, cy + Math.sin(a) * 18 * z, 9 * z, 3.2 * z, a]); }
    else for (let i = 0; i < 4; i++) { const a = rot + i * TAU / 4; petals.push([cx + Math.cos(a) * 8.5 * z, cy + Math.sin(a) * 8.5 * z, 7.5 * z, 7.5 * z, a]); }
    const core = f.kind === 1 ? 10 * z : f.kind === 0 ? 5.5 * z : 3 * z, ext = f.kind === 1 ? 30 * z : 24 * z;
    const x0 = Math.max(0, Math.floor((cx - ext) / S)), x1 = Math.min(b.cols - 1, Math.ceil((cx + ext) / S)), y0 = Math.max(0, Math.floor((cy - ext) / S)), y1 = Math.min(b.rows - 1, Math.ceil((cy + ext) / S));
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
      const px = gx * S + 2.5, py = gy * S + 2.5, dc = Math.hypot(px - cx, py - cy);
      let v = 0, rr = 1;
      if (dc < core) { v = f.kind === 1 ? 0.55 + 0.35 * ((gx + gy) & 1) : 0.95; rr = 1.6; }   // sunflower seeds: a checker of bright and dim
      else for (const [ex, ey, ra, rb, a] of petals) { const dx = px - ex, dy = py - ey, ca = Math.cos(a), sa = Math.sin(a);
        const q = ((dx * ca + dy * sa) / ra) ** 2 + ((dy * ca - dx * sa) / rb) ** 2; if (q < 1) { v = Math.max(v, 0.5 + 0.35 * (1 - q)); rr = Math.max(rr, 1.2 + 0.7 * (1 - q)); } }
      if (v) b.put(gy * b.cols + gx, v * f.op, rr, f.hue);
    }
  };
  const newFlower = (b, x, y, hue) => { const kind = (Math.random() * 3) | 0;
    return { x, y, kind, hue, n: kind === 0 ? 6 + ((Math.random() * 3) | 0) : 12 + ((Math.random() * 5) | 0), size: hue ? 0.35 : R(0.7, 1.25), grow: hue ? 1 : 0,
      ph: R(0, TAU), sw: R(0.8, 1.4), rot: R(0, TAU), spin: R(-0.08, 0.08), px: 0, py: 0, op: 0, age: hue ? -20 : R(0, 12), life: R(18, 30), fading: false }; };
  const Garden = {
    label: (k, n) => `${n} planted today`,
    init(b) {
      b.k = Math.max(0.7, Math.min(1, Math.min(b.w, b.h) / 420));   // flowers scale a little with the block (Sam's block is ~560 px)
      b.want = Math.max(5, Math.min(22, Math.round(b.w * b.h / (15900 * b.k * b.k))));   // Sam's density: ~20 flowers on a 564 px square
      b.grass = new Float32Array(b.cols * b.rows);   // grass: clumps of short blades, set once
      const clumps = Math.round(b.cols * b.rows / 40);
      for (let k = 0; k < clumps; k++) { const cx = R(0, b.cols), cy = R(0, b.rows), n = 2 + ((Math.random() * 4) | 0);
        for (let j = 0; j < n; j++) { const a = -Math.PI / 2 + R(-0.7, 0.7), L = R(2, 4.5), sx = cx + R(-1.5, 1.5);
          for (let s = 0; s <= L; s++) { const x = Math.round(sx + Math.cos(a) * s), y = Math.round(cy + Math.sin(a) * s); if (x >= 0 && y >= 0 && x < b.cols && y < b.rows) b.grass[y * b.cols + x] = Math.max(b.grass[y * b.cols + x], 0.2 - s * 0.02 + hash(x, y) * 0.06); } } }
      if (!b.items.length) for (let i = 0; i < b.want; i++) { const f = newFlower(b, 0, 0, 0); this.place(b, f); f.op = 1; b.items.push(f); }
    },
    place(b, f) { for (let k = 0; k < 30; k++) { f.x = R(24, b.w - 24); f.y = R(24, b.h - 24); if (b.items.every((o) => Math.hypot(o.x - f.x, o.y - f.y) > 52 * b.k)) return; } },
    move(b) {},
    field(b, t, dt) {
      for (let i = 0; i < b.v.length; i++) if (b.grass[i]) b.put(i, b.grass[i], 1);
      const p = b.ptr;
      for (const f of b.items) {
        let fx = 0, fy = 0; if (p) { const dx = f.x - p[0], dy = f.y - p[1], d = Math.hypot(dx, dy); if (d > 0 && d < 120) { const s = (1 - d / 120) * 14; fx = dx / d * s; fy = dy / d * s; } }
        f.px += (fx - f.px) * Math.min(1, dt * 3); f.py += (fy - f.py) * Math.min(1, dt * 3);   // the cursor parts the flowers like a breeze
        f.age += dt; if (f.size < f.grow) f.size = Math.min(f.grow, f.size + dt * 1.6);
        if (!f.hue && f.age > f.life) f.fading = true;
        f.op = f.fading ? f.op - dt * 0.8 : Math.min(1, f.op + dt * 1.5);
      }
      b.items = b.items.filter((f) => f.op > 0 || !f.fading);
      if (b.items.filter((f) => !f.fading).length < b.want) { const f = newFlower(b, 0, 0, 0); this.place(b, f); b.items.push(f); }
      for (const f of b.items) flower(b, f, t);
    },
    click(b, x, y, hue) {
      let best = null, bd = 40 * b.k + 10; for (const f of b.items) { const d = Math.hypot(f.x - x, f.y - y); if (!f.fading && d < bd) { bd = d; best = f; } }
      if (best && best.grow < 1.6) { best.grow = Math.max(best.size, best.grow) + 0.35; best.hue = hue; best.age = 0; best.life = 60; return null; }   // grow it, and it becomes yours
      const f = newFlower(b, x, y, hue); f.grow = R(0.8, 1.15); if (reduce) { f.size = f.grow; f.op = 1; }
      b.items.push(f); const mine = b.items.filter((o) => o.hue && !o.fading); if (mine.length > 24) mine[0].fading = true;
      return 'flowers';
    },
  };

  // ================= fireworks =================
  // A dotted Toronto skyline (our drawing: CN Tower, Rogers Centre dome, towers) under a starry sky.
  const Fireworks = {
    label: (k, n) => `${n} launched today`,
    keyAt: () => [R(0.25, 0.75), R(0.2, 0.45)],
    init(b) {
      b.sky = Array.from({ length: Math.round(b.cols * b.rows / 70) }, () => ({ i: ((R(0, b.rows * 0.75) | 0) * b.cols + (R(0, b.cols) | 0)), ph: R(0, TAU), s: R(0.5, 2) }));
      const base = b.rows - 1, sk = new Float32Array(b.cols);   // skyline height per column (in dots)
      const tower = Math.round(b.cols * 0.32), H = Math.max(10, Math.round(b.rows * 0.42));
      for (let x = 0; x < b.cols; x++) { const blk = Math.floor(x / 4), hgt = hash(blk, 9) < 0.3 ? 0 : 2 + hash(blk, 3) * b.rows * 0.16; sk[x] = hgt; }
      for (let x = Math.round(b.cols * 0.55); x < Math.round(b.cols * 0.55) + 9 && x < b.cols; x++) sk[x] = Math.max(sk[x], 3 + Math.sqrt(Math.max(0, 16 - (x - Math.round(b.cols * 0.55) - 4) ** 2)));   // dome
      b.mask = new Uint8Array(b.cols * b.rows);
      for (let x = 0; x < b.cols; x++) for (let y = base; y > base - sk[x]; y--) if (y >= 0) b.mask[y * b.cols + x] = 1;
      for (let y = base; y > base - H && y >= 0; y--) { const k = (base - y) / H; const w = k < 0.55 ? 1 : k < 0.62 ? 2 : 0; for (let dx = -w; dx <= w; dx++) if (tower + dx >= 0 && tower + dx < b.cols) b.mask[y * b.cols + tower + dx] = 1; }
      for (let dy = 0; dy < 2; dy++) for (let dx = -3; dx <= 3; dx++) { const y = base - Math.round(H * 0.62) + dy, x = tower + dx; if (y >= 0 && x >= 0 && x < b.cols) b.mask[y * b.cols + x] = 1; }   // the pod
      b.ttop = base - H; b.tx = tower; b.next = 0.8; b.flash = 0; b.sparks = b.sparks || [];
    },
    launch(b, x, y, hue) { const kind = Math.random() < 0.45 ? 0 : Math.random() < 0.55 ? 1 : 2;
      b.items.push({ x0: x + R(-20, 20), y0: b.h, x, y: Math.min(y, b.h * 0.72), t: 0, rise: R(0.75, 1.05), hue, kind }); },
    burst(b, it) { const n = Math.round((it.kind === 2 ? 40 : 70) * Math.max(0.6, Math.min(1.4, b.w / 500))), sp = Math.max(60, Math.min(170, b.w * 0.28));
      for (let i = 0; i < n; i++) { const a = i / n * TAU + R(-0.05, 0.05), s = it.kind === 1 ? sp : sp * Math.sqrt(R(0.05, 1));
        b.sparks.push({ x: it.x, y: it.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: it.kind === 2 ? R(1.6, 2.4) : R(0.9, 1.6), age: 0, hue: it.hue, drag: it.kind === 2 ? 2.6 : 1.6, g: it.kind === 2 ? 40 : 70 }); }
      b.flash = 1; },
    field(b, t, dt) {
      for (const s of b.sky) b.put(s.i, 0.1 + 0.2 * (0.5 + 0.5 * Math.sin(t * s.s + s.ph)), 1);
      b.flash = Math.max(0, b.flash - dt * 2.2);
      for (let i = 0; i < b.mask.length; i++) if (b.mask[i]) b.put(i, 0.22 + b.flash * 0.25 + hash(i, 1) * 0.06, 1.1);
      if (Math.sin(t * 3) > 0.6) b.at(b.tx * S + 2.5, b.ttop * S - 2.5, 0.9, 1.6, 1);   // the tower's red light
      if (!reduce && t > b.next) { this.launch(b, R(0.15, 0.85) * b.w, R(0.15, 0.5) * b.h, 0); b.next = t + R(2, 5); }
      b.items = b.items.filter((it) => { it.t += dt; const k = Math.min(1, it.t / it.rise), e = 1 - (1 - k) * (1 - k);
        const x = it.x0 + (it.x - it.x0) * k, y = it.y0 + (it.y - it.y0) * e;
        for (let s = 0; s < 5; s++) b.at(x - (it.x - it.x0) * s * 0.012, y + s * 4, (it.hue ? 0.95 : 0.8) * (1 - s / 5), 1.3, it.hue);
        if (k >= 1) { this.burst(b, it); return false; } return true; });
      b.sparks = b.sparks.filter((p) => { p.age += dt; if (p.age > p.life) return false; const f = Math.exp(-p.drag * dt);
        p.vx *= f; p.vy = p.vy * f + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; const k = 1 - p.age / p.life;
        b.at(p.x, p.y, 0.25 + 0.75 * k, 1 + k * 1.1, p.hue); if (k > 0.5) b.at(p.x - p.vx * 0.03, p.y - p.vy * 0.03, 0.35 * k, 1, p.hue); return true; });
    },
    settle(b) { b.sparks = []; b.items = []; },
    click(b, x, y, hue) { if (reduce) { this.burst(b, { x, y, kind: 0, hue }); b.sparks.forEach((p) => { p.x += p.vx * 0.35; p.y += p.vy * 0.35; p.age = p.life * 0.4; }); } else this.launch(b, x, y, hue); return 'fireworks'; },
  };

  // ================= sunset (and the rest of the day) =================
  const q = new URLSearchParams(location.search).get('time');
  const torontoNow = () => { if (q && /^\d{1,2}:\d{2}$/.test(q)) { const [h, m] = q.split(':').map(Number); return h + m / 60; }
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    return +p.find((x) => x.type === 'hour').value + +p.find((x) => x.type === 'minute').value / 60; };
  // sunrise / sunset in Toronto today (standard solar formula, ±2 min), in local clock hours
  const sunTimes = () => { const d = new Date(), doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), lat = 43.65 * Math.PI / 180;
    const g = TAU / 365 * (doy - 1), eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g);
    const ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec)) * 180 / Math.PI;
    const off = -new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', timeZoneName: 'shortOffset' }).formatToParts(d).find((x) => x.type === 'timeZoneName').value.replace('GMT', '') || 5;
    const noon = (720 - 4 * -79.38 - eq) / 60 - off;
    return [noon - ha / 15, noon + ha / 15]; };
  let ST = sunTimes();
  const phaseOf = (h) => { const [r, s] = ST; return h >= r - 0.6 && h < r + 0.6 ? 'Sunrise' : h >= r + 0.6 && h < s - 0.9 ? 'Day' : h >= s - 0.9 && h < s + 0.5 ? 'Sunset' : 'Night'; };
  const vbird = (b, x, y, flap, v, r, c) => {   // a gull: two bent wings, tips up (flap) or down
    for (let s = -3; s <= 3; s++) { const a = Math.abs(s), dy = flap ? (a === 1 ? -4 : a === 2 ? -6 : a === 3 ? -5 : 0) : (a === 1 ? -2 : a === 2 ? 0 : a === 3 ? 3 : 0); b.at(x + s * 5, y + dy, v, r, c); } };
  // a dolphin side-on, nose to +x (units of 4 px): back, belly, beak, dorsal fin, tail flukes
  const DOLPHIN = [];   // filled body (a tapered curve), dorsal fin, beak, tail flukes
  for (let u = -4.6; u <= 4.7; u += 0.8) { const e = 1 - (u / 4.9) ** 2, th = 0.8 * Math.sqrt(Math.max(0, e)), c = -0.2 * e; for (let v = -th; v <= th + 0.01; v += 0.8) DOLPHIN.push([u, c + v]); DOLPHIN.push([u, c - th], [u, c + th]); }
  DOLPHIN.push([5.3, 0.1], [5.9, 0.2], [-0.4, -1.3], [-0.9, -1.8], [-1.3, -1.2], [-5.3, -0.5], [-5.8, -1], [-5.3, 0.5], [-5.8, 1], [-5, 0]);
  const SEA = { dolphin: 0.1, shark: 0.5, school: 0.7, whale: 0.9 };   // ?sea=dolphin etc. shows one kind (testing)
  const splash = (b, s, x, y) => { for (let j = 0; j < 3; j++) { const k = s - j * 0.1; if (k <= 0 || k >= 0.9) continue;
    const rad = 30 * k; for (let m = 0; m < 28; m++) { const th = m / 28 * TAU; b.at(x + Math.cos(th) * rad, y + Math.sin(th) * rad * 0.45, (1 - k / 0.9) * 0.55, 1.2); } } };
  const Sunset = {
    label: (k, n) => `${n} ${k === 'birds' ? 'birds sent off' : 'fish spotted'} today`,
    keyAt: (b) => [R(0.2, 0.8), R(0.65, 0.95)],
    init(b) { b.trail = []; b.nextAuto = 2; b.nextSea = 1.5; b.stars = Array.from({ length: Math.round(b.cols * b.rows / 90) }, () => ({ x: R(0, b.w), y: R(0, b.h * 0.56), ph: R(0, TAU), s: R(0.5, 2) })); },
    move(b, x, y) { const l = b.trail[b.trail.length - 1]; if (y > b.h * 0.6 && (!l || Math.hypot(x - l.x, y - l.y) > 20)) b.trail.push({ x, y, t: clock() }); },
    bg(b) { const k = this.sky(b).lit; return `rgb(${Math.round(19 + 34 * k)},${Math.round(18 + 40 * k)},${Math.round(23 + 51 * k)})`; },   // daytime: a soft slate sky (#353a4a), night: the usual near-black
    sky(b) {   // where the sun or moon is, and how lit the sky is
      const h = torontoNow(), [r, s] = ST, hz = b.h * 0.6, day = h >= r && h < s;
      const k = day ? (h - r) / (s - r) : ((h - s + 24) % 24) / (24 - (s - r));
      const el = Math.sin(Math.PI * k), rad = (day ? 0.13 : 0.085) * Math.min(b.w, b.h), x = b.w * (0.18 + 0.64 * k), y = hz + 4 - el * (hz - rad - 14);   // highest point stays inside the block
      const lit = day ? sm(el * 3) : 0, dusk = day ? 1 - sm(el * 2.2) : 0;   // dusk = 1 when the sun is low
      return { h, hz, day, x, y, el, lit, dusk, rad };
    },
    field(b, t, dt) {
      const P = this.sky(b), { hz, day, lit, dusk } = P, cx = P.x, cy = P.y, V = P.rad, halo = V * (4 + 2 * dusk), now = clock();
      while (b.trail.length && now - b.trail[0].t > 0.8) b.trail.shift();
      const cols = b.cols, rows = b.rows;
      for (let gy = 0; gy < rows; gy++) { const py = gy * S + 2.5, water = py > hz;
        for (let gx = 0; gx < cols; gx++) { const px = gx * S + 2.5, i = gy * cols + gx; let v = 0.1, rr = 1;
          const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
          if (!water) {
            if (d < V && py <= hz) { const e = 1 - d / V; rr = 1.4 + 0.7 * e * e; v = day ? 0.88 + 0.12 * e * e : 0.7 + 0.2 * e; if (!day && Math.hypot(dx - V * 0.45, dy + V * 0.15) < V * 0.82) { v = 0.1; rr = 1; } }   // the moon is a crescent
            else if (d < halo) { const e = 1 - d / halo, ray = Math.pow(Math.abs(Math.cos((Math.atan2(dy, dx) - t * 0.01) * 6)), 8) * Math.sin(e * Math.PI) * 0.25;
              const k = (e * e * 0.55 + ray) * (day ? 1 : 0.45); v = 0.1 + 0.5 * k; rr = 1 + 0.4 * k; }
            v = Math.max(v, 0.06 + 0.15 * (py / hz) ** 2 + lit * (0.34 + 0.12 * (py / hz)));   // sky brightens toward the horizon, and by day
            const nh = Math.abs(py - hz); if (nh < 30) v += (1 - nh / 30) * 0.2 * (0.5 + dusk);   // horizon glow, strongest at sunset
            const sx = px + t * 11;   // slow drifting streaks of cloud
            for (let j = 0; j < 3; j++) { const cyy = Math.abs(py - b.h * (0.14 + 0.14 * j)); if (cyy < 18) { const n = Math.sin(sx * 0.007 + j * 2.6) * Math.cos(sx * 0.011 + j * 6.1) * 0.5 + 0.25 * Math.sin(sx * 0.004 + j * 4 + 2); if (n > 0.2) v += (n - 0.2) * (1 - cyy / 18) * (0.16 + lit * 0.1); } }
          } else {
            const dep = (py - hz) / (b.h - hz); v = Math.max(v, 0.08 + (1 - dep) * 0.06 + lit * (0.14 - dep * 0.06));
            const wv = Math.sin((py + 3 * Math.sin(t * 0.3 + px * 0.02 + gy * 0.8) + 2 * Math.sin(t * 0.2 + px * 0.035 + gy * 1.2 + 2)) * 0.15 + t * 0.15);
            if (wv > 0.7) v += (wv - 0.7) / 0.3 * 0.15 * Math.max(0, 1 - 1.5 * dep);   // glints on the swell
            const off = Math.abs(px - cx), width = (20 + 60 * dep + 10 * Math.sin(t * 0.2 + py * 0.05)) * (V / 60);
            if (off < width && cy < hz + V) { const e = (1 - off / width) * Math.max(0, 1 - 1.2 * dep) * (0.6 * (0.5 + 0.5 * Math.sin(t * 0.5 + py * 0.3 + px * 0.05)) + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.3 + py * 0.15 + px * 0.1 + 1.5))) * 0.45 * (day ? 1 - 0.3 * dusk : 0.5);
              v += e; rr = Math.max(rr, 1 + 0.4 * e); }   // the sun's (or moon's) path on the water
            for (const p of b.trail) { const a = (now - p.t) / 0.8, ex = px - p.x, ey = (py - p.y) * 2.6, L = Math.hypot(ex, ey), ring = Math.abs(L - 46 * a);
              if (ring < 4 && L > 2) { v += (1 - ring / 4) * (1 - a) * (1 - a) * 0.6; } }   // your cursor leaves ripples
          }
          v += 0.02 * Math.sin(t * 0.5 + gx * 0.1 + gy * 0.1);
          b.v[i] = Math.max(0.04, Math.min(1, v)); b.r[i] = rr; } }
      if (!day) { const fade = sm(Math.min((P.h - ST[1] + 24) % 24, (ST[0] - P.h + 24) % 24) / 0.8); for (const s of b.stars) if (s.y < hz - 6) b.at(s.x, s.y, fade * (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.s + s.ph))), 1.2); }
      // now and then: a few birds cross by day, a fish jumps by night (Sam: a dolphin every 6-12 s)
      if (!reduce && t > b.nextAuto) { if (day) this.flock(b, 0); else this.fish(b, R(0.15, 0.85) * b.w, hz + R(0.1, 0.75) * (b.h - hz), 0); b.nextAuto = t + R(6, 12); }
      if (!reduce && t > b.nextSea) { this.sea(b, hz); b.nextSea = t + R(3, 6); }
      b.items = b.items.filter((it) => { it.t += dt; const a = reduce ? 0.5 : it.t / it.dur; if (a > (it.end || (it.kind === 'fish' ? 1.8 : 1))) return false;
        if (it.kind === 'dolphin') { if (a < 0) return true;   // waits its turn in the pod
          if (a <= 1) { const ht = Math.sin(a * Math.PI), fy = it.y - ht * it.top, fx = it.x + (a - 0.5) * it.run * it.dir, ang = Math.atan(-Math.cos(a * Math.PI) * Math.PI * it.top / it.run) * it.dir;
            for (const [ox, oy] of DOLPHIN) { const ux = ox * it.dir, X = ux * Math.cos(ang) - oy * Math.sin(ang), Y = ux * Math.sin(ang) + oy * Math.cos(ang);
              if (fy + Y * 6 <= it.y + 2.5) b.at(fx + X * 6, fy + Y * 6, 1, 1.8 + 0.5 * ht, it.hue); } }
          splash(b, a, it.x - it.run / 2 * it.dir, it.y); splash(b, a - 0.9, it.x + it.run / 2 * it.dir, it.y); return true; }
        if (it.kind === 'shark') { const x = it.x0 + (it.x1 - it.x0) * a, y = it.y + Math.sin(it.t * 1.3) * 1.5, show = Math.min(1, a * 8, (1 - a) * 8);   // fin rises in, sinks out
          for (let j = 0; j < 8; j++) { const yy = y - (7 - j) * 5 * show; if (show < 0.2 && j < 7) continue;
            for (let c = -j * 0.8; c <= j * 0.3 + 0.01; c += 0.8) b.at(x + c * 5 * it.dir, yy, 1, 1.8); }   // a dark-edged triangle, swept back
          for (let k = 1; k < 14; k++) { const wx = x - it.dir * k * 7; b.at(wx, y + k * 1.8, 0.7 * (1 - k / 14), 1.3); b.at(wx, y + 2 - k * 0.4, 0.5 * (1 - k / 14), 1.2); }   // the wake
          return true; }
        if (it.kind === 'school') { const cx = it.x0 + (it.x1 - it.x0) * a, cy = it.y + Math.sin(it.t * 0.9) * 6, vis = Math.min(1, a * 6, (1 - a) * 6);
          for (const f of it.fish) { let fx = cx + f.ox + Math.sin(it.t * 2 + f.ph) * 3, fy = cy + f.oy + Math.cos(it.t * 1.6 + f.ph) * 2;
            if (b.ptr) { const ex = fx + f.sx - b.ptr[0], ey = fy + f.sy - b.ptr[1], ed = Math.hypot(ex, ey); if (ed < 60 && ed > 0.1) { const k = (1 - ed / 60) * 160 * dt; f.sx += ex / ed * k; f.sy += ey / ed * k; } }   // cursor scatters the school
            f.sx *= 1 - Math.min(1, dt * 0.9); f.sy *= 1 - Math.min(1, dt * 0.9); fx += f.sx; fy = Math.max(it.top, fy + f.sy);
            b.at(fx + it.dir * 4, fy, 0.9 * vis, 1.6, it.hue); b.at(fx, fy, 0.8 * vis, 1.5, it.hue); b.at(fx - it.dir * 5, fy, 0.55 * vis, 1.2); }
          return true; }
        if (it.kind === 'whale') { const rise = Math.sin(Math.min(1, a) * Math.PI), x = it.x + (a - 0.5) * 40 * it.dir;
          for (let c = -12; c <= 12; c++) { const hy = it.y - rise * 18 * Math.cos(c / 12 * Math.PI / 2); for (let d = 0; hy + d * 5 < it.y - 1; d++) b.at(x + c * 5, hy + d * 5, d ? 0.55 : 1, d ? 1.4 : 1.8); }   // the back breaks the surface
          if (a > 0.3 && a < 0.85) { const k = (a - 0.3) / 0.55; for (let j = 0; j < 24; j++) { const sp = ((j * 0.37) % 1 + k) % 1, side = (j % 3) - 1;
            b.at(x + side * sp * 22 + it.dir * 20, it.y - 20 - Math.sin(sp * Math.PI) * 55 * (1 - k * 0.4), 0.95 * (1 - sp * 0.5), 1.5); } }   // the spout
          return true; }
        if (it.kind === 'shoot') { for (let j = 0; j < 12; j++) b.at(it.x + it.vx * (a - j * 0.025), it.y + it.vy * (a - j * 0.025), (1 - j / 12) * (1 - a * 0.6), 1.4 - j * 0.03, it.hue); return true; }
        if (it.kind === 'bird') { const x = it.x0 + (it.x1 - it.x0) * a, y = it.y0 + (it.y1 - it.y0) * a + Math.sin(a * 12 + it.ph) * 3;
          vbird(b, x, y, Math.sin(it.t * 8 + it.ph) > 0, it.hue ? 1 : 0.85, 1.6, it.hue); return true; }
        // fish: an arc out of the water and back, with a splash ring where it leaves and where it lands
        if (a <= 1) { const ht = Math.sin(a * Math.PI), fy = it.y - ht * it.top, fx = it.x + (a - 0.5) * 30 * it.dir, ang = (a - 0.5) * Math.PI * 0.4 * it.dir;
          for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [2, 0.3], [-1.5, 0.3], [0, -0.6], [-2.2, 0.3], [-2.2, 0.9], [0.4, -0.9]]) { const ux = ox * it.dir, X = ux * Math.cos(ang) - oy * Math.sin(ang), Y = ux * Math.sin(ang) + oy * Math.cos(ang);
            if (fy + Y * 3.5 <= it.y + 2.5) b.at(fx + X * 3.5, fy + Y * 3.5, 0.75 + 0.25 * ht, 1.4 + 0.7 * ht, it.hue); } }
        for (const [s, x] of [[a, it.x - 15 * it.dir], [a - 0.9, it.x + 15 * it.dir]]) for (let j = 0; j < 3; j++) { const k = s - j * 0.1; if (k <= 0 || k >= 0.9) continue;
          const rad = 30 * k / S; for (let m = 0; m < 28; m++) { const th = m / 28 * TAU; b.at(x + Math.cos(th) * rad * S, it.y + Math.sin(th) * rad * S * 0.45, (1 - k / 0.9) * 0.55, 1.2); } }
        return true; });
    },
    flock(b, hue, x, y) { const dir = x === undefined ? (Math.random() < 0.5 ? 1 : -1) : (x < b.w / 2 ? -1 : 1), n = hue ? 1 : 2 + ((Math.random() * 3) | 0), y0 = y === undefined ? R(0.12, 0.38) * b.h : y;
      for (let i = 0; i < n; i++) { const sx = x === undefined ? (dir > 0 ? -30 : b.w + 30) - dir * i * 26 : x, sy = y0 + i * 9;
        b.items.push({ kind: 'bird', x0: sx, y0: sy, x1: x === undefined ? sx + dir * (b.w + 90) : sx + dir * b.w * 0.6, y1: x === undefined ? sy - R(0, 20) : sy - b.h * 0.4, t: 0, dur: x === undefined ? R(7, 10) : 3, ph: R(0, TAU), hue }); } },
    sea(b, hz) {   // one creature at a time, somewhere on the water
      const dep = b.h - hz, k = SEA[new URLSearchParams(location.search).get('sea')] ?? Math.random(), dir = Math.random() < 0.5 ? 1 : -1;
      if (k < 0.35) { const n = Math.random() < 0.4 ? 3 : 1, x = R(0.25, 0.75) * b.w, y = hz + R(0.25, 0.6) * dep;   // dolphin, or a pod of three
        for (let i = 0; i < n; i++) this.dolphin(b, x - dir * i * 46, y + i * 5, dir, 0, -i * 0.28); }
      else if (k < 0.6) b.items.push({ kind: 'shark', x0: dir > 0 ? -40 : b.w + 40, x1: dir > 0 ? b.w + 40 : -40, y: hz + R(0.3, 0.7) * dep, dir, t: 0, dur: R(9, 12) });
      else if (k < 0.85) b.items.push({ kind: 'school', x0: dir > 0 ? -60 : b.w + 60, x1: dir > 0 ? b.w + 60 : -60, y: hz + R(0.45, 0.75) * dep, top: hz + 8, dir, t: 0, dur: R(10, 14), hue: 0,
        fish: Array.from({ length: 18 }, () => ({ ox: R(-55, 55), oy: R(-16, 16), ph: R(0, TAU), sx: 0, sy: 0 })) });
      else b.items.push({ kind: 'whale', x: R(0.25, 0.75) * b.w, y: hz + R(0.3, 0.55) * dep, dir, t: 0, dur: 4 }); },
    dolphin(b, x, y, dir, hue, a0 = 0) { const dur = 1.6; b.items.push({ kind: 'dolphin', x, y, dir, hue, run: 130, top: R(55, 75), t: a0 * dur, dur, end: 1.8 }); },
    settle(b) { b.items = []; },
    fish(b, x, y, hue) { b.items.push({ kind: 'fish', x, y, t: 0, dur: 1.2, dir: Math.random() < 0.5 ? 1 : -1, top: R(20, 30), hue }); },
    click(b, x, y, hue) { const P = this.sky(b);
      if (y > P.hz + 4) { const cx = Math.max(50, Math.min(b.w - 50, x)); Math.random() < 0.4 ? this.dolphin(b, cx, y, Math.random() < 0.5 ? 1 : -1, hue) : this.fish(b, cx, y, hue); return 'fish'; }
      if (P.day) { this.flock(b, hue, x, y); return 'birds'; }
      b.items.push({ kind: 'shoot', x, y, vx: (x < b.w / 2 ? 1 : -1) * b.w * 0.25, vy: b.h * 0.12, t: 0, dur: 0.9, hue }); return null; },   // night sky: a shooting star
  };

  // ---- one loop for every block on screen ----
  const t0 = performance.now(), clock = () => (performance.now() - t0) / 1000;
  const SC = { garden: Garden, fireworks: Fireworks, sunset: Sunset };
  const boards = [...document.querySelectorAll('canvas[data-dots]')].map((c) => new Board(c, SC[c.dataset.dots])).filter((b) => b.scene);
  const root = document.documentElement;
  let raf = 0, last = performance.now();
  const runs = (b) => b.vis && !b.paused && !reduce && !document.hidden && !root.classList.contains('cpanel-open');
  function frame(now) { raf = 0; const dt = Math.min(0.05, (now - last) / 1000); last = now; let any = false;
    for (const b of boards) { const go = runs(b); if (go || (b.vis && b.dirty)) { b.render(go ? clock() : (b.tStill || (b.tStill = clock())), go ? dt : (reduce ? 0.016 : 0)); if (go) b.tStill = 0; any = any || go; } }
    caption(); if (any) raf = requestAnimationFrame(frame); }
  function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const io = new IntersectionObserver((es) => es.forEach((e) => { const b = boards.find((x) => x.cv === e.target); b.vis = e.isIntersecting; if (b.vis) { b.dirty = true; wake(); } }), { rootMargin: '120px' });
  boards.forEach((b) => io.observe(b.cv));
  document.addEventListener('visibilitychange', wake);
  new MutationObserver(wake).observe(root, { attributes: true, attributeFilter: ['class'] });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { boards.forEach((b) => b.resize()); wake(); }, 150); });

  // sunset caption: Toronto time + phase; its counter shows birds by day, fish by night
  const nowEl = document.querySelector('.scene-now'), sb = boards.find((b) => b.scene === Sunset);
  let lastCap = '';
  function caption() { if (!nowEl || !sb) return; const h = torontoNow(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60), ph = phaseOf(h);
    const s = `Toronto · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · ${ph}`; if (s !== lastCap) { nowEl.textContent = s; lastCap = s; sb.dirty = true; sb.label(Sunset.sky(sb).day ? 'birds' : 'fish'); } }
  caption(); setInterval(() => { ST = sunTimes(); caption(); wake(); }, 30000);
  boards.forEach((b) => b.scene !== Sunset && b.label(b.scene === Garden ? 'flowers' : 'fireworks'));
  window.DOTS = { boards, phaseOf, torontoNow, sunTimes };
})();
