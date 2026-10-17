// System diagram as an embeddable section (Version B). mountSystem(box): the pipeline Noel builds (interface -> API -> agent ->
// tools -> verifier -> tests -> a person, on cloud + shipping), with flowing packets and the verifier's retry loop. Each part opens
// an evidence card that links to CaseUI case studies. Motion stops by itself (WCAG 2.2.2): when the diagram first scrolls into view it
// sends requests for ~6 s, then sends no more and lets the ones in flight finish; pointing at or focusing the diagram sends another
// ~6 s. The clock pauses off screen. Reduced motion: no moving requests. Needs content.js + case-ui.js.
window.mountSystem = (box) => {
  const P = window.PORTFOLIO, ns = 'http://www.w3.org/2000/svg';
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NODES = [
    { id: 'ui', x: 85, y: 150, name: 'Interface', role: 'React + TypeScript screens people use', what: 'Front ends that make the system usable and show their work.',
      ev: [['MPAC analytics dashboard', 'Built a React investigation dashboard from the ground up with a staff AI engineer; delivered it to the VP.', 'mpac'],
           ['Casefile UI', 'React and TypeScript UI that streams each agent step live and links every sentence to its source transactions.', 'casefile'],
           ['MPAC co-op', 'Intro.js walkthroughs, a login page redesign and a theme switcher with custom SVG icons.', 'coop']] },
    { id: 'api', x: 253, y: 150, name: 'API', role: 'FastAPI REST endpoints', what: 'The contract between screens and logic.',
      ev: [['Casefile', 'FastAPI REST API (alerts, money-flow, streamed agent steps).', 'casefile'], ['RootCause', 'FastAPI API for runs, topology and the agent graph.', 'rootcause'],
           ['MPAC GIS tools', 'Integrated the Esri REST API so field mapping fetches aliases live, with no redeploy on schema changes.', 'mpac']] },
    { id: 'agent', x: 422, y: 150, name: 'Agent', role: 'LangGraph agent that does the work', what: 'An AI step that drafts or diagnoses, always inside a loop it cannot skip.',
      ev: [['Casefile', 'A LangGraph agent writes the case narrative sentence by sentence, each tied to the transactions it cites.', 'casefile'],
           ['RootCause', 'A LangGraph agent gathers evidence and proposes the root cause of an outage.', 'rootcause']] },
    { id: 'tools', x: 590, y: 150, name: 'Tools & data', role: 'Read-only queries, real sources', what: 'The agent only sees data through narrow, read-only tools.',
      ev: [['Casefile', 'Read-only, parameterized SQL tools over the ledger.', 'casefile'], ['RootCause', 'Parsers for Prometheus, Jaeger and JSON-lines log exports.', 'rootcause'],
           ['MPAC', 'Dashboards over AWS Redshift data; data-drift validation across 12 business domains, checked daily.', 'mpac']] },
    { id: 'verifier', x: 758, y: 150, name: 'Verifier', role: 'Plain code checks every claim', what: 'Nothing the AI says is trusted until code proves it. Failures go back, at most 3 times, then to a person.',
      ev: [['Casefile', 'Flagged all 417 deliberately corrupted claims, with 0 of 994 clean claims falsely flagged. An earlier version missed about 5%: the date check accepted any real date. Fixed with a new rule and a test.', 'casefile'],
           ['RootCause', 'Re-queries the telemetry in a fresh time window with stricter thresholds before it reports; max 3 loops, then "inconclusive".', 'rootcause']] },
    { id: 'ci', x: 927, y: 150, name: 'Tests & CI', role: 'Gates that stop regressions', what: 'Every change has to pass the same checks again.',
      ev: [['RootCause', '52 automated tests, and a CI gate that fails the build if diagnosis accuracy drops more than 5 points.', 'rootcause'],
           ['Casefile', '36 automated tests; GitHub Actions runs tests, the TypeScript build and the Docker build.', 'casefile'], ['MPAC co-op', 'Wrote unit tests for core navigation components.', 'coop']] },
    { id: 'human', x: 1095, y: 150, name: 'A person', role: 'Decides and acts', what: 'The tools inform; a person decides. That is a design choice, not a gap.',
      ev: [['Casefile', 'A human analyst always makes the final call; Casefile never files anything.', 'casefile'], ['RootCause', 'Strictly read-only: a person acts on the diagnosis.', 'rootcause'],
           ['MPAC', 'Shipped production changes under change management; 280 tickets across both roles; trained a summer student.', 'mpac']] },
    { id: 'cloud', x: 340, y: 430, name: 'Cloud', role: 'AWS: Lambda, Cognito, Amplify', what: 'Where it runs.',
      ev: [['MPAC sign-in', 'Rebuilt legacy sign-in with AWS Amplify and Cognito, adding multi-factor authentication; a Lambda trigger collects login metrics.', 'mpac'],
           ['MPAC co-op', 'Automated company-wide offboarding with Python AWS Lambda functions and auto-created Jira tickets.', 'coop']] },
    { id: 'ship', x: 840, y: 430, name: 'Shipping', role: 'Docker, GitHub Actions, dashboards', what: 'How it gets out and stays watched.',
      ev: [['Both projects', 'Docker images built and smoke-tested; CI on GitHub Actions.', 'casefile'], ['MPAC', 'AWS QuickSight dashboard that replaced a blocked Power BI rollout.', 'mpac']] },
  ];
  const EDGES = [['ui', 'api'], ['api', 'agent'], ['agent', 'tools'], ['tools', 'verifier'], ['verifier', 'ci'], ['ci', 'human'], ['cloud', 'api'], ['cloud', 'tools'], ['ship', 'ci'], ['ship', 'verifier']];

  const N = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const KIND = (c) => (P.cases.find((x) => x.id === c) || {}).kind === 'work' ? 'var(--k-work)' : 'var(--k-project)';
  box.classList.add('sys-box');
  box.innerHTML = `<div class="stage"><svg viewBox="0 0 1180 520" aria-hidden="true"><g class="lanes"><text x="0" y="40">The pipeline</text><text x="0" y="400">Runs on</text></g><defs><marker id="sys-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="rgba(239,232,220,.55)"/></marker></defs>
      <g class="edges"></g><g class="packets"></g></svg><div class="nodes"></div></div>
    <p class="sys-legend"><span><i class="dot"></i>a request</span><span><i class="ring"></i>caught by the verifier, sent back (max 3)</span><span><i class="ok"></i>verified</span><span><i class="bar w"></i>work evidence</span><span><i class="bar p"></i>project evidence</span></p>`;
  const edgeG = box.querySelector('.edges'), pktG = box.querySelector('.packets');
  const path = (d, cls) => { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'edge ' + (cls || '')); edgeG.appendChild(p); return p; };
  // Requests travel box to box along the arrows, wait inside each box while it lights up, and the verifier sends some back
  // along the dashed loop. Packets are drawn under the boxes, so they disappear into a box and come out the other side.
  const ROW = ['ui', 'api', 'agent', 'tools', 'verifier', 'ci', 'human'], VI = ROW.indexOf('verifier'), AI = ROW.indexOf('agent');
  const arrows = ROW.slice(1).map(() => path('', 'arrow')), loop = path('', 'loop');
  EDGES.slice(6).forEach(([a, b]) => path(`M ${N[a].x} ${N[a].y} C ${N[a].x} ${(N[a].y + N[b].y) / 2}, ${N[b].x} ${(N[a].y + N[b].y) / 2}, ${N[b].x} ${N[b].y + 36}`));
  box.querySelector('.nodes').innerHTML = NODES.map((n) => `<button class="node ${n.id}" data-id="${n.id}" aria-expanded="false" style="left:${n.x / 11.8}%;top:${n.y / 5.2}%">
      <b>${esc(n.name)}</b><span class="role">${esc(n.role)}</span><span class="ev" aria-label="${n.ev.length} pieces of evidence">${n.ev.map(([, , c]) => `<i style="background:${KIND(c)}"></i>`).join('')}</span></button>`).join('');
  const btns = [...box.querySelectorAll('.node')], row = btns.slice(0, 7), stage = box.querySelector('.stage');
  let LLEN = 0, onLayout = null;
  // same height for every box in the pipeline row; arrows run edge to edge; the loop leaves the verifier's bottom and enters the agent's
  const layout = () => { row.forEach((b) => (b.style.height = '')); const svgOn = getComputedStyle(stage.querySelector('svg')).display !== 'none'; if (!svgOn) { LLEN = 0; return; }
    const h = Math.max(...row.map((b) => b.getBoundingClientRect().height)); row.forEach((b) => (b.style.height = h + 'px'));
    const sr = stage.getBoundingClientRect(), k = 1180 / sr.width, half = row[0].getBoundingClientRect().width * k / 2, bottom = (row[0].getBoundingClientRect().bottom - sr.top) * k, Y = N.ui.y;
    arrows.forEach((a, i) => a.setAttribute('d', `M ${N[ROW[i]].x + half + 2} ${Y} L ${N[ROW[i + 1]].x - half - 2} ${Y}`));
    loop.setAttribute('d', `M ${N.verifier.x} ${Y} C ${N.verifier.x} ${bottom + 95}, ${N.agent.x} ${bottom + 95}, ${N.agent.x} ${Y}`);
    LLEN = loop.getTotalLength(); if (onLayout) onLayout(); };
  new ResizeObserver(layout).observe(stage); layout();
  // "where I did this" evidence opens in the shared case-study panel (CaseUI.show), so the page has one pop-up style
  let open = null;
  const show = (id, from) => { const n = N[id]; open = id; btns.forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.id === id)));
    const panel = window.CaseUI.show({ kind: 'Where I did this', title: n.name, sub: n.role, opener: from, onClose: () => { open = null; btns.forEach((b) => b.setAttribute('aria-expanded', 'false')); },
      html: `<p class="what">${esc(n.what)}</p><ul class="ev">${n.ev.map(([t, d, c]) => `<li style="--k2:${KIND(c)}"><b>${esc(t)}</b><span>${esc(d)}</span><button type="button" data-case="${c}">Open the ${esc(P.cases.find((x) => x.id === c).title)} case study →</button></li>`).join('')}</ul>` });
    panel.querySelectorAll('.ev button').forEach((b) => (b.onclick = () => window.CaseUI.open(b.dataset.case, b))); };
  const hide = () => { if (open) window.CaseUI.close(); };
  btns.forEach((b) => { b.setAttribute('aria-haspopup', 'dialog'); b.addEventListener('click', () => show(b.dataset.id, b)); });

  // packets: dwell in a box (it lights up), hop to the next along the arrow; at the verifier, caught ones loop back to the agent (max 3)
  const DWELL = 520, HOP = 420, LOOPT = 1300, ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const pk = []; let last = -1e9, visible = false, raf = 0;
  const paint = (p, x, y) => { p.c.setAttribute('cx', x); p.c.setAttribute('cy', y);
    const st = p.ok ? ['#e9ff3a', 'none', '#e9ff3a'] : p.caught ? ['#131217', '#efe8dc', 'rgba(239,232,220,.6)'] : ['#efe8dc', 'none', '#efe8dc'];
    p.c.setAttribute('fill', st[0]); p.c.setAttribute('stroke', st[1]); p.c.setAttribute('stroke-width', 2.2); p.c.style.color = st[2]; };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, RUN = 3000;
  let spawnUntil = 0, played = false;
  const tick = (now) => { raf = 0; if (!visible || !LLEN) return;   // stacked layout (no arrows): no moving requests
    if (now < spawnUntil && now - last > 1500) { const c = document.createElementNS(ns, 'circle'); c.setAttribute('r', 6); pktG.appendChild(c); pk.push({ c, i: 0, st: 'dwell', t0: now, bad: Math.random() < .4, tries: 0 }); last = now; }
    const busy = new Set();
    for (let j = pk.length - 1; j >= 0; j--) { const p = pk[j], t = now - p.t0;
      if (p.st === 'dwell') { busy.add(p.i); paint(p, N[ROW[p.i]].x, N.ui.y);
        if (t >= DWELL) { if (p.i === ROW.length - 1) { p.c.remove(); pk.splice(j, 1); continue; }
          if (p.i === VI && p.bad) { p.st = 'loop'; p.caught = true; } else { if (p.i === VI) { p.ok = true; p.caught = false; } p.st = 'hop'; } p.t0 = now; } }
      else if (p.st === 'hop') { const u = ease(Math.min(1, t / HOP)), x0 = N[ROW[p.i]].x, x1 = N[ROW[p.i + 1]].x; paint(p, x0 + (x1 - x0) * u, N.ui.y);
        if (t >= HOP) { p.i++; p.st = 'dwell'; p.t0 = now; } }
      else { const pt = loop.getPointAtLength(ease(Math.min(1, t / LOOPT)) * LLEN); paint(p, pt.x, pt.y);
        // after the sending window a caught request passes on its next try, so the run winds down instead of looping on
        if (t >= LOOPT) { p.i = AI; p.st = 'dwell'; p.t0 = now; p.tries++; p.bad = now < spawnUntil && p.tries < 3 && Math.random() < .3; } } }
    row.forEach((b, i) => b.classList.toggle('busy', busy.has(i)));
    if (now < spawnUntil || pk.length) raf = requestAnimationFrame(tick); };
  // off screen the clocks stop; coming back shifts them by the gap so nothing jumps
  let pausedAt = Infinity;
  const run = () => { if (still) return; spawnUntil = Math.max(spawnUntil, performance.now() + RUN); if (visible && !raf) raf = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; const now = performance.now();
    if (!visible) { if (raf) { cancelAnimationFrame(raf); raf = 0; } pausedAt = now; return; }
    if (pausedAt !== Infinity) { const gap = now - pausedAt; pk.forEach((p) => (p.t0 += gap)); last += gap; if (spawnUntil > pausedAt) spawnUntil += gap; pausedAt = Infinity; }
    if (!played) { played = true; run(); } else if ((now < spawnUntil || pk.length) && !raf) raf = requestAnimationFrame(tick); }, { threshold: .05 }).observe(box);
  onLayout = () => { if (visible && !raf && (performance.now() < spawnUntil || pk.length)) raf = requestAnimationFrame(tick); };
  box.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') run(); });
  box.addEventListener('focusin', run);
  return { hide };
};
