// Costruisci la frase – zo slovenskej vety poskladaj taliansku z dlaždíc.
import { h, topbar, sample, shuffle, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { norm, tilesOf } from '../lessons.js';
import { store } from '../store.js';
import { speak } from '../speech.js';
import config from '../../data/config.js';

const COUNT = 6;

export function builder(lesson, rerender) {
  const items = sample(lesson.build, Math.min(COUNT, lesson.build.length));
  const key = `${lesson.id}.build`;
  let i = 0, firstTry = 0;

  const main = h('main', { class: 'wrap' });
  const progress = h('span', { class: 'hud-score' });
  const el = h('div', { class: 'screen' }, topbar(config.ui.build, progress), main);

  function show() {
    const item = items[i];
    const accepted = [item.t, ...(item.alt || [])].map(norm);
    const tiles = shuffle([...tilesOf(item.t), ...(item.x || [])]).map((text, id) => ({ id, text }));
    let chosen = [];
    let tries = 0, solved = false;
    progress.textContent = `${i + 1}/${items.length}`;

    const answerEl = h('div', { class: 'answer', 'aria-label': 'Tvoja veta' });
    const bankEl = h('div', { class: 'bank' });
    const fb = h('div', { class: 'feedback', hidden: true });
    const checkBtn = h('button', { class: 'btn', type: 'button', disabled: true, onclick: check }, 'Skontrolovať');

    function draw() {
      answerEl.replaceChildren(...(chosen.length
        ? chosen.map((t) => h('button', { class: 'tile', type: 'button', disabled: solved, onclick: () => { chosen = chosen.filter((x) => x !== t); draw(); } }, t.text))
        : [h('span', { class: 'placeholder' }, 'Ťukaj na slová v správnom poradí')]));
      bankEl.replaceChildren(...tiles.map((t) => {
        const used = chosen.includes(t);
        return h('button', { class: 'tile' + (used ? ' used' : ''), type: 'button', disabled: used || solved, onclick: () => { chosen.push(t); draw(); } }, t.text);
      }));
      checkBtn.disabled = !chosen.length || solved;
    }

    function done(ok) {
      solved = true;
      if (ok && tries === 1) firstTry++;
      draw();
      checkBtn.hidden = true;
      fb.hidden = false;
      fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
      fb.replaceChildren(
        h('div', { class: 'fb-head' }, ok ? pick(MASCOT.ok) : 'Takto to má byť:', speakBtn(item.t)),
        h('div', { class: 'fb-solution' }, item.t),
        h('button', { class: 'btn', type: 'button', onclick: next }, i + 1 < items.length ? 'Ďalej →' : 'Výsledok'));
      if (ok) speak(item.t);
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function check() {
      tries++;
      if (accepted.includes(norm(chosen.map((t) => t.text).join(' ')))) { done(true); return; }
      answerEl.classList.remove('shake');
      void answerEl.offsetWidth;
      answerEl.classList.add('shake');
      fb.hidden = false;
      fb.className = 'feedback ko';
      fb.replaceChildren(
        h('div', { class: 'fb-head' }, pick(MASCOT.ko)),
        tries >= 2 && h('button', { class: 'btn small ghost', type: 'button', onclick: () => done(false) }, 'Ukáž riešenie'));
    }

    draw();
    main.replaceChildren(
      h('div', { class: 'card-progress' }, h('div', { style: `width:${(i / items.length) * 100}%` })),
      h('p', { class: 'hint' }, config.ui.buildHint),
      h('div', { class: 'qcard' }, h('p', { class: 'prompt-sk' }, item.sk)),
      answerEl, bankEl, checkBtn, fb);
  }

  function next() {
    i++;
    if (i < items.length) show();
    else finish();
  }

  function finish() {
    const stars = firstTry >= items.length ? 3 : firstTry >= items.length * 0.6 ? 2 : firstTry >= 1 ? 1 : 0;
    const isBest = store.record(key, firstTry, stars);
    el.replaceWith(resultView({
      title: config.ui.build,
      big: `${firstTry} z ${items.length} na prvý pokus`,
      stars,
      verdict: (isBest && firstTry > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('h2', {}, 'Vety z tohto kola'),
        items.map((b) => h('div', { class: 'recap-row' },
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, b.t), h('div', { class: 'sk' }, b.sk)),
          speakBtn(b.t)))),
      again: rerender,
    }));
  }

  show();
  return { el };
}

export function validate(l, err) {
  if (!l.build?.length) err('skladačka: lekcia nemá žiadne vety (build)');
  for (const b of l.build || []) {
    if (!b.t || !b.sk) { err(`skladačka: veta bez t alebo sk (${b.t || b.sk})`); continue; }
    const pool = [...tilesOf(b.t), ...(b.x || [])].map((t) => t.toLowerCase());
    for (const alt of b.alt || []) {
      const left = [...pool];
      for (const t of tilesOf(alt)) {
        const i = left.indexOf(t.toLowerCase());
        if (i < 0) err(`skladačka „${b.t}“: alternatíva „${alt}“ sa nedá poskladať (chýba „${t}“)`);
        else left.splice(i, 1);
      }
      if (tilesOf(alt).length !== tilesOf(b.t).length) err(`skladačka „${b.t}“: alternatíva má iný počet dlaždíc`);
    }
    for (const x of b.x || []) if (tilesOf(b.t).map((t) => t.toLowerCase()).includes(x.toLowerCase())) err(`skladačka „${b.t}“: dlaždica navyše „${x}“ je aj v riešení`);
    if (norm(tilesOf(b.t).join(' ')) !== norm(b.t)) err(`skladačka „${b.t}“: dlaždice nedávajú riešenie`);
  }
  return `${l.build?.length || 0} viet`;
}
