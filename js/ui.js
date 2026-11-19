// Malé pomôcky na stavbu DOM a spoločné kúsky rozhrania.
import { speak } from './speech.js';
import config from '../data/config.js';

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sample = (arr, n) => shuffle(arr).slice(0, n);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const starsText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function topbar(title, right) {
  return h('header', { class: 'topbar' },
    h('a', { class: 'back', href: '#/', 'aria-label': 'Späť na úvod' }, '←'),
    h('div', { class: 'topbar-title' }, title),
    h('div', { class: 'topbar-right' }, right));
}

export function speakBtn(text, label = 'Vypočuť') {
  return h('button', { class: 'icon-btn', type: 'button', 'aria-label': label, onclick: (e) => { e.stopPropagation(); speak(text); } }, '🔊');
}

// Hlášky maskota (ok, ko, nonsense, home) – sú v data/config.js
export const MASCOT = config.mascot;

// Spoločná obrazovka s výsledkom
export function resultView({ title, big, stars, verdict, body, again }) {
  return h('div', { class: 'screen' },
    topbar(title),
    h('main', { class: 'wrap result' },
      h('div', { class: 'result-stars', 'aria-label': `${stars} z 3 hviezd` }, starsText(stars)),
      h('div', { class: 'result-big' }, big),
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), verdict),
      body,
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: again }, 'Ešte raz'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Domov'))));
}

export const verdictFor = (stars) => config.mascot.verdicts[stars];
