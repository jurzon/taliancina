// Roztrieď – slovo pomaly padá a hráč ho musí ťuknutím poslať do správnej skupiny.
// Dáta lekcie: sortTitle (voliteľné) a
// sort = { bins: [{ name, sk, icon }], items: [['cathedral', 0, 'katedrála', '⛪'], …] }
// (slovo, index skupiny, preklad, ikona – ikona sa ukáže až po odpovedi, aby neprezradila význam).
import { h, topbar, shuffle, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';
import { speak } from '../speech.js';
import { sfx, burst, floatText } from '../fx.js';
import config from '../../data/config.js';

const FALL_START = 11000; // ms, za koľko slovo dopadne na začiatku
const FALL_MIN = 6000;
const FALL_STEP = 250; // o koľko sa pád zrýchli po každom správnom slove

export function sort(lesson, rerender) {
  const title = lesson.sortTitle || config.ui.sort;
  const { bins } = lesson.sort;
  const items = shuffle(lesson.sort.items).map(([w, bin, sk, icon]) => ({ w, bin, sk, icon, ok: null }));
  const key = `${lesson.id}.sort`;
  let i = 0, right = 0, streak = 0, best = 0, fall = FALL_START, busy = false, dead = false, landTimer = null;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); return t; };

  const progress = h('span', { class: 'hud-score' });
  const sky = h('div', { class: 'sort-sky' });
  const status = h('div', { class: 'sort-status' }, 'Ťukni na skupinu, kam slovo patrí, kým nedopadne.');
  const counts = bins.map(() => h('span', { class: 'bin-count' }, '0'));
  const binEls = bins.map((b, k) => h('button', { class: 'bin', type: 'button', onclick: () => answer(k) },
    h('span', { class: 'bin-icon' }, b.icon),
    h('span', { class: 'bin-name' }, b.name),
    b.sk && h('span', { class: 'bin-sk' }, b.sk),
    counts[k]));
  const el = h('div', { class: 'screen' }, topbar(title, progress),
    h('main', { class: 'wrap sort' }, status, sky, h('div', { class: 'bins' }, binEls)));

  function show() {
    const it = items[i];
    busy = false;
    progress.textContent = `${i + 1}/${items.length}`;
    const card = h('div', { class: 'falling', style: `--fall:${fall}ms` },
      h('span', { class: 'falling-word' }, it.w), speakBtn(it.w));
    sky.replaceChildren(card);
    it.el = card;
    later(() => speak(it.w), 200);
    landTimer = later(() => answer(-1), fall);
  }

  function answer(k) {
    if (busy || i >= items.length) return;
    busy = true;
    clearTimeout(landTimer);
    const it = items[i];
    const card = it.el;
    const target = binEls[it.bin];
    const ok = k === it.bin;
    it.ok = ok;
    card.style.top = getComputedStyle(card).top; // zastaví pád tam, kde práve je
    card.classList.add('stop');
    card.querySelector('.falling-word').textContent = `${it.icon || ''} ${it.w}`.trim();
    if (ok) {
      right++;
      streak++;
      best = Math.max(best, streak);
      fall = Math.max(FALL_MIN, fall - FALL_STEP);
      sfx.pop(streak);
      burst(target, { count: 8 + streak * 2, spread: 70 + streak * 8 });
      if (streak >= 3) floatText(target, `Combo ×${streak}!`, 'combo');
      status.className = 'sort-status ok';
      status.textContent = `${pick(MASCOT.ok)} ${it.w} = ${it.sk}`;
    } else {
      streak = 0;
      sfx.buzz();
      if (k >= 0) { binEls[k].classList.remove('shake'); void binEls[k].offsetWidth; binEls[k].classList.add('shake'); }
      target.classList.add('hint-bin');
      status.className = 'sort-status ko';
      status.textContent = `${k < 0 ? 'Dopadlo! ' : ''}${it.w} (${it.sk}) patrí sem: ${bins[it.bin].name}`;
    }
    // Slovo odletí do správnej skupiny.
    const a = card.getBoundingClientRect(), b = target.getBoundingClientRect();
    card.style.setProperty('--tx', `${b.left + b.width / 2 - (a.left + a.width / 2)}px`);
    card.style.setProperty('--ty', `${b.top + b.height / 2 - (a.top + a.height / 2)}px`);
    later(() => card.classList.add('into'), ok ? 150 : 1100);
    later(() => {
      counts[it.bin].textContent = items.filter((x) => x.bin === it.bin && x.ok !== null).length;
      target.classList.remove('hint-bin');
      target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump');
      i++;
      if (i < items.length) show(); else finish();
    }, ok ? 650 : 1700);
  }

  function finish() {
    const n = items.length;
    const stars = right >= n ? 3 : right >= n * 0.8 ? 2 : right >= n * 0.5 ? 1 : 0;
    const isBest = store.record(key, right, stars);
    if (stars === 3) sfx.fanfare();
    el.replaceWith(resultView({
      title,
      big: `${right} z ${n}`,
      stars,
      verdict: (isBest && right > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('p', { class: 'muted' }, `Najdlhšia séria: ${best}`),
        bins.map((b, k) => [
          h('h2', {}, `${b.icon} ${b.name}`),
          items.filter((it) => it.bin === k).map((it) => h('div', { class: 'recap-row' + (it.ok ? ' ok' : '') },
            h('span', { class: 'recap-mark' }, it.ok ? '✓' : '✗'),
            h('div', { class: 'recap-text' }, h('div', { class: 'it' }, `${it.icon || ''} ${it.w}`), h('div', { class: 'sk' }, it.sk)),
            speakBtn(it.w))),
        ])),
      again: rerender,
    }));
  }

  later(show, 300);
  return { el, cleanup: () => { dead = true; timers.forEach(clearTimeout); } };
}

export function validate(l, err) {
  const s = l.sort;
  if (!s?.bins?.length || !s.items?.length) { err('roztrieď: chýba sort.bins alebo sort.items'); return 'bez triedenia'; }
  if (s.bins.length < 2 || s.bins.length > 6) err('roztrieď: skupín má byť 2 až 6');
  const words = s.items.map((x) => x[0]);
  if (new Set(words).size !== words.length) err('roztrieď: slovo sa opakuje');
  for (const [w, bin, sk] of s.items) {
    if (!s.bins[bin]) err(`roztrieď: „${w}“ má neexistujúcu skupinu ${bin}`);
    if (!sk) err(`roztrieď: „${w}“ nemá preklad`);
  }
  return `${s.items.length} slov na triedenie`;
}
