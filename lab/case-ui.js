// Shared section bar + case-study panel for the interactive views (A "Orbit", B "System").
// Usage: CaseUI.mount({ onSelect(id), onClose(), barInto: element? }) then CaseUI.open(id, openerEl). Deep links: #casefile opens Casefile.
// Accessibility: the panel is a labelled modal dialog over a dimmed page (the rest of the page is inert while it is open); opening
// moves focus to its title, closing returns focus to whatever opened it (after a deep link: that case's button on the page);
// Escape, a click on the dimmed page or the browser's Back button closes it.
// CaseUI.show({...}) puts other content (the pipeline's "where I did this" evidence) in the same panel, so there is one pop-up style.
window.CaseUI = (() => {
  const P = window.PORTFOLIO, CASES = P.cases, S = window.SCENES || {};
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KCOL = { work: 'var(--k-work)', project: 'var(--k-project)', skills: 'var(--k-skills)', school: 'var(--k-school)', contact: 'var(--k-contact)' };
  let customClose = null, cur = -1, isOpen = false, opener = null, hooks = {}, raf = 0, offPage = [], pushed = false, scrollAfterPop = null;
  // prev/next in the panel steps through the real work only (projects + jobs), never into Toolkit / School / Contact
  const STEP = CASES.map((c, i) => i).filter((i) => CASES[i].kind === 'project' || CASES[i].kind === 'work');
  const bar = document.createElement('nav'), panel = document.createElement('aside'), scrim = document.createElement('div');
  scrim.className = 'cscrim'; scrim.setAttribute('aria-hidden', 'true');
  bar.className = 'cbar'; bar.setAttribute('aria-label', 'Case studies');
  bar.innerHTML = `<ul>${CASES.map((c) => `<li><button type="button" data-id="${c.id}" style="--k:${KCOL[c.kind]}"><i aria-hidden="true"></i>${esc(c.title)}</button></li>`).join('')}</ul>`;
  panel.className = 'cpanel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'cp-title');
  // closed: panel not tabbable. open: everything else on the page is inert (focus stays in the panel), page behind is dimmed
  const shut = (v) => { panel.inert = v; v ? panel.setAttribute('aria-hidden', 'true') : panel.removeAttribute('aria-hidden');
    if (!v) { offPage = [...document.body.children].filter((e) => e !== panel && e !== scrim && !e.inert && !e.classList.contains('kcursor')); offPage.forEach((e) => (e.inert = true)); }
    else { offPage.forEach((e) => (e.inert = false)); offPage = []; }
    scrim.classList.toggle('on', !v); document.documentElement.classList.toggle('cpanel-open', !v); }; panel.inert = true; panel.setAttribute('aria-hidden', 'true');

  const body = (c) => {
    let h = c.scene && S[c.scene] ? `<canvas data-scene="${c.scene}" aria-hidden="true"></canvas>` : '';
    h += `<p class="outcome">${esc(c.outcome)}</p>`;
    if (c.stats) h += `<div class="stats">${c.stats.map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>`;
    if (c.did) h += `<h3>${c.kind === 'school' ? 'Also' : 'What I did'}</h3><ul class="did">${c.did.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`;
    if (c.result) h += `<h3>Result</h3><p class="result">${esc(c.result)}</p>`;
    if (c.groups) h += `<dl class="groups">${c.groups.map(([g, v]) => `<div><dt>${esc(g)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
    if (c.stack) h += `<h3>Stack</h3><ul class="chips">${c.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
    if (c.limits) h += `<h3>Honest limits</h3><p class="limits">${esc(c.limits)}</p>`;
    if (c.contact) h += `<h3>Get in touch</h3><div class="links"><a href="mailto:${esc(P.email)}">${esc(P.email)}</a><a href="${esc(P.resume)}" download="Noel_Yohannes_Ghebremeskel_Resume.pdf">Résumé (PDF)</a><a href="${esc(P.linkedin)}">LinkedIn</a><a href="${esc(P.github)}">GitHub</a></div>`;
    else h += `<h3>More</h3><div class="links"><a href="${esc(P.resume)}" download="Noel_Yohannes_Ghebremeskel_Resume.pdf">Résumé (PDF)</a><a href="mailto:${esc(P.email)}">Email me</a></div>`;
    return h;
  };
  const footer = (i) => { const at = STEP.indexOf(i); if (at < 0) return '';
    const to = (d) => CASES[STEP[(at + d + STEP.length) % STEP.length]];
    return `<footer><button type="button" data-step="-1" data-to="${to(-1).id}">← ${esc(to(-1).title)}</button>
        <span class="dots" aria-hidden="true">${STEP.map((j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</span>
        <button type="button" data-step="1" data-to="${to(1).id}">${esc(to(1).title)} →</button></footer>`; };
  const render = (i) => {
    const c = CASES[i], k = KCOL[c.kind];
    panel.style.setProperty('--k', k);
    panel.innerHTML = `<header><span class="kind">${esc(c.kind)}</span><h2 id="cp-title" tabindex="-1">${esc(c.title)}</h2><p class="sub">${esc(c.sub || '')}</p>
        <button class="x" type="button" aria-label="Close">✕</button></header><div class="body">${body(c)}</div>
      ${footer(i)}`;
    panel.querySelector('.x').onclick = () => api.close();
    panel.querySelectorAll('[data-step]').forEach((b) => (b.onclick = () => api.open(b.dataset.to, null, true)));
    animate();
  };
  const animate = () => {
    cancelAnimationFrame(raf);
    const cv = panel.querySelector('canvas[data-scene]'); if (!cv) return;
    const fit = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; cv.getContext('2d').setTransform(d, 0, 0, d, 0, 0); return r; };
    let r = fit(); const t0 = performance.now(), f = (now) => { if (!panel.classList.contains('on')) return;
      if (cv.width < 4) r = fit(); S[cv.dataset.scene](cv.getContext('2d'), r.width, r.height, still ? 2.4 : (now - t0) / 1000); if (!still) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
  };
  // Back button: opening pushes one history entry (the deep-link hash is moved onto it), so Back closes the panel and stays on
  // the page. Closing with ✕ / Escape / the dimmed page pops that entry again; closing because of Back does not.
  const caseHash = () => CASES.some((c) => '#' + c.id === location.hash);
  const reveal = (from, keepOpener) => { if (!keepOpener) opener = from || document.activeElement;
    if (!isOpen) { isOpen = true; shut(false);
      if (!pushed) { const base = location.pathname + location.search + (caseHash() ? '' : location.hash);
        history.replaceState(history.state, '', base); history.pushState({ cpanel: true }, '', base); pushed = true; } }
    panel.classList.add('on');
    requestAnimationFrame(() => panel.querySelector('#cp-title').focus({ preventScroll: true })); };
  const mark = () => bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(CASES[cur] && b.dataset.id === CASES[cur].id)));
  const api = {
    cases: CASES,
    mount(h = {}) {
      hooks = h; if (h.barInto) { bar.classList.add('inline'); h.barInto.appendChild(bar); document.body.append(scrim, panel); } else document.body.append(bar, scrim, panel);   // barInto: put the bar inside a page section
      scrim.addEventListener('click', () => api.close());
      bar.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => api.open(b.dataset.id, b)));
      addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) api.close(); });
      addEventListener('popstate', () => { if (scrollAfterPop) { const t = scrollAfterPop; scrollAfterPop = null; requestAnimationFrame(() => t.scrollIntoView({ block: 'center' })); }
        if (pushed) { pushed = false; if (isOpen) api.close(true); } });
      // deep links open only the real work (#casefile, #mpac, ...); #skills / #education / #contact stay plain page anchors
      const id = location.hash.slice(1); if (CASES.some((c) => c.id === id && (c.kind === 'project' || c.kind === 'work'))) setTimeout(() => api.open(id), 0);
    },
    open(id, from, keepOpener) {
      const i = CASES.findIndex((c) => c.id === id); if (i < 0) return;
      const fromPanel = isOpen && from && panel.contains(from);   // e.g. "Open the case study" inside pipeline evidence: keep the first opener
      cur = i; render(i); reveal(from, keepOpener || fromPanel); mark(); history.replaceState(history.state, '', '#' + id);
      hooks.onSelect && hooks.onSelect(id);
    },
    // other content in the same panel: { title, kind, sub, html, k, opener, onClose }
    show(o) {
      cancelAnimationFrame(raf); cur = -1; mark(); const fromPanel = isOpen && o.opener && panel.contains(o.opener);
      panel.style.setProperty('--k', o.k || 'var(--c-ink)'); customClose = o.onClose || null;
      panel.innerHTML = `<header><span class="kind">${esc(o.kind || '')}</span><h2 id="cp-title" tabindex="-1">${esc(o.title)}</h2><p class="sub">${esc(o.sub || '')}</p>
          <button class="x" type="button" aria-label="Close">✕</button></header><div class="body">${o.html}</div>`;
      panel.querySelector('.x').onclick = () => api.close(); reveal(o.opener, fromPanel); return panel;
    },
    close(fromBack) {
      if (!isOpen) return; isOpen = false; const id = cur >= 0 ? CASES[cur].id : null; cur = -1; panel.classList.remove('on'); shut(true); mark(); cancelAnimationFrame(raf);
      const popping = pushed && !fromBack;
      if (popping) { pushed = false; history.back(); }   // pops our entry; the popstate that follows is ignored (pushed is false)
      else if (id && caseHash()) history.replaceState(history.state, '', location.pathname + location.search);
      // focus goes back to what opened the panel; after a deep link (nothing opened it) to that case's button on the page
      let to = opener && opener !== document.body && document.contains(opener) ? opener : null;
      if (!to && id) to = document.querySelector(`#projects-list [data-case="${id}"]`) || bar.querySelector(`[data-id="${id}"]`);
      // after a deep link, bring that card into view (once history.back() has landed, or the browser's scroll restore would undo it)
      if (to && to.focus) { to.focus({ preventScroll: true }); if (to !== opener) { if (popping) scrollAfterPop = to; else to.scrollIntoView({ block: 'center' }); } }
      if (customClose) { customClose(); customClose = null; } hooks.onClose && hooks.onClose();
    },
    current: () => (cur < 0 ? null : CASES[cur].id),
    isOpen: () => isOpen,
    panelWidth: () => (panel.classList.contains('on') && innerWidth > 720 ? panel.getBoundingClientRect().width : 0),
  };
  return api;
})();
