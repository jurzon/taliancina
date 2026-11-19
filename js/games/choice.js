// Karty s medzerou: vyber správnu spojku alebo tvar slovesa.
import { h, topbar, sample, shuffle, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';

const COUNT = 10;

export function choice(lesson, rerender) {
  const cards = sample(lesson.cards, Math.min(COUNT, lesson.cards.length));
  const key = `${lesson.id}.choice`;
  const wrong = [];
  let i = 0, right = 0, streak = 0, bestStreak = 0;

  const main = h('main', { class: 'wrap' });
  const progress = h('span', { class: 'hud-score' });
  const el = h('div', { class: 'screen' }, topbar(lesson.choiceTitle, progress), main);

  const full = (c) => c.s.replace('___', c.o[0]);
  // Karta so say: false (napr. „aká je to hypotéza?“) nemá vetu na prečítanie.
  const speakable = (c) => c.say !== false;

  function show() {
    const c = cards[i];
    const [before, after] = c.s.split('___');
    const gap = h('span', { class: 'gap' }, ' ');
    const fb = h('div', { class: 'feedback', hidden: true });
    const tr = h('div', { class: 'tr', hidden: true }, c.sk);
    const trBtn = h('button', { class: 'chip', type: 'button', onclick: () => { tr.hidden = !tr.hidden; } }, 'SK preklad');
    progress.textContent = `${i + 1}/${cards.length}`;

    const opts = shuffle(c.o).map((o) => h('button', { class: 'btn option', type: 'button', onclick: (e) => answer(o, e.currentTarget) }, o));
    const optBox = h('div', { class: 'options' + (c.o.some((o) => o.length > 18) ? ' stacked' : '') }, opts);

    function answer(o, btn) {
      if (!fb.hidden) return;
      const ok = o === c.o[0];
      opts.forEach((b) => { b.disabled = true; if (b.textContent === c.o[0]) b.classList.add('correct'); });
      if (ok) { right++; streak++; bestStreak = Math.max(bestStreak, streak); } else { streak = 0; wrong.push(c); btn.classList.add('wrong'); }
      gap.textContent = c.o[0];
      gap.classList.add('filled');
      tr.hidden = false;
      trBtn.remove();
      fb.hidden = false;
      fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
      fb.replaceChildren(
        h('div', { class: 'fb-head' }, ok ? pick(MASCOT.ok) + (streak >= 3 ? ` ${streak} za sebou!` : '') : pick(MASCOT.ko), speakable(c) && speakBtn(full(c))),
        h('div', { class: 'fb-why' }, c.why),
        h('button', { class: 'btn', type: 'button', onclick: next }, i + 1 < cards.length ? 'Ďalej →' : 'Výsledok'));
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    main.replaceChildren(
      h('div', { class: 'card-progress' }, h('div', { style: `width:${(i / cards.length) * 100}%` })),
      h('p', { class: 'hint' }, lesson.choiceHint),
      h('div', { class: 'qcard' }, h('p', { class: 'sentence' }, before, gap, after), trBtn, tr),
      optBox,
      fb);
  }

  function next() {
    i++;
    if (i < cards.length) show();
    else finish();
  }

  function finish() {
    const stars = right >= cards.length ? 3 : right >= cards.length * 0.7 ? 2 : right >= cards.length * 0.4 ? 1 : 0;
    const isBest = store.record(key, right, stars);
    el.replaceWith(resultView({
      title: lesson.choiceTitle,
      big: `${right} z ${cards.length}`,
      stars,
      verdict: (isBest && right > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        h('p', { class: 'muted' }, `Najdlhšia šnúra: ${bestStreak}`),
        wrong.length > 0 && h('h2', {}, 'Na zopakovanie'),
        wrong.map((c) => h('div', { class: 'recap-row' },
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, full(c)), h('div', { class: 'sk' }, c.why)),
          speakable(c) && speakBtn(full(c))))),
      again: rerender,
    }));
  }

  show();
  return { el };
}

export function validate(l, err) {
  if (!l.cards?.length) err('karty: lekcia nemá žiadne karty (cards)');
  if (!l.choiceTitle) err('karty: chýba choiceTitle');
  for (const c of l.cards || []) {
    if (c.s.split('___').length !== 2) err(`karta „${c.s}“: musí mať práve jednu medzeru`);
    if (c.o.length < 2 || new Set(c.o).size !== c.o.length) err(`karta „${c.s}“: zlé možnosti`);
    if (!c.why || !c.sk) err(`karta „${c.s}“: chýba vysvetlenie alebo preklad`);
  }
  return `${l.cards?.length || 0} kariet`;
}
