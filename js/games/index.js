// Register minihier. Lekcia si v dátach vyberie, ktoré hry má: games: ['stars', 'choice', 'build'].
// Novú hru pridáš ako modul s funkciou view(lesson, rerender) → { el, cleanup? } a validate(lesson, err) → zhrnutie.
import config from '../../data/config.js';
import * as stars from './constellation.js';
import * as choiceGame from './choice.js';
import * as build from './builder.js';

// title/desc môžu byť funkcie lekcie (napr. vlastný nadpis kariet v každej lekcii).
// unit: jednotka rekordu na karte hry.
export const games = {
  stars: { view: stars.constellation, validate: stars.validate, icon: '✨',
    title: config.ui.stars, desc: 'Chytaj slová, ktoré k sebe patria', unit: () => 'b' },
  choice: { view: choiceGame.choice, validate: choiceGame.validate, icon: '🚦',
    title: (l) => l.choiceTitle, desc: 'Desať kariet, pri každej vysvetlenie prečo', unit: (l) => `z ${Math.min(10, l.cards.length)}` },
  build: { view: build.builder, validate: build.validate, icon: '🧩',
    title: config.ui.build, desc: config.ui.buildDesc, unit: (l) => `z ${Math.min(6, l.build.length)}` },
};

export const text = (v, lesson) => (typeof v === 'function' ? v(lesson) : v);
