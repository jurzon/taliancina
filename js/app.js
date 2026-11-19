// Smerovanie podľa #hash a domovská obrazovka.
import { h, topbar, pick, starsText, speakBtn, MASCOT } from './ui.js';
import { lessons, lessonById } from './lessons.js';
import { store } from './store.js';
import { reader } from './games/reader.js';
import { games, text } from './games/index.js';
import config from '../data/config.js';

const root = document.getElementById('app');
let cleanup = null;

function home() {
  const lesson = lessonById(store.lesson) || lessons[0];
  const streak = store.streak();
  const readCount = lesson.chapters.filter((_, i) => store.isRead(`${lesson.id}.${i}`)).length;

  // Prepínač lekcií – iba keď je ich viac.
  const tabs = lessons.length > 1 && h('nav', { class: 'lesson-switch', 'aria-label': 'Lekcie' }, lessons.map((l) =>
    h('button', { class: 'lesson-pill' + (l.id === lesson.id ? ' on' : ''), type: 'button', 'aria-current': l.id === lesson.id ? 'true' : null,
      onclick: () => { store.lesson = l.id; render(); } },
    h('b', {}, l.code), ' ', l.title)));

  // Pokrok v lekcii: hviezdy zo všetkých hier a prečítané kapitoly.
  const gameIds = lesson.games.filter((id) => games[id]);
  const starsGot = gameIds.reduce((n, id) => n + store.stars(`${lesson.id}.${id}`), 0);
  const starsMax = gameIds.length * 3;
  const topics = (lesson.subtitle || '').split(' · ').filter(Boolean);

  const game = (href, icon, title, desc, k, unit) => h('a', { class: 'game-card', href },
    h('span', { class: 'game-icon' }, icon),
    h('span', { class: 'game-body' }, h('span', { class: 'game-title' }, title), h('span', { class: 'game-desc' }, desc)),
    h('span', { class: 'game-meta' },
      h('span', { class: 'game-stars' }, starsText(store.stars(k))),
      store.best(k) > 0 && h('span', { class: 'game-best' }, `${store.best(k)} ${unit}`)));

  const el = h('div', { class: 'screen home' },
    h('main', { class: 'wrap' },
      h('header', { class: 'app-bar' },
        h('img', { class: 'app-logo', src: 'icon.svg', alt: '' }),
        h('div', { class: 'app-name' }, config.brand.title.join(' ')),
        streak > 0 && h('div', { class: 'streak', title: 'Dni po sebe' }, `🔥 ${streak}`)),
      tabs,
      h('section', { class: 'lesson-hero' },
        h('div', { class: 'lesson-kicker' }, `Lekcia ${lesson.code}`),
        h('h1', { class: 'lesson-title' }, lesson.title),
        topics.length > 0 && h('div', { class: 'lesson-topics' }, topics.map((t) => h('span', { class: 'topic' }, t))),
        h('div', { class: 'lesson-progress' },
          h('div', { class: 'lp-bar' }, h('div', { style: `width:${starsMax ? (starsGot / starsMax) * 100 : 0}%` })),
          h('div', { class: 'lp-text' }, `⭐ ${starsGot}/${starsMax} · 📖 ${readCount}/${lesson.chapters.length} kapitol`))),
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), h('span', {}, h('b', {}, `${config.mascot.name}: `), pick(MASCOT.home))),

      h('section', { class: 'story-card' },
        h('div', { class: 'story-card-head' },
          h('span', { class: 'game-icon' }, '📖'),
          h('span', { class: 'game-body' },
            h('span', { class: 'game-title' }, config.ui.reader),
            h('span', { class: 'game-desc' }, `${lesson.storyTitle} · prečítané ${readCount}/${lesson.chapters.length}`))),
        h('div', { class: 'chapters' }, lesson.chapters.map((ch, i) =>
          h('a', { class: 'chapter' + (store.isRead(`${lesson.id}.${i}`) ? ' read' : ''), href: `#/l/${lesson.id}/read/${i}` },
            h('span', { class: 'chapter-n' }, store.isRead(`${lesson.id}.${i}`) ? '✓' : i + 1),
            h('span', {}, ch.title, h('small', {}, ch.sk)))))),

      lesson.games.filter((id) => games[id]).map((id) => {
        const g = games[id];
        return game(`#/l/${lesson.id}/${id}`, g.icon, text(g.title, lesson), text(g.desc, lesson), `${lesson.id}.${id}`, text(g.unit, lesson));
      }),

      h('a', { class: 'game-card plain', href: '#/words' },
        h('span', { class: 'game-icon' }, '⭐'),
        h('span', { class: 'game-body' }, h('span', { class: 'game-title' }, 'Moje slová'),
          h('span', { class: 'game-desc' }, store.hard().length ? `${store.hard().length} uložených na opakovanie` : 'Pri čítaní si hviezdičkou odlož ťažké slová'))),
      h('footer', { class: 'foot' },
        h('div', {}, config.brand.source),
        h('div', {}, `Autor: ${config.brand.author} · `, h('a', { href: `mailto:${config.brand.email}` }, config.brand.email)),
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
      if (lesson.games.includes(parts[2]) && games[parts[2]]) return games[parts[2]].view(lesson, render);
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
