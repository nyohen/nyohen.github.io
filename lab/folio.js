// Shared page content for the home page. Fills the text parts from content.js (one source of facts), runs the clock and
// the checkbox nav. The interactive centrepiece is mounted by the page. folioParts() has no DOM use, so the build also
// calls it to write the same text into index.html for visitors without JavaScript (vite.config.ts, prerender plugin).
window.folioParts = (P) => {
  const C = Object.fromEntries(P.cases.map((c) => [c.id, c]));
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // one row = heading + subline | bullet points | dates + type (used by Experience and Education)
  const row = (title, subline, points, when, type) => `<div class="job"><div class="head"><h3>${esc(title)}</h3><p class="org">${subline}</p></div>
      <ul class="pts">${points.map((d) => `<li>${d}</li>`).join('')}</ul><p class="meta mono"><span>${esc(when)}</span>${type ? `<span>${esc(type)}</span>` : ''}</p></div>`;
  return {
    esc,
    mail: esc(P.email).replace('@', '@<wbr>'),
    glance: P.glance.map(([k, v]) => `<dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd>`).join(''),
    jobs: (P.jobs || []).map((j) => row(j.role, esc(j.org), C[j.id].did.map(esc), j.when, j.type)).join(''),
    education: (P.schools || []).map((x) => row(x.name, `<strong>${esc(x.degree)}</strong><br>${esc(x.sub)}`, x.notes.map(esc), x.when, '')).join(''),
    // project cards: the strongest facts as plain text (prerendered), each opening its case study
    projects: P.cases.filter((c) => c.kind === 'project').map((c) => `<article class="proj"><p class="mono kind">Project · ${esc(c.sub.split(' · ').pop())}</p>
      <h3 class="tight">${esc(c.title)}</h3><p class="what">${esc(c.sub.split(' · ')[0])}</p><p class="out">${esc(c.outcome)}</p>
      <dl>${(c.stats || []).map(([n, l]) => `<div><dt class="tight">${esc(n)}</dt><dd>${esc(l)}</dd></div>`).join('')}</dl>
      <p class="mono stack">${(c.stack || []).map((x) => `<span>${esc(x)}</span>`).join('')}</p>
      ${c.limits ? `<p class="limits"><b>Limits:</b> ${esc(c.limits.replace(/\s*Repo is private for now\.?/, ''))}</p>` : ''}<a class="btn" href="#${c.id}" data-case="${c.id}">Read the case study →</a></article>`).join(''),
    skills: C.skills.groups.map(([g, v]) => `<div><p class="mono">${esc(g)}</p><p>${esc(v)}</p></div>`).join(''),
  };
};

window.mountFolio = () => {
  const P = window.PORTFOLIO, F = window.folioParts(P), esc = F.esc, $ = (s) => document.querySelector(s);
  $('#glance').innerHTML = F.glance;
  document.querySelectorAll('[data-mail]').forEach((a) => { a.href = 'mailto:' + P.email; if (a.dataset.mail === 'text') a.innerHTML = F.mail; });
  $('#jobs').innerHTML = F.jobs;
  if ($('#schools')) $('#schools').innerHTML = F.education;
  $('#skills').innerHTML = F.skills;
  const pl = $('#projects-list'); if (pl) { pl.innerHTML = F.projects;
    pl.querySelectorAll('[data-case]').forEach((a) => a.addEventListener('click', (e) => { if (!window.CaseUI) return; e.preventDefault(); window.CaseUI.open(a.dataset.case, a); })); }
  const tick = () => { const t = new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto' }); document.querySelectorAll('.clock').forEach((e) => (e.textContent = t)); };
  tick(); setInterval(tick, 15000);
  // ticker: short facts one at a time (no words cut), one pass of ~5 s, then it rests on the first fact
  document.querySelectorAll('.tag.ticker').forEach((t) => { const facts = (t.dataset.facts || '').split('|').filter(Boolean); if (!facts.length) return;
    t.innerHTML = `<span aria-hidden="true">[</span><span class="fact" aria-hidden="true">${esc(facts[0])}</span><span aria-hidden="true">]</span><span class="sr">${esc(facts.join('. '))}</span>`;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const f = t.querySelector('.fact'), seq = [...facts.slice(1), facts[0]];
    seq.forEach((txt, i) => setTimeout(() => { f.classList.add('out'); setTimeout(() => { f.textContent = txt; f.classList.remove('out'); }, 220); }, 1700 * (i + 1))); });
  // sub-menu under the centrepiece item: one entry per case study
  document.querySelectorAll('nav.check .sub').forEach((sub) => { sub.innerHTML = P.cases.map((c) => `<button type="button" data-case="${c.id}">${esc(c.title)}</button>`).join('');
    sub.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => window.CaseUI && window.CaseUI.open(b.dataset.case, b))); });
  const links = [...document.querySelectorAll('nav.check a')];
  const mark = (id) => links.forEach((a) => { const on = a.dataset.s === id; a.querySelector('b').textContent = on ? '[●]' : '[ ]'; on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && mark(e.target.id)), { rootMargin: '-40% 0px -55% 0px' });
  links.forEach((a) => { const el = document.getElementById(a.dataset.s); if (el) io.observe(el);
    a.addEventListener('pointerenter', () => { if (!a.hasAttribute('aria-current')) a.querySelector('b').textContent = '[●]'; });
    a.addEventListener('pointerleave', () => { if (!a.hasAttribute('aria-current')) a.querySelector('b').textContent = '[ ]'; }); });
  mark('top');
};
