// Jazero – slová sa na chvíľu vynoria z hladiny a zase sa ponoria (a vynoria inde).
// Treba ťuknúť na slovo a kým je nad vodou, aj na jeho dvojicu. Hrá sa na čas.
// Dáta lekcie: rovnaké ako hra Páry – pairs = [['noisy', 'quiet', 'hlučný – tichý'], …], voliteľne pondTitle.
import { h, topbar, sample, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';
import { speak } from '../speech.js';
import { sfx, burst, floatText } from '../fx.js';
import config from '../../data/config.js';

const COUNT = 6;
const TIME = 90; // sekúnd na kolo
const LIFE = 4200; // ako dlho je slovo nad vodou (ms)
const HOLD = 5500; // ako dlho vydrží označené slovo
const MAX_UP = 5;
const SPAWN_MS = 900;

// Miesta na hladine (v %), v riadkoch striedavo dve a tri, aby sa slová neprekrývali.
const SLOTS = [];
[14, 30, 46, 62, 78, 92].forEach((y, row) => {
  for (const x of row % 2 ? [22, 50, 78] : [30, 70]) SLOTS.push({ x, y });
});

export function pond(lesson, rerender) {
  const title = lesson.pondTitle || config.ui.pond;
  const set = sample(lesson.pairs, Math.min(COUNT, lesson.pairs.length)).map((p, id) => ({ id, w: [p[0], p[1]], sk: p[2], done: false }));
  const words = set.flatMap((p) => p.w.map((text, side) => ({ p, text, side })));
  const key = `${lesson.id}.pond`;
  let found = 0, mistakes = 0, streak = 0, best = 0, left = TIME, dead = false, started = false;
  let held = null; // { word, el }
  const up = new Map(); // word -> { el, slot, timer }
  const timeouts = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timeouts.delete(t); if (!dead) fn(); }, ms); timeouts.add(t); return t; };
  const cancel = (t) => { clearTimeout(t); timeouts.delete(t); };
  let tick = null, spawner = null;

  const clock = h('span', { class: 'hud-score' }, `⏱ ${TIME} s`);
  const timeBar = h('div', { class: 'timebar-fill' });
  const status = h('div', { class: 'pond-status' });
  const caught = h('div', { class: 'caught' });
  const lake = h('div', { class: 'lake' }, h('div', { class: 'lake-shine' }));
  const intro = h('div', { class: 'lake-intro' },
    h('div', { class: 'lake-intro-icon' }, '🌊'),
    h('p', {}, 'Slová sa vynárajú z vody len na chvíľu.'),
    h('p', {}, 'Ťukni na slovo a potom na jeho ', h('b', {}, 'dvojicu'), ', kým sa neponorí.'),
    h('p', { class: 'muted' }, `Máš ${TIME} sekúnd na ${set.length} párov.`),
    h('button', { class: 'btn', type: 'button', onclick: start }, 'Štart!'));
  lake.append(intro);
  const el = h('div', { class: 'screen' }, topbar(title, clock),
    h('main', { class: 'wrap pond' }, h('div', { class: 'timebar' }, timeBar), status, lake, caught));

  function setStatus(text, cls = '') { status.className = 'pond-status ' + cls; status.textContent = text; }

  function start() {
    if (started) return;
    started = true;
    intro.remove();
    setStatus('Chyť pár!');
    tick = setInterval(() => {
      left--;
      clock.textContent = `⏱ ${left} s`;
      timeBar.style.width = `${(left / TIME) * 100}%`;
      clock.classList.toggle('hurry', left <= 10);
      if (left <= 0) end(false);
    }, 1000);
    spawn();
    spawner = setInterval(spawn, SPAWN_MS);
  }

  const free = () => SLOTS.filter((s) => ![...up.values()].some((u) => u.slot === s));

  // Vyberie slovo: často partnera toho, čo je práve hore, aby sa pár dal stihnúť.
  function nextWord() {
    const waiting = words.filter((w) => !w.p.done && !up.has(w));
    if (!waiting.length) return null;
    const partners = waiting.filter((w) => (held && held.word.p === w.p) || [...up.keys()].some((u) => u.p === w.p));
    if (partners.length && Math.random() < (held ? 0.85 : 0.55)) return pick(partners);
    return pick(waiting);
  }

  function spawn() {
    if (up.size >= MAX_UP) return;
    const slots = free();
    const word = nextWord();
    if (!word || !slots.length) return;
    const slot = pick(slots);
    const el = h('button', {
      class: 'lake-word', type: 'button',
      style: `left:${slot.x + (Math.random() * 8 - 4)}%;top:${slot.y}%;--life:${LIFE}ms`,
      onclick: () => tap(word),
    }, word.text);
    lake.append(el);
    const u = { el, slot, timer: later(() => sink(word), LIFE) };
    up.set(word, u);
  }

  function sink(word, cls = 'sink') {
    const u = up.get(word);
    if (!u) return;
    cancel(u.timer);
    up.delete(word);
    if (held?.word === word) { held = null; }
    u.el.classList.add(cls);
    u.el.disabled = true;
    setTimeout(() => u.el.remove(), 600);
  }

  function tap(word) {
    const u = up.get(word);
    if (!u || dead) return;
    if (!held) {
      held = { word };
      cancel(u.timer);
      u.el.classList.add('held');
      u.timer = later(() => { sink(word); setStatus('Ušlo ti! Skús znova.', 'ko'); streak = 0; }, HOLD);
      speak(word.text);
      setStatus(`${word.text} ↔ ?`, 'go');
      return;
    }
    if (held.word === word) { sink(word); held = null; setStatus('Chyť pár!'); return; }
    const first = held.word;
    if (first.p === word.p) catchPair(first, word);
    else {
      mistakes++;
      streak = 0;
      sfx.buzz();
      floatText(u.el, 'Ups!', 'oops');
      setStatus(`${first.text} ↔ ${word.text}? ${pick(MASCOT.nonsense)}`, 'ko');
      sink(first, 'miss');
      sink(word, 'miss');
    }
  }

  function catchPair(a, b) {
    const ua = up.get(a), ub = up.get(b);
    a.p.done = true;
    found++;
    streak++;
    best = Math.max(best, streak);
    sfx.pop(streak + 2);
    burst(ub.el, { symbols: ['💦', '✨', '⭐', '🐟'], count: 14 + streak * 3, spread: 110 });
    burst(ua.el, { symbols: ['💦', '✨'], count: 8, spread: 70 });
    if (streak >= 2) floatText(ub.el, `Combo ×${streak}!`, 'combo');
    held = null;
    sink(a, 'caught-word');
    sink(b, 'caught-word');
    const [x, y] = a.side === 0 ? [a.text, b.text] : [b.text, a.text];
    later(() => speak(`${x}, ${y}`), 150);
    caught.append(h('span', { class: 'caught-pair' }, `${x} ↔ ${y}`));
    setStatus(`${pick(MASCOT.ok)} ${x} ↔ ${y}${a.p.sk ? ` (${a.p.sk})` : ''}`, 'ok');
    // Ostatné vynorené slová toho páru už netreba.
    if (found === set.length) end(true);
  }

  function stopAll() {
    clearInterval(tick);
    clearInterval(spawner);
    for (const w of [...up.keys()]) sink(w);
  }

  function end(won) {
    if (dead) return;
    stopAll();
    if (won) {
      setStatus('Všetky páry vylovené! 🎉', 'ok');
      sfx.fanfare();
      lake.classList.add('splash');
      burst(lake, { symbols: ['🎉', '🐟', '💦', '⭐', '✨', '🐠'], count: 34, spread: 220 });
      later(() => burst(lake, { symbols: ['🎊', '⭐', '💥'], count: 24, spread: 160 }), 450);
    } else {
      setStatus('Čas vypršal! Ryby si zvyšok odniesli.', 'ko');
      sfx.buzz();
    }
    later(() => finish(won), won ? 2000 : 1300);
  }

  function finish(won) {
    dead = true;
    const n = set.length;
    const stars = won ? (mistakes <= 1 ? 3 : 2) : found >= n / 2 ? 1 : 0;
    const isBest = store.record(key, found, stars);
    el.replaceWith(resultView({
      title,
      big: `${found} z ${n} párov`,
      stars,
      verdict: (isBest && found > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('p', { class: 'muted' }, `${won ? `Zostalo ${left} s` : 'Čas vypršal'} · chyby: ${mistakes} · najdlhšie combo: ${best}`),
        set.map((p) => h('div', { class: 'recap-row' + (p.done ? ' ok' : ' missed') },
          h('span', { class: 'recap-mark' }, p.done ? '✓' : '·'),
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, `${p.w[0]} ↔ ${p.w[1]}`), p.sk && h('div', { class: 'sk' }, p.sk)),
          speakBtn(`${p.w[0]}, ${p.w[1]}`)))),
      again: rerender,
    }));
  }

  return { el, cleanup: () => { dead = true; clearInterval(tick); clearInterval(spawner); timeouts.forEach(clearTimeout); } };
}

// Dáta sú rovnaké ako pri hre Páry.
export { validate } from './pairs.js';
