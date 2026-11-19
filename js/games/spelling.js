// Spelling – hráč počuje slovo hláskované po písmenkách a zapíše ho.
// Dva režimy: na papier (na konci sa slová odkryjú a hráč sa sám ohodnotí)
// alebo do políčka s vypnutým dopĺňaním a opravou pravopisu.
// Dáta lekcie: spell = [{ w: 'castle', sk: 'hrad' }, …]
import { h, topbar, sample, pick, MASCOT, resultView, verdictFor, speakBtn } from '../ui.js';
import { store } from '../store.js';
import { speak, speakSeq, stopSpeech } from '../speech.js';
import config from '../../data/config.js';

const COUNT = 8;
const clean = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

// 'city walls' → ['C', 'I', 'T', 'Y', medzera, 'W', …] s pauzami medzi písmenami
function letters(word, slow) {
  const gap = slow ? 750 : 280;
  return [...word.toUpperCase()].flatMap((ch) => (ch === ' ' ? [gap * 2] : [ch, gap]));
}

export function spelling(lesson, rerender) {
  const items = sample(lesson.spell, Math.min(COUNT, lesson.spell.length));
  const key = `${lesson.id}.spell`;
  const title = config.ui.spell;
  const marks = items.map(() => null); // true/false po kontrole
  let i = 0, mode = null;

  const progress = h('span', { class: 'hud-score' });
  const main = h('main', { class: 'wrap spell' });
  const el = h('div', { class: 'screen' }, topbar(title, progress), main);

  const spellOut = (w, slow) => speakSeq(letters(w, slow), { rate: slow ? 0.7 : 0.85 });

  function intro() {
    progress.textContent = '';
    main.replaceChildren(
      h('div', { class: 'qcard spell-intro' },
        h('div', { class: 'spell-big' }, '🔤'),
        h('p', {}, `Počuješ ${items.length} slov hláskovaných po písmenkách, napr. „C – A – S – T – L – E“. Zapíš ich.`),
        h('p', { class: 'muted' }, 'Najlepšie na papier, lebo mobil rád opravuje pravopis sám. Na konci si slová skontroluješ.')),
      h('div', { class: 'options stacked' },
        h('button', { class: 'btn', type: 'button', onclick: () => { mode = 'paper'; show(); } }, '📝 Píšem na papier'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { mode = 'type'; show(); } }, '⌨️ Píšem sem do appky')));
  }

  function controls(w) {
    return h('div', { class: 'row spell-play' },
      h('button', { class: 'btn', type: 'button', onclick: () => spellOut(w, false) }, '▶ Prehrať'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => spellOut(w, true) }, '🐢 Pomalšie'));
  }

  function show() {
    const it = items[i];
    progress.textContent = `${i + 1}/${items.length}`;
    const bar = h('div', { class: 'card-progress' }, h('div', { style: `width:${(i / items.length) * 100}%` }));

    if (mode === 'paper') {
      main.replaceChildren(bar,
        h('div', { class: 'qcard spell-card' },
          h('div', { class: 'spell-n' }, `${i + 1}.`),
          h('p', { class: 'muted' }, 'Počúvaj a píš na papier pod číslo ' + (i + 1) + '.'),
          controls(it.w)),
        h('button', { class: 'btn', type: 'button', onclick: () => { stopSpeech(); i++; if (i < items.length) show(); else check(); } },
          i + 1 < items.length ? 'Ďalšie slovo →' : 'Skontrolovať papier'));
    } else {
      const input = h('input', {
        class: 'spell-input', type: 'text', inputmode: 'text', 'aria-label': 'Napíš slovo',
        autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false',
        onkeydown: (e) => { if (e.key === 'Enter') submit(); },
      });
      const fb = h('div', { class: 'feedback', hidden: true });
      const okBtn = h('button', { class: 'btn', type: 'button', onclick: submit }, 'Skontrolovať');
      function submit() {
        if (!fb.hidden || !input.value.trim()) return;
        const ok = clean(input.value) === clean(it.w);
        marks[i] = ok;
        input.disabled = true;
        okBtn.hidden = true;
        speak(it.w);
        fb.hidden = false;
        fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
        fb.replaceChildren(
          h('div', { class: 'fb-head' }, ok ? pick(MASCOT.ok) : 'Takto sa to píše:', speakBtn(it.w)),
          !ok && h('div', { class: 'spell-diff' }, diff(input.value, it.w)),
          h('div', { class: 'fb-solution' }, it.w, h('span', { class: 'muted' }, ` – ${it.sk}`)),
          h('button', { class: 'btn', type: 'button', onclick: () => { i++; if (i < items.length) show(); else finish(); } }, i + 1 < items.length ? 'Ďalej →' : 'Výsledok'));
      }
      main.replaceChildren(bar,
        h('div', { class: 'qcard spell-card' }, h('div', { class: 'spell-n' }, `${i + 1}.`), controls(it.w), input),
        okBtn, fb);
    }
    spellOut(it.w, false);
  }

  // Zvýrazní písmená, ktoré sa nezhodujú (po pozíciách).
  function diff(typed, word) {
    const t = typed.trim().toLowerCase(), w = word.toLowerCase();
    return [...w].map((ch, k) => h('span', { class: t[k] === ch ? 'd-ok' : 'd-ko' }, ch === ' ' ? ' ' : ch));
  }

  function check() {
    progress.textContent = '✓';
    const finishBtn = h('button', { class: 'btn', type: 'button', disabled: true, onclick: finish }, 'Hotovo');
    const update = () => { finishBtn.disabled = marks.some((m) => m === null); };
    main.replaceChildren(
      h('p', { class: 'hint' }, 'Porovnaj s papierom a pri každom slove ťukni ✓ alebo ✗.'),
      h('div', { class: 'recap' }, items.map((it, k) => {
        const yes = h('button', { class: 'icon-btn mark', type: 'button', 'aria-label': 'Správne', onclick: () => set(true) }, '✓');
        const no = h('button', { class: 'icon-btn mark', type: 'button', 'aria-label': 'Zle', onclick: () => set(false) }, '✗');
        function set(v) { marks[k] = v; yes.classList.toggle('on-ok', v); no.classList.toggle('on-ko', !v); update(); }
        return h('div', { class: 'recap-row' },
          h('span', { class: 'recap-mark' }, `${k + 1}.`),
          h('div', { class: 'recap-text' }, h('div', { class: 'it spell-word' }, it.w), h('div', { class: 'sk' }, it.sk)),
          speakBtn(it.w), yes, no);
      })),
      h('div', { class: 'row' }, finishBtn));
  }

  function finish() {
    const right = marks.filter(Boolean).length, n = items.length;
    const stars = right >= n ? 3 : right >= n * 0.7 ? 2 : right >= n * 0.4 ? 1 : 0;
    const isBest = store.record(key, right, stars);
    el.replaceWith(resultView({
      title,
      big: `${right} z ${n}`,
      stars,
      verdict: (isBest && right > 0 ? 'Nový rekord! ' : '') + verdictFor(stars),
      body: h('div', { class: 'recap' },
        marks.some((m) => !m) && h('h2', {}, 'Na zopakovanie'),
        items.filter((_, k) => !marks[k]).map((it) => h('div', { class: 'recap-row' },
          h('div', { class: 'recap-text' }, h('div', { class: 'it spell-word' }, it.w), h('div', { class: 'sk' }, it.sk)),
          speakBtn(it.w)))),
      again: rerender,
    }));
  }

  intro();
  return { el, cleanup: stopSpeech };
}

export function validate(l, err) {
  if (!l.spell?.length) { err('spelling: lekcia nemá slová (spell)'); return '0 slov'; }
  for (const it of l.spell) {
    if (!it.w || !it.sk) err(`spelling: slovo ${JSON.stringify(it)} potrebuje w a sk`);
    else if (!/^[\p{L} ]+$/u.test(it.w)) err(`spelling: „${it.w}“ – iba písmená a medzery`);
  }
  return `${l.spell.length} slov na spelling`;
}
