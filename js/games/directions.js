// Odkaz na záznamníku – hráč počuje hlasovú správu (text nevidí), napr. „I'm in a city north-east of …“,
// ťukne na mape na mesto, docestuje tam, prečíta si krátky príbeh a vyhrá niečo smiešne.
// Dáta lekcie:
// walk = {
//   outline: [[lon, lat], …]            obrys krajiny
//   cities: { id: { name, at: [lon, lat], dx?, dy? } }   dx/dy = posun popisku
//   marks: [{ icon, at: [lon, lat], label }]   orientačné body (hory, rieka…), nedajú sa ťukať
//   start: 'id', vehicle: '🚌',
//   tour: [{ to: 'id', say: 'správa', story: [[en, sk], …], prize: [ikona, text] }]
// }
import { h, topbar, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';
import { speakSeq, stopSpeech } from '../speech.js';
import { sfx } from '../fx.js';
import config from '../../data/config.js';

const W = 1000;
const SVG = 'http://www.w3.org/2000/svg';
const s = (tag, attrs, ...kids) => {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
  el.append(...kids.flat().filter((k) => k != null && k !== false));
  return el;
};

// Jednoduchá projekcia: dĺžka sa skráti kosínusom strednej šírky, aby mapa nebola roztiahnutá.
function projection(outline) {
  const lons = outline.map((p) => p[0]), lats = outline.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
  const pad = 30;
  const scale = (W - 2 * pad) / ((x1 - x0) * k);
  const H = Math.round((y1 - y0) * scale + 2 * pad);
  return { H, xy: ([lon, lat]) => [pad + (lon - x0) * k * scale, pad + (y1 - lat) * scale] };
}

// Pauzy medzi vetami, aby správa znela ako odkaz na záznamníku.
const sentences = (text) => text.split(/(?<=[.!?])\s+/).flatMap((t) => [t, 450]);

export function walk(lesson, rerender) {
  const { outline, cities, tour, start, marks = [], vehicle = '🚌' } = lesson.walk;
  const key = `${lesson.id}.walk`;
  const { H, xy } = projection(outline);
  let at = start;
  let i = 0, firstTry = 0, tries = 0, busy = false, heard = false, dead = false, selected = null;
  const prizes = [];
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead) fn(); }, ms); timers.add(t); };

  const progress = h('span', { class: 'hud-score' });
  const dots = {};
  const svg = s('svg', { class: 'country', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Mapa' },
    s('polygon', { class: 'land', points: outline.map((p) => xy(p).join(',')).join(' ') }),
    marks.map((m) => {
      const [x, y] = xy(m.at);
      return s('g', { class: 'map-mark' },
        s('text', { class: 'mark-icon', x, y, 'text-anchor': 'middle' }, m.icon),
        m.label && s('text', { class: 'mark-label', x, y: y + 28, 'text-anchor': 'middle' }, m.label));
    }),
    Object.entries(cities).map(([id, c]) => {
      const [x, y] = xy(c.at);
      const g = s('g', { class: 'city-pin', tabindex: 0, role: 'button', 'aria-label': c.name },
        s('circle', { class: 'hit', cx: x, cy: y, r: 34 }),
        s('circle', { class: 'dot', cx: x, cy: y, r: 11 }),
        s('text', { x: x + (c.dx ?? 0), y: y + (c.dy ?? -20), 'text-anchor': 'middle' }, c.name));
      g.addEventListener('click', () => choose(id));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(id); } });
      dots[id] = g;
      return g;
    }),
    s('g', { class: 'rose', transform: `translate(${W - 70} ${H - 80})` },
      s('path', { d: 'M0 -46 L10 -8 L0 -14 L-10 -8 Z' }),
      s('text', { x: 0, y: -54, 'text-anchor': 'middle' }, 'N')));
  const traveller = h('div', { class: 'traveller', 'aria-hidden': 'true' }, vehicle);
  const mapBox = h('div', { class: 'map-box' }, svg, traveller);

  const panel = h('div', { class: 'walk-panel' });
  const main = h('main', { class: 'wrap walk' }, panel, mapBox);
  const el = h('div', { class: 'screen' }, topbar(config.ui.walk, progress), main);

  function moveTo(id, instant) {
    const [x, y] = xy(cities[id].at);
    traveller.style.transition = instant ? 'none' : '';
    traveller.style.left = `${(x / W) * 100}%`;
    traveller.style.top = `${(y / H) * 100}%`;
    Object.entries(dots).forEach(([k, g]) => g.classList.toggle('here', k === id));
  }

  function play(slow) {
    heard = true;
    sfx.beep();
    later(() => speakSeq(sentences(tour[i].say), { rate: slow ? 0.68 : 0.85 }), 550);
    const tape = panel.querySelector('.tape');
    tape?.classList.add('spin');
    later(() => tape?.classList.remove('spin'), 3000);
  }

  function showMessage(note) {
    progress.textContent = `${i + 1}/${tour.length}`;
    selected = null;
    Object.values(dots).forEach((g) => g.classList.remove('sel'));
    panel.replaceChildren(
      h('div', { class: 'voicemail' },
        h('div', { class: 'tape', 'aria-hidden': 'true' }, '📼'),
        h('div', {},
          h('div', { class: 'vm-title' }, `Nová správa ${i + 1} z ${tour.length}`),
          h('div', { class: 'vm-note' }, note || `Si v meste ${cities[at].name}. Vypočuj si odkaz a ťukni na mesto, kam ťa volajú. Sever je hore.`))),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: () => play(false) }, '▶ Prehrať'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: () => play(true) }, '🐢 Pomalšie')),
      h('div', { class: 'pick-bar', hidden: true }));
  }

  function choose(id) {
    if (busy) return;
    if (!heard) { showMessage('Najprv si vypočuj správu ▶'); return; }
    if (id === at) return;
    selected = id;
    Object.entries(dots).forEach(([k, g]) => g.classList.toggle('sel', k === id));
    const bar = panel.querySelector('.pick-bar');
    bar.hidden = false;
    bar.replaceChildren(
      h('span', { class: 'pick-name' }, cities[id].name),
      h('button', { class: 'btn small', type: 'button', onclick: go }, `Cestovať ${vehicle}`));
  }

  function go() {
    const stop = tour[i];
    tries++;
    if (selected !== stop.to) {
      const g = dots[selected];
      g.classList.remove('wrong'); void g.getBBox(); g.classList.add('wrong');
      sfx.buzz();
      showMessage(`${pick(MASCOT.ko)} ${cities[selected].name} to nie je. Vypočuj si správu ešte raz.`);
      return;
    }
    if (tries === 1) firstTry++;
    sfx.pop(4);
    busy = true;
    stopSpeech();
    moveTo(stop.to);
    later(() => { at = stop.to; busy = false; arrive(); }, 1300);
  }

  function arrive() {
    const stop = tour[i];
    const c = cities[stop.to];
    prizes.push(stop.prize);
    const transcript = h('div', { class: 'tr', hidden: true }, stop.say);
    panel.replaceChildren(
      h('div', { class: 'feedback ok walk-story' },
        h('div', { class: 'fb-head' }, `📍 ${c.name}`, h('span', {}, tries === 1 ? pick(MASCOT.ok) : '')),
        stop.story.map(([en, sk]) => {
          const tr = h('div', { class: 'tr', hidden: true }, sk);
          return h('div', { class: 'story-line' },
            h('div', { class: 'line-row' }, h('p', { class: 'line', onclick: () => { tr.hidden = !tr.hidden; } }, en), speakBtn(en)), tr);
        }),
        h('p', { class: 'muted small-hint' }, 'Ťukni na vetu a uvidíš preklad.'),
        h('div', { class: 'prize' }, h('span', { class: 'prize-icon' }, stop.prize[0]), h('span', {}, h('b', {}, 'Výhra: '), stop.prize[1])),
        h('div', { class: 'row' },
          h('button', { class: 'chip', type: 'button', onclick: () => speakSeq(sentences(stop.say)) }, '🔊 Správa znova'),
          h('button', { class: 'chip', type: 'button', onclick: () => { transcript.hidden = !transcript.hidden; } }, 'Čo v nej bolo?')),
        transcript,
        h('button', { class: 'btn', type: 'button', onclick: next }, i + 1 < tour.length ? '📼 Ďalšia správa' : 'Výsledok')));
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function next() {
    i++;
    tries = 0;
    heard = false;
    if (i < tour.length) { showMessage(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else finish();
  }

  function finish() {
    const n = tour.length;
    const stars = firstTry >= n ? 3 : firstTry >= n * 0.7 ? 2 : firstTry >= n * 0.4 ? 1 : 0;
    const isBest = store.record(key, firstTry, stars);
    el.replaceWith(resultView({
      title: config.ui.walk,
      big: `${firstTry} z ${n} na prvý pokus`,
      stars,
      verdict: (isBest && firstTry > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('h2', {}, 'Tvoje výhry'),
        prizes.map(([icon, text]) => h('div', { class: 'recap-row' }, h('span', { class: 'prize-icon' }, icon), h('div', { class: 'recap-text' }, text)))),
      again: rerender,
    }));
  }

  moveTo(at, true);
  showMessage();
  return { el, cleanup: () => { dead = true; timers.forEach(clearTimeout); stopSpeech(); } };
}

export function validate(l, err) {
  const w = l.walk;
  if (!w) { err('walk: lekcia nemá mapu (walk)'); return 'bez mapy'; }
  const { outline = [], cities = {}, tour = [], start } = w;
  if (outline.length < 3) err('walk: obrys (outline) potrebuje aspoň 3 body');
  for (const [id, c] of Object.entries(cities)) if (!c.name || c.at?.length !== 2) err(`walk: mesto ${id} potrebuje name a at: [lon, lat]`);
  if (!cities[start]) err('walk: štart (start) nie je medzi mestami');
  let prev = start;
  tour.forEach((t, k) => {
    const n = `walk: správa ${k + 1}`;
    if (!cities[t.to]) err(`${n}: neznáme mesto ${t.to}`);
    if (t.to === prev) err(`${n}: cieľ je to isté mesto, kde hráč stojí`);
    if (!t.say) err(`${n}: chýba text správy (say)`);
    if (!t.story?.length || t.story.some((x) => !x[0] || !x[1])) err(`${n}: príbeh potrebuje riadky [en, sk]`);
    if (!t.prize || t.prize.length !== 2) err(`${n}: výhra má tvar [ikona, text]`);
    prev = t.to;
  });
  if (!tour.length) err('walk: chýbajú správy (tour)');
  return `${tour.length} správ`;
}
