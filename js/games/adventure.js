// Adventure – interaktívny príbeh, ktorý sa posúva len vtedy, keď hráč sám tvorí vety.
// Jedna scéna = rozcvička (opakovanie) → čítanie s rebríkom nápovied → rozhodnutie (napíš/povedz)
// → dril viet SK→EN → hovorenie → (na konci) písanie listu, ktoré ohodnotí AI.
// Čo hráč nevedel, ide do opakovania (js/srs.js) a vráti sa v ďalších dňoch.
//
// Dáta lekcie:
// adventure: {
//   title, sk, intro, start: 'id',
//   clues: { slovo: 'Anglická nápoveda.' },               // rebrík ①: vysvetlenie po anglicky
//   scenes: { id: {
//     title, sk, lines: [['Text so [značkami].', 'preklad']],
//     choice: { sk: 'Čo urobíš?', options: [{ sk: 'Zámer po slovensky', t: 'English (voliteľné).', alt: [], go: 'id', res: ['Odpoveď.', 'preklad'] }] },
//     drill: [{ sk: 'Veta po slovensky.', t: 'English sentence.', alt: ['Iné znenie.'] }],
//     speak: ['Sentence to repeat.'],
//     write: { sk: 'Zadanie', must: ['fráza'], words: [40, 80], model: 'Vzorový text.' },
//   } },
// }
import { h, topbar, speakBtn, pick, MASCOT, shuffle } from '../ui.js';
import { tokenize, plain, lookup } from '../lessons.js';
import { store } from '../store.js';
import { speak, stopSpeech, listen, canListen } from '../speech.js';
import { check, diffWords, heardRatio, initials, hasPhrase, display, normalize } from '../answer.js';
import * as srs from '../srs.js';
import { canAssess, assessWriting } from '../ai.js';
import { sfx, floatText, burst } from '../fx.js';
import config from '../../data/config.js';

const MAX_REVIEW = 6;
const MAX_WORDS = 8;
// replaceChildren by vypísal aj undefined/false ako text – tu sa vynechajú.
const fill = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const words = (s) => (s.trim().match(/\p{L}+(?:['’]\p{L}+)*/gu) || []).length;

export function adventure(lesson) {
  const A = lesson.adventure;
  const key = `${lesson.id}.adventure`;
  const progKey = `${lesson.id}.adv`;
  const prog = () => store.get(progKey, { reached: [A.start], done: [] });
  let stopMic = null;

  const score = h('span', { class: 'hud-score' });
  const main = h('main', { class: 'wrap adv' });
  const el = h('div', { class: 'screen' }, topbar(config.ui.adventure, score), main);

  function stop() {
    stopSpeech();
    stopMic?.();
    stopMic = null;
  }
  const show = (...kids) => { stop(); main.replaceChildren(...kids.flat().filter(Boolean)); window.scrollTo(0, 0); };

  // Body a chyby jednej hry
  function session() {
    const S = { pts: 0, max: 0, added: new Map(), words: [], next: null,
      gain(p, max, target) {
        S.pts += p; S.max += max;
        score.textContent = `⭐ ${S.pts}`;
        if (p > 0 && target) floatText(target, `+${p}`);
      },
      miss(item) {
        if (item.review) return; // opakovanie si krabičku posunie samo
        srs.add({ ...item, lesson: lesson.id });
        S.added.set(item.id, item);
      } };
    score.textContent = '⭐ 0';
    return S;
  }

  function run(steps, done) {
    let i = 0;
    const go = () => (i < steps.length ? steps[i++](go) : done());
    go();
  }

  // ---------- Menu: cesta príbehom ----------
  function menu() {
    score.textContent = '';
    const p = prog();
    const dueN = srs.due(lesson.id, 99).length;
    const total = srs.count(lesson.id);
    show(
      h('div', { class: 'story-kicker' }, config.ui.adventure),
      h('h1', { class: 'story-title' }, A.title),
      A.sk && h('div', { class: 'story-sub' }, A.sk),
      A.intro && h('p', {}, A.intro),
      h('div', { class: 'adv-how' },
        h('div', {}, '📖 Čítaj. Neznáme slovo ťukni – najprv dostaneš nápovedu, preklad až na koniec.'),
        h('div', {}, '✍️ Príbeh pokračuje, len keď to sám napíšeš alebo povieš po anglicky.'),
        h('div', {}, '🔁 Čo nevieš, sa ti vráti zajtra, o 3 dni, o týždeň… kým to nesype ako z rukáva.')),
      h('div', { class: 'chapters adv-path' }, p.reached.filter((id) => A.scenes[id]).map((id, i) => {
        const sc = A.scenes[id], done = p.done.includes(id);
        return h('button', { class: 'chapter' + (done ? ' read' : ''), type: 'button', onclick: () => play(id) },
          h('span', { class: 'chapter-n' }, done ? '✓' : i + 1),
          h('span', {}, sc.title, h('small', {}, sc.sk)));
      })),
      h('div', { class: 'qcard adv-review' },
        h('div', { class: 'adv-label' }, '🔁 Opakovanie'),
        h('p', {}, total ? `Na opakovanie máš ${total} viet a slov, dnes treba zopakovať ${dueN}.` : 'Zatiaľ nič. Čo v príbehu nebudeš vedieť, objaví sa tu.'),
        dueN > 0 && h('button', { class: 'btn', type: 'button', onclick: reviewOnly }, `Zopakovať teraz (${Math.min(dueN, 12)})`)));
  }

  // ---------- Celá scéna ----------
  function play(id) {
    const sc = A.scenes[id];
    const S = session();
    const steps = [];
    const rev = srs.due(lesson.id, MAX_REVIEW);
    if (rev.length) steps.push((next) => drill(S, rev.map((c) => ({ ...c, review: true })), '🔁 Rozcvička', 'Najprv to, čo si minule nevedel. Čím rýchlejšie, tým lepšie.', next));
    steps.push((next) => read(S, sc, next));
    if (sc.choice) steps.push((next) => choice(S, sc, next));
    steps.push((next) => {
      const ws = S.words.slice(0, MAX_WORDS).map((w) => ({ id: `${lesson.id}:w:${w.key}`, p: w.sk, t: w.text, alt: w.lemma ? [w.lemma] : [] }));
      const ds = shuffle(sc.drill || []).map((d) => ({ id: `${lesson.id}:d:${normalize(d.t)}`, p: d.sk, t: d.t, alt: d.alt || [] }));
      const items = [...ws, ...ds];
      if (items.length) drill(S, items, '🏋️ Dril', 'Napíš po anglicky. Chyba nevadí – veta sa vráti, kým ju nedáš.', next);
      else next();
    });
    if (sc.speak?.length) steps.push((next) => speaking(S, sc.speak, next));
    if (sc.write) steps.push((next) => write(S, sc, next));
    run(steps, () => finish(S, id));
  }

  function reviewOnly() {
    const S = session();
    drill(S, srs.due(lesson.id, 12).map((c) => ({ ...c, review: true })), '🔁 Opakovanie', 'Odpovedaj čo najrýchlejšie. Rýchla správna odpoveď posunie kartu na neskôr.', () => finish(S, null));
  }

  // ---------- Čítanie s rebríkom nápovied ----------
  function read(S, sc, next) {
    const state = {};
    let selected = null;
    const sheet = h('aside', { class: 'sheet', 'aria-live': 'polite' });
    const close = () => { sheet.classList.remove('open'); selected?.classList.remove('sel'); selected = null; };
    sheet.addEventListener('click', (e) => e.stopPropagation());

    const clueFor = (tok, g) => A.clues?.[tok.key] || (g.lemma && A.clues?.[g.lemma.toLowerCase()]);
    const firstSk = (sk) => sk.split(/[,;(]/)[0].trim();
    const mask = (sk) => firstSk(sk).split(/\s+/).map((w) => w[0] + ' _'.repeat(Math.max(0, [...w].length - 1))).join('   ');

    function open(tok, wEl) {
      selected?.classList.remove('sel');
      selected = wEl;
      wEl.classList.add('sel');
      const g = lookup(lesson, tok.key) || { sk: '?', lemma: '', note: '' };
      const ladder = !!lesson.gloss[tok.key] && !/^\p{Lu}/u.test(g.sk);
      const st = state[tok.key] ??= { step: !ladder ? 3 : clueFor(tok, g) ? 1 : 2 };

      const learnt = (known) => {
        if (st.step === 3 && st.counted) return;
        st.step = 3; st.counted = true;
        wEl.classList.add(known ? 'known' : 'learnt');
        const w = { key: tok.key, text: tok.text, sk: firstSk(g.sk) || g.sk, lemma: g.lemma };
        if (!S.words.some((x) => x.key === w.key)) S.words.push(w);
        // Nevedené slovo ide rovno do opakovania, aj keď ho potom v drile napíše správne.
        if (!known) S.miss({ id: `${lesson.id}:w:${w.key}`, p: w.sk, t: w.text, alt: w.lemma ? [w.lemma] : [] });
      };

      function draw() {
        const head = h('div', { class: 'sheet-head' },
          h('div', { class: 'sheet-word' }, tok.text), speakBtn(tok.text),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Zavrieť', onclick: close }, '✕'));
        const answer = [
          g.lemma && h('div', { class: 'sheet-lemma' }, '← ', h('i', {}, g.lemma)),
          h('div', { class: 'sheet-sk' }, g.sk),
          g.note && h('div', { class: 'sheet-note' }, g.note)];
        let body;
        if (st.step === 1) {
          const clue = clueFor(tok, g);
          body = h('div', { class: 'q-box' },
            h('div', { class: 'q-label' }, '🤔 Čo to znamená? Nápoveda po anglicky'),
            h('div', { class: 'q-text' }, clue, ' ', speakBtn(clue)),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', onclick: () => confirm(2) }, 'Už viem (+2)'),
              h('button', { class: 'btn small ghost', type: 'button', onclick: () => { st.step = 2; draw(); } }, 'Neviem')));
        } else if (st.step === 2) {
          body = h('div', { class: 'q-box' },
            h('div', { class: 'q-label' }, '🔤 Po slovensky to začína takto'),
            h('div', { class: 'q-text adv-mask' }, mask(g.sk)),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', onclick: () => confirm(1) }, 'Už viem (+1)'),
              h('button', { class: 'btn small ghost', type: 'button', onclick: () => { S.gain(0, 2); learnt(false); draw(); } }, 'Neviem – ukáž')));
        } else if (st.step === 'check') {
          body = h('div', {}, answer, h('div', { class: 'q-box' },
            h('div', { class: 'q-label' }, 'Myslel si to isté?'),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', onclick: (e) => { S.gain(st.pts, 2, e.target); learnt(true); draw(); } }, 'Áno ✓'),
              h('button', { class: 'btn small ghost', type: 'button', onclick: () => { S.gain(0, 2); learnt(false); draw(); } }, 'Nie'))));
        } else {
          body = h('div', {}, answer, st.counted && h('p', { class: 'muted adv-note' }, 'O chvíľu si to slovo napíšeš v drile.'));
        }
        sheet.replaceChildren(head, body);
        sheet.classList.add('open');
      }
      function confirm(pts) { st.pts = pts; st.step = 'check'; draw(); }
      draw();
    }

    const paras = sc.lines.map(([en, sk]) => {
      const tr = h('div', { class: 'tr', hidden: true }, sk);
      const p = h('p', { class: 'line' });
      for (const tok of tokenize(en)) {
        if (tok.sep !== undefined) { p.append(tok.sep); continue; }
        const wEl = h('span', { class: 'w', role: 'button', tabindex: '0' }, tok.text);
        const go = (e) => { e.stopPropagation(); open(tok, wEl); };
        wEl.addEventListener('click', go);
        wEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
        p.append(wEl);
      }
      return h('div', { class: 'para' }, p,
        h('span', { class: 'line-tools' },
          h('button', { class: 'chip', type: 'button', 'aria-label': 'Prečítať vetu', onclick: (e) => { e.stopPropagation(); speak(plain(en)); } }, '🔊'),
          h('button', { class: 'chip', type: 'button', 'aria-label': 'Preklad vety', onclick: (e) => { e.stopPropagation(); tr.hidden = !tr.hidden; } }, 'SK')),
        tr);
    });

    const article = h('article', { class: 'story', onclick: close },
      h('div', { class: 'story-kicker' }, A.title),
      h('h1', { class: 'story-title' }, sc.title),
      h('div', { class: 'story-sub' }, sc.sk),
      h('p', { class: 'hint' }, 'Ťukni na slovo, ktoré nepoznáš. Preklad celej vety (SK) skús až nakoniec.'),
      paras,
      h('button', { class: 'btn adv-continue', type: 'button', onclick: () => { close(); next(); } }, 'Pokračovať →'));
    show(article, sheet);
    article.style.setProperty('--rs', [1.0, 1.1, 1.22, 1.36, 1.5][store.font] + 'rem');
  }

  // ---------- Karta s odpoveďou (písanie alebo hlas) ----------
  // onAnswer(r) vráti true, ak sa má dať ďalší pokus (inak sa ukáže „Ďalej“).
  function askCard({ label, p, t, alt, onAnswer, onNext, sub }) {
    const t0 = performance.now();
    let hints = 0, tries = 0, locked = false;
    const input = h('input', {
      class: 'adv-input', type: 'text', 'aria-label': 'Napíš po anglicky', placeholder: 'po anglicky…',
      autocomplete: 'off', autocorrect: 'off', autocapitalize: 'sentences', spellcheck: 'false',
      onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } },
    });
    const hintBox = h('div', { class: 'adv-hint', hidden: true });
    const fb = h('div', { class: 'feedback', hidden: true });
    const hintBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: () => {
      hints++;
      hintBox.hidden = false;
      hintBox.textContent = hints === 1 ? initials(t) : display(t);
      if (hints >= 2) hintBtn.disabled = true;
      input.focus();
    } }, '💡 Nápoveda');
    const okBtn = h('button', { class: 'btn', type: 'button', onclick: () => submit() }, 'Skontrolovať');
    const mic = canListen() && h('button', { class: 'btn ghost small mic', type: 'button', 'aria-label': 'Povedať nahlas', onclick: () => {
      if (locked) return;
      mic.classList.add('rec');
      stopMic = listen({
        onresult: (alts) => {
          // Rozpoznávanie reči nie je presné (center/centre, chýbajúce slovíčko),
          // preto stačí, keď zaznie aspoň 80 % slov niektorého správneho znenia.
          const good = alts.find((a) => check(a, t, alt).ok);
          const close = !good && [t, ...(alt || [])].map(display).find((v) => heardRatio(alts, v) >= 0.8);
          input.value = good || close || alts[0] || '';
          submit(true);
        },
        onerror: (e) => {
          if (e !== 'not-allowed') return;
          hintBox.hidden = false;
          hintBox.textContent = 'Mikrofón je zakázaný – napíš odpoveď.';
        },
        onend: () => mic.classList.remove('rec'),
      });
    } }, '🎤 Povedz');
    const tools = h('div', { class: 'row adv-tools' }, okBtn, mic, hintBtn);

    function submit(spoken = false) {
      if (locked || !input.value.trim()) return;
      const r = { ...check(input.value, t, alt), hints, tries, ms: performance.now() - t0, spoken };
      tries++;
      const again = onAnswer(r, input);
      fb.hidden = false;
      fb.className = 'feedback ' + (r.ok ? 'ok' : 'ko');
      const solution = h('div', { class: 'fb-solution' }, r.ok ? r.best : diffWords(input.value, r.best).map((x, i) => [i ? ' ' : '', h('span', { class: x.ok ? '' : 'd-ko' }, x.w)]));
      if (r.ok) {
        sfx.pop(3 - hints);
        speak(r.best);
        locked = true;
        input.disabled = true;
        tools.hidden = true;
        const nextBtn = h('button', { class: 'btn', type: 'button', onclick: onNext }, 'Ďalej →');
        fill(fb,
          h('div', { class: 'fb-head' }, r.typo ? 'Skoro presne – pozor na preklep:' : pick(MASCOT.ok), speakBtn(r.best)),
          solution, sub && h('div', { class: 'muted' }, sub), nextBtn);
        nextBtn.focus();
      } else {
        sfx.buzz();
        speak(r.best);
        if (again) {
          fb.replaceChildren(h('div', { class: 'fb-head' }, 'Ešte nie. Správne je takto – teraz to napíš sám:', speakBtn(r.best)), solution);
          input.value = '';
          input.focus();
        } else {
          locked = true;
          input.disabled = true;
          tools.hidden = true;
          const nextBtn = h('button', { class: 'btn', type: 'button', onclick: onNext }, 'Ďalej →');
          fb.replaceChildren(h('div', { class: 'fb-head' }, 'Takto správne (vráti sa ti ešte):', speakBtn(r.best)), solution,
            h('div', { class: 'muted' }, 'Tvoja odpoveď: ', input.value), nextBtn);
          nextBtn.focus();
        }
      }
    }

    const card = h('div', {},
      h('div', { class: 'qcard' },
        h('div', { class: 'adv-label' }, label),
        h('p', { class: 'prompt-sk' }, p),
        hintBox, input),
      tools, fb);
    return { el: card, focus: () => input.focus() };
  }

  // ---------- Dril: veta sa vracia, kým ju hráč nedá ----------
  function drill(S, items, title, hint, next) {
    const queue = items.map((it) => ({ ...it, tries: 0 }));
    const total = queue.length;
    let done = 0;
    function step() {
      if (!queue.length) return next();
      const it = queue[0];
      const bar = h('div', { class: 'card-progress' }, h('div', { style: `width:${(done / total) * 100}%` }));
      const card = askCard({
        label: it.review ? '🔁 Zopakuj po anglicky' : 'Povedz po anglicky',
        p: it.p, t: it.t, alt: it.alt,
        onAnswer: (r, input) => {
          if (it.review && it.tries === 0) srs.grade(it.id, r.ok && r.hints === 0, r.ms);
          if (it.tries === 0) S.gain(r.ok ? (r.hints === 0 ? (r.typo ? 2 : 3) : r.hints === 1 ? 1 : 0) : 0, 3, input);
          queue.shift();
          if (r.ok) {
            done++;
            if (r.hints >= 2 || it.tries > 0) S.miss(it);
          } else {
            it.tries++;
            S.miss(it);
            queue.splice(Math.min(2, queue.length), 0, it); // vráti sa o dve vety neskôr
          }
          return false;
        },
        onNext: step,
      });
      show(h('h2', { class: 'adv-step' }, title, h('span', { class: 'muted' }, ` ${done + 1}/${total}${queue.length > total - done ? ' +' : ''}`)),
        done === 0 && it.tries === 0 && h('p', { class: 'hint' }, hint), bar, card.el);
      card.focus();
    }
    step();
  }

  // ---------- Rozhodnutie v príbehu ----------
  function choice(S, sc, next) {
    const opts = sc.choice.options;
    function pickOpt(o) {
      const card = askCard({
        label: '✍️ Napíš alebo povedz po anglicky',
        p: o.sk, t: o.t, alt: o.alt,
        onAnswer: (r, input) => {
          if (r.tries === 0) S.gain(r.ok ? (r.hints === 0 ? 3 : r.hints === 1 ? 1 : 0) : 0, 3, input);
          if (!r.ok) S.miss({ id: `${lesson.id}:c:${normalize(o.t)}`, p: o.sk, t: o.t, alt: o.alt || [] });
          return !r.ok; // príbeh ide ďalej až po správnej vete
        },
        onNext: () => {
          S.next = o.go;
          if (!o.res) return next();
          const [en, sk] = o.res;
          const tr = h('div', { class: 'tr', hidden: true }, sk);
          show(h('div', { class: 'qcard adv-res' },
            h('div', { class: 'adv-label' }, '💬'),
            h('p', { class: 'line' }, en, ' ', speakBtn(en)),
            h('button', { class: 'chip', type: 'button', onclick: () => { tr.hidden = !tr.hidden; } }, 'SK'), tr),
          h('button', { class: 'btn', type: 'button', onclick: next }, 'Pokračovať →'));
          speak(en);
        },
      });
      show(h('h2', { class: 'adv-step' }, '🧭 ', sc.choice.sk), card.el);
      card.focus();
    }
    if (opts.length === 1) return pickOpt(opts[0]);
    show(h('h2', { class: 'adv-step' }, '🧭 ', sc.choice.sk),
      h('p', { class: 'hint' }, 'Vyber si, čo urobíš. Potom to povieš po anglicky.'),
      h('div', { class: 'options stacked' }, opts.map((o) =>
        h('button', { class: 'btn option', type: 'button', onclick: () => pickOpt(o) }, o.sk))));
  }

  // ---------- Hovorenie: vypočuj a zopakuj ----------
  function speaking(S, list, next) {
    let i = 0;
    function step() {
      if (i >= list.length) return next();
      const t = list[i];
      let tries = 0;
      const fb = h('div', { class: 'feedback', hidden: true });
      const nextBtn = h('button', { class: 'btn', type: 'button', onclick: () => { i++; step(); } }, 'Ďalej →');
      const sentence = h('p', { class: 'sentence' }, t);
      const play = (slow) => speak(t, { rate: slow ? 0.6 : 0.88 });
      let micBtn = null;
      if (canListen()) {
        micBtn = h('button', { class: 'btn mic', type: 'button', onclick: () => {
          micBtn.classList.add('rec');
          stopMic = listen({
            onresult: (alts) => {
              tries++;
              const ratio = heardRatio(alts, t);
              const ok = ratio >= 0.8;
              fb.hidden = false;
              fb.className = 'feedback ' + (ok ? 'ok' : 'ko');
              const marks = diffWords(alts[0] || '', t);
              if (ok) { sfx.pop(2); S.gain(tries === 1 ? 2 : 1, 2, micBtn); micBtn.hidden = true; }
              else { sfx.buzz(); if (tries === 1) S.gain(0, 2); }
              fill(fb,
                h('div', { class: 'fb-head' }, ok ? pick(MASCOT.ok) : 'Červené slová som nepočula. Skús znova, pomalšie.'),
                h('div', { class: 'fb-solution' }, marks.map((x, k) => [k ? ' ' : '', h('span', { class: x.ok ? 'd-ok' : 'd-ko' }, x.w)])),
                h('div', { class: 'muted' }, 'Počula som: ', alts[0] || '—'),
                (ok || tries >= 3) && nextBtn);
              if (ok || tries >= 3) nextBtn.focus();
            },
            onerror: (e) => {
              fb.hidden = false;
              fb.className = 'feedback ko';
              fb.replaceChildren(h('div', {}, e === 'not-allowed' ? 'Mikrofón je zakázaný. Povedz vetu nahlas a pokračuj.' : 'Nič som nepočula. Skús znova, alebo pokračuj.'), nextBtn);
            },
            onend: () => micBtn.classList.remove('rec'),
          });
        } }, '🎤 Teraz ty');
      }
      const self = !canListen() && h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: (e) => { S.gain(1, 2, e.target); i++; step(); } }, 'Povedal som to nahlas ✓'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { S.gain(0, 2); i++; step(); } }, 'Nešlo mi to'));
      show(h('h2', { class: 'adv-step' }, '🗣️ Vypočuj a zopakuj', h('span', { class: 'muted' }, ` ${i + 1}/${list.length}`)),
        i === 0 && h('p', { class: 'hint' }, canListen() ? 'Vypočuj si vetu a povedz ju nahlas rovnako. Appka ťa počúva.' : 'Tento prehliadač nevie počúvať. Vypočuj si vetu, povedz ju nahlas a ohodnoť sa sám.'),
        h('div', { class: 'qcard' }, sentence,
          h('div', { class: 'row' },
            h('button', { class: 'btn ghost small', type: 'button', onclick: () => play(false) }, '🔊 Vypočuť'),
            h('button', { class: 'btn ghost small', type: 'button', onclick: () => play(true) }, '🐢 Pomaly'))),
        micBtn, self, fb,
        micBtn && h('button', { class: 'btn ghost small adv-skip', type: 'button', onclick: () => { if (!tries) S.gain(0, 2); i++; step(); } }, 'Teraz nemôžem hovoriť – preskočiť'));
      play(false);
    }
    step();
  }

  // ---------- Písanie (list, pohľadnica) s hodnotením AI ----------
  function write(S, sc, next) {
    const w = sc.write;
    const [min, max] = w.words || [30, 80];
    const draftKey = `${progKey}.draft`;
    const area = h('textarea', { class: 'adv-write', rows: 9, 'aria-label': 'Tvoj text', spellcheck: 'false', autocapitalize: 'sentences' });
    area.value = store.get(draftKey, '');
    const counter = h('div', { class: 'muted adv-count' });
    const list = h('ul', { class: 'adv-must' });
    const send = h('button', { class: 'btn', type: 'button', onclick: submit }, canAssess() ? '📨 Poslať na kontrolu' : 'Hotovo – porovnať so vzorom');
    const out = h('div', {});
    function update() {
      const n = words(area.value);
      counter.textContent = `${n} slov (treba ${min}–${max})`;
      counter.classList.toggle('ok', n >= min && n <= max);
      list.replaceChildren(...w.must.map((m) => h('li', { class: hasPhrase(area.value, m) ? 'ok' : '' }, m)));
      send.disabled = n < min;
      store.set(draftKey, area.value);
    }
    area.addEventListener('input', update);

    async function submit() {
      const text = area.value.trim();
      const used = w.must.filter((m) => hasPhrase(text, m));
      area.disabled = true;
      send.hidden = true;
      let res = null;
      if (canAssess()) {
        out.replaceChildren(h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), `${config.mascot.name} číta tvoj text…`));
        res = await assessWriting({ task: w.sk, must: w.must, text });
      }
      const doneBtn = h('button', { class: 'btn', type: 'button', onclick: () => { store.set(draftKey, ''); next(); } }, 'Dokončiť →');
      if (res && !res.error && typeof res.score === 'number') {
        const sc10 = Math.max(0, Math.min(10, Math.round(res.score)));
        S.gain(sc10, 10, send);
        for (const c of res.corrections || []) {
          if (c.wrong && c.right) S.miss({ id: `${lesson.id}:fix:${normalize(c.right)}`, p: `Oprav chybu: ${c.wrong}`, t: c.right, alt: [] });
        }
        if (sc10 >= 8) sfx.fanfare();
        out.replaceChildren(h('div', {},
          h('div', { class: 'qcard adv-ai' },
            h('div', { class: 'result-big' }, `${sc10}/10`),
            h('p', {}, res.summary),
            res.corrections?.length > 0 && h('div', {}, h('h3', {}, 'Opravy'),
              res.corrections.map((c) => h('div', { class: 'adv-fix' },
                h('div', {}, h('s', {}, c.wrong), ' → ', h('b', {}, c.right)),
                h('div', { class: 'muted' }, c.why)))),
            res.better && h('div', {}, h('h3', {}, 'Lepšia verzia', ' ', speakBtn(res.better)), h('p', { class: 'adv-model' }, res.better))),
          doneBtn));
      } else {
        const pts = Math.round((10 * used.length) / Math.max(1, w.must.length));
        S.gain(pts, 10, send);
        out.replaceChildren(h('div', {},
          res?.error && h('p', { class: 'feedback ko' }, res.error),
          h('div', { class: 'qcard' },
            h('div', { class: 'adv-label' }, 'Porovnaj so vzorom'),
            h('p', { class: 'adv-model' }, w.model, ' ', speakBtn(w.model)),
            h('p', {}, `Použil si ${used.length} z ${w.must.length} fráz.`),
            h('p', { class: 'muted' }, 'Prečítaj si svoj text nahlas a oprav, čo znie inak ako vo vzore.')),
          doneBtn));
      }
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    show(h('h2', { class: 'adv-step' }, '✉️ Napíš'),
      h('div', { class: 'qcard' },
        h('p', { class: 'prompt-sk' }, w.sk),
        h('div', { class: 'adv-label' }, 'Použi tieto frázy'), list),
      area, counter, h('div', { class: 'row' }, send), out);
    update();
  }

  // ---------- Koniec scény ----------
  function finish(S, id) {
    stop();
    const p = prog();
    if (id) {
      if (!p.done.includes(id)) p.done.push(id);
      if (S.next && !p.reached.includes(S.next)) p.reached.push(S.next);
      store.set(progKey, p);
    }
    const ratio = S.max ? S.pts / S.max : 0;
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    const isBest = store.record(key, S.pts, stars);
    if (stars >= 2) sfx.fanfare();
    const nextSc = S.next && A.scenes[S.next];
    const big = h('div', { class: 'result-big' }, `${S.pts} b`);
    show(h('div', { class: 'result' },
      h('div', { class: 'result-stars', 'aria-label': `${stars} z 3 hviezd` }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
      big,
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), (isBest && S.pts > 0 ? 'Nový rekord! ' : '') + config.mascot.verdicts[stars]),
      id && !nextSc && h('p', { class: 'adv-end' }, '🏁 The end! Príbeh si dohral. Skús niektoré rozhodnutie znova a choď inou cestou.'),
      S.added.size > 0 && h('div', { class: 'recap' },
        h('h2', {}, `Do opakovania pribudlo ${S.added.size}`),
        h('p', { class: 'muted' }, 'Vrátia sa ti zajtra v rozcvičke.'),
        [...S.added.values()].map((it) => h('div', { class: 'recap-row' },
          h('div', { class: 'recap-text' }, h('div', { class: 'it' }, display(it.t)), h('div', { class: 'sk' }, it.p)),
          speakBtn(display(it.t))))),
      h('div', { class: 'row' },
        nextSc && h('button', { class: 'btn', type: 'button', onclick: () => play(S.next) }, `Ďalej: ${nextSc.title} →`),
        h('button', { class: 'btn' + (nextSc ? ' ghost' : ''), type: 'button', onclick: menu }, 'Príbeh'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Domov'))));
    if (stars === 3) burst(big);
  }

  menu();
  return { el, cleanup: stop };
}

export function validate(l, err) {
  const A = l.adventure;
  if (!A?.scenes || !A.start) { err('adventure: chýba adventure.scenes alebo start'); return '0 scén'; }
  const ids = Object.keys(A.scenes);
  if (!A.scenes[A.start]) err(`adventure: štart „${A.start}“ neexistuje`);
  let drills = 0, speaks = 0, words = 0;
  const reach = new Set(), todo = [A.start];
  while (todo.length) {
    const id = todo.pop();
    if (reach.has(id) || !A.scenes[id]) continue;
    reach.add(id);
    for (const o of A.scenes[id].choice?.options || []) todo.push(o.go);
  }
  const has = (k) => !!lookup(l, k);
  const sentence = (where, t, alt = []) => {
    if (!t || /[[\]|]/.test(t)) err(`adventure: ${where}: chýba alebo pokazená veta „${t}“`);
    if ((t.match(/\(/g) || []).length !== (t.match(/\)/g) || []).length) err(`adventure: ${where}: nespárované zátvorky v „${t}“`);
    for (const a of alt) if (/[[\]|]/.test(a)) err(`adventure: ${where}: pokazené alt „${a}“`);
  };
  for (const id of ids) {
    const sc = A.scenes[id];
    if (!reach.has(id)) err(`adventure: scéna „${id}“ sa nedá dosiahnuť zo štartu`);
    if (!sc.title || !sc.sk || !sc.lines?.length) err(`adventure: scéna „${id}“ potrebuje title, sk a lines`);
    for (const [en, sk] of sc.lines || []) {
      if (!sk) err(`adventure: ${id}: riadok bez prekladu „${en}“`);
      for (const t of tokenize(en)) {
        if (t.sep !== undefined) continue;
        words++;
        if (!has(t.key)) err(`adventure: ${id}: slovo „${t.text}“ (${t.key}) nemá preklad v gloss`);
      }
    }
    for (const o of sc.choice?.options || []) {
      if (!o.sk || !o.go) err(`adventure: ${id}: voľba potrebuje sk, t a go`);
      if (o.go && !A.scenes[o.go]) err(`adventure: ${id}: voľba vedie na neexistujúcu scénu „${o.go}“`);
      sentence(`${id}/voľba`, o.t, o.alt);
    }
    for (const d of sc.drill || []) { drills++; if (!d.sk) err(`adventure: ${id}: drill bez sk`); sentence(`${id}/drill`, d.t, d.alt); }
    for (const s of sc.speak || []) { speaks++; sentence(`${id}/speak`, s); if (/[()]/.test(s)) err(`adventure: ${id}/speak: bez zátvoriek „${s}“`); }
    if (sc.write && (!sc.write.sk || !sc.write.must?.length || !sc.write.model)) err(`adventure: ${id}: write potrebuje sk, must a model`);
    if (!sc.choice && !sc.write) err(`adventure: ${id}: scéna nemá voľbu ani písanie (slepá ulička)`);
  }
  for (const k of Object.keys(A.clues || {})) if (!has(k)) err(`adventure: nápoveda k „${k}“, ktoré nie je v gloss`);
  return `${ids.length} scén, ${words} slov, ${drills} viet na dril, ${speaks} na hovorenie`;
}
