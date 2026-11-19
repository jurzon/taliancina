// Zvukové efekty (Web Audio, bez súborov) a vizuálne efekty (výbuch, plávajúci text).
let ctx = null;

function tone(freq, dur, { type = 'sine', vol = 0.12, when = 0, slide } = {}) {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch { /* bez zvuku */ }
}

export const sfx = {
  beep: () => tone(880, 0.45, { vol: 0.15 }),
  // Čím dlhšia séria, tým vyšší tón.
  pop: (n = 0) => {
    const f = 440 * 2 ** (Math.min(n, 12) / 12 * 2);
    tone(f, 0.12, { type: 'triangle', vol: 0.16 });
    tone(f * 1.5, 0.22, { vol: 0.1, when: 0.07 });
  },
  buzz: () => tone(160, 0.32, { type: 'sawtooth', vol: 0.07, slide: 90 }),
  fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i > 3 ? 0.4 : 0.18, { type: 'triangle', vol: 0.12, when: i * 0.11 })),
};

const calm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Výbuch: z prvku (alebo bodu) vyletia symboly na všetky strany.
export function burst(target, { symbols = ['✨', '⭐', '💥', '🎉'], count = 14, spread = 120 } = {}) {
  if (calm()) return;
  const r = target.getBoundingClientRect ? target.getBoundingClientRect() : { left: target.x, top: target.y, width: 0, height: 0 };
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2 + Math.random() * 0.5;
    const d = spread * (0.5 + Math.random() * 0.7);
    const p = document.createElement('span');
    p.className = 'fx-bit';
    p.textContent = symbols[k % symbols.length];
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;--rot:${Math.random() * 540 - 270}deg;font-size:${14 + Math.random() * 14}px`;
    document.body.append(p);
    setTimeout(() => p.remove(), 900);
  }
}

// Plávajúci text (napr. „Combo ×3!“), ktorý vyletí hore a zmizne.
export function floatText(target, text, cls = '') {
  const r = target.getBoundingClientRect();
  const p = document.createElement('span');
  p.className = 'fx-float ' + cls;
  p.textContent = text;
  p.style.left = `${r.left + r.width / 2}px`;
  p.style.top = `${r.top}px`;
  document.body.append(p);
  setTimeout(() => p.remove(), 1200);
}
