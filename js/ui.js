// Malé pomôcky na stavbu DOM a spoločné kúsky rozhrania.
import { speak } from './speech.js';

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

// Hlášky signora Verdiho
export const VERDI = {
  ok: ['Bravissimo!', 'Esatto!', 'Perfetto!', 'Che bravo!', 'Giusto!', 'Ottimo!', 'Così si fa!'],
  ko: [
    'Skoro! Aj signor Verdi si občas pomýli kontajner.',
    'Nevadí. Chyby sú biologicky rozložiteľné.',
    'Toto recyklujeme a skúsime znova.',
    'Quasi! Taliančina vie byť záludná ako sedem kontajnerov.',
    'Piano, piano. Nabudúce to sadne.',
    'Tak toto pôjde do zmesového odpadu.',
  ],
  nonsense: [
    'Zaujímavé, ale to ešte nikto nevynašiel.',
    'Signor Verdi dvíha obočie.',
    'Poetické. Ale nie.',
    'Toto by neprešlo ani v Albergo Impatto Zero.',
    'Odvážne spojenie! Bohužiaľ neexistuje.',
  ],
  home: [
    'Benvenuto! Dnes šetríme energiu, nie slovíčka.',
    'Výťah je mimo prevádzky. Vždy bol. Sú to schody.',
    'Každé správne slovíčko zasadí pomyselný strom.',
    'Káva nie je a chilometro zero. Taliančina áno.',
    'Sebbene sia tardi, na jednu hru je čas vždy.',
    'Dnes na raňajky: tri paradajky a konjunktív.',
  ],
};

// Spoločná obrazovka s výsledkom
export function resultView({ title, big, stars, verdict, body, again }) {
  return h('div', { class: 'screen' },
    topbar(title),
    h('main', { class: 'wrap result' },
      h('div', { class: 'result-stars', 'aria-label': `${stars} z 3 hviezd` }, starsText(stars)),
      h('div', { class: 'result-big' }, big),
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, '🌿'), verdict),
      body,
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: again }, 'Ešte raz'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Domov'))));
}

export function verdictFor(stars) {
  return [
    'Dnes to bolo na kompost, ale z kompostu rastú najlepšie paradajky.',
    'Dobrý začiatok! Signor Verdi vám drží miesto na bicykli.',
    'Molto bene! Ešte kúsok a ste a impatto zero.',
    'Perfetto! Signor Verdi vám na počesť zasadil strom.',
  ][stars];
}
