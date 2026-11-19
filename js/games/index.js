// Register minihier. Lekcia si v dátach vyberie, ktoré hry má: games: ['stars', 'choice', 'build'].
// Novú hru pridáš ako modul s funkciou view(lesson, rerender) → { el, cleanup? } a validate(lesson, err) → zhrnutie.
import config from '../../data/config.js';
import * as stars from './constellation.js';
import * as choiceGame from './choice.js';
import * as build from './builder.js';
import * as walkGame from './directions.js';
import * as pairsGame from './pairs.js';
import * as spellGame from './spelling.js';
import * as pondGame from './pond.js';

// title/desc môžu byť funkcie lekcie (napr. vlastný nadpis kariet v každej lekcii).
// unit: jednotka rekordu na karte hry.
export const games = {
  stars: { view: stars.constellation, validate: stars.validate, icon: '✨',
    title: config.ui.stars, desc: 'Chytaj slová, ktoré k sebe patria', unit: () => 'b' },
  choice: { view: choiceGame.choice, validate: choiceGame.validate, icon: '🚦',
    title: (l) => l.choiceTitle, desc: 'Desať kariet, pri každej vysvetlenie prečo', unit: (l) => `z ${Math.min(10, l.cards.length)}` },
  build: { view: build.builder, validate: build.validate, icon: '🧩',
    title: config.ui.build, desc: config.ui.buildDesc, unit: (l) => `z ${Math.min(6, l.build.length)}` },
  walk: { view: walkGame.walk, validate: walkGame.validate, icon: '📼',
    title: config.ui.walk, desc: config.ui.walkDesc, unit: (l) => `z ${l.walk.tour.length}` },
  pairs: { view: pairsGame.pairs, validate: pairsGame.validate, icon: '🔁',
    title: (l) => l.pairsTitle || config.ui.pairs, desc: config.ui.pairsDesc, unit: (l) => `z ${Math.min(6, l.pairs.length)}` },
  pond: { view: pondGame.pond, validate: pondGame.validate, icon: '🌊',
    title: (l) => l.pondTitle || config.ui.pond, desc: config.ui.pondDesc, unit: (l) => `z ${Math.min(6, l.pairs.length)}` },
  spell: { view: spellGame.spelling, validate: spellGame.validate, icon: '🔤',
    title: config.ui.spell, desc: config.ui.spellDesc, unit: (l) => `z ${Math.min(8, l.spell.length)}` },
};

export const text = (v, lesson) => (typeof v === 'function' ? v(lesson) : v);
