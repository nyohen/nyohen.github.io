// Live drawings, one per kind of work (shared by the interactive views). Dark "photographs made of light".
// scene(g, w, h, t): ledger = Casefile (figures verified, one bad one caught); graph = RootCause (fault spreads, probe walks back to the cause);
// bars = MPAC (a dashboard assembling). Static frame when the visitor prefers less motion.
window.SCENES = (() => {
  const HOT = '#ff4b1f';
  return {
    ledger(g, w, h, t) {
      g.fillStyle = '#060606'; g.fillRect(0, 0, w, h);
      const rowH = h / 9, off = (t * 18) % rowH;
      for (let r = -1; r < 11; r++) {
        const y = r * rowH - off + rowH * .5, k = Math.floor(t * 18 / rowH) + r, bad = k % 7 === 3, glow = Math.max(0, 1 - Math.abs(y - h * .55) / (h * .45));
        g.fillStyle = `rgba(235,232,224,${.08 + glow * .5})`; g.fillRect(w * .08, y - 3, w * (.28 + ((k * 37) % 20) / 100), 6); g.fillRect(w * .5, y - 3, w * .18, 6);
        if (y < h * .62) { g.beginPath(); g.arc(w * .82, y, 7, 0, 7); g.fillStyle = bad ? HOT : `rgba(235,232,224,${.25 + glow * .6})`; g.fill();
          if (bad) { g.shadowColor = HOT; g.shadowBlur = 24; g.fillRect(w * .5, y - 3, w * .18, 6); g.shadowBlur = 0; } }
      }
      const s = g.createLinearGradient(0, h * .55, 0, h * .66); s.addColorStop(0, 'rgba(255,75,31,0)'); s.addColorStop(.5, 'rgba(255,75,31,.5)'); s.addColorStop(1, 'rgba(255,75,31,0)');
      g.fillStyle = s; g.fillRect(0, h * .55, w, h * .11);
    },
    graph(g, w, h, t) {
      g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h);
      const N = [[.5, .16], [.25, .38], [.75, .38], [.14, .64], [.38, .66], [.62, .64], [.86, .66], [.3, .88], [.7, .88]], E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 7], [5, 8]];
      const cause = 5, ph = (t % 6) / 6, noisy = new Set([cause, 2, 0]);
      E.forEach(([a, b]) => { g.strokeStyle = 'rgba(220,225,240,.18)'; g.lineWidth = 2; g.beginPath(); g.moveTo(N[a][0] * w, N[a][1] * h); g.lineTo(N[b][0] * w, N[b][1] * h); g.stroke(); });
      N.forEach(([x, y], i) => { const hot = i === cause && ph > .55, loud = noisy.has(i) && ph > (i === cause ? 0 : i === 2 ? .15 : .3);
        g.beginPath(); g.arc(x * w, y * h, Math.max(5, 9 + (loud ? 5 * Math.sin(t * 6 + i) : 0)), 0, 7);
        g.fillStyle = hot ? HOT : loud ? 'rgba(255,180,140,.9)' : 'rgba(225,228,240,.55)'; g.shadowColor = hot ? HOT : 'transparent'; g.shadowBlur = hot ? 30 : 0; g.fill(); g.shadowBlur = 0; });
      if (ph > .4) { const p = Math.min(1, (ph - .4) / .15), path = [0, 2, 5], seg = Math.min(1, Math.floor(p * 2)), f = p * 2 - seg, a = N[path[seg]], b = N[path[seg + 1]];
        g.strokeStyle = HOT; g.lineWidth = 2.5; g.beginPath(); g.arc((a[0] + (b[0] - a[0]) * f) * w, (a[1] + (b[1] - a[1]) * f) * h, 20, 0, 7); g.stroke(); }
    },
    bars(g, w, h, t) {
      g.fillStyle = '#070707'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(235,232,224,.12)'; g.fillRect(w * (.07 + i * .3), h * .08, w * .26, h * .16); g.fillStyle = 'rgba(235,232,224,.55)'; g.fillRect(w * (.1 + i * .3), h * .13, w * (.08 + .05 * Math.sin(t + i)), h * .05); }
      for (let i = 0; i < 9; i++) { const v = .25 + .5 * Math.abs(Math.sin(i * 1.7 + t * .7)) * (i / 9 + .3); g.fillStyle = i === 6 ? HOT : 'rgba(235,232,224,.38)'; g.fillRect(w * (.08 + i * .095), h * (.92 - v * .55), w * .06, h * v * .55); }
      g.strokeStyle = HOT; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 20; i++) { const x = w * (.08 + i * .042), y = h * (.52 - .16 * Math.sin(i * .45 + t * .9) - i * .006); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    },
  };
})();
