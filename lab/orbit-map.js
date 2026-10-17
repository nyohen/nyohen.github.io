// Orbit map as an embeddable section (Version A). mountOrbit(box): rings by kind (work inside, projects in the middle,
// everything else outside), size = importance, skill stars linked to the work that used them. Labels open CaseUI case studies.
// Renders only while the section is on screen. Needs window.PORTFOLIO (content.js) and window.CaseUI (case-ui.js).
import * as THREE from './vendor/three/three.module.js';

export function mountOrbit(box) {
  const CASES = window.PORTFOLIO.cases, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KHEX = { work: '#ff4b1f', project: '#8aa4ff', skills: '#e9ff3a', school: '#f2f0ea', contact: '#f2f0ea' };
  const KVAR = { work: 'var(--k-work)', project: 'var(--k-project)', skills: 'var(--k-skills)', school: 'var(--k-school)', contact: 'var(--k-contact)' };
  box.classList.add('orbit-box');
  box.innerHTML = `<canvas aria-hidden="true"></canvas><div class="o-labels"></div><div class="o-skills" aria-hidden="true"></div>
    <div class="o-legend"><span><b>Core</b> me</span><span><b>Inner</b> work</span><span><b>Middle</b> projects</span><span><b>Outer</b> toolkit · school · contact</span><span><b>Size</b> importance · <b>lines</b> skills used</span></div>`;
  const canvas = box.querySelector('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { box.classList.add('no-gl'); box.querySelector('.o-legend').textContent = 'This map needs 3D graphics. Every section is in the bar below.'; return { setActive() {} }; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setClearColor(0x131217);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x131217, .02);
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 300), HOME = new THREE.Vector3(0, 14, 23);
  camera.position.copy(HOME);
  const map = new THREE.Group(); scene.add(map);
  const small = box.clientWidth < 700;
  { // faint backdrop galaxy
    const N = small ? 12000 : 26000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N), rad = new Float32Array(N);
    const a0 = new THREE.Color('#ffb070'), a1 = new THREE.Color('#3d5cff'), c = new THREE.Color();
    for (let i = 0; i < N; i++) { const r = Math.pow(Math.random(), 1.4) * 15, a = (i % 4) / 4 * Math.PI * 2 + r * .32, s = (v) => Math.pow(Math.random(), 3) * (Math.random() < .5 ? 1 : -1) * v * (.3 + r * .1);
      pos.set([Math.cos(a) * r + s(1.3), s(.4), Math.sin(a) * r + s(1.3)], i * 3); c.copy(a0).lerp(a1, Math.min(1, r / 14)); col.set([c.r, c.g, c.b], i * 3); seed[i] = Math.random(); rad[i] = r; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('rad', new THREE.BufferAttribute(rad, 1));
    map.add(new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      uniforms: { uTime: { value: 0 }, uSize: { value: 20 * renderer.getPixelRatio() } },
      vertexShader: `attribute float seed; attribute float rad; uniform float uTime; uniform float uSize; varying vec3 vC; varying float vA;
        void main() { vec3 p = position; float an = uTime * (0.04 / (0.6 + rad * 0.12)); float s = sin(an), c = cos(an); p.xz = mat2(c, -s, s, c) * p.xz;
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float tw = 0.6 + 0.4 * sin(uTime * (1.0 + seed * 3.0) + seed * 40.0);
          gl_PointSize = uSize * (0.3 + seed * 0.8) * tw / -mv.z; vC = color; vA = tw * 0.5; }`,
      fragmentShader: `varying vec3 vC; varying float vA; void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vC, pow(smoothstep(0.5, 0.0, d), 2.2) * vA); }` })));
  }
  const glow = (hex, size, op) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, hex); gr.addColorStop(.3, hex + '55'); gr.addColorStop(1, hex + '00'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op })); sp.scale.set(size, size, 1); return sp; };
  map.add(glow('#ffd2a8', 5.5, .45));
  [['#ff4b1f', [-8, -1, -10], 24], ['#3d5cff', [9, 2, -12], 28], ['#c23bff', [1, -4, -16], 26]].forEach(([h, p, s]) => { const g = glow(h, s, .3); g.position.set(...p); scene.add(g); });
  const RING = { work: 4.2, project: 7.4, outer: 10.6 }, ringOf = (c) => (c.kind === 'work' ? 'work' : c.kind === 'project' ? 'project' : 'outer');
  const POS = {};
  ['work', 'project', 'outer'].forEach((ring, gi) => { const list = CASES.filter((c) => ringOf(c) === ring); if (ring === 'work') list.reverse();
    list.forEach((c, i) => { const a = gi * .9 + (i / list.length) * Math.PI * 2 + .4; POS[c.id] = new THREE.Vector3(Math.cos(a) * RING[ring], 0, Math.sin(a) * RING[ring]); }); });
  Object.values(RING).forEach((r) => { const pts = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    map.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xeceae4, transparent: true, opacity: .14 }))); });
  CASES.forEach((c) => { const g = glow(KHEX[c.kind], 1.2 + c.weight * .7, .9); g.position.copy(POS[c.id]); map.add(g);
    map.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), POS[c.id]]), new THREE.LineBasicMaterial({ color: 0xeceae4, transparent: true, opacity: .07 }))); });
  const SKILLS = ['Python', 'TypeScript', 'React', 'FastAPI', 'LangGraph', 'SQL', 'AWS', 'Docker', 'GitHub Actions', 'Jira'];
  const uses = (c, s) => { const st = (c.stack || []).join(' ').toLowerCase() + ' ' + (c.groups || []).map((g) => g[1]).join(' ').toLowerCase();
    if (s === 'AWS') return /aws|lambda|cognito|amplify|redshift|quicksight/.test(st); if (s === 'SQL') return /sql|redshift/.test(st); return st.includes(s.toLowerCase()); };
  const SPOS = {}, links = [];
  SKILLS.forEach((s, i) => { const a = i / SKILLS.length * Math.PI * 2 + .15; SPOS[s] = new THREE.Vector3(Math.cos(a) * 13.3, .6 * Math.sin(i * 2.1), Math.sin(a) * 13.3);
    CASES.filter((c) => c.kind !== 'skills' && uses(c, s)).forEach((c) => { const m = new THREE.LineBasicMaterial({ color: 0xe9ff3a, transparent: true, opacity: .06 });
      map.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([POS[c.id], SPOS[s]]), m)); links.push({ s, id: c.id, m }); }); });
  const labels = box.querySelector('.o-labels'), skillsEl = box.querySelector('.o-skills');
  labels.innerHTML = CASES.map((c) => `<button class="lbl" data-id="${c.id}" style="--k:${KVAR[c.kind]};--w:${c.weight}"><span class="dot"></span><span><b>${esc(c.title)}</b><small>${esc(c.kind)}</small></span></button>`).join('');
  skillsEl.innerHTML = SKILLS.map((s) => `<span class="sk" data-s="${esc(s)}">${esc(s)}</span>`).join('');
  const L = [...labels.querySelectorAll('.lbl')], SK = [...skillsEl.querySelectorAll('.sk')];
  const light = (id, s) => { links.forEach((l) => (l.m.opacity = (id && l.id === id) || (s && l.s === s) ? .6 : .06));
    SK.forEach((e) => e.classList.toggle('lit', !!(id && links.some((l) => l.id === id && l.s === e.dataset.s)) || e.dataset.s === s)); };
  // hold: the map stops turning while a label is hovered or focused, so it does not slide away from the pointer
  let hold = 0; const grab = (on) => (hold = Math.max(0, hold + (on ? 1 : -1)));
  L.forEach((b) => { b.addEventListener('click', () => window.CaseUI.open(b.dataset.id, b));
    b.addEventListener('pointerenter', () => { light(b.dataset.id); grab(true); }); b.addEventListener('pointerleave', () => { light(target); grab(false); });
    b.addEventListener('focus', () => grab(true)); b.addEventListener('blur', () => grab(false)); });
  skillsEl.style.pointerEvents = 'none';
  let target = null, yaw = 0, tYaw = 0, pitch = 0, tPitch = 0, drag = null, visible = false, raf = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: tYaw, pitch: tPitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => (drag = null));
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; tYaw = drag.yaw + (e.clientX - drag.x) * .004; tPitch = Math.max(-.35, Math.min(.5, drag.pitch + (e.clientY - drag.y) * .003)); });
  const fit = () => { const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(box); fit();
  const camTo = new THREE.Vector3(), look = new THREE.Vector3(), wv = new THREE.Vector3(), clock = new THREE.Clock();
  const frame = () => {
    raf = 0; if (!visible) return;
    const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime, W = box.clientWidth, H = box.clientHeight;
    map.children[0].material.uniforms.uTime.value = still ? 6 : t;
    if (!still && !drag && !target && !hold) tYaw += dt * .025;
    yaw += (tYaw - yaw) * .06; pitch += (tPitch - pitch) * .06; map.rotation.y = yaw; map.rotation.x = pitch * .5; map.updateMatrixWorld();
    if (target) { wv.copy(POS[target]).applyMatrix4(map.matrixWorld); camTo.copy(wv).multiplyScalar(.5).add(new THREE.Vector3(0, 9, 14)); look.lerp(wv.clone().multiplyScalar(.7), .08); }
    else { camTo.copy(HOME); look.lerp(new THREE.Vector3(), .08); }
    camera.position.lerp(camTo, still ? 1 : .05); camera.lookAt(look);
    // boxes are kept inside the canvas (clamped to a 6px margin) and case labels that overlap are nudged apart vertically
    const M = 6, clampX = (x, w) => Math.max(M, Math.min(W - w - M, x)), clampY = (y, h) => Math.max(M, Math.min(H - h - M, y));
    const spot = (el, p, sk) => { const v = p.clone().applyMatrix4(map.matrixWorld).project(camera), x = (v.x * .5 + .5) * W, y = (-v.y * .5 + .5) * H;
      const w = el.offsetWidth, h = el.offsetHeight;
      return { el, w, h, x: clampX(sk ? x - w / 2 : x + 10, w), y: clampY(y - h / 2, h), hide: v.z > 1 || x < -30 || x > W + 30 || y < -20 || y > H + 20, op: Math.max(.5, Math.min(1, 1.6 - v.z * .7)) }; };
    const put = (r) => { r.el.style.visibility = r.hide ? 'hidden' : 'visible'; r.el.style.transform = `translate(${r.x}px, ${r.y}px)`; r.el.style.opacity = String(r.op); };
    const boxes = L.map((b) => spot(b, POS[b.dataset.id])).sort((a, b) => a.y - b.y), stars = SK.map((e) => spot(e, SPOS[e.dataset.s], true));   // read all sizes, then write
    boxes.forEach((r, i) => { for (let j = 0; j < i; j++) { const q = boxes[j]; if (q.hide || r.hide) continue;
      if (r.x < q.x + q.w && q.x < r.x + r.w && r.y < q.y + q.h + 4) r.y = q.y + q.h + 4; } r.y = clampY(r.y, r.h); });
    boxes.forEach(put); stars.forEach(put);
    renderer.render(scene, camera); raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { clock.getDelta(); raf = requestAnimationFrame(frame); } }, { threshold: .05 }).observe(box);
  return { setActive(id) { target = id; L.forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id))); light(id); } };
}
