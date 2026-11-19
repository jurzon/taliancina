// Costellazioni – slovo v strede, okolo sa vynárajú slová; ťukaním skladáš ustálené spojenia.
import { h, topbar, sample, pick, shuffle, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';
import config from '../../data/config.js';

const ROUND_TIME = 40; // sekúnd na jedno slovo v strede
const LIFE = 4600; // ako dlho slovo svieti (ms)
const MAX_ON_SCREEN = 6;
const SVG = 'http://www.w3.org/2000/svg';

// Miesta, kde sa môžu slová objaviť (v % plochy); stred je vynechaný.
// Riadky sa striedajú (dve slová po stranách / jedno v strede), aby sa dlhé slová neprekrývali.
const SLOTS = [];
[9, 22, 35, 68, 80, 92].forEach((y, row) => {
  for (const x of row % 3 === 1 ? [50] : [27, 73]) SLOTS.push({ x, y });
});

const startsWith = (chain, prefix) => prefix.every((w, i) => chain[i] === w);

export function constellation(lesson, rerender) {
  const rounds = sample(lesson.rounds, Math.min(4, lesson.rounds.length));
  const key = `${lesson.id}.stars`;
  const log = []; // všetky spojenia: { phrase, sk, found }
  let ri = 0, score = 0, combo = 1, lastHit = 0, hits = 0, misses = 0;
  let dead = false, tick = null, spawner = null;
  const timeouts = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timeouts.delete(t); if (!dead) fn(); }, ms); timeouts.add(t); };

  let st = null; // stav aktuálneho kola

  const scoreEl = h('b', {}, '0');
  const comboEl = h('span', { class: 'combo' }, '');
  const dotsEl = h('span', { class: 'dots' });
  const timeBar = h('div', { class: 'timebar-fill' });
  const centerEl = h('div', { class: 'center-word' });
  const statusEl = h('div', { class: 'sky-status' });
  const lines = document.createElementNS(SVG, 'svg');
  lines.setAttribute('class', 'sky-lines');
  lines.setAttribute('viewBox', '0 0 100 100');
  lines.setAttribute('preserveAspectRatio', 'none');
  const sky = h('div', { class: 'sky' }, lines, h('div', { class: 'center' }, centerEl, statusEl));

  const el = h('div', { class: 'screen night' },
    topbar(config.ui.stars, h('span', { class: 'hud-score' }, scoreEl, ' b')),
    h('div', { class: 'hud' }, h('div', { class: 'timebar' }, timeBar), h('div', { class: 'hud-row' }, dotsEl, comboEl)),
    sky);

  function hud() {
    scoreEl.textContent = score;
    comboEl.textContent = combo > 1 ? `combo ×${combo}` : '';
    dotsEl.replaceChildren(...st.all.map((c) => h('i', { class: st.left.includes(c) ? '' : 'on' })));
  }

  function setStatus(text, cls = '') {
    statusEl.className = 'sky-status ' + cls;
    statusEl.textContent = text;
  }

  function clearLines() {
    lines.replaceChildren();
    st.from = { x: 50, y: 50 };
  }

  function drawLine(to) {
    const l = document.createElementNS(SVG, 'line');
    l.setAttribute('x1', st.from.x); l.setAttribute('y1', st.from.y);
    l.setAttribute('x2', to.x); l.setAttribute('y2', to.y);
    l.setAttribute('vector-effect', 'non-scaling-stroke');
    lines.append(l);
    st.from = to;
  }

  // Slová, ktoré by teraz boli správne.
  function wanted() {
    const next = new Set(), starters = new Set();
    for (const c of st.left) {
      starters.add(c.w[0]);
      if (st.prefix.length && startsWith(c.w, st.prefix)) next.add(c.w[st.prefix.length]);
    }
    return { next: [...next], starters: [...starters] };
  }

  function spawn(force) {
    if (dead || !st || st.over) return;
    const on = new Set(st.bubbles.map((b) => b.word));
    if (st.bubbles.length >= MAX_ON_SCREEN && !force) return;
    const { next, starters } = wanted();
    const good = (next.length ? next : starters).filter((w) => !on.has(w));
    const alsoGood = starters.filter((w) => !on.has(w));
    const bad = st.noise.filter((w) => !on.has(w) && !next.includes(w) && !starters.includes(w));
    let word;
    if (force) word = good[0];
    else {
      const r = Math.random();
      if (good.length && r < 0.6) word = pick(good);
      else if (alsoGood.length && r < 0.72) word = pick(alsoGood);
      else if (bad.length) word = pick(bad);
      else word = good[0] || alsoGood[0];
    }
    if (!word) return;
    const taken = new Set(st.bubbles.map((b) => b.slot));
    const free = SLOTS.filter((s) => !taken.has(s));
    if (!free.length) return;
    const slot = pick(free);
    const pos = { x: slot.x + (Math.random() * 4 - 2), y: slot.y + (Math.random() * 4 - 2) };
    const b = { word, slot, pos, gone: false };
    b.el = h('button', { class: 'bubble', type: 'button', style: `left:${pos.x}%;top:${pos.y}%;animation-duration:${LIFE}ms` }, word);
    b.el.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(b); });
    st.bubbles.push(b);
    sky.append(b.el);
    later(() => remove(b), LIFE);
  }

  function remove(b) {
    if (b.gone) return;
    b.gone = true;
    b.el.remove();
    if (st) st.bubbles = st.bubbles.filter((x) => x !== b);
  }

  function pop(b, cls) {
    if (b.gone) return;
    b.gone = true;
    st.bubbles = st.bubbles.filter((x) => x !== b);
    b.el.style.animation = 'none';
    void b.el.offsetWidth; // aby sa prechod spustil z viditeľného stavu
    b.el.classList.add(cls);
    const node = b.el;
    setTimeout(() => node.remove(), 450);
  }

  function tap(b) {
    if (dead || b.gone || st.over) return;
    let used = [...st.prefix, b.word];
    let match = st.left.filter((c) => startsWith(c.w, used));
    if (!match.length && st.prefix.length) { // prepnutie na iné spojenie
      used = [b.word];
      match = st.left.filter((c) => startsWith(c.w, used));
      if (match.length) clearLines();
    }
    if (!match.length) {
      combo = 1;
      misses++;
      pop(b, 'miss');
      setStatus(`«${[st.round.c, ...st.prefix, b.word].join(' ')}»? ${pick(MASCOT.nonsense)}`, 'ko');
      hud();
      return;
    }
    const now = performance.now();
    combo = now - lastHit < 4000 ? Math.min(combo + 1, 5) : 1;
    lastHit = now;
    score += 10 * combo;
    hits++;
    drawLine(b.pos);
    pop(b, 'hit');

    const doneChain = match.find((c) => c.w.length === used.length);
    if (doneChain) {
      score += 15 * used.length * combo + (used.length > 1 ? 20 : 0);
      st.left = st.left.filter((c) => c !== doneChain);
      st.prefix = [];
      setStatus(`✓ ${doneChain.phrase} · ${doneChain.sk}`, 'ok');
      centerEl.classList.remove('pulse');
      void centerEl.offsetWidth;
      centerEl.classList.add('pulse');
      later(clearLines, 700);
      hud();
      if (!st.left.length) endRound(true);
    } else {
      st.prefix = used;
      setStatus(`${st.round.c} ${used.join(' ')} …`, 'go');
      hud();
      later(() => spawn(true), 250); // ďalšie slovo frázy nenechá na seba čakať
    }
  }

  function startRound() {
    const round = rounds[ri];
    st = {
      round, all: round.chains, left: [...round.chains], prefix: [], bubbles: [], from: { x: 50, y: 50 },
      noise: shuffle([...round.x, ...round.chains.flatMap((c) => c.w.slice(1))]),
      t: ROUND_TIME, over: false,
    };
    combo = 1;
    centerEl.textContent = round.c;
    setStatus(`${ri + 1}/${rounds.length} · ťukaj slová, ktoré sa k nemu hodia`);
    lines.replaceChildren();
    hud();
    spawn(); spawn();
    spawner = setInterval(spawn, 800);
    tick = setInterval(() => {
      st.t -= 0.1;
      timeBar.style.width = Math.max(0, (st.t / ROUND_TIME) * 100) + '%';
      if (st.t <= 0) endRound(false);
    }, 100);
  }

  function endRound(allFound) {
    if (st.over) return;
    st.over = true;
    clearInterval(spawner); clearInterval(tick);
    if (allFound) score += Math.round(st.t) * 3;
    for (const c of st.all) log.push({ phrase: c.phrase, sk: c.sk, found: !st.left.includes(c) });
    [...st.bubbles].forEach((b) => pop(b, 'fade'));
    hud();
    if (allFound) setStatus(`✓ Všetky spojenia! +${Math.round(st.t) * 3} b za čas`, 'ok');
    else setStatus('Čas vypršal. Ide sa ďalej!', '');
    later(() => {
      ri++;
      if (ri < rounds.length) startRound();
      else finish();
    }, 1600);
  }

  function finish() {
    const found = log.filter((x) => x.found).length;
    const ratio = found / log.length;
    // Hviezdy sú za nájdené spojenia aj za presnosť – ťukať naslepo na všetko sa neoplatí.
    const accuracy = hits + misses ? hits / (hits + misses) : 0;
    const stars = ratio >= 0.9 && accuracy >= 0.8 ? 3 : ratio >= 0.6 && accuracy >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
    const isBest = store.record(key, score, stars);
    cleanup();
    el.replaceWith(resultView({
      title: config.ui.stars,
      big: `${score} bodov`,
      stars,
      verdict: (isBest ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('h2', {}, `Spojenia: ${found} z ${log.length}`),
        h('p', { class: 'muted' }, `Presnosť ťukania: ${Math.round(accuracy * 100)} %`),
        log.map((x) => h('div', { class: 'recap-row' + (x.found ? '' : ' missed') },
          h('span', { class: 'recap-mark' }, x.found ? '✓' : '○'),
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, x.phrase), h('div', { class: 'sk' }, x.sk)),
          speakBtn(x.phrase)))),
      again: rerender,
    }));
  }

  function cleanup() {
    dead = true;
    clearInterval(spawner); clearInterval(tick);
    timeouts.forEach(clearTimeout);
    timeouts.clear();
  }

  // Úvodná obrazovka kola
  const intro = h('div', { class: 'sky-intro' },
    h('h1', {}, config.ui.stars),
    h('p', {}, 'V strede svieti slovo. Okolo sa vynárajú ďalšie – ťukaj tie, ktoré s ním tvoria spojenie.'),
    h('p', {}, 'Viacslovné frázy ťukaj v poradí: ', h('b', {}, config.ui.starsExample), '. Rýchle zásahy za sebou zvyšujú combo.'),
    h('p', { class: 'muted' }, `Omyl stojí len combo a kúsok presnosti. ${config.mascot.watching}`),
    h('button', { class: 'btn', type: 'button', onclick: () => { intro.remove(); startRound(); } }, 'Rozsvieť oblohu'),
    store.best(key) > 0 && h('p', { class: 'muted' }, `Tvoj rekord: ${store.best(key)} b`));
  sky.append(intro);

  return { el, cleanup };
}

// Kontrola obsahu pre tools/validate.mjs; vráti krátke zhrnutie.
export function validate(l, err) {
  if (!l.rounds.length) err('súhvezdia: lekcia nemá žiadne kolo (rounds)');
  for (const r of l.rounds) {
    const ok = new Set(r.chains.flatMap((c) => c.w));
    const seen = new Set();
    for (const c of r.chains) {
      const id = c.w.join(' ');
      if (seen.has(id)) err(`súhvezdie „${r.c}“: duplicitné spojenie ${id}`);
      seen.add(id);
      if (!c.sk) err(`súhvezdie „${r.c}“: ${id} nemá preklad`);
      for (const o of r.chains) {
        if (o !== c && o.w.length > c.w.length && c.w.every((w, i) => o.w[i] === w)) err(`súhvezdie „${r.c}“: ${id} je začiatkom iného spojenia`);
      }
    }
    for (const x of r.x) if (ok.has(x)) err(`súhvezdie „${r.c}“: nezmysel „${x}“ je zároveň správne slovo`);
    if (new Set(r.x).size !== r.x.length) err(`súhvezdie „${r.c}“: duplicitné nezmysly`);
  }
  return `${l.rounds.length} súhvezdí (${l.rounds.reduce((n, r) => n + r.chains.length, 0)} spojení)`;
}
