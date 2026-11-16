// Kontrola obsahu lekcií: node tools/validate.mjs
import { lessons, lookup, tokenize, norm, tilesOf } from '../js/lessons.js';

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

  for (const r of l.rounds) {
    const ok = new Set(r.chains.flatMap((c) => c.w));
    const seen = new Set();
    for (const c of r.chains) {
      const id = c.w.join(' ');
      if (seen.has(id)) err(l, `súhvezdie „${r.c}“: duplicitné spojenie ${id}`);
      seen.add(id);
      if (!c.sk) err(l, `súhvezdie „${r.c}“: ${id} nemá preklad`);
      for (const o of r.chains) {
        if (o !== c && o.w.length > c.w.length && c.w.every((w, i) => o.w[i] === w)) err(l, `súhvezdie „${r.c}“: ${id} je začiatkom iného spojenia`);
      }
    }
    for (const x of r.x) if (ok.has(x)) err(l, `súhvezdie „${r.c}“: nezmysel „${x}“ je zároveň správne slovo`);
    if (new Set(r.x).size !== r.x.length) err(l, `súhvezdie „${r.c}“: duplicitné nezmysly`);
  }

  for (const c of l.cards) {
    if (c.s.split('___').length !== 2) err(l, `karta „${c.s}“: musí mať práve jednu medzeru`);
    if (c.o.length < 2 || new Set(c.o).size !== c.o.length) err(l, `karta „${c.s}“: zlé možnosti`);
    if (!c.why || !c.sk) err(l, `karta „${c.s}“: chýba vysvetlenie alebo preklad`);
  }

  for (const b of l.build) {
    const pool = [...tilesOf(b.it), ...(b.x || [])].map((t) => t.toLowerCase());
    for (const alt of b.alt || []) {
      const left = [...pool];
      for (const t of tilesOf(alt)) {
        const i = left.indexOf(t.toLowerCase());
        if (i < 0) err(l, `skladačka „${b.it}“: alternatíva „${alt}“ sa nedá poskladať (chýba „${t}“)`);
        else left.splice(i, 1);
      }
      if (tilesOf(alt).length !== tilesOf(b.it).length) err(l, `skladačka „${b.it}“: alternatíva má iný počet dlaždíc`);
    }
    for (const x of b.x || []) if (tilesOf(b.it).map((t) => t.toLowerCase()).includes(x.toLowerCase())) err(l, `skladačka „${b.it}“: dlaždica navyše „${x}“ je aj v riešení`);
    if (norm(tilesOf(b.it).join(' ')) !== norm(b.it)) err(l, `skladačka „${b.it}“: dlaždice nedávajú riešenie`);
  }

  console.log(`${l.code} ${l.title}: ${l.chapters.length} kapitoly, ${words} slov, ${Object.keys(l.questions).length} otázok, ` +
    `${l.rounds.length} súhvezdí (${l.rounds.reduce((n, r) => n + r.chains.length, 0)} spojení), ${l.cards.length} kariet, ${l.build.length} viet`);
}

console.log(errors ? `\n${errors} chýb` : '\nVšetko v poriadku ✓');
process.exit(errors ? 1 : 0);
