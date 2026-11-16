// Načítanie lekcií a práca s textom. Bez DOM – používa to aj tools/validate.mjs.
import common from '../data/common.js';
import l6a from '../data/lezione6a.js';
import l6b from '../data/lezione6b.js';

// Rovné úvodzovky v slovenských textoch → správna slovenská koncová úvodzovka.
function polish(v) {
  if (typeof v === 'string') return v.replace(/"/g, '“');
  if (Array.isArray(v)) return v.map(polish);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, polish(x)]));
  return v;
}

export function parseGloss(src) {
  const map = {};
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const [form, sk, lemma, note] = line.split('|').map((s) => s.trim());
    map[form.toLowerCase()] = { sk, lemma: lemma || '', note: note || '' };
  }
  return map;
}

const commonGloss = parseGloss(polish(common));

export const lessons = [l6a, l6b].map((raw) => {
  const l = polish(raw);
  l.gloss = parseGloss(l.gloss);
  l.rounds = l.rounds.map((r) => ({
    c: r.c,
    x: r.x,
    chains: r.chains.map(([w, sk]) => ({ w: w.split('|'), sk, phrase: `${r.c} ${w.split('|').join(' ')}` })),
  }));
  return l;
});

export const lessonById = (id) => lessons.find((l) => l.id === id);

export function lookup(lesson, key) {
  const k = key.toLowerCase();
  if (lesson.gloss[k]) return lesson.gloss[k];
  if (commonGloss[k]) return commonGloss[k];
  for (const l of lessons) if (l.gloss[k]) return l.gloss[k];
  return null;
}

// Rozloží riadok príbehu na ťukateľné slová a oddeľovače.
const TOKEN = /\[([^\]]+)\]|(\p{L}+'?)|([^\p{L}[]+)/gu;
export function tokenize(line) {
  const out = [];
  for (const m of line.matchAll(TOKEN)) {
    if (m[3] !== undefined) { out.push({ sep: m[3] }); continue; }
    if (m[2] !== undefined) { out.push({ text: m[2], key: m[2].toLowerCase() }); continue; }
    const [text, ...opts] = m[1].split('|');
    const tok = { text, key: text.toLowerCase() };
    for (const o of opts) {
      const [k, v] = o.split('=');
      if (k === 'q') tok.q = v;
      if (k === 'g') tok.key = v.toLowerCase();
    }
    out.push(tok);
  }
  return out;
}

export const plain = (line) => tokenize(line).map((t) => t.sep ?? t.text).join('');

// Skladačka viet
export const norm = (s) => s.toLowerCase().replace(/[.,!?;:«»]/g, '').replace(/\s+/g, ' ').trim();
export function tilesOf(sentence) {
  return sentence.replace(/[.,!?;:«»]/g, '').split(/\s+/).filter(Boolean)
    .map((w, i) => (i === 0 ? w[0].toLowerCase() + w.slice(1) : w));
}
