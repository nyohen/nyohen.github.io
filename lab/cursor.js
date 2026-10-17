// Starburst cursor (Kluster's idea; our own code): a hand-drawn orange starburst follows the mouse with a little lag, its strokes
// re-drawn every ~110 ms like hand animation ("boil") while the mouse moves (it stops ~300 ms after the last move), with a small
// dot marking the real pointer. Hidden until the first mouse move. Only for mouse/trackpad users; touch keeps the normal
// behaviour. Reduced motion: no boil and no lag.
(() => {
  if (!matchMedia('(pointer: fine)').matches) return;
  const NS = 'http://www.w3.org/2000/svg', R = (a, b) => a + Math.random() * (b - a);
  const burst = () => {           // ~11 strokes from near the centre outwards, each slightly bent, like a quick marker scribble
    let d = ''; const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R(-.25, .25), r0 = R(2, 14), r1 = R(52, 98), bend = R(-.3, .3);
      const x0 = Math.cos(a) * r0, y0 = Math.sin(a) * r0, x1 = Math.cos(a) * r1, y1 = Math.sin(a) * r1;
      const cx = Math.cos(a + bend) * r1 * .55, cy = Math.sin(a + bend) * r1 * .55;
      d += `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
    }
    return d;
  };
  const el = document.createElement('div'); el.className = 'kcursor'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg viewBox="-105 -105 210 210" width="200" height="200"><path fill="none" stroke="#ff4b1f" stroke-width="3.6" stroke-linecap="round"/></svg><i></i>`;
  document.body.appendChild(el); document.documentElement.classList.add('kcursor-on');
  const path = el.querySelector('path'), dot = el.querySelector('i'), frames = [burst(), burst(), burst()];
  path.setAttribute('d', frames[0]);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mx = 0, my = 0, x = 0, y = 0, moved = false, f = 0, lastBoil = 0, lastMove = 0, over = false;
  el.style.opacity = '0';   // nothing drawn over the page until the mouse actually moves
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; mx = e.clientX; my = e.clientY;
    if (!moved) { x = mx; y = my; moved = true; } lastMove = performance.now(); el.style.opacity = '1'; }, { passive: true });
  document.addEventListener('pointerleave', () => (el.style.opacity = '0'));
  addEventListener('pointerover', (e) => (over = !!e.target.closest('a,button,[role=button],.lbl,.node')), { passive: true });
  const loop = (now) => {
    const k = still ? 1 : .2; x += (mx - x) * k; y += (my - y) * k;
    el.style.transform = `translate(${x}px, ${y}px)`;
    dot.style.transform = `translate(${mx - x}px, ${my - y}px)`;
    path.parentNode.style.transform = `scale(${over ? 1.18 : 1})`;
    if (!still && now - lastMove < 300 && now - lastBoil > 110) { f = (f + 1) % frames.length; path.setAttribute('d', frames[f]); lastBoil = now; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
