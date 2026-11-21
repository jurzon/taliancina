// Textová hra (Adventure): stav sveta, parser príkazov a podmienky. Bez DOM – používa to aj validate.
// Všetky texty v cieľovom jazyku (názvy, slovesá, hlášky) sú v dátach lekcie (lesson.adventure).
//
// Stav: { place, money, time, items: [], flags: [], known: [], visited: [], given: [], drilled: [], pts }
// time = minúty od polnoci (600 = 10:00).
import { normalize, lev } from './answer.js';

export const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

export function newState(A) {
  return {
    place: A.start, money: A.state.money, time: A.state.time,
    items: [], flags: [], known: [...(A.places[A.start].known || [])],
    visited: [], given: [], drilled: [], where: [], pts: 0, max: 0, over: false,
  };
}

// Podmienka v dátach: { has, not, flag, noflag, money, after, before, given }
export function cond(c, st) {
  if (!c) return true;
  if (c.has && !st.items.includes(c.has)) return false;
  if (c.not && (st.items.includes(c.not) || st.given.includes(c.not))) return false;
  if (c.flag && !st.flags.includes(c.flag)) return false;
  if (c.given && !st.given.includes(c.given)) return false;
  if (c.noflag && st.flags.includes(c.noflag)) return false;
  if (c.money != null && st.money < c.money) return false;
  if (c.after != null && st.time < c.after) return false;
  if (c.before != null && st.time >= c.before) return false;
  return true;
}

// Miesta, kam hráč vie trafiť: tie, o ktorých počul, a s mapou aj všetky na mape.
export function knownPlaces(A, st) {
  const map = A.mapItem && st.items.includes(A.mapItem);
  return Object.keys(A.places).filter((id) => st.known.includes(id) || (map && A.places[id].onMap));
}

export const peopleHere = (A, st) => (A.places[st.place].people || []).filter((id) => cond(A.people[id].when, st));
export const itemsHere = (A, st) => (A.places[st.place].items || [])
  .filter((id) => !st.items.includes(id) && !st.given.includes(id) && !st.flags.includes(`took:${id}`));

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// Anglický príkaz pre tlačidlo / kanonický tvar. V = A.verbs, prvé synonymum je správny tvar.
export function command(A, verb, id) {
  const V = A.verbs[verb][0];
  if (verb === 'go') return `${V} ${A.places[id].name}`;
  if (verb === 'talk') return `${V} ${A.people[id].name}`;
  if (verb === 'take' || verb === 'examine') return `${V} ${A.items[id].name}`;
  if (verb === 'give') return fill(V, { item: A.items[id].name, person: A.people[A.final.person].name });
  if (verb === 'where') return A.items[id] ? `${V} ${A.items[id].a}?` : `${A.verbs.whereIs[0]} ${A.places[id].name}?`;
  return V;
}

// Tlačidlá akcií na aktuálnom mieste.
export function actions(A, st) {
  const out = [];
  const here = A.places[st.place];
  for (const id of peopleHere(A, st)) out.push({ verb: 'talk', id });
  for (const id of itemsHere(A, st)) out.push({ verb: 'take', id });
  if (st.flags.includes(A.final.flag)) {
    for (const id of A.goal.items) if (st.items.includes(id)) out.push({ verb: 'give', id });
    out.push({ verb: 'card' });
  } else if (st.place === A.final.place) out.push({ verb: 'wait' });
  for (const id of knownPlaces(A, st)) if (id !== st.place && here.exits?.[id] != null) out.push({ verb: 'go', id });
  if (A.mapItem && st.items.includes(A.mapItem)) out.push({ verb: 'examine', id: A.mapItem });
  // Otázka na vec, o ktorej hráč ešte nevie, kde ju kúpi (keď je tu niekto, koho sa dá opýtať).
  const unknown = A.goal.items.find((id) => !st.items.includes(id) && !st.given.includes(id) && !knowsWhere(A, st, id));
  if (unknown && peopleHere(A, st).length) out.push({ verb: 'where', id: unknown });
  out.push({ verb: 'look' });
  out.push({ verb: 'time' });
  return out.map((a) => ({ ...a, text: command(A, a.verb, a.id) }));
}

// Všetky príkazy, ktorým parser rozumie (aj tie, čo sa teraz nedajú urobiť).
function candidates(A) {
  const out = [];
  // bare = tvar bez členu, hoci správny názov ho má (market vs the market) → uzná sa, ale opraví.
  const add = (verb, id, names, main) => {
    for (const v of A.verbs[verb]) for (const n of names) {
      const text = v.includes('{') ? fill(v, n) : `${v} ${n}`.trim();
      const nm = typeof n === 'string' ? n : n.item;
      const bare = /^the /i.test(main || '') && !/^(the|a|an) /i.test(nm);
      out.push({ verb, id, text, bare });
    }
  };
  for (const [id, p] of Object.entries(A.places)) add('go', id, [p.name, ...(p.aliases || [])], p.name);
  for (const [id, p] of Object.entries(A.people)) add('talk', id, [p.name, ...(p.aliases || [])], p.name);
  for (const [id, it] of Object.entries(A.items)) {
    const names = [it.name, ...(it.aliases || [])];
    add('take', id, names, it.name);
    add('examine', id, names, it.name);
    const tom = A.people[A.final.person];
    if (A.goal.items.includes(id)) add('give', id, names.flatMap((item) => [tom.name, ...(tom.aliases || [])].map((person) => ({ item, person }))), it.name);
  }
  for (const verb of ['look', 'time', 'wait', 'inventory', 'card']) for (const v of A.verbs[verb] || []) out.push({ verb, text: v });
  return out;
}

// Vie hráč, kde vec zohnať? (opýtal sa, videl reklamu na mape, alebo pozná miesto, kde ju predávajú)
export const knowsWhere = (A, st, id) => st.where.includes(id);

const SMALL = new Set(['the', 'a', 'an', 'to', 'at', 'please', 'some', 'my']);
const strip = (s) => normalize(s).split(' ').filter((w) => !SMALL.has(w)).join(' ');

// Rozumie príkazu? → { verb, id, canonical, quality: 'exact' | 'form' | 'typo' | 'short' } alebo null.
// form = chýbajú malé slová (to, the), typo = preklep, short = iba názov miesta.
// st (voliteľné): uprednostní ľudí a veci, ktoré sú práve tu (the man = ten, čo tu stojí).
export function parse(input, A, st) {
  const here = st ? new Set([...peopleHere(A, st), ...itemsHere(A, st), ...st.items]) : null;
  let n = normalize(input);
  for (let k = 0; k < 3; k++) n = n.replace(/^(excuse me|sorry|please|hello|hi|ok|okay) /, '').replace(/ please$/, '');
  n = n.replace(/^(i want to|i would like to|let us|lets|i will) /, '');
  if (!n) return null;
  // Otázka „where…“: kde kúpim vec / kde je miesto.
  if (/^where /.test(n) && A.verbs.where) {
    const words = ` ${n} `;
    const has = (names) => names.some((x) => { const k = strip(x); return k && words.includes(` ${k} `); });
    const it = Object.entries(A.items).find(([, v]) => has([v.name, v.a, ...(v.aliases || [])]));
    const pl = !it && Object.entries(A.places).find(([, v]) => has([v.name, ...(v.aliases || [])]));
    const id = it?.[0] || pl?.[0];
    if (id) {
      const canonical = command(A, 'where', id);
      const good = it
        ? [it[1].a, it[1].name, ...(it[1].aliases || [])].some((x) => new RegExp(`^where (can i (buy|find|get)|do they sell) (a |an |some |the )?${strip(x)}$`).test(n))
        : normalize(canonical) === n;
      return { verb: 'where', id, quality: good ? 'exact' : 'form', canonical };
    }
  }
  let best = null;
  for (const c of candidates(A)) {
    const cn = normalize(c.text);
    let q = null, d = 0;
    if (cn === n) q = c.bare ? 'form' : 'exact';
    else if (strip(c.text) === strip(n)) q = 'form';
    else {
      d = lev(strip(n), strip(c.text));
      if (d <= (strip(c.text).length > 6 ? 2 : 1)) q = 'typo';
    }
    if (!q) continue;
    const away = here && c.id && c.verb !== 'go' && !here.has(c.id) ? 5 : 0;
    const rank = { exact: 0, form: 1, typo: 2 }[q] * 10 + d + away;
    if (!best || rank < best.rank) best = { ...c, quality: q, rank };
  }
  if (!best) {
    // Iba názov miesta: „market“ → go to the market
    for (const [id, p] of Object.entries(A.places)) {
      if ([p.name, ...(p.aliases || [])].some((x) => strip(x) === strip(n))) best = { verb: 'go', id, quality: 'short' };
    }
  }
  if (!best) return null;
  return { verb: best.verb, id: best.id, quality: best.quality, canonical: command(A, best.verb, best.id) };
}

// Kroky rozhovoru: vyberie variant podľa podmienky (talk: [{ if, steps }]).
export const talkSteps = (A, id, st) => (A.people[id].talk.find((v) => cond(v.if, st)) || A.people[id].talk.at(-1)).steps;

// Všetky kroky (aj vnorené) – na kontrolu dát.
export function* walkSteps(steps) {
  for (const s of steps || []) {
    yield s;
    yield* walkSteps(s.then);
    yield* walkSteps(s.else);
    for (const o of s.choose || []) { yield o; yield* walkSteps(o.then); }
  }
}
