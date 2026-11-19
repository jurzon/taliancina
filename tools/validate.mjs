// Kontrola obsahu lekcií: node tools/validate.mjs
import { lessons, lookup, tokenize } from '../js/lessons.js';
import { games } from '../js/games/index.js';

let errors = 0;
const err = (l, msg) => { errors++; console.log(`  ✗ [${l.code}] ${msg}`); };

for (const l of lessons) {
  let words = 0;
  const usedQ = new Set();

  l.chapters.forEach((ch, ci) => {
    if (!ch.vf || ch.vf.length < 1) err(l, `kapitola ${ci + 1}: chýba vero/falso`);
    ch.lines.forEach(([it, sk], li) => {
      if (!sk) err(l, `kapitola ${ci + 1}, riadok ${li + 1}: chýba preklad`);
      if (/[\[\]|]/.test(tokenize(it).map((t) => t.sep ?? '').join(''))) err(l, `kapitola ${ci + 1}, riadok ${li + 1}: pokazená značka`);
      for (const t of tokenize(it)) {
        if (t.sep !== undefined) continue;
        words++;
        if (!lookup(l, t.key)) err(l, `kapitola ${ci + 1}: slovo „${t.text}“ (${t.key}) nemá preklad`);
        if (t.q) {
          usedQ.add(t.q);
          if (!l.questions[t.q]) err(l, `otázka ${t.q} neexistuje`);
        }
      }
    });
  });
  for (const q of Object.keys(l.questions)) if (!usedQ.has(q)) err(l, `otázka ${q} sa v texte nepoužíva`);

  const parts = [];
  if (!l.games?.length) err(l, 'lekcia nemá žiadne hry (games)');
  for (const id of l.games || []) {
    if (!games[id]) { err(l, `neznáma hra „${id}“`); continue; }
    parts.push(games[id].validate(l, (msg) => err(l, msg)));
  }

  console.log(`${l.code} ${l.title}: ${l.chapters.length} kapitoly, ${words} slov, ${Object.keys(l.questions).length} otázok, ${parts.join(', ')}`);
}

console.log(errors ? `\n${errors} chýb` : '\nVšetko v poriadku ✓');
process.exit(errors ? 1 : 0);
