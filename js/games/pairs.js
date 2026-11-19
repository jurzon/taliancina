// Páry – ťukni na slovo vľavo a jeho dvojicu vpravo (napr. opozitá: noisy ↔ quiet).
// Každý správny pár naleje jeden pohár, chyba trochu rozleje. Séria bez chyby = combo.
// Dáta lekcie: pairs = [['noisy', 'quiet', 'hlučný – tichý'], …] (tretí prvok, preklad, je voliteľný),
// pairsTitle a pairsHint (voliteľné, inak sa použije config.ui.pairs).
import { h, topbar, sample, shuffle, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';
import { speak } from '../speech.js';
import { sfx, burst, floatText } from '../fx.js';
import config from '../../data/config.js';

const COUNT = 6;

const glass = () => h('div', { class: 'mug' },
  h('div', { class: 'mug-glass' }, h('div', { class: 'mug-drink' }, h('div', { class: 'mug-foam' }))),
  h('div', { class: 'mug-handle' }));

export function pairs(lesson, rerender) {
  const title = lesson.pairsTitle || config.ui.pairs;
  const set = sample(lesson.pairs, Math.min(COUNT, lesson.pairs.length))
    // Pár sa náhodne otočí; preklad „hlučný – tichý“ sa otočí s ním.
    .map((p, id) => (Math.random() < 0.5
      ? { id, a: p[0], b: p[1], sk: p[2] }
      : { id, a: p[1], b: p[0], sk: p[2]?.split(' – ').reverse().join(' – ') }));
  const key = `${lesson.id}.pairs`;
  let started = 0, tick = null;
  const missed = new Set();
  let mistakes = 0, found = 0, streak = 0, best = 0, left = null, over = false;

  const clock = h('span', { class: 'hud-score' }, '⏱ 0 s');
  const mugs = set.map(glass);
  const spills = h('div', { class: 'spills' });
  const bar = h('div', { class: 'mugs' }, mugs);
  const status = h('div', { class: 'pairs-status' }, lesson.pairsHint || 'Ťukni na slovo vľavo a potom na jeho dvojicu vpravo.');
  const comboEl = h('div', { class: 'combo-badge', hidden: true });
  const mk = (p, side) => {
    const b = h('button', { class: 'tile pair', type: 'button', onclick: () => tap(p, side, b) }, side === 'a' ? p.a : p.b);
    p[side + 'El'] = b;
    return b;
  };
  const colA = h('div', { class: 'pair-col' }, set.map((p) => mk(p, 'a')));
  const colB = h('div', { class: 'pair-col' }, shuffle(set).map((p) => mk(p, 'b')));
  const main = h('main', { class: 'wrap pairs' },
    h('div', { class: 'mug-bar' }, bar, spills, comboEl),
    status,
    h('div', { class: 'pair-board' }, colA, colB));
  const el = h('div', { class: 'screen' }, topbar(title, clock), main);

  const secs = () => (started ? Math.round((Date.now() - started) / 1000) : 0);
  function startClock() {
    if (started) return;
    started = Date.now();
    tick = setInterval(() => { clock.textContent = `⏱ ${secs()} s`; }, 500);
  }

  function shake(b) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }

  function tap(p, side, btn) {
    if (over) return;
    startClock();
    if (side === 'a') {
      set.forEach((q) => q.aEl.classList.remove('sel'));
      left = p;
      btn.classList.add('sel');
      speak(p.a);
      return;
    }
    if (!left) { status.textContent = 'Najprv vyber slovo vľavo.'; shake(btn); return; }
    if (left.id === p.id) hit(p, btn);
    else miss(p, btn);
  }

  function hit(p, btn) {
    streak++;
    best = Math.max(best, streak);
    const mug = mugs[found];
    found++;
    for (const b of [p.aEl, p.bEl]) { b.classList.remove('sel'); b.classList.add('matched'); b.disabled = true; }
    sfx.pop(streak);
    burst(btn, { count: 10 + streak * 3, spread: 90 + streak * 15 });
    burst(p.aEl, { count: 8, spread: 70 });
    mug.classList.add('full');
    later(() => burst(mug, { symbols: ['🫧', '✨'], count: 6, spread: 50 }), 450);
    if (streak >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = `Combo ×${streak}`;
      comboEl.classList.remove('bump'); void comboEl.offsetWidth; comboEl.classList.add('bump');
      floatText(btn, `Combo ×${streak}!`, 'combo');
    }
    later(() => speak(`${p.a}, ${p.b}`), 150);
    status.textContent = `${pick(MASCOT.ok)} ${p.a} ↔ ${p.b}${p.sk ? ` (${p.sk})` : ''}`;
    left = null;
    if (found === set.length) win();
  }

  function miss(p, btn) {
    mistakes++;
    streak = 0;
    comboEl.hidden = true;
    missed.add(left.id);
    sfx.buzz();
    shake(btn);
    shake(left.aEl);
    const mug = mugs[found] || mugs[mugs.length - 1];
    mug.classList.remove('spill'); void mug.offsetWidth; mug.classList.add('spill');
    spills.append(h('span', { class: 'drop' }, '💧'));
    floatText(btn, 'Ups!', 'oops');
    status.textContent = `${left.a} ↔ ${p.b}? ${pick(MASCOT.nonsense)}`;
  }

  const timers = new Set();
  function later(fn, ms) { const t = setTimeout(() => { timers.delete(t); if (el.isConnected) fn(); }, ms); timers.add(t); }

  function win() {
    over = true;
    clearInterval(tick);
    bar.classList.add('cheers');
    status.textContent = mistakes === 0 ? 'Všetko bez chyby. Na zdravie! 🥂' : 'Hotovo. Na zdravie!';
    later(() => { sfx.fanfare(); burst(bar, { symbols: ['🎉', '⭐', '✨', '🥤', '💥'], count: 28, spread: 200 }); }, 300);
    later(finish, 1900);
  }

  function finish() {
    const time = secs();
    const clean = set.length - missed.size;
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : mistakes <= 4 ? 1 : 0;
    const isBest = store.record(key, clean, stars);
    el.replaceWith(resultView({
      title,
      big: `${clean} z ${set.length} bez chyby`,
      stars,
      verdict: (isBest && clean > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('div', { class: 'mugs result-mugs' }, set.map((_, k) => {
          const m = glass();
          if (k < clean) m.classList.add('full');
          return m;
        })),
        h('p', { class: 'muted' }, `Čas: ${time} s · chyby: ${mistakes} · najdlhšie combo: ${best}`),
        set.map((p) => h('div', { class: 'recap-row' + (missed.has(p.id) ? '' : ' ok') },
          h('span', { class: 'recap-mark' }, missed.has(p.id) ? '✗' : '✓'),
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, `${p.a} ↔ ${p.b}`), p.sk && h('div', { class: 'sk' }, p.sk)),
          speakBtn(`${p.a}, ${p.b}`)))),
      again: rerender,
    }));
  }

  return { el, cleanup: () => { clearInterval(tick); timers.forEach(clearTimeout); } };
}

export function validate(l, err) {
  if (!l.pairs?.length) { err('páry: lekcia nemá páry (pairs)'); return '0 párov'; }
  const words = l.pairs.flatMap((p) => [p[0], p[1]]);
  if (new Set(words).size !== words.length) err('páry: každé slovo môže byť len v jednom páre, inak by mal hráč dve správne odpovede');
  for (const p of l.pairs) if (!p[0] || !p[1]) err(`páry: neúplný pár ${JSON.stringify(p)}`);
  return `${l.pairs.length} párov`;
}
