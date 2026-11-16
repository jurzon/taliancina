// Smerovanie podľa #hash a domovská obrazovka.
import { h, topbar, pick, starsText, speakBtn, VERDI } from './ui.js';
import { lessons, lessonById } from './lessons.js';
import { store } from './store.js';
import { reader } from './games/reader.js';
import { constellation } from './games/constellation.js';
import { choice } from './games/choice.js';
import { builder } from './games/builder.js';

const root = document.getElementById('app');
let cleanup = null;

function home() {
  const lesson = lessonById(store.lesson) || lessons[0];
  const streak = store.streak();
  const readCount = lesson.chapters.filter((_, i) => store.isRead(`${lesson.id}.${i}`)).length;

  const tabs = h('div', { class: 'tabs', role: 'tablist' }, lessons.map((l) =>
    h('button', { class: 'tab' + (l.id === lesson.id ? ' on' : ''), type: 'button', role: 'tab', 'aria-selected': String(l.id === lesson.id),
      onclick: () => { store.lesson = l.id; render(); } },
    h('b', {}, l.code), ' ', l.title)));

  const game = (href, icon, title, desc, k, unit) => h('a', { class: 'game-card', href },
    h('span', { class: 'game-icon' }, icon),
    h('span', { class: 'game-body' }, h('span', { class: 'game-title' }, title), h('span', { class: 'game-desc' }, desc)),
    h('span', { class: 'game-meta' },
      h('span', { class: 'game-stars' }, starsText(store.stars(k))),
      store.best(k) > 0 && h('span', { class: 'game-best' }, `${store.best(k)} ${unit}`)));

  const el = h('div', { class: 'screen home' },
    h('main', { class: 'wrap' },
      h('header', { class: 'hero' },
        h('div', { class: 'hero-kicker' }, 'Lezione 6 · Un ambiente prezioso'),
        h('h1', {}, 'Albergo', h('br'), 'Impatto Zero'),
        streak > 0 && h('div', { class: 'streak' }, `🔥 ${streak} ${streak === 1 ? 'deň' : streak < 5 ? 'dni' : 'dní'} po sebe`)),
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, '🌿'), h('span', {}, h('b', {}, 'Signor Verdi: '), pick(VERDI.home))),
      tabs,
      h('p', { class: 'lesson-sub' }, lesson.subtitle),

      h('section', { class: 'story-card' },
        h('div', { class: 'story-card-head' },
          h('span', { class: 'game-icon' }, '📖'),
          h('span', { class: 'game-body' },
            h('span', { class: 'game-title' }, 'Lettura viva'),
            h('span', { class: 'game-desc' }, `${lesson.storyTitle} · prečítané ${readCount}/${lesson.chapters.length}`))),
        h('div', { class: 'chapters' }, lesson.chapters.map((ch, i) =>
          h('a', { class: 'chapter' + (store.isRead(`${lesson.id}.${i}`) ? ' read' : ''), href: `#/l/${lesson.id}/read/${i}` },
            h('span', { class: 'chapter-n' }, store.isRead(`${lesson.id}.${i}`) ? '✓' : i + 1),
            h('span', {}, ch.title, h('small', {}, ch.sk)))))),

      game(`#/l/${lesson.id}/stars`, '✨', 'Costellazioni', 'Chytaj slová, ktoré k sebe patria', `${lesson.id}.stars`, 'b'),
      game(`#/l/${lesson.id}/choice`, '🚦', lesson.choiceTitle, 'Desať kariet, pri každej vysvetlenie prečo', `${lesson.id}.choice`, 'z 10'),
      game(`#/l/${lesson.id}/build`, '🧩', 'Costruisci la frase', 'Poskladaj taliansku vetu z dlaždíc', `${lesson.id}.build`, 'z 6'),

      h('a', { class: 'game-card plain', href: '#/words' },
        h('span', { class: 'game-icon' }, '⭐'),
        h('span', { class: 'game-body' }, h('span', { class: 'game-title' }, 'Moje slová'),
          h('span', { class: 'game-desc' }, store.hard().length ? `${store.hard().length} uložených na opakovanie` : 'Pri čítaní si hviezdičkou odlož ťažké slová'))),
      h('footer', { class: 'foot' },
        h('div', {}, 'Podľa učebnice DIECI, lezione 6 · na domáce precvičovanie'),
        h('div', {}, 'Autor: Juraj Zonnenschein · ', h('a', { href: 'mailto:jurzon@seznam.cz' }, 'jurzon@seznam.cz')),
        h('div', {}, 'Pre školy zadarmo.'))));
  return { el };
}

function words() {
  const list = h('div', { class: 'recap' });
  function draw() {
    const items = store.hard();
    list.replaceChildren(...(items.length ? items.map((w) => {
      const sk = h('div', { class: 'sk veil' }, w.sk);
      return h('div', { class: 'recap-row tappable', onclick: () => sk.classList.toggle('veil') },
        h('div', { class: 'recap-text' }, h('div', { class: 'it' }, w.text, w.lemma && h('small', {}, ` ← ${w.lemma}`)), sk),
        speakBtn(w.text),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Odstrániť', onclick: (e) => { e.stopPropagation(); store.toggleHard(w); draw(); } }, '✕'));
    }) : [h('p', { class: 'muted' }, 'Zatiaľ nič. Pri čítaní príbehu ťukni na slovo a potom na ☆.')]));
  }
  draw();
  return { el: h('div', { class: 'screen' }, topbar('Moje slová'),
    h('main', { class: 'wrap' }, h('p', { class: 'hint' }, 'Najprv si spomeň, potom ťukni na riadok a odkry preklad.'), list)) };
}

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'words') return words();
  if (parts[0] === 'l') {
    const lesson = lessonById(parts[1]);
    if (lesson) {
      if (parts[2] === 'read' && lesson.chapters[+parts[3]]) return reader(lesson, +parts[3]);
      if (parts[2] === 'stars') return constellation(lesson, render);
      if (parts[2] === 'choice') return choice(lesson, render);
      if (parts[2] === 'build') return builder(lesson, render);
    }
  }
  return home();
}

function render() {
  cleanup?.();
  const view = route();
  cleanup = view.cleanup || null;
  root.replaceChildren(view.el);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();

// Úvodná obrazovka: zmizne sama alebo po ťuknutí.
const splash = document.getElementById('splash');
if (splash) {
  const hide = () => {
    splash.classList.add('gone');
    setTimeout(() => splash.remove(), 450);
  };
  splash.addEventListener('click', hide);
  setTimeout(hide, 2200);
}
