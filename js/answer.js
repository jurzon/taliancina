// Kontrola napísaných a vyslovených odpovedí. Bez DOM.
// Správna odpoveď môže mať voliteľné časti v zátvorkách: '(Excuse me,) where is the station?'
// a ďalšie znenia v poli alt. Stiahnuté tvary (where's = where is) sú v config.equivalents.
import config from '../data/config.js';

const EQ = Object.entries(config.equivalents || {}).map(([k, v]) => [new RegExp(`(^| )${k}(?= |$)`, 'g'), `$1${v}`]);

export function normalize(s) {
  let t = ` ${String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim()} `;
  for (const [re, v] of EQ) t = t.replace(re, v);
  return t.replace(/\s+/g, ' ').trim();
}

// '(A) b (c)' → ['A b c', 'A b', 'b c', 'b']
export function variants(t) {
  const m = t.match(/\(([^()]*)\)/);
  if (!m) return [t.replace(/\s+/g, ' ').trim()];
  const before = t.slice(0, m.index), after = t.slice(m.index + m[0].length);
  return [...variants(before + m[1] + after), ...variants(before + after)];
}

// Ako sa správna odpoveď ukáže: zátvorky preč, ich obsah ostane.
// Prvé písmeno veľké, aj keď voliteľný začiatok chýba: '(Excuse me,) how…' → 'How…'.
export const display = (t) => { const s = t.replace(/[()]/g, '').replace(/\s+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };

export function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

// → { ok, typo, best } ; best = znenie najbližšie k odpovedi (na zobrazenie rozdielu)
export function check(input, t, alt = []) {
  const all = [t, ...alt].flatMap(variants);
  const n = normalize(input);
  let best = display(t), dist = Infinity;
  for (const v of all) {
    const d = lev(n, normalize(v));
    if (d < dist) { dist = d; best = v; }
  }
  if (dist > 1) {
    // Mobil často vynechá apostrof a dĺžne (dont, wheres, cafe) – to berieme ako preklep.
    const r = rough(input);
    for (const v of all) if (lev(r, rough(v)) <= 1) return { ok: r.length > 0, typo: true, best: display(v) };
  }
  return { ok: dist <= 1 && n.length > 0, typo: dist === 1, best: display(best) };
}

export const rough = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/[’'‘`]/g, '').replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();

// Slová správnej vety, ktoré v odpovedi chýbajú alebo sú inak → [{ w, ok }]
export function diffWords(input, target) {
  const have = normalize(input).split(' ');
  return display(target).split(/\s+/).map((w) => {
    // Stiahnutý tvar je jedno slovo, ale po normalizácii viac (let's → let us): musia sedieť všetky časti.
    const ks = normalize(w).split(' ').filter(Boolean);
    if (!ks.length) return { w, ok: true };
    const left = [...have];
    const ok = ks.every((k) => { const i = left.indexOf(k); if (i >= 0) left.splice(i, 1); return i >= 0; });
    if (ok) have.splice(0, have.length, ...left);
    return { w, ok };
  });
}

// Podiel slov cieľovej vety, ktoré zazneli (rozpoznávanie reči vracia viac možností).
export function heardRatio(alternatives, target) {
  const want = normalize(display(target)).split(' ');
  let best = 0;
  for (const a of alternatives) {
    const got = normalize(a).split(' ');
    const hit = want.filter((w) => { const i = got.indexOf(w); if (i >= 0) got.splice(i, 1); return i >= 0; }).length;
    best = Math.max(best, hit / want.length);
  }
  return best;
}

// Nápoveda: prvé písmená slov, 'Where is the castle?' → 'W____ i_ t__ c_____?'
export const initials = (t) => display(t).replace(/\p{L}+/gu, (w) => w[0] + '_'.repeat(w.length - 1));

// Obsahuje text frázu? (kontrolný zoznam pri písaní)
export const hasPhrase = (text, phrase) => ` ${normalize(text)} `.includes(` ${normalize(phrase)} `);

// Ktoré slovo má preklep? → [napísané, správne] alebo null (len keď sedí počet slov).
export function typoWord(input, target) {
  const clean = (w) => w.toLowerCase().replace(/[.,!?;:«»]/g, '');
  const a = input.trim().split(/\s+/), b = display(target).split(/\s+/);
  if (a.length !== b.length) return null;
  for (let i = 0; i < a.length; i++) if (clean(a[i]) !== clean(b[i])) return [a[i].replace(/[.,!?;:]/g, ''), b[i].replace(/[.,!?;:]/g, '')];
  return null;
}

// Rozdelí správne slovo na [spoločný začiatok, inú časť, spoločný koniec] voči napísanému.
export function wordFix(wrong, right) {
  const w = wrong.toLowerCase(), r = right.toLowerCase();
  let i = 0;
  while (i < w.length && i < r.length && w[i] === r[i]) i++;
  let j = 0;
  while (j < w.length - i && j < r.length - i && w[w.length - 1 - j] === r[r.length - 1 - j]) j++;
  return [right.slice(0, i), right.slice(i, right.length - j), right.slice(right.length - j)];
}

// Slová odpovede, ktoré v správnej vete nie sú (na prečiarknutie) → [{ w, ok }]
export const extraWords = (input, target) => diffWords(target, input);
