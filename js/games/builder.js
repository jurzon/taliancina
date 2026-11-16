// Costruisci la frase – zo slovenskej vety poskladaj taliansku z dlaždíc.
import { h, topbar, sample, shuffle, pick, VERDI, resultView, verdictFor, speakBtn } from '../ui.js';
import { norm, tilesOf } from '../lessons.js';
import { store } from '../store.js';
import { speak } from '../speech.js';

const COUNT = 6;

export function builder(lesson, rerender) {
  const items = sample(lesson.build, Math.min(COUNT, lesson.build.length));
  const key = `${lesson.id}.build`;
  let i = 0, firstTry = 0;

  const main = h('main', { class: 'wrap' });
  const progress = h('span', { class: 'hud-score' });
  const el = h('div', { class: 'screen' }, topbar('Costruisci la frase', progress), main);

  function show() {
    const item = items[i];
    const accepted = [item.it, ...(item.alt || [])].map(norm);
    const tiles = shuffle([...tilesOf(item.it), ...(item.x || [])]).map((text, id) => ({ id, text }));
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
        h('div', { class: 'fb-head' }, ok ? pick(VERDI.ok) : 'Takto to má byť:', speakBtn(item.it)),
        h('div', { class: 'fb-solution' }, item.it),
        h('button', { class: 'btn', type: 'button', onclick: next }, i + 1 < items.length ? 'Ďalej →' : 'Výsledok'));
      if (ok) speak(item.it);
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
        h('div', { class: 'fb-head' }, pick(VERDI.ko)),
        tries >= 2 && h('button', { class: 'btn small ghost', type: 'button', onclick: () => done(false) }, 'Ukáž riešenie'));
    }

    draw();
    main.replaceChildren(
      h('div', { class: 'card-progress' }, h('div', { style: `width:${(i / items.length) * 100}%` })),
      h('p', { class: 'hint' }, 'Povedz to po taliansky. Pozor, jedno slovo je navyše.'),
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
      title: 'Costruisci la frase',
      big: `${firstTry} z ${items.length} na prvý pokus`,
      stars,
      verdict: (isBest && firstTry > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('h2', {}, 'Vety z tohto kola'),
        items.map((b) => h('div', { class: 'recap-row' },
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, b.it), h('div', { class: 'sk' }, b.sk)),
          speakBtn(b.it)))),
      again: rerender,
    }));
  }

  show();
  return { el };
}
