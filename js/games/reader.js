// Lettura viva – príbeh, v ktorom sa dá ťuknúť na každé slovo.
import { h, topbar, speakBtn, MASCOT, pick } from '../ui.js';
import { tokenize, plain, lookup } from '../lessons.js';
import { store } from '../store.js';
import { speak } from '../speech.js';
import config from '../../data/config.js';

const FONT = [1.0, 1.1, 1.22, 1.36, 1.5];

export function reader(lesson, n) {
  const ch = lesson.chapters[n];
  const readKey = `${lesson.id}.${n}`;
  let selected = null;

  const sheet = h('aside', { class: 'sheet', 'aria-live': 'polite' });
  const closeSheet = () => {
    sheet.classList.remove('open');
    selected?.classList.remove('sel');
    selected = null;
  };

  function openSheet(tok, el) {
    selected?.classList.remove('sel');
    selected = el;
    el.classList.add('sel');
    const g = lookup(lesson, tok.key) || { sk: '?', lemma: '', note: '' };
    const id = `${lesson.id}:${tok.key}`;
    const star = h('button', { class: 'icon-btn star' + (store.isHard(id) ? ' on' : ''), type: 'button', 'aria-label': 'Pridať medzi moje slová',
      onclick: () => {
        const on = store.toggleHard({ id, text: tok.text.toLowerCase(), sk: g.sk, lemma: g.lemma });
        star.classList.toggle('on', on);
        star.textContent = on ? '★' : '☆';
      } }, store.isHard(id) ? '★' : '☆');

    const kids = [
      h('div', { class: 'sheet-head' },
        h('div', { class: 'sheet-word' }, tok.text),
        speakBtn(tok.text),
        star,
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Zavrieť', onclick: closeSheet }, '✕')),
      g.lemma && h('div', { class: 'sheet-lemma' }, '← ', h('i', {}, g.lemma)),
      h('div', { class: 'sheet-sk' }, g.sk),
      g.note && h('div', { class: 'sheet-note' }, g.note),
    ];

    if (tok.q && lesson.questions[tok.q]) {
      const [q, a] = lesson.questions[tok.q];
      const ans = h('div', { class: 'q-answer', hidden: true }, a);
      const btn = h('button', { class: 'btn small', type: 'button', onclick: () => { ans.hidden = false; btn.remove(); } }, 'Mám to v hlave – ukáž odpoveď');
      kids.push(h('div', { class: 'q-box' }, h('div', { class: 'q-label' }, '🤔 Otázka na zamyslenie'), h('div', { class: 'q-text' }, q), btn, ans));
    }
    sheet.replaceChildren(...kids.filter(Boolean));
    sheet.classList.add('open');
  }

  // Text
  const paras = ch.lines.map(([it, sk]) => {
    const tr = h('div', { class: 'tr', hidden: true }, sk);
    const p = h('p', { class: 'line' });
    for (const tok of tokenize(it)) {
      if (tok.sep !== undefined) { p.append(tok.sep); continue; }
      const el = h('span', { class: 'w' + (tok.q ? ' has-q' : ''), role: 'button', tabindex: '0' }, tok.text);
      const open = (e) => { e.stopPropagation(); openSheet(tok, el); };
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
      p.append(el);
    }
    const tools = h('span', { class: 'line-tools' },
      h('button', { class: 'chip', type: 'button', 'aria-label': 'Prečítať vetu', onclick: (e) => { e.stopPropagation(); speak(plain(it)); } }, '🔊'),
      h('button', { class: 'chip', type: 'button', 'aria-label': 'Preklad vety', onclick: (e) => { e.stopPropagation(); tr.hidden = !tr.hidden; } }, 'SK'));
    return h('div', { class: 'para' }, p, tools, tr);
  });

  // Vero o falso
  let answered = 0;
  const done = h('div', { class: 'chapter-done', hidden: true });
  const vf = ch.vf.map(([stmt, truth, why]) => {
    const fb = h('div', { class: 'vf-fb', hidden: true });
    const mk = (label, val) => h('button', { class: 'btn small ghost', type: 'button', onclick: () => {
      if (!fb.hidden) return;
      const ok = val === truth;
      fb.hidden = false;
      fb.className = 'vf-fb ' + (ok ? 'ok' : 'ko');
      fb.textContent = (ok ? pick(MASCOT.ok) + ' ' : `Je to ${(truth ? config.ui.vfTrue : config.ui.vfFalse).toLowerCase()}. `) + why;
      row.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      if (++answered === ch.vf.length) finish();
    } }, label);
    const row = h('div', { class: 'row' }, mk(config.ui.vfTrue, true), mk(config.ui.vfFalse, false));
    return h('div', { class: 'vf' }, h('div', { class: 'vf-stmt' }, stmt), row, fb);
  });

  function finish() {
    store.markRead(readKey);
    const next = n + 1 < lesson.chapters.length;
    done.hidden = false;
    done.replaceChildren(
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), next ? config.mascot.chapterDone : 'Príbeh dočítaný! Teraz si slovíčka vyskúšaj v hrách.'),
      h('div', { class: 'row' },
        next && h('a', { class: 'btn', href: `#/l/${lesson.id}/read/${n + 1}` }, 'Ďalšia kapitola →'),
        h('a', { class: 'btn' + (next ? ' ghost' : ''), href: '#/' }, 'Domov')));
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const article = h('article', { class: 'story' },
    h('div', { class: 'story-kicker' }, `${lesson.storyTitle} · ${n + 1}/${lesson.chapters.length}`),
    h('h1', { class: 'story-title' }, ch.title),
    h('div', { class: 'story-sub' }, ch.sk),
    h('p', { class: 'hint' }, 'Ťukni na ktorékoľvek slovo. ', h('span', { class: 'w has-q demo' }, 'Podčiarknuté'), ' slová skrývajú otázku.'),
    paras,
    h('section', { class: 'vf-box' }, h('h2', {}, config.ui.vf), vf),
    done);

  const applyFont = () => article.style.setProperty('--rs', FONT[store.font] + 'rem');
  applyFont();
  const fontBtn = (label, d) => h('button', { class: 'icon-btn', type: 'button', 'aria-label': d > 0 ? 'Väčšie písmo' : 'Menšie písmo', onclick: () => {
    store.font = Math.max(0, Math.min(FONT.length - 1, store.font + d));
    applyFont();
  } }, label);

  const el = h('div', { class: 'screen reader', onclick: closeSheet },
    topbar(config.ui.reader, [fontBtn('A−', -1), fontBtn('A+', 1)]),
    h('main', { class: 'wrap' }, article),
    sheet);
  sheet.addEventListener('click', (e) => e.stopPropagation());

  return { el, cleanup: () => window.speechSynthesis?.cancel() };
}
