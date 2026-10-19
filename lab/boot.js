// Boot screen, every page load (Noel, 2026-10-18: a planet with a person on top instead of the cat):
//   - a dot-matrix planet pops in (3D: shaded sphere, land/sea/ice that turn with it) with the page's stars around it;
//   - a little person drops onto the top and says "Ciao, I'm Noel", then "Choose Me", and does Michael Jackson's moves while waiting
//     (fedora, moonwalk over the top of the planet, spin, toe stand "Hee-hee!", the lean); after one loop he turns into Darkon
//     (our own villain), Earth burns into Pyrokos, his fire world, and now and then his eye beams zig-zag out and blow up a ship;
//   - the planet is Earth (real continents); around it, all 3D in the same dots: shooting stars, a black hole, planets, a rocket /
//     flying saucer / satellite, floating astronauts, and a space war (orange vs blue fighters, lasers, explosions), coming in from
//     every side. Any of them can be dragged and flung (mouse or touch), and the planet itself can be spun by hand; a tossed one explodes
//     on whatever it hits (the black hole swallows); that never starts the spin; the mouse gets a
//     glowing patch of grid, a comet trail and a reticle that locks on over the person; the name decodes underneath, the boot log types;
//   - click or tap the person: the world spins faster and faster, the person flails and yells "WOOOO" (vertigo),
//     and the planet grows until it fills the screen, blowing up everything it touches (ships, planets, the black hole, even stars); then the spin slows to a stop while the whole screen fades into the site.
// Only a click or tap ON THE PERSON starts the spin (Noel: no keys, scrolling, or clicks anywhere else; no auto-start). There's no visible
// Skip (Noel); a hidden one appears only when tabbed to, the only way in for keyboard and screen-reader users (the page behind is inert). Skipped for reduced motion and with
// no JS (the inline script in <head> adds html.boot; ?boot=0 skips it for testing). position: fixed, so nothing on the page moves.
(() => {
  const root = document.documentElement, el = document.querySelector('.boot-screen');
  if (!el) return;
  if (!root.classList.contains('boot')) { el.remove(); return; }
  const R = (a, b) => a + Math.random() * (b - a);
  const cv = el.querySelector('.boot-world'), g = cv.getContext('2d'), go = el.querySelector('.boot-go'), say = el.querySelector('.boot-say'), mid = el.querySelector('.boot-mid');
  const GROW = 1500, SLOW = 1000;   // ms: spin + grow, slow down + fade (about 2.5 s from the click to the site)

  // the same material as the sunset block (dots.js): a 5 px dot grid, 20 brightness levels, dots up to 2.2 px, warm grey / orange / blue on #131217
  const S = 5, LV = 20, TAU = Math.PI * 2, BG = '#131217', COL = ['rgb(222, 216, 206)', 'rgb(255, 106, 64)', 'rgb(138, 164, 255)', 'rgb(228, 36, 44)'];   // + crimson, only for Darkon's eyes, his eye beams and Pyrokos' fire
  let W = 0, H = 0, dpr = 1, R0 = 0, CX = 0, CY = 0, cols = 0, rows = 0, v, rr, c;
  const size = () => { dpr = Math.min(1.5, devicePixelRatio || 1);   // 1.5x is sharp enough for dots and much cheaper than 2x
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    cols = Math.ceil(W / S); rows = Math.ceil(H / S); v = new Float32Array(cols * rows); rr = new Float32Array(cols * rows); c = new Uint8Array(cols * rows);
    R0 = Math.max(70, Math.min(W * 0.3, H * 0.2)); CX = W / 2; CY = H / 2; mid.style.top = `${CY + R0 + 30}px`; };   // the planet sits in the middle of the screen
  size(); addEventListener('resize', size);
  const put = (i, val, r, col) => { if (val > v[i]) { v[i] = val; c[i] = col; } if (r > rr[i]) rr[i] = r; };
  const B = Array.from({ length: COL.length * (LV + 1) }, () => []);
  // the faint background grid is the same every frame: draw it once to its own canvas and copy it in (it was ~50k arcs a frame)
  let grid = null, gridKey = '';
  const gridLayer = () => { const key = `${W}x${H}x${dpr}`; if (grid && gridKey === key) return grid; gridKey = key; grid = document.createElement('canvas'); grid.width = W * dpr; grid.height = H * dpr;
    const q = grid.getContext('2d'); q.setTransform(dpr, 0, 0, dpr, 0, 0); q.fillStyle = BG; q.fillRect(0, 0, W, H); q.fillStyle = COL[0]; q.globalAlpha = 1 / LV; q.beginPath();
    for (let y = 2.5; y < H; y += S) for (let x = 2.5; x < W; x += S) { q.moveTo(x + 1, y); q.arc(x, y, 1, 0, TAU); } q.fill(); return grid; };
  const draw = () => {   // dots.js render(): bucket by colour and level, one path per bucket
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(gridLayer(), 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const b of B) b.length = 0;
    g.fillStyle = BG; for (let i = 0; i < v.length; i++) { if (v[i] < 0.02) g.fillRect((i % cols) * S, ((i / cols) | 0) * S, S, S);   // the black hole's void hides the grid too
      B[c[i] * (LV + 1) + Math.round(Math.min(1, v[i]) * LV)].push(i); }
    for (let k = 0; k < B.length; k++) { const b = B[k], lv = k % (LV + 1); if (!b.length || !lv || k === 1) continue;   // k 1 = the plain grid, already copied in
      g.fillStyle = COL[(k / (LV + 1)) | 0]; g.globalAlpha = lv / LV; g.beginPath();
      for (const i of b) { const x = (i % cols) * S + 2.5, y = ((i / cols) | 0) * S + 2.5, r = Math.min(2.2, rr[i]); g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
      g.fill(); }
    g.globalAlpha = 1; };
  const stars = Array.from({ length: 110 }, () => ({ a: R(0, TAU), d: R(0.12, 1), c: (Math.random() * 3) | 0, t: R(0, TAU) }));

  // 3D: unit normals lit from the upper left, with a highlight (the planet and the person share the light)
  const L = (() => { const q = [-0.5, 0.55, 0.67], n = Math.hypot(...q); return q.map((x) => x / n); })();
  const shade = (nx, ny, nz) => { const lam = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]); return [lam, Math.max(0, 2 * lam * nz - L[2]) ** 14]; };
  // the planet is Earth: a 2-degree land map (180 x 90 bits) made from Natural Earth's 1:110m land (public domain), via world-atlas
  // land-110m.json, rasterised once. Looked up with smoothing, and the coastline roughened a little with fine noise so it holds up zoomed in.
  const LAND = (() => { const b = atob('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAfAP8DAAAAAAAAAAAAAAAAAAAAAADo//z//wcAAAAAAAACAAAAAAAAAAAAhvvw//8PAPABAAAAwAMAAAAAAAAAwADkw////wEABAAAAABgAAAAAAAAAADAUT8A/v8PAAAAAAwA/j8AuAEAAAAAcBHtDcD/fwAAAAAwAPz/fwMAABCAAQD5w/wD8P8FAAAMAIL7DwCAAOx/AH8ggLFFDv8A4P//B/D/SAAAAAAAQIAPAAAAAODBB+D//x8AKAAEAAAAAAAAcwAAAABAB/7Af/j/YCgAAAAAAAAAAADw/////wEs4AEAAHz+////////////gL////8HeAAcAADg5///////////9ADgAf7/f4AnAAAAAH78////////H0QAAAiA//8f8AcAAIBB4////////38ADwAQAOD//5//AQAAHAT/////////A3AAAAAA/v//+T8AAGDz//////////8DAQAAAMD/////AwAAsP//////////LwAAAAAA6P///2IAAAD+//////////8CAAAAAAD///8/CAAA4P//////////JwAAAAAA8P///wYAAAD+/unz/////z8AAAAAAAD///8HAAAA/pgPPP//////MQAAAAAA8P//PwAAAMBD9v7n/////wcBAAAAAAD///8AAAAAPkD7f/7///8hEAAAAAAA4P//DwAAAIDhAv/n////f8YAAAAAAAD8//8AAAAA+AdE//////8jDwAAAAAAgP//AwAAAMD/APD/////PxgAAAAAAADw/x8AAAAA/n/v//////8HAAAAAAAAAPwDAgAAAOD////7////fwAAAAAAAACgHyAAAACA//9/f/7///8DAAAAAAAAAPQBAAAAAPj//+cv+P//PwAAAAAAAAAAHjAAAADA/////g/+//8EAAAAAAAAAOBhCAAAAP7//99/4D//AAAAAAAAAAAAPAMEAADA////+Qf84BcAAAAAAAAAAAA/AAAAAPz//58fgAf+QAAAAAAAAAAAAA8AAADg////ewA4gA8EAAAAAAAAAADAAAAAAPz//38BgAP4QQAAAAAAAAAAAAgPAADA////zwAwgAwQAAAAAAAAAAAA9Q8AAPj///8HAAVIAAAAAAAAAAAAAID/AQAA////fwBAAAAQAAAAAAAAAAAA+P8AAGDh//8DAAA0GAAAAAAAAAAAAID/HwAAAPj/HwAAgMIBAAAAAAAAAAAA/P8BAACA//8AAAAYXgAAAAAAAAAAAMD/fwAAAPz/BwAAAOOBAQAAAAAAAAAA/P8/AACA/z8AAABgbtQBAAAAAAAAAOD//w8AAPD/AwAAAAQIeAAAAAAAAAAA/P//AQAA/z8AAACAA4APAQAAAAAAAID//w8AAPD/AwAAAAARsEAAAAAAAAAA+P9/AAAA/j8AAAAAAAAAAAAAAAAAAAD//wcAAPD/QwAAAACAIwAAAAAAAAAA8P9/AAAA/z8EAAAAAD8GIAAAAAAAAAD8/wMAAPD/cQAAAAD4ZwAAAAAAAAAAgP8/AAAA/w8HAAAAgP8HAAAAAAAAAAD4/wMAAOD/MAAAAAD//wEBAAAAAAAAgP8PAAAA/g8DAAAA+P8fAAAAAAAAAAD4PwAAAOB/EAAAAID//wMAAAAAAAAAgP8DAAAA/AMAAAAA+P9/AAAAAAAAAAD8HwAAAMA/AAAAAID//wcAAAAAAAAAwP8BAAAA+AEAAAAA8P9/AAAAAAAAAAD8DwAAAIAPAAAAAAAP/gMAAAAAAAAAwB8AAAAAAAAAAAAAEIAfAAEAAAAAAAD+AwAAAAAAAAAAAAAA8AEgAAAAAAAA4AcAAAAAAAAAAAAAAAAAAAYAAAAAAABeAAAAAAAAAAAAAAAAwAAwAAAAAAAAwAMAAAAAAAAAAAAAAAAIgAEAAAAAAAAeAAAAAAAAAAAAAAAAAAAMAAAAAAAA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAABAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAB4AEDwn/8HAAAAAAAAAAAwAAAAAACA/P/h/////w8AAAAAAAAAwAcAAAD4////z///////PwAAAAAAHALwAACA//////////////8HAADw/y///wMAAP7/////////////HwAA+P///38AAID///////////////8AAPL/////BwAO////////////////DwAA8P////8HEPD//////////////z8AAOD/////////////////////////HwDgPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'), o = new Uint8Array(180 * 90); for (let i = 0; i < o.length; i++) o[i] = (b.charCodeAt(i >> 3) >> (i & 7)) & 1; return o; })();
  const landAt = (lat, lon) => { const fx = ((lon + 180) / 2 - 0.5 + 180) % 180, fy = Math.max(0, Math.min(89, (90 - lat) / 2 - 0.5)), i = Math.floor(fx), j = Math.floor(fy), u = fx - i, w = fy - j;
    const L = (x, y) => LAND[Math.min(89, y) * 180 + (x % 180)]; return (L(i, j) * (1 - u) + L(i + 1, j) * u) * (1 - w) + (L(i, j + 1) * (1 - u) + L(i + 1, j + 1) * u) * w; };
  const height = (x, y, z) => Math.sin(2.3 * x + 1.1 * y + 0.7) * 0.55 + Math.sin(3.7 * z - 2.1 * x + 1.9) * 0.35 + Math.sin(5.3 * y + 3.1 * z - 0.4) * 0.22 + Math.sin(8.9 * x - 6.1 * z + 2.2) * 0.1
    + Math.sin(19 * x + 14 * y - 11 * z) * 0.06 + Math.sin(37 * z - 29 * y + 23 * x) * 0.04;   // texture: deserts, and the fine coastline
  const LON0 = 12 * Math.PI / 180;   // it starts facing Italy (Ciao)
  const TILT = 0.38, ct = Math.cos(TILT), st = Math.sin(TILT);
  // apo (0..1): Earth dissolves into Pyrokos, Darkon's world: scorched grey rock, fire pits and burning channels, a red glow
  const planet = (cx, cy, r, spin, apo = 0) => {
    const hal = r * 1.2, ca = Math.cos(spin), sa = Math.sin(spin);
    const i0 = Math.max(0, Math.floor((cx - hal) / S)), i1 = Math.min(cols - 1, Math.ceil((cx + hal) / S)), j0 = Math.max(0, Math.floor((cy - hal) / S)), j1 = Math.min(rows - 1, Math.ceil((cy + hal) / S));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = (i * S + 2.5 - cx) / r, yu = -(j * S + 2.5 - cy) / r, d2 = dx * dx + yu * yu, k = j * cols + i;
      const pos = (1 - yu) / 2 + 0.05 * Math.sin(dx * 11 + yu * 3) + 0.03 * Math.sin(dx * 23 - yu * 17), front = apo * 1.3 - 0.15;   // a burning front rolls down from his feet
      const ap = apo >= 1 || (apo > 0 && pos < front), edge = apo > 0 && apo < 1 && Math.abs(pos - front) < 0.045;
      if (d2 > 1) { const d = Math.sqrt(d2); if (d < 1.2) { const e = 1 - (d - 1) / 0.2; put(k, 0.05 + 0.32 * e * e, 1, ap ? 3 : 1); } continue; }   // atmosphere, like the sun's halo (red over Pyrokos)
      const dz = Math.sqrt(1 - d2), [lam, spec] = shade(dx, yu, dz);
      const y1 = yu * ct - dz * st, z1 = yu * st + dz * ct, x2 = dx * ca + z1 * sa, z2 = -dx * sa + z1 * ca, h = height(x2, y1, z2);
      const lat = Math.asin(Math.max(-1, Math.min(1, y1))) * 57.2958, lon = (Math.atan2(x2, z2) + LON0) * 57.2958;
      const land = landAt(lat, ((lon % 360) + 540) % 360 - 180) + Math.sin(23 * x2 - 17 * y1 + 13 * z2) * 0.08 + Math.sin(41 * z2 + 31 * x2 - 19 * y1) * 0.05 > 0.5;
      let val, rad, col;
      if ((land && lat < -62) || (!land && lat > 79)) { val = 0.2 + 0.8 * lam; rad = 1 + 1.2 * lam; col = 0; }                                // ice: Antarctica, Arctic sea ice
      else if (land) { val = 0.16 + 0.76 * lam + 0.2 * spec; rad = 1 + 1.2 * lam; col = Math.abs(lat - 8) < 26 && h > 0.15 ? 1 : 0; }    // land; orange in the warm, dry belt
      else { val = 0.12 + 0.4 * lam + 0.35 * spec; rad = 0.8 + 0.7 * lam + 0.6 * spec; col = 2; }                    // sea, with the sun's glint
      if (dz < 0.22) { const e = 1 - dz / 0.22; val = Math.max(val, 0.3 * e); if (e > 0.5) col = 1; }             // lit rim
      if (ap) { const fire = height(x2 * 1.7, y1 * 1.7, z2 * 1.7), ch = Math.abs(Math.sin(9 * x2 + 6 * z2 - 4 * y1) + Math.sin(7 * y1 - 5 * x2)) < 0.12, fl = 0.8 + 0.2 * Math.sin(now_ / 90 + i * 0.7 + j * 1.3);
        if (fire > 0.62) { val = (0.55 + 0.45 * lam) * fl; rad = 1.4 + 0.8 * lam; col = fire > 0.8 ? 1 : 3; }                       // fire pits
        else if (ch) { val = (0.4 + 0.4 * lam) * fl; rad = 1.1 + 0.6 * lam; col = 1; }                                                 // burning channels
        else { val = 0.07 + 0.38 * lam + 0.08 * Math.sin(31 * x2 + 23 * y1 - 17 * z2); rad = 0.8 + 0.9 * lam; col = 0; }               // scorched rock
        if (dz < 0.22) { const e = 1 - dz / 0.22; val = Math.max(val, 0.3 * e); if (e > 0.5) col = 3; } }
      if (edge) { const e = 1 - Math.abs(pos - front) / 0.045; val = Math.max(val, 0.5 + 0.5 * e); rad = 1.4 + 0.8 * e; col = (i + j) % 3 ? 1 : 3; }   // the front itself glows
      v[k] = val; rr[k] = rad; c[k] = col; }
  };
  // ---- 3D solids: every object (person, astronauts, ships) is capsules and spheres (a sphere = a capsule of length 0) ----
  // raster(): capsules already in screen space (y down, z toward the viewer); each grid dot takes the front-most surface, lit like the planet.
  // A part with glow > 0 shines on its own (engine flames, saucer lights). Returns the outline [x0, y0, x1, y1].
  const raster = (seg) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const s of seg) { x0 = Math.min(x0, s.a[0] - s.r, s.b[0] - s.r); x1 = Math.max(x1, s.a[0] + s.r, s.b[0] + s.r); y0 = Math.min(y0, s.a[1] - s.r, s.b[1] - s.r); y1 = Math.max(y1, s.a[1] + s.r, s.b[1] + s.r); }
    const i0 = Math.max(0, Math.floor(x0 / S)), i1 = Math.min(cols - 1, Math.ceil(x1 / S)), j0 = Math.max(0, Math.floor(y0 / S)), j1 = Math.min(rows - 1, Math.ceil(y1 / S));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const px = i * S + 2.5, py = j * S + 2.5; let best = -1e9, n = null, hit = null;
      for (const s of seg) { const ex = s.b[0] - s.a[0], ey = s.b[1] - s.a[1], ez = s.b[2] - s.a[2], l2 = ex * ex + ey * ey;
        const u = l2 ? Math.max(0, Math.min(1, ((px - s.a[0]) * ex + (py - s.a[1]) * ey) / l2)) : 0;
        const dx = px - (s.a[0] + u * ex), dy = py - (s.a[1] + u * ey), d2 = dx * dx + dy * dy; if (d2 >= s.r * s.r) continue;
        const dz = Math.sqrt(s.r * s.r - d2), z = s.a[2] + u * ez + dz;   // the front surface of the capsule here
        if (z > best) { best = z; n = [dx / s.r, -dy / s.r, dz / s.r]; hit = s; } }
      if (!n) continue;
      const k = j * cols + i;
      if (hit.glow) { v[k] = hit.glow; rr[k] = 2; c[k] = hit.col; continue; }
      const [lam, spec] = shade(...n);
      v[k] = (0.22 + 0.72 * lam + 0.3 * spec) * (hit.dim || 1); rr[k] = 1.1 + 1.1 * lam; c[k] = hit.col; }
    return [x0, y0, x1, y1];
  };
  // place(): a model in its own space (y up, z toward the viewer, about 1 unit tall/long) at (px, py), h px per unit:
  // turned about its x axis (pitch), then its y axis (yaw), then tipped in the screen plane (roll). Parts: [ax, ay, az, bx, by, bz, radius, colour, glow?]
  const place = (P, px, py, h, yaw, pitch, roll, minR) => {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const tr = (x, y, z) => { const Y = y * cp - z * sp, Z1 = y * sp + z * cp, X = x * cyw + Z1 * syw, Z = -x * syw + Z1 * cyw; return [px + (X * cr - Y * sr) * h, py - (X * sr + Y * cr) * h, Z * h]; };
    return { tr, box: raster(P.map((p) => ({ a: tr(p[0], p[1], p[2]), b: tr(p[3], p[4], p[5]), r: Math.max(minR, p[6] * h), col: p[7], glow: p[8] || 0, dim: p[9] || 0 }))) };
  };
  const lerp = (a, b, u) => a + (b - a) * u, sm = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

  // the person: head, body, two-part legs (knees bend), arms; faces +z. mode: 'wave' (hello), 'mj' (the Michael Jackson routine while
  // waiting, with a fedora), 'spin' (arms up, legs running), 'float' (astronaut)
  const leg = (sx, knee, foot) => [[sx, .4, 0, ...knee, .075, 0], [...knee, ...foot, .07, 0]];
  const straight = (sx, z = 0) => leg(sx, [sx * 1.2, .22, z / 2], [sx * 1.5, .04, z]);
  const HAT = [[0, .98, 0, 0, 1.1, 0, .12, 0], ...Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * TAU, b = ((i + 1) / 10) * TAU; return [Math.cos(a) * .2, .97, Math.sin(a) * .2, Math.cos(b) * .2, .97, Math.sin(b) * .2, .03, 0]; })];
  // after one loop of the routine (about 9 s in) he turns into Darkon (our own villain): craggy grey stone head and arms, heavy
  // brow, glowing red eyes (his beams come from them), dark blue armoured tunic, belt, gloves and boots; a huge, still stance
  const DARK = (t, spin, aim) => { const f = spin ? Math.sin(t * 26) * .12 : 0, B = .55, G = .7;   // B, G: how dark the blue suit and the grey stone are
    const arm = (sd) => spin ? [[sd * .2, .7, 0, sd * .34, .98, sd * f, .085, 0, 0, G], [sd * .34, .98, sd * f, sd * .34, .98, sd * f, .08, 2, 0, B]]
      : [[sd * .2, .7, 0, sd * .3, .5, .02, .085, 0, 0, G], [sd * .3, .5, .02, sd * .27, .34, .06, .08, 0, 0, G], [sd * .27, .34, .06, sd * .27, .34, .06, .085, 2, 0, B]];
    const eye = aim ? 1 : 0.75 + 0.2 * Math.sin(t * 5);
    return [[0, .87, 0, 0, .87, 0, .17, 0, 0, G], [0, .79, .06, 0, .79, .06, .12, 0, 0, G], [-.1, .94, .12, .1, .94, .12, .05, 0, 0, G],
      [-.055, .89, .155, -.055, .89, .155, .032, 3, eye], [.055, .89, .155, .055, .89, .155, .032, 3, eye],
      [-.14, .74, 0, .14, .74, 0, .085, 2, 0, B], [0, .4, 0, 0, .68, 0, .17, 2, 0, B], [-.15, .42, .02, .15, .42, .02, .055, 0, 0, .9],
      [-.2, .7, 0, -.2, .7, 0, .11, 2, 0, B], [.2, .7, 0, .2, .7, 0, .11, 2, 0, B], ...arm(-1), ...arm(1),
      [-.08, .4, 0, -.15, .2, 0, .1, 2, 0, B * .8], [-.15, .2, 0, -.17, .04, 0, .09, 2, 0, B * .8], [.08, .4, 0, .15, .2, 0, .1, 2, 0, B * .8], [.15, .2, 0, .17, .04, 0, .09, 2, 0, B * .8],
      [-.17, .04, 0, -.17, .04, .06, .085, 2, 0, B], [.17, .04, 0, .17, .04, .06, .085, 2, 0, B]]; };
  const body = (mode, t, m, headCol) => {
    if (mode === 'dark' || mode === 'darkSpin') { const P = DARK(t, mode === 'darkSpin', m && m.aim), k = m && m.k !== undefined ? m.k : 1;
      if (k >= 1) return P;
      // the morph: he swells into Darkon while the stone and armour sweep up from his feet to his head; the fedora floats away
      const g_ = 0.62 + 0.38 * sm(k), out = P.map((q, n) => { const reached = (q[1] + q[4]) / 2 < k * 1.25 - 0.05, o = [...q]; o[6] = q[6] * g_;
        if (!reached) { o[7] = n === 0 || q[8] ? 1 : 0; o[8] = 0; o[9] = 0; } return o; });
      if (k < 0.6) HAT.forEach((q) => out.push([q[0], q[1] + k * 0.9, q[2], q[3], q[4] + k * 0.9, q[5], q[6] * (1 - k / 0.6), 0]));
      return out; }
    const hd = [0, .86, 0, 0, .86, 0, .15, headCol], torso = (lx = 0, lz = 0) => [lx, .42, 0, 0, .66, lz, .12, 0];
    if (mode === 'spin') { const run = Math.sin(t * 22), f = Math.sin(t * 26);
      return [hd, torso(), ...straight(-.06, run * .16), ...straight(.06, -run * .16), [-.11, .64, 0, -.3, .98, f * .14, .06, 0], [.11, .64, 0, .3, .98, -f * .14, .06, 0]]; }
    if (mode === 'float') { const f = Math.sin(t * 2) * .06;
      return [hd, [0, .42, 0, 0, .66, 0, .13, 0], ...leg(-.07, [-.13, .22, .05], [-.2, .06, .02]), ...leg(.07, [.13, .22, -.05], [.2, .08, -.02]), [-.11, .64, 0, -.33, .66 + f, 0, .065, 0], [.11, .64, 0, .33, .66 - f, 0, .065, 0]]; }
    if (mode === 'mj') {
      if (m.move === 'moon') {   // moonwalk: one leg straight and sliding back flat, the other bent with the heel up; they swap every half step
        const p = (t * 1.5) % 1, half = p < 0.5, u = (p % 0.5) * 2, slide = (sx) => straight(sx, lerp(.1, -.16, u)), toe = (sx) => leg(sx, [sx, .25, .11], [sx, .07, -.03]);
        const sw = Math.sin(t * 1.5 * TAU) * .1;
        return [hd, ...HAT, torso(0, .03), ...(half ? [...slide(-.05), ...toe(.05)] : [...toe(-.05), ...slide(.05)]), [-.11, .64, 0, -.15, .44, sw, .06, 0], [.11, .64, 0, .15, .44, -sw, .06, 0]]; }
      if (m.move === 'toe') {    // the toe stand: up on the toes, knees together and forward, one arm pointing up, the other hand on the hat
        return [hd, ...HAT, torso(), ...leg(-.04, [-.02, .26, .12], [-.03, .09, .02]), ...leg(.04, [.02, .26, .12], [.03, .09, .02]), [.11, .66, 0, .2, 1.12, .05, .06, 0], [-.11, .64, 0, -.12, .98, .14, .06, 0]]; }
      if (m.move === 'lean') {   // the lean: straight as a board, the whole body tips forward (roll is set by the caller)
        return [hd, ...HAT, torso(), ...straight(-.04), ...straight(.04), [-.11, .64, 0, -.13, .4, .04, .06, 0], [.11, .64, 0, .13, .4, .04, .06, 0]]; }
      // spin: arms out, feet together
      return [hd, ...HAT, torso(), ...straight(-.03), ...straight(.03), [-.11, .64, 0, -.34, .74, 0, .06, 0], [.11, .64, 0, .2, .5, .12, .06, 0]]; }
    const wave = Math.sin(t * 6);
    return [hd, torso(), ...straight(-.06), ...straight(.06), [-.11, .64, 0, -.2, .4, .06, .06, 0], [.11, .64, 0, .24 + .05 * wave, .98, .12 * wave, .06, 0]];
  };
  const person = (fx, fy, h, yaw, roll, t, mode, m, headCol = 1, minR = 4.6) => {
    const o = place(body(mode, t, m, headCol), fx, fy, h, yaw, 0, roll, minR);
    return { head: o.tr(0, .85, 0), box: o.box };   // the head (for the bubble) and the outline (for the click target)
  };
  // the routine: moonwalk left, spin, toe stand ("Hee-hee!"), moonwalk back to the top, the lean; then he turns into Darkon.
  // th = where on the planet's top the feet are (radians from the top); moonwalking always slides backwards.
  const SEQ = [['moon', 1.5, 0, -0.25], ['spin', 0.6], ['toe', 1.0], ['moon', 1.5, -0.25, 0], ['lean', 1.0]];   // one quick loop (5.6 s), then Darkon (Noel: faster)
  const SEQ_T = SEQ.reduce((a, s) => a + s[1], 0);
  const mj = (t) => { let tt = t % SEQ_T, th = 0, face = 1;
    for (const s of SEQ) { if (s[0] === 'moon') face = s[3] > s[2] ? -1 : 1;   // moving right means facing left
      if (tt < s[1]) { const u = tt / s[1];
        if (s[0] === 'moon') return { move: 'moon', th: lerp(s[2], s[3], u), yaw: face * Math.PI / 2, lean: 0 };
        if (s[0] === 'spin') return { move: 'spin', th, yaw: face * Math.PI / 2 + sm(u) * TAU, lean: 0 };
        if (s[0] === 'lean') return { move: 'lean', th, yaw: face * Math.PI / 2, lean: -face * 0.55 * Math.sin(Math.PI * sm(u)) };
        return { move: 'toe', th, yaw: 0.25, lean: 0 }; }
      tt -= s[1]; if (s[0] === 'moon') th = s[3]; }
    return { move: 'toe', th: 0, yaw: 0, lean: 0 }; };
  const MJ_END = mj(SEQ_T - 1e-3).yaw;   // where he's facing when the dance ends, so the morph turns him smoothly from there

  // ---- the rest of space: shooting stars, a black hole, planets, 3D ships and astronauts that come in from every side ----
  const rot = (x, y) => { const dx = x - CX, dy = y - CY, ca = Math.cos(sky), sa = Math.sin(sky); return [CX + dx * ca - dy * sa, CY + dx * sa + dy * ca]; };   // everything turns with the vertigo
  const area = (x, y, rad, fn) => { const i0 = Math.max(0, Math.floor((x - rad) / S)), i1 = Math.min(cols - 1, Math.ceil((x + rad) / S)), j0 = Math.max(0, Math.floor((y - rad) / S)), j1 = Math.min(rows - 1, Math.ceil((y + rad) / S));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * cols + i, i * S + 2.5 - x, j * S + 2.5 - y); };
  const dot = (x, y, val, r, col) => { const i = Math.round((x - 2.5) / S), j = Math.round((y - 2.5) / S); if (i >= 0 && j >= 0 && i < cols && j < rows) put(j * cols + i, val, r, col); };
  const ball = (x, y, r, col, col2, t) => area(x, y, r, (k, dx, dy) => { const d2 = (dx * dx + dy * dy) / (r * r); if (d2 > 1) return;   // a lit sphere with drifting bands
    const nx = dx / r, ny = -dy / r, [lam] = shade(nx, ny, Math.sqrt(1 - d2)); v[k] = 0.12 + 0.78 * lam; rr[k] = 0.9 + 1.1 * lam; c[k] = Math.sin(ny * 7 + Math.sin(nx * 2 + t) * 0.6) > 0.35 ? col2 : col; });
  const ring = (x, y, r, front, tilt = 0.31) => area(x, y, r * 2.2, (k, dx, dy) => { const ct_ = Math.cos(tilt), st_ = Math.sin(tilt), xr = dx * ct_ + dy * st_, yr = -dx * st_ + dy * ct_, e = Math.hypot(xr, yr / 0.3);
    if (e > r * 1.4 && e < r * 2.15 && (yr > 0) === front) put(k, 0.5 - 0.25 * Math.abs(e / r - 1.75), 1.2, 0); });
  const hole = (x, y, rb, t) => area(x, y, rb * 2.8, (k, dx, dy) => {   // the void (even the grid goes), a bright photon ring, a turning orange disk in front of and behind it
    const d = Math.hypot(dx, dy), xr = dx * 0.92 + dy * 0.39, yr = -dx * 0.39 + dy * 0.92, e = Math.hypot(xr, yr / 0.3), disk = e > rb * 1.25 && e < rb * 2.7;
    if (d < rb && !(disk && yr > 0)) { v[k] = 0; rr[k] = 0; return; }
    if (d >= rb && d < rb + S) put(k, 0.85, 1.5, 1); else if (d >= rb && d < rb * 1.7) put(k, 0.3 * (1 - (d - rb) / (0.7 * rb)), 1, 1);
    if (disk) { const q = 1 - (e - rb * 1.25) / (rb * 1.45); put(k, (0.25 + 0.6 * q) * (0.6 + 0.4 * Math.sin(Math.atan2(yr / 0.3, xr) * 3 - t * 2.5)), 0.9 + 1.2 * q, q > 0.55 ? 1 : 0); } });
  // ship models (about 1 unit long, nose along +x for the rocket)
  const ROCKET = [[-.45, 0, 0, .3, 0, 0, .17, 0], [.3, 0, 0, .55, 0, 0, .1, 1], [.12, 0, .15, .12, 0, .15, .07, 2],
    ...[[0, .3], [0, -.3], [.3, 0], [-.3, 0]].map(([y, z]) => [-.38, 0, 0, -.6, y, z, .05, 1])];
  const UFO = (t) => [[0, .13, 0, 0, .13, 0, .22, 2], [0, -.05, 0, 0, -.05, 0, .27, 0],
    ...Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * TAU, b = ((i + 1) / 12) * TAU; return [Math.cos(a) * .45, 0, Math.sin(a) * .45, Math.cos(b) * .45, 0, Math.sin(b) * .45, .1, 0]; }),
    ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return [Math.cos(a) * .47, -.03, Math.sin(a) * .47, Math.cos(a) * .47, -.03, Math.sin(a) * .47, .05, i % 2 ? 1 : 2, (i + Math.floor(t * 6)) % 2 ? 1 : 0.35]; })];
  const SAT = [[0, -.16, 0, 0, .16, 0, .14, 0], [0, .16, 0, 0, .36, 0, .02, 1], [0, .38, 0, 0, .38, 0, .04, 1, 0.9],
    ...[-1, 1].flatMap((sd) => [-.09, 0, .09].map((z) => [sd * .2, 0, z, sd * .72, 0, z, .045, 2])), [-.2, 0, 0, .2, 0, 0, .025, 0]];
  // in from a random side (top, right, bottom or left), aimed across the screen
  const enter = (speed, m) => { const e = (Math.random() * 4) | 0, x = e === 1 ? W + m : e === 3 ? -m : R(0, W), y = e === 0 ? -m : e === 2 ? H + m : R(0, H);
    const tx = R(0.2, 0.8) * W, ty = R(0.2, 0.8) * H, n = Math.hypot(tx - x, ty - y); return { x, y, vx: ((tx - x) / n) * speed, vy: ((ty - y) / n) * speed, t: 0, r0: R(0, TAU), dir: Math.random() < 0.5 ? -1 : 1 }; };
  const away = (o, m) => o.x < -m - 20 || o.x > W + m + 20 || o.y < -m - 20 || o.y > H + m + 20;
  // a fighter for the space war: nose along +x, swept wings, tail fin, cockpit, engine glow; orange squadron vs blue squadron
  const FIGHTER = (col) => [[-.4, 0, 0, .32, 0, 0, .1, 0], [.32, 0, 0, .5, 0, 0, .05, col], [.1, .08, 0, .1, .08, 0, .075, col === 1 ? 2 : 1],
    [-.02, 0, 0, -.34, 0, .46, .045, col], [-.02, 0, 0, -.34, 0, -.46, .045, col], [-.28, 0, 0, -.42, .22, 0, .04, col], [-.46, 0, 0, -.46, 0, 0, .07, col, 0.95]];
  // planets (fractions of the screen; they can be dragged and flung, then they drift to a stop and bounce off the edges)
  const PL = [{ x: -.02, y: .44, r: [30, .1], c: 0, c2: 2, sp: .2 }, { x: .84, y: .2, r: [10, .032], c: 0, c2: 1, sp: .6, ring: .31, moon: 1 },
    { x: .3, y: .86, r: [8, .02], c: 2, c2: 0, sp: .5, ring: -.4 }, { x: .64, y: .12, r: [8, .022], c: 1, c2: 0, sp: .8 },
    { x: .09, y: .7, r: [8, .024], c: 2, c2: 0, sp: .4 }, { x: .92, y: .62, r: [5, .014], c: 1, c2: 0, sp: 1 }, { x: .74, y: .9, r: [4, .01], c: 0, c2: 2, sp: 1 },
    { x: .15, y: .25, r: [10, .03], hole: 1 }].map((p) => ({ ...p, x0: p.x, y0: p.y, vx: 0, vy: 0, dead: 0 }));
  const unrot = (x, y) => { const dx = x - CX, dy = y - CY, ca = Math.cos(-sky), sa = Math.sin(-sky); return [CX + dx * ca - dy * sa, CY + dx * sa + dy * ca]; };
  const shooting = [], ships = [], nauts = [], jets = [], bolts = [], booms = [];
  let nShoot = 900, nShip = 2000, nNaut = 1400, nJet = 600, kind = 0, grabs = [], held = null;
  const boom = (x, y, n = 28, hot = 1) => { for (let q = 0; q < n; q++) { const a = R(0, TAU), sp = R(40, 240); booms.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: R(0.45, 0.95), c: q % 3 ? hot : 0 }); }
    booms.push({ x, y, flash: 1, age: 0, life: 0.3 }); };
  const space = (ms, dt, er, ecy) => {
    const u = Math.min(W, H), tn = ms / 1000; grabs = [];
    // planets and the black hole
    for (const p of PL) { const rad = Math.max(p.r[0], u * p.r[1]);
      if (p.dead) { if (ms - p.dead < 8000) continue; Object.assign(p, { dead: 0, x: p.x0, y: p.y0, vx: 0, vy: 0 }); }   // blown up: back in its place after 8 s
      if (held && held.o === p) { p.vx = p.vy = 0; } else { p.x += (p.vx * dt) / W; p.y += (p.vy * dt) / H; const f = Math.exp(-dt * 1.2); p.vx *= f; p.vy *= f;
        if (p.x < -0.05 || p.x > 1.05) { p.vx = -p.vx * 0.6; p.x = Math.max(-0.05, Math.min(1.05, p.x)); } if (p.y < -0.05 || p.y > 1.05) { p.vy = -p.vy * 0.6; p.y = Math.max(-0.05, Math.min(1.05, p.y)); } }
      const [x, y] = rot(p.x * W, p.y * H);
      if (phase !== 'idle' && Math.hypot(x - CX, y - ecy) < er + rad * 0.5) { boom(x, y, p.hole ? 30 : 70); if (!p.hole) boom(x, y, 30, 3); p.dead = ms; destroyed++; continue; }   // the growing planet swallows it: boom
      if (p.hole) hole(x, y, rad, tn);
      else { if (p.ring) ring(x, y, rad, false, p.ring); ball(x, y, rad, p.c, p.c2, tn * p.sp); if (p.ring) ring(x, y, rad, true, p.ring);
        if (p.moon) { const mo = tn * 0.9; ball(x + Math.cos(mo) * rad * 2.6, y + Math.sin(mo) * rad * 0.8, Math.max(3, rad * 0.22), 0, 0, 0); } }
      grabs.push({ o: p, kind: 'pl', x, y, rad: rad * (p.hole ? 1.6 : 1.15) + 6 }); }
  };
  // the front layer, drawn over Earth: nothing passes behind it. Moving things steer around it; anything that still touches it crashes.
  const spaceFront = (ms, dt, er, ecy) => {
    const u = Math.min(W, H), live = phase === 'idle', grow = !live, nowT = performance.now();   // grow: after the click, everything the planet touches explodes
    const avoid = (o, size) => {   // true = it hit Earth. Otherwise, inside the safety zone it turns along the surface (and a little outward)
      if (grow) return Math.hypot(o.x - CX, o.y - ecy) < er + size * 0.3;
      if (held && held.o === o) return false;
      const dx = o.x - CX, dy = o.y - ecy, d = Math.hypot(dx, dy), hit = er + size * 0.35, zone = er + size + 60;
      if (d < hit) return true; if (d > zone || o.thrown > nowT) return false;
      const sp = Math.hypot(o.vx, o.vy) || 1, nx = dx / d, ny = dy / d; let tx = -ny, ty = nx; if (tx * o.vx + ty * o.vy < 0) { tx = -tx; ty = -ty; }
      if (o.vx * nx + o.vy * ny > 0 && d > hit + size) return false;   // already heading away
      const w = Math.min(1, dt * 9 * (1 - (d - hit) / (zone - hit))), ux = lerp(o.vx / sp, tx + nx * 0.45, w), uy = lerp(o.vy / sp, ty + ny * 0.45, w), un = Math.hypot(ux, uy) || 1;
      o.vx = (ux / un) * sp; o.vy = (uy / un) * sp; return false; };
    const crash = (o, L, size) => { boom(o.x, o.y, 40); destroyed++; const i = L.indexOf(o); if (i >= 0) L.splice(i, 1); if (held && held.o === o) held = null; };
    // shooting stars, any direction: a bright head and a fading tail (they burn up if they reach Earth)
    if (ms > nShoot) { nShoot = ms + R(700, 2200); const a = R(0, TAU), sp = R(520, 820); shooting.push({ x: R(0.05, 0.95) * W, y: R(0.05, 0.95) * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: R(0.55, 0.85), c: (Math.random() * 3) | 0 }); }
    for (let i = shooting.length - 1; i >= 0; i--) { const s = shooting[i]; s.age += dt; if (s.age > s.life) { shooting.splice(i, 1); continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; const f = 1 - s.age / s.life, n = Math.hypot(s.vx, s.vy);
      if (Math.hypot(s.x - CX, s.y - ecy) < er) { boom(s.x, s.y, 8); shooting.splice(i, 1); continue; }
      for (let k = 0; k < 16; k++) dot(s.x - (s.vx / n) * k * S, s.y - (s.vy / n) * k * S, f * (1 - k / 16), 2 - k * 0.07, k < 2 ? 0 : s.c); }
    const move = (o) => { if (held && held.o === o) return; o.x += o.vx * dt; o.y += o.vy * dt; };
    // 3D ships take turns from every side: a rocket (rolls about its length, flame behind), a flying saucer (spins, lights blink), a satellite (tumbles)
    if (ms > nShip) { nShip = ms + R(3500, 6500); const k = kind++ % 3; ships.push({ k, ...enter([R(150, 210), R(100, 140), R(50, 80)][k], 60) }); }
    for (let i = ships.length - 1; i >= 0; i--) { const sh = ships[i]; sh.t += dt; move(sh); if (away(sh, 60) && !(held && held.o === sh)) { ships.splice(i, 1); continue; }
      const sz = Math.max(40, Math.min(70, u * 0.075)); if (avoid(sh, sz * 0.6)) { crash(sh, ships); continue; }
      if (sh.k === 0) { const n = Math.hypot(sh.vx, sh.vy) || 1, head = Math.atan2(-sh.vy, sh.vx);
        if (n > 20) for (let q = 1; q < 11; q++) dot(sh.x - (sh.vx / n) * (sz * 0.6 + q * S) + R(-2, 2), sh.y - (sh.vy / n) * (sz * 0.6 + q * S) + R(-2, 2), (1 - q / 11) * R(0.5, 1), 1.9 - q * 0.1, q < 4 ? 1 : 0);
        place(ROCKET, sh.x, sh.y, sz, 0.35, sh.t * 2.2, head, 2.6); }
      else if (sh.k === 1) place(UFO(sh.t), sh.x, sh.y, sz, sh.t * 1.6, 0.38, Math.sin(sh.t * 2) * 0.12, 2.6);
      else place(SAT, sh.x, sh.y, sz, sh.t * 0.7, 0.5 + Math.sin(sh.t * 0.5) * 0.3, sh.r0 + sh.t * 0.25 * sh.dir, 2.4);
      grabs.push({ o: sh, kind: 'ship', x: sh.x, y: sh.y, rad: sz * 0.6 }); }
    // floating astronauts drift in from any side, slowly tumbling (blue visor)
    if (ms > nNaut) { nNaut = ms + R(5000, 8500); nauts.push(enter(R(45, 75), 60)); }
    for (let i = nauts.length - 1; i >= 0; i--) { const a = nauts[i]; a.t += dt; move(a); if (away(a, 60) && !(held && held.o === a)) { nauts.splice(i, 1); continue; }
      const hh = Math.max(34, Math.min(56, u * 0.07)); if (avoid(a, hh * 0.6)) { crash(a, nauts); continue; } person(a.x, a.y, hh, a.t * 1.3, a.r0 + a.t * 0.7 * a.dir, a.t, 'float', null, 2, 3.2);
      grabs.push({ o: a, kind: 'naut', x: a.x, y: a.y - hh * 0.5, rad: hh * 0.7 }); }
    // the space war: orange and blue fighters fly in from every side, chase the nearest enemy, fire lasers when lined up; hits explode
    const jz = Math.max(30, Math.min(52, u * 0.055));
    if (ms > nJet && jets.length < 6) { nJet = ms + R(500, 1400); const team = jets.filter((j) => j.team === 1).length <= jets.filter((j) => j.team === 2).length ? 1 : 2; jets.push({ team, cd: R(0.4, 1), sp: R(150, 200), ...enter(175, 70) }); }
    for (let i = jets.length - 1; i >= 0; i--) { const f = jets[i]; f.t += dt;
      const isHeld = held && held.o === f; let tgt = null, best = 1e9;
      for (const e of jets) if (e.team !== f.team) { const d = Math.hypot(e.x - f.x, e.y - f.y); if (d < best) { best = d; tgt = e; } }
      let a = Math.atan2(f.vy, f.vx), sp = Math.hypot(f.vx, f.vy);
      if (!isHeld) { if (tgt && f.t > 0.8) { let want = Math.atan2(tgt.y - f.y, tgt.x - f.x) - a; want = Math.atan2(Math.sin(want), Math.cos(want)); a += Math.max(-1.7 * dt, Math.min(1.7 * dt, want)); }
        sp += (f.sp - sp) * Math.min(1, dt * 1.5); f.vx = Math.cos(a) * sp; f.vy = Math.sin(a) * sp; f.x += f.vx * dt; f.y += f.vy * dt; }
      if (!isHeld && f.t > 2 && away(f, 70)) { jets.splice(i, 1); continue; }
      if (avoid(f, jz * 0.6)) { crash(f, jets); continue; } a = Math.atan2(f.vy, f.vx);   // the fighters dodge Earth too
      f.cd -= dt;
      if (tgt && f.cd <= 0 && best < 480) { let off = Math.atan2(tgt.y - f.y, tgt.x - f.x) - a; off = Math.atan2(Math.sin(off), Math.cos(off));
        if (Math.abs(off) < 0.3) { f.cd = R(0.45, 1.1); bolts.push({ team: f.team, x: f.x + Math.cos(a) * jz * 0.55, y: f.y + Math.sin(a) * jz * 0.55, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, age: 0 }); } }
      place(FIGHTER(f.team), f.x, f.y, jz, 0.3, Math.sin(f.t * 2.4) * 0.6, -a, 2.4);   // banks as it turns
      grabs.push({ o: f, kind: 'jet', x: f.x, y: f.y, rad: jz * 0.6 }); }
    for (let i = bolts.length - 1; i >= 0; i--) { const b = bolts[i]; b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.age > 1.1 || away(b, 0)) { bolts.splice(i, 1); continue; }
      if (Math.hypot(b.x - CX, b.y - ecy) < er) { boom(b.x, b.y, 6); bolts.splice(i, 1); continue; }   // lasers spark on Earth's surface
      const hit = jets.findIndex((e) => e.team !== b.team && Math.hypot(e.x - b.x, e.y - b.y) < jz * 0.45);
      if (hit >= 0) { const e = jets[hit]; boom(e.x, e.y); score[b.team]++; destroyed++; if (held && held.o === e) held = null; jets.splice(hit, 1); bolts.splice(i, 1); continue; }
      const n = Math.hypot(b.vx, b.vy); for (let q = 0; q < 5; q++) dot(b.x - (b.vx / n) * q * S, b.y - (b.vy / n) * q * S, 1 - q * 0.15, 2 - q * 0.2, b.team); }
    for (let i = booms.length - 1; i >= 0; i--) { const p = booms[i]; p.age += dt; if (p.age > p.life) { booms.splice(i, 1); continue; } const f = 1 - p.age / p.life;
      if (p.ring) { const rad = 14 + 320 * (1 - f * f), n = Math.ceil((rad * TAU) / (S * 1.6)); for (let q = 0; q < n; q++) { const a = (q / n) * TAU; dot(p.x + Math.cos(a) * rad, p.y + Math.sin(a) * rad, f * 0.8, 1 + f, q % 3 ? 3 : 1); } continue; }
      if (p.flash) { const rad = 8 + 40 * (1 - f); area(p.x, p.y, rad, (k, dx, dy) => { const d = Math.hypot(dx, dy); if (d < rad) put(k, f * (1 - d / rad), 2.2, 0); }); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; dot(p.x, p.y, f, 1 + f * 1.2, p.c); }
    // tossed things explode on whatever they hit (both go); the black hole swallows; thrown into Earth, they blow up on it
    const kill = (gr) => { gr.gone = 1; destroyed++; const o = gr.o; if (gr.kind === 'pl') o.dead = ms; else for (const L of [ships, nauts, jets]) { const i = L.indexOf(o); if (i >= 0) L.splice(i, 1); } if (held && held.o === o) held = null; };
    for (const a of grabs) { if (a.gone || !(a.o.thrown > nowT) || (held && held.o === a.o)) continue;
      if (!a.o.hole && Math.hypot(a.x - CX, a.y - ecy) < er + a.rad * 0.4) { boom(a.x, a.y, 45); kill(a); continue; }
      for (const b of grabs) { if (b === a || b.gone || Math.hypot(a.x - b.x, a.y - b.y) > (a.rad + b.rad) * 0.55) continue;
        if (a.o.hole || b.o.hole) { const v = a.o.hole ? b : a; boom(v.x, v.y, 12); kill(v); }
        else { boom((a.x + b.x) / 2, (a.y + b.y) / 2, 55); boom(a.x, a.y, 18); boom(b.x, b.y, 18); kill(a); kill(b); }
        break; } }
  };
  // drag: grab a planet, the black hole, a ship, a fighter or an astronaut and fling it (mouse or touch). Never starts the spin.
  const pick = (x, y) => { let hit = null, bd = 1e9; for (const gr of grabs) { const d = Math.hypot(gr.x - x, gr.y - y); if (d < gr.rad && d < bd) { bd = d; hit = gr; } } return hit; };
  const onEarth = (x, y) => Math.hypot(x - CX, y - eCy) < eR;
  el.addEventListener('pointerdown', (e) => { if (phase !== 'idle' || e.target.closest('.boot-skip, .boot-go, .boot-sound')) return; const gr = pick(e.clientX, e.clientY);
    if (!gr && onEarth(e.clientX, e.clientY)) { held = { kind: 'earth', o: null, id: e.pointerId, x: e.clientX, hist: [[e.clientX, 0, performance.now()]] }; try { el.setPointerCapture(e.pointerId); } catch (x) {} return; }   // spin the planet by hand
    if (!gr) return;
    held = { o: gr.o, kind: gr.kind, dx: gr.x - e.clientX, dy: gr.y - e.clientY, id: e.pointerId, hist: [[e.clientX, e.clientY, performance.now()]] };
    try { el.setPointerCapture(e.pointerId); } catch (x) {} });
  el.addEventListener('pointermove', (e) => { if (!held || e.pointerId !== held.id) return;
    if (held.kind === 'earth') { spin -= (e.clientX - held.x) / eR; held.x = e.clientX; held.hist.push([e.clientX, 0, performance.now()]); if (held.hist.length > 6) held.hist.shift(); return; }   // the surface follows the finger
    const x = e.clientX + held.dx, y = e.clientY + held.dy;
    held.hist.push([e.clientX, e.clientY, performance.now()]); if (held.hist.length > 6) held.hist.shift();
    if (held.kind === 'pl') { const [bx, by] = unrot(x, y); held.o.x = bx / W; held.o.y = by / H; } else if (held.kind === 'naut') { held.o.x = x; held.o.y = y + Math.max(34, Math.min(56, Math.min(W, H) * 0.07)) * 0.5; } else { held.o.x = x; held.o.y = y; } });
  const drop = (e) => { if (!held || e.pointerId !== held.id) return; const h0 = held.hist[0], h1 = held.hist[held.hist.length - 1], tt = Math.max(16, h1[2] - h0[2]) / 1000;
    if (held.kind === 'earth') { w = Math.max(-14, Math.min(14, -((h1[0] - h0[0]) / tt) / eR)); held = null; return; }   // let go mid-swipe: it keeps spinning, then eases back
    let vx = (h1[0] - h0[0]) / tt, vy = (h1[1] - h0[1]) / tt; const n = Math.hypot(vx, vy); if (n > 1400) { vx *= 1400 / n; vy *= 1400 / n; }   // the fling
    const o = held.o; if (Math.hypot(vx, vy) > 60) o.thrown = performance.now() + 3000;   // for the next 3 s it explodes on whatever it hits
    if (held.kind === 'pl') { o.vx = vx; o.vy = vy; }
    else if (Math.hypot(vx, vy) > 40) { o.vx = vx; o.vy = vy; if (o.sp) o.sp = Math.max(o.sp, Math.min(320, Math.hypot(vx, vy))); }   // thrown: off it goes (fighters keep the speed, then fly on)
    held = null; };
  el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
  // the pointer: the grid lights up around it, a two-colour comet trail follows, and a reticle that locks on (orange) over the person
  let ptr = null, onSkip = false, lock = 0, gb = null; const trail = [];
  el.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; ptr = [e.clientX, e.clientY]; onSkip = !!e.target.closest('.boot-skip, .boot-sound'); trail.push([e.clientX, e.clientY, performance.now()]); if (trail.length > 28) trail.shift(); });
  el.addEventListener('pointerleave', () => (ptr = null));
  const pointerGlow = (now) => { if (!ptr || onSkip) return; const [px, py] = ptr;
    area(px, py, 90, (k, dx, dy) => { const d = Math.hypot(dx, dy); if (d < 90) put(k, 0.04 + 0.24 * (1 - d / 90) ** 2, 1 + 0.6 * (1 - d / 90), 0); });
    trail.forEach(([x, y, t], i) => { const age = now - t; if (age < 420) dot(x, y, 0.85 * (1 - age / 420), 2 - age / 420, i % 2 ? 1 : 2); }); };
  const MONO = getComputedStyle(el.querySelector('.boot-tl')).fontFamily;
  const reticle = (ms, dt) => { if (!ptr || onSkip || phase === 'out') return; const [x, y] = ptr, on = phase === 'idle' && gb && x > gb[0] && x < gb[2] && y > gb[1] && y < gb[3];
    lock += ((on ? 1 : 0) - lock) * Math.min(1, dt * 12);
    const s = 15 - 6 * lock, col = lock > 0.5 ? COL[1] : COL[0];
    g.save(); g.translate(x, y); g.rotate((1 - lock) * ms / 600); g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath();
    for (let q = 0; q < 4; q++) { g.rotate(Math.PI / 2); g.moveTo(s, s - 5); g.lineTo(s, s); g.lineTo(s - 5, s); }
    g.stroke(); g.restore(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill();
    g.font = `10px ${MONO}`; g.fillStyle = lock > 0.5 ? COL[1] : 'rgba(222, 216, 206, .6)';
    g.fillText(lock > 0.5 ? 'LOCKED ON' : held ? (held.kind === 'earth' ? 'SPINNING' : 'HOLDING · FLING IT') : pick(x, y) ? 'DRAG ME' : !on && phase === 'idle' && onEarth(x, y) ? 'DRAG TO SPIN' : `X ${String(Math.round(x)).padStart(4, '0')}  Y ${String(Math.round(y)).padStart(4, '0')}`, x + 20, y + 26); };

  // live Toronto time in the corner
  const clock = el.querySelector('.boot-clock');
  const tor = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  if (clock) clock.textContent = `Toronto ${tor()}`;
  // name decodes from random glyphs, left to right; typed boot log
  const nameEl = el.querySelector('.boot-name'), NAME = nameEl.dataset.name, GL = '01#*+=/<>[]{}NYG';
  // typed lines: a pretend system boot (Noel: no personal lines or project stats here). The cores and the display size are the visitor's own.
  const small = innerWidth < 600, cores = navigator.hardwareConcurrency || 4;
  const LOG = ['nyg-os 4.0 · cold boot', 'bios check ............ ok', ...(small ? [] : [`cpu · ${cores} cores ........... ok`]), `display · ${innerWidth}×${innerHeight} ...... ok`,
    ...(small ? [] : ['mounting /dev/space .... ok', 'loading star map ....... ok']), 'planet online .......... ok', 'waiting for input'];
  // the game score, bottom right: the space war, everything destroyed, and Darkon's beam hits once he's here (no tips: Noel wants people to explore)
  const score = { 1: 0, 2: 0 }; let destroyed = 0, beamHits = 0, liveEl = null;
  const say_ = (txt) => { const p = document.createElement('p'); p.textContent = txt; logEl.appendChild(p); };
  const scoreEl = el.querySelector('.boot-score');
  const fill = (box, L) => L.forEach((t, i) => { let p = box.children[i]; if (!p) { p = document.createElement('p'); box.appendChild(p); } if (p.textContent !== t) p.textContent = t; });
  const live = (ms) => { if (!liveEl) return;
    fill(scoreEl, [`space war · orange ${score[1]} – blue ${score[2]}`, `destroyed · ${destroyed}`, ...(tDark ? [`darkon’s beams · ${beamHits} hit${beamHits === 1 ? '' : 's'}`] : [])]); };
  const logEl = el.querySelector('.boot-log');

  const t0 = performance.now(); let behind = [];
  let eR = 1, eCy = 0, tDark = 0, ringDone = false, beam = null, nBeam = 0, now_ = 0, phase = 'idle', tSpin = 0, tOut = 0, last = t0, spin = 0, w = 0.35, sky = 0, shownLog = -1, raf = 0, Rend = 0, said = '';
  const cover = () => Math.hypot(W / 2, H / 2) * 1.06;   // radius that hides every corner
  const start = () => { if (phase !== 'idle') return; phase = 'spin'; tSpin = performance.now(); el.classList.add('spin');
    Rend = cover();
    say_('> wooooo'); };
  const end = (fast) => { if (phase === 'out') return; phase = 'out'; tOut = performance.now();   // Skip before the click: the planet just fades where it is
    behind.forEach((e) => (e.inert = false));
    el.style.setProperty('--fade', fast ? '.6s' : `${SLOW}ms`); el.classList.add('fade');
    root.classList.remove('boot');   // the page scrolls again and the hero cascades in while the planet fades
    window.nygSound && nygSound.mood('home');   // and the music turns warm and relaxing
    setTimeout(() => { cancelAnimationFrame(raf); const had = el.contains(document.activeElement); el.remove(); if (had) { const s = document.querySelector('.skip'); s && s.focus(); } }, (fast ? 600 : SLOW) + 80); };   // keyboard focus lands on 'Skip to content', not <body>

  // Darkon's eye beams: every few seconds two red beams leave his eyes and home in on a ship, fighter or astronaut like missiles,
  // zig-zagging (sharp turns either side of the target's direction, tightening as they close in); when one reaches it, it explodes
  const darkon = (ms, dt, head, hh) => {
    if (!beam && ms > nBeam) { nBeam = ms + R(2600, 4600); let best = null, bd = 1e9;
      for (const L of [ships, jets, nauts]) for (const o of L) { if (held && held.o === o) continue; if (o.x < 20 || o.x > W - 20 || o.y < 20 || o.y > H - 20) continue; const d = Math.hypot(o.x - head[0], o.y - head[1]); if (d < bd) { bd = d; best = o; } }
      if (best) beam = { o: best, t: 0, fade: 0, heads: [-1, 1].map((sd) => { const x = head[0] + sd * hh * 0.055, y = head[1] - hh * 0.04; return { x, y, a: Math.atan2(best.y - y, best.x - x), flip: sd, next: 0, pts: [[x, y]] }; }) }; }
    if (!beam) return;
    beam.t += dt; const o = beam.o, alive = ships.includes(o) || jets.includes(o) || nauts.includes(o);
    if (beam.fade) { beam.fade -= dt; if (beam.fade <= 0) { beam = null; return; } }
    else if (!alive || beam.t > 2.5) { beam = null; return; }
    else for (const hd of beam.heads) {
      const d = Math.hypot(o.x - hd.x, o.y - hd.y);
      if (beam.t > hd.next) { hd.next = beam.t + 0.075; hd.flip = -hd.flip; hd.a = Math.atan2(o.y - hd.y, o.x - hd.x) + hd.flip * 0.95 * Math.min(1, d / 260); hd.pts.push([hd.x, hd.y]); }   // a sharp turn: the zig-zag
      const step = Math.min(d, 980 * dt); hd.x += Math.cos(hd.a) * step; hd.y += Math.sin(hd.a) * step;
      if (d < 16) { boom(o.x, o.y, 50, 3); beamHits++; destroyed++; for (const L of [ships, jets, nauts]) { const i = L.indexOf(o); if (i >= 0) L.splice(i, 1); } hd.pts.push([o.x, o.y]); beam.fade = 0.3; break; } }
    const f = beam.fade ? beam.fade / 0.3 : 1;
    for (const hd of beam.heads) { const P = [...hd.pts, [hd.x, hd.y]];   // the beam: every corner of the zig-zag joined up, a red line with a white-hot flicker
      for (let q = 1; q < P.length; q++) { const [x0, y0] = P[q - 1], [x1, y1] = P[q], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (S * 0.8)));
        for (let z = 0; z <= n; z++) { const x = x0 + ((x1 - x0) * z) / n, y = y0 + ((y1 - y0) * z) / n; dot(x, y, f * R(0.75, 1), 2.1, (z + q) % 5 ? 3 : 0); dot(x + R(-S, S), y + R(-S, S), f * R(0.2, 0.4), 1.3, 3); } } }
  };
  const ease = (u) => u * u * (3 - 2 * u), back = (u) => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2;
  const tick = (now) => {
    try {   // a safety net: if a frame ever throws, the boot screen ends instead of trapping the visitor
    now_ = now; const ms = Math.max(0, now - t0), dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;   // (rAF can stamp a frame a hair before t0)
    // spin speed: gentle while waiting, whips up after the click, slows to a stop as the page fades in
    const target = phase === 'idle' ? 0.35 : phase === 'spin' ? 9 : 0;
    const hand = held && held.kind === 'earth';   // spun by hand: no motor while held; a flung spin eases back to the idle turn slowly
    if (!hand) { w += (target - w) * Math.min(1, dt * (phase === 'out' ? 1.6 : phase === 'idle' ? 0.7 : 2.6)); spin += w * dt; }
    sky += (phase === 'idle' ? 0.35 : w) * dt * 0.07;   // the sky only swirls with the real (clicked) spin, not a hand spin
    let r = Math.max(1, R0 * back(Math.min(1, ms / 750))), cy = CY;   // pops in (overshoots a little)
    if (tSpin) { const u = Math.min(1, (now - tSpin) / GROW), e = u ** 2.4;   // grows faster and faster
      r = R0 + (Rend - R0) * e; if (phase === 'out') r *= 1 + 0.12 * ease(Math.min(1, (now - tOut) / SLOW));
      if (phase === 'spin' && u >= 1) end(false); }
    v.fill(0.04); rr.fill(1); c.fill(0);   // the faint grid, as in the sunset block
    // the page's stars, turning around the middle as the world spins (vertigo)
    for (const s of stars) { if (s.gone) continue; const a = s.a + sky, d = s.d * Math.hypot(W, H) * 0.55, sx = CX + Math.cos(a) * d, sy = CY + Math.sin(a) * d, x = Math.round(sx / S), y = Math.round(sy / S);
      if (phase !== 'idle' && Math.hypot(sx - CX, sy - cy) < r) { s.gone = 1; boom(sx, sy, 5, s.c || 1); continue; }   // the growing planet: even the stars spark out
      if (x >= 0 && y >= 0 && x < cols && y < rows) put(y * cols + x, 0.3 + 0.3 * Math.sin(ms / 500 + s.t), 1.3, s.c); }
    space(ms, dt, r, cy);
    eR = r; eCy = cy;
    planet(CX, cy, r, spin, tDark ? sm((ms - tDark - 150) / 1800) : 0);   // Pyrokos rolls in over 1.8 s
    spaceFront(ms, dt, r, cy);   // ships, fighters, astronauts, lasers, shooting stars and explosions: always in front of the planet
    // the person drops onto the top at 0.55 s, then stands (waving, turning to look around) or flails (spinning); grows with the planet
    const pd = Math.min(1, Math.max(0, (ms - 550) / 380)), hgt = Math.max(70, r * 0.5), tm = ms / 1000 - 3.25, dk = tm > SEQ_T, mode = phase !== 'idle' ? (dk ? 'darkSpin' : 'spin') : ms < 3250 ? 'wave' : dk ? 'dark' : 'mj';
    let head = null, m = null;
    if (pd > 0) { const tn = ms / 1000, spinning = mode === 'spin';
      m = mode === 'mj' ? mj(tm) : null; const th = m ? m.th : 0;
      const tA = tm - SEQ_T, mk = dk ? sm(tA / 1.2) : 0;   // the change, 1.2 s: he turns to face us and morphs into Darkon while Earth burns into Pyrokos
      if (dk && !tDark) { tDark = ms; nBeam = ms + 2400; say_('> darkon is. welcome to pyrokos'); window.nygSound && nygSound.mood('dark'); }   // the music turns ominous   // MJ: the feet travel over the top of the planet; the body stays upright to its surface
      const drop = (1 - back(pd)) * hgt * 1.4 + 0;
      const spinning_ = spinning || mode === 'darkSpin', roll = -th + (spinning_ ? Math.sin(ms / 70) * 0.25 + Math.sin(ms / 190) * 0.12 : m ? m.lean : Math.sin(ms / 900) * 0.04);
      const yaw = spinning_ ? (now - tSpin) / 1000 * 7 : m ? m.yaw : mode === 'dark' ? lerp(MJ_END, beam && !beam.fade ? Math.sign(beam.o.x - CX) * 0.6 : 0.3 * Math.sin(tn * 0.5), mk) : 0.5 * Math.sin(ms / 1100);
      const hh = hgt * (1 + 0.2 * (dk ? mk : 0)), pp = person(CX + Math.sin(th) * (r - 2), cy - Math.cos(th) * (r - 2) - drop, hh, yaw, roll, tn, mode, mode === 'dark' ? { aim: !!beam, k: mk } : m); head = pp.head;
      if (mode === 'dark' && mk < 1) { const [a, b2, x, y] = pp.box, ly = y - (y - b2) * mk;   // a line of embers rides up his body with the change
        for (let q = 0; q < 26; q++) dot(R(a - 8, x + 8), ly + R(-4, 4), R(0.5, 1), R(1.4, 2.1), q % 2 ? 1 : 3);
        if (tA > 1.1 && !ringDone) { ringDone = true; booms.push({ x: (a + x) / 2, y: (b2 + y) / 2, ring: 1, age: 0, life: 1.3 }); } }   // done: one soft shockwave
      if (mode === 'dark' && head) darkon(ms, dt, head, hh);
      if (phase === 'idle') { const [a, b2, x, y] = pp.box, pad = 8; gb = [a - pad, b2 - pad, x + pad, y + pad]; go.style.left = `${a - pad}px`; go.style.top = `${b2 - pad}px`; go.style.width = `${x - a + 2 * pad}px`; go.style.height = `${y - b2 + 2 * pad}px`; } }   // the click target hugs the person
    pointerGlow(now);
    draw(); reticle(ms, dt);
    // speech bubble up and to the right of the head, with a gap (kept on screen on narrow phones): "Ciao, I'm Noel", it clears, "Choose Me"; then a growing "WOOOO"
    if (head && ms > 1050) { const txt = mode === 'spin' || mode === 'darkSpin' ? `W${'O'.repeat(Math.min(9, 2 + Math.floor((now - tSpin) / 180)))}` : ms < 2850 ? 'Ciao, I’m Noel' : ms < 3250 ? '' : dk && tm - SEQ_T < 1.2 ? '…' : dk && tm - SEQ_T < 3.6 ? 'Darkon is.' : beam ? 'Begone!' : m && m.move === 'toe' ? 'Hee-hee!' : 'Choose Me';
      say.classList.toggle('red', dk);
      if (txt && txt !== said) say.textContent = said = txt; say.classList.toggle('on', !!txt);
      say.style.setProperty('--s', Math.min(2.4, hgt / Math.max(70, R0 * 0.5)).toFixed(3));
      say.style.translate = `${Math.min(head[0] + hgt * 0.3 + 12, W - say.offsetWidth * Math.min(2.4, hgt / Math.max(70, R0 * 0.5)) - 10).toFixed(1)}px ${Math.max(head[1] - hgt * 0.32 - 10, (W < 600 ? 84 : 8) + say.offsetHeight * Math.min(2.4, hgt / Math.max(70, R0 * 0.5))).toFixed(1)}px`; say.style.marginTop = `-${say.offsetHeight}px`; }
    // name + log (before the click)
    const nk = Math.max(0, Math.min(1, (ms - 900) / 1200)), fixed = Math.floor(nk * NAME.length);
    nameEl.textContent = [...NAME].map((ch, i) => (i < fixed || ch === ' ' ? ch : ms < 900 && i > 0 ? ' ' : GL[(Math.random() * GL.length) | 0])).join('');
    const li = Math.min(LOG.length - 1, Math.floor((ms - 250) / 420));   // a line every 0.42 s
    if (phase === 'idle' && li > shownLog && ms > 300) { shownLog = li; say_(`> ${LOG[li]}`); if (li === LOG.length - 1) liveEl = true; }   // the score appears once the log has typed
    live(ms);
    } catch (err) { console.error(err); end(true); }
    raf = requestAnimationFrame(tick);
  };

  // the page behind can't be clicked, tabbed to or read until the boot ends. This script runs before <main> is parsed, so lock it once the DOM is in
  const lockPage = () => { if (phase === 'out') return; behind = [...document.body.children].filter((e) => e !== el && !e.inert && !/^(SCRIPT|NOSCRIPT)$/.test(e.tagName)); behind.forEach((e) => (e.inert = true)); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', lockPage) : lockPage();
  go.addEventListener('pointerdown', (e) => { if (e.isPrimary && e.button === 0) start(); });   // a pointer press on the person only: keys never reach it (not focusable)
  el.querySelector('.boot-skip').addEventListener('click', () => end(true));
  addEventListener('wheel', (e) => { if (phase !== 'out') e.preventDefault(); }, { passive: false });   // no scrolling under it (Lenis listens to the wheel)
  addEventListener('touchmove', (e) => { if (phase !== 'out') e.preventDefault(); }, { passive: false });
  raf = requestAnimationFrame(tick);
  clearTimeout(window.__boot); el.style.animation = 'none'; el.classList.add('ready');   // it runs: this script ends it, not the failsafes (and the hint can show)
})();
