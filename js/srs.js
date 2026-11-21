// Rozložené opakovanie (Leitnerove krabičky). Čo hráč nevedel, sa vráti o 1, 3, 7, 14 a 30 dní.
// Karta: { id, lesson, p: zadanie (po slovensky), t: správna odpoveď, alt: [], box, due }
// Správne a rýchlo → krabička vyššie. Správne, ale pomaly → ostáva. Zle → späť do prvej.
import { store } from './store.js';

const DAYS = [0, 1, 3, 7, 14, 30];
export const today = () => { const d = new Date(); return Math.floor((d - d.getTimezoneOffset() * 60000) / 864e5); };

// Na koľko ms má hráč nárok, aby odpoveď bola „rýchla“ (podľa dĺžky vety).
export const fastMs = (t) => 2500 + t.length * 180;

export function add({ id, lesson, p, t, alt = [] }) {
  const all = store.srs();
  all[id] = { id, lesson, p, t, alt, box: 1, due: today() + 1 };
  store.saveSrs();
}

export function due(lesson, max = 8) {
  const d = today();
  return Object.values(store.srs()).filter((c) => c.lesson === lesson && c.due <= d)
    .sort((a, b) => a.due - b.due || a.box - b.box).slice(0, max);
}

export const count = (lesson) => Object.values(store.srs()).filter((c) => c.lesson === lesson).length;

export function grade(id, ok, ms) {
  const c = store.srs()[id];
  if (!c) return;
  if (!ok) c.box = 1;
  else if (ms <= fastMs(c.t)) c.box = Math.min(DAYS.length - 1, c.box + 1);
  c.due = today() + DAYS[c.box];
  store.saveSrs();
}
