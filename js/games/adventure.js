// Adventure – textová hra. Hráč chodí po meste, zbiera veci a rozpráva sa s ľuďmi – všetko po anglicky.
// Príkazy píše alebo hovorí (go to the market, take the map, talk to the man…), alebo ťukne na tlačidlo.
// Rozhovory: postava povie vetu, hráč musí odpovedať po anglicky (askCard: tolerancia, AI, tipy).
// Po prvom rozhovore na mieste nasleduje dril viet z toho miesta a „vypočuj a zopakuj“.
// Čo hráč nevedel, ide do opakovania (js/srs.js). Logika sveta a parser sú v js/world.js.
//
// Dáta lekcie (lesson.adventure) – úplný príklad je data/unit5-adventure.js:
//   title, sk, intro, start, state: { money, time, deadline }, goal: { sk, items }, mapItem, talkMinutes,
//   verbs: { go: ['go to', …], talk, take, examine, give: ['give {item} to {person}'], look, time, inventory, wait, card },
//   msgs: { take: 'You take {item}.', … },  clues, tips,
//   items: { id: { name: 'the map', aliases, sk, icon, price, consume, desc: [[en, sk]], tom: [en, sk] } },
//   people: { id: { name, aliases, when, who: { name, note, photo | emoji }, talk: [{ if, steps }] } },
//   places: { id: { name, aliases, title, sk, photo, lines, look, people, items, exits: { id: minúty }, known, reveal, onMap, drill, speak } },
//   final: { place, person, flag, arrive: [kroky], write: { sk, must, words, model } }
// Kroky rozhovoru: { say: [en, sk] } { ask: { sk, t, alt } } { choose: [{ sk, t, alt, if, then, exit }], loop }
//   { give: id } { buy: id, then, else } { pay: n } { flag: x } { reveal: [ids] } { if: podmienka, then, else }
import { h, topbar, speakBtn, pick, MASCOT, shuffle } from '../ui.js';
import { tokenize, plain, lookup } from '../lessons.js';
import { store } from '../store.js';
import { speak, speakSeq, stopSpeech, listen, canListen } from '../speech.js';
import { check, diffWords, heardRatio, initials, hasPhrase, display, normalize, typoWord, wordFix, extraWords } from '../answer.js';
import * as srs from '../srs.js';
import * as W from '../world.js';
import { canAssess, assessWriting, checkAnswer } from '../ai.js';
import { sfx, floatText, burst } from '../fx.js';
import config from '../../data/config.js';

const MAX_REVIEW = 6;
const MAX_WORDS = 6;
const LOG = 8;
// replaceChildren by vypísal aj undefined/false ako text – tu sa vynechajú.
const fill = (node, ...kids) => node.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
const words = (s) => (s.trim().match(/\p{L}+(?:['’]\p{L}+)*/gu) || []).length;
const tpl = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export function adventure(lesson) {
  const A = lesson.adventure;
  const key = `${lesson.id}.adventure`;
  const saveKey = `${lesson.id}.adv2`;
  let st = store.get(saveKey, null);
  if (st) st.where ??= [];
  let S = null;
  let stopMic = null;
  let log = [];
  let mode = 'menu'; // city | talk | menu – podľa toho sa dá na mape ťuknúť na miesto

  const score = h('span', { class: 'hud-score' });
  const main = h('main', { class: 'wrap adv' });
  const el = h('div', { class: 'screen' }, topbar(config.ui.adventure, score), main);

  function stop() {
    stopSpeech();
    stopMic?.();
    stopMic = null;
  }
  const show = (...kids) => { stop(); closePanel?.(); fill(main, ...kids); window.scrollTo(0, 0); };
  const save = () => store.set(saveKey, st);

  // Body a chyby. Body sa pripisujú aj do uloženej hry (st.pts).
  function session() {
    const s = { pts: 0, max: 0, added: new Map(), words: [],
      gain(p, max, target) {
        s.pts += p; s.max += max;
        if (st) { st.pts += p; st.max += max; save(); }
        score.textContent = `⭐ ${st ? st.pts : s.pts}`;
        if (p > 0 && target) floatText(target, `+${p}`);
      },
      miss(item) {
        if (item.review) return; // opakovanie si krabičku posunie samo
        srs.add({ ...item, lesson: lesson.id });
        s.added.set(item.id, item);
      } };
    score.textContent = `⭐ ${st ? st.pts : 0}`;
    return s;
  }

  // ---------- Fotky, postavy ----------
  // Fotka s menom autora a licenciou (photo: { src, alt, author, license, licenseUrl, source }).
  function credit(ph) {
    if (!ph?.author) return null;
    return h('div', { class: 'adv-credit' }, 'Foto: ',
      ph.source ? h('a', { href: ph.source, target: '_blank', rel: 'noopener' }, ph.author) : ph.author,
      ph.license && [' · ', ph.licenseUrl ? h('a', { href: ph.licenseUrl, target: '_blank', rel: 'noopener' }, ph.license) : ph.license],
      ' · Wikimedia Commons');
  }
  const photo = (ph, cls) => ph?.src && h('img', { class: cls, src: ph.src, alt: ph.alt || '', loading: 'lazy' });
  // Tvár v krúžku. photo.face: { pos: '50% 30%', zoom: 2 } priblíži tvár na veľkej fotke.
  const face = (w, cls) => {
    if (!w?.photo) return h('span', { class: cls + ' emoji' }, w?.emoji || '🙂');
    const f = w.photo.face;
    return h('span', { class: cls + ' face' }, h('img', { src: w.photo.src, alt: w.photo.alt || '', loading: 'lazy',
      style: f ? `object-position:${f.pos};transform:scale(${f.zoom});transform-origin:${f.pos}` : null }));
  };

  // Postava: who: { name, note, photo | emoji }. talking = práve hovorí.
  function who(w, talking) {
    if (!w) return null;
    return h('div', { class: 'adv-who' + (talking ? ' talking' : '') },
      face(w, 'adv-who-img'),
      h('div', { class: 'adv-who-text' }, h('b', {}, w.name), h('div', {}, w.note), credit(w.photo)));
  }

  // ---------- Ťukateľný text s rebríkom nápovied ----------
  // Jeden spodný panel na obrazovku; lineEl(en) vyrobí odsek, v ktorom sa dá ťuknúť na každé slovo.
  function reader() {
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
      const s = state[tok.key] ??= { step: !ladder ? 3 : clueFor(tok, g) ? 1 : 2 };

      const learnt = (known) => {
        if (s.step === 3 && s.counted) return;
        s.step = 3; s.counted = true;
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
        if (s.step === 1) {
          const clue = clueFor(tok, g);
          body = h('div', { class: 'q-box' },
            h('div', { class: 'q-label' }, '🤔 Čo to znamená? Nápoveda po anglicky'),
            h('div', { class: 'q-text' }, clue, ' ', speakBtn(clue)),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', onclick: () => confirm(2) }, 'Už viem (+2)'),
              h('button', { class: 'btn small ghost', type: 'button', onclick: () => { s.step = 2; draw(); } }, 'Neviem')));
        } else if (s.step === 2) {
          body = h('div', { class: 'q-box' },
            h('div', { class: 'q-label' }, '🔤 Po slovensky to začína takto'),
            h('div', { class: 'q-text adv-mask' }, mask(g.sk)),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', onclick: () => confirm(1) }, 'Už viem (+1)'),
              h('button', { class: 'btn small ghost', type: 'button', onclick: () => { S.gain(0, 2); learnt(false); draw(); } }, 'Neviem – ukáž')));
        } else if (s.step === 'check') {
          body = h('div', {}, answer, h('div', { class: 'q-box' },
            h('div', { class: 'q-label' }, 'Myslel si to isté?'),
            h('div', { class: 'row' },
              h('button', { class: 'btn small', type: 'button', onclick: (e) => { S.gain(s.pts, 2, e.target); learnt(true); draw(); } }, 'Áno ✓'),
              h('button', { class: 'btn small ghost', type: 'button', onclick: () => { S.gain(0, 2); learnt(false); draw(); } }, 'Nie'))));
        } else {
          body = h('div', {}, answer, s.counted && h('p', { class: 'muted adv-note' }, 'Toto slovo si ešte napíšeš v drile.'));
        }
        fill(sheet, head, body);
        sheet.classList.add('open');
      }
      function confirm(pts) { s.pts = pts; s.step = 'check'; draw(); }
      draw();
    }

    function lineEl(en, sk, cls = 'line') {
      const tr = sk && h('div', { class: 'tr', hidden: true }, sk);
      const p = h('p', { class: cls });
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
          sk && h('button', { class: 'chip', type: 'button', 'aria-label': 'Preklad vety', onclick: (e) => { e.stopPropagation(); tr.hidden = !tr.hidden; } }, 'SK')),
        tr);
    }
    return { sheet, close, lineEl };
  }

  // ---------- Menu ----------
  function menu() {
    stop();
    score.textContent = st ? `⭐ ${st.pts}` : '';
    const dueN = srs.due(lesson.id, 99).length;
    const total = srs.count(lesson.id);
    const playing = st && !st.over;
    const place = A.places[playing ? st.place : A.start];
    const got = playing ? A.goal.items.filter((id) => st.items.includes(id) || st.given.includes(id)).length : 0;

    const hero = h('figure', { class: 'adv-hero' },
      photo(place.photo, 'adv-hero-img'),
      h('figcaption', { class: 'adv-hero-text' },
        h('div', { class: 'adv-hero-kicker' }, '🧭 ', config.ui.adventure),
        h('h1', {}, A.title),
        A.sk && h('div', {}, A.sk)));

    const next = playing
      ? h('section', { class: 'adv-next' },
        h('div', { class: 'adv-next-kicker' }, 'Pokračuj v hre'),
        h('div', { class: 'adv-next-row' },
          photo(place.photo, 'adv-next-img'),
          h('div', {},
            h('div', { class: 'adv-next-n' }, `🕙 ${W.clock(st.time)} · 💷 £${st.money} · 🎁 ${got}/${A.goal.items.length}`),
            h('h2', { class: 'adv-next-title' }, place.title),
            h('div', { class: 'muted' }, place.sk))),
        h('button', { class: 'btn adv-play', type: 'button', onclick: () => begin(false) }, '▶ Pokračovať'),
        h('button', { class: 'btn ghost small adv-new', type: 'button', onclick: () => { if (confirm('Začať odznova? Rozohraná hra sa stratí.')) begin(true); } }, '↻ Nová hra'))
      : h('section', { class: 'adv-next' },
        h('div', { class: 'adv-next-kicker' }, st?.over ? '🎉 Oslava sa podarila! Hrať znova?' : 'Začni tu'),
        h('div', { class: 'adv-next-row' },
          h('div', {},
            h('div', { class: 'adv-goal-big' }, A.goal.items.map((id) => h('span', { title: A.items[id].sk }, A.items[id].icon))),
            h('div', { class: 'muted' }, `${A.goal.sk}: ${A.goal.items.map((id) => A.items[id].sk).join(', ')} · 💷 £${A.state.money} · do ${W.clock(A.state.deadline)}`))),
        h('button', { class: 'btn adv-play', type: 'button', onclick: () => begin(true) }, '▶ Hrať'));

    const due = dueN > 0 && h('section', { class: 'adv-due' },
      h('div', {}, h('b', {}, `🔁 Dnes zopakuj ${dueN}`), h('div', { class: 'muted' }, 'Slová a vety, ktoré si minule nevedel. Zaberie to 2 minúty.')),
      h('button', { class: 'btn', type: 'button', onclick: reviewOnly }, 'Zopakovať'));

    show(hero, credit(place.photo),
      A.intro && h('p', { class: 'adv-intro' }, A.intro),
      due, next,
      h('details', { class: 'adv-how' },
        h('summary', {}, 'Ako sa hrá?'),
        h('div', {}, '🧭 Píš alebo povedz príkazy po anglicky: go to the market, take the map, talk to the man, look around… Kto si nevie rady, ťukne na tlačidlo.'),
        h('div', {}, '💬 S ľuďmi sa rozprávaš po anglicky. Keď odpoveď nesedí, dostaneš vysvetlenie a skúsiš znova.'),
        h('div', {}, '📖 Neznáme slovo ťukni – najprv dostaneš nápovedu po anglicky, preklad až nakoniec.'),
        h('div', {}, '🏋️ Po rozhovore na novom mieste nasleduje krátky dril.'),
        h('div', {}, '🔁 Čo nevieš, sa ti vráti zajtra, o 3 dni, o týždeň… kým to nesype ako z rukáva.')),
      !dueN && total > 0 && h('p', { class: 'muted adv-srs-note' }, `V opakovaní máš ${total} slov a viet. Dnes je všetko zopakované ✓`));
  }

  function begin(fresh) {
    if (fresh || !st || st.over) { st = W.newState(A); log = []; save(); }
    S = session();
    const rev = srs.due(lesson.id, MAX_REVIEW);
    if (rev.length) drill(S, rev.map((c) => ({ ...c, review: true })), '🔁 Rozcvička', 'Najprv to, čo si minule nevedel. Čím rýchlejšie, tým lepšie.', () => arrive(true));
    else arrive(true);
  }

  function reviewOnly() {
    S = session();
    drill(S, srs.due(lesson.id, 12).map((c) => ({ ...c, review: true })), '🔁 Opakovanie', 'Odpovedaj čo najrýchlejšie. Rýchla správna odpoveď posunie kartu na neskôr.', () => reviewDone(S));
  }

  // ---------- Mesto: miesto, záznam, príkazy ----------
  const say = (en, sk, cls = '') => { log.push({ en, sk, cls }); log = log.slice(-LOG); };
  let cmdEntry = null; // záznam posledného príkazu – pri presune sa ponechá s opravou
  const me = (text) => { cmdEntry = { me: text }; log.push(cmdEntry); log = log.slice(-LOG); };
  const sys = (text) => { log.push({ sys: text }); log = log.slice(-LOG); };
  const iname = (id) => A.items[id].name;

  // Príchod na miesto (aj začiatok hry). Prvá návšteva: celý opis, odhalí miesta z tabúľ.
  function arrive(silent) {
    const p = A.places[st.place];
    const first = !st.visited.includes(st.place);
    if (!st.known.includes(st.place)) st.known.push(st.place);
    for (const id of p.reveal || []) if (!st.known.includes(id)) st.known.push(id);
    // Čo sa predáva tu, to hráč odteraz vie.
    for (const [id, it] of Object.entries(A.items)) if (it.where === st.place && !st.where.includes(id)) st.where.push(id);
    save();
    if (!silent) sfx.pop(1);
    city(first);
    if (first) { st.visited.push(st.place); save(); }
  }

  function city(first) {
    stop();
    const p = A.places[st.place];
    const R = reader();
    const desc = (first ? p.lines : p.look || p.lines).map(([en, sk]) => R.lineEl(en, sk));
    const people = W.peopleHere(A, st).map((id) => {
      const pe = A.people[id];
      const talked = pe.talk?.[0]?.if && W.cond(pe.talk[0].if, st);
      return h('button', { class: 'adv-person' + (talked ? ' talked' : ''), type: 'button', onclick: () => exec(W.command(A, 'talk', id), true) },
        face(pe.who, 'adv-person-img'), h('span', {}, h('b', {}, pe.who?.name || pe.name), h('small', {}, W.command(A, 'talk', id))));
    });
    const things = W.itemsHere(A, st).map((id) => h('button', { class: 'chip adv-thing', type: 'button', onclick: () => exec(W.command(A, 'take', id), true) }, A.items[id].icon, ' ', iname(id)));
    const bag = st.items.map((id) => h('button', { class: 'chip adv-thing', type: 'button', title: A.items[id].sk, onclick: () => exec(W.command(A, 'examine', id), true) }, A.items[id].icon, ' ', iname(id)));

    const logEl = log.length > 0 && h('ol', { class: 'adv-log', onclick: R.close }, log.map((e) => {
      if (e.me) return h('li', { class: 'me' }, '> ', e.me);
      if (e.sys) return h('li', { class: 'sys' }, e.sys);
      if (e.html) return h('li', { class: 'sys' }, e.html);
      return h('li', { class: 'say ' + (e.cls || '') }, R.lineEl(e.en, e.sk, 'adv-log-line'));
    }));

    const input = h('input', {
      class: 'adv-input adv-cmd', type: 'text', 'aria-label': 'Príkaz po anglicky', placeholder: 'napr. go to the bridge',
      autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false',
      onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); if (input.value.trim()) exec(input.value.trim(), false); } },
    });
    const mic = canListen() && h('button', { class: 'btn ghost small mic', type: 'button', 'aria-label': 'Povedať príkaz', onclick: () => {
      mic.classList.add('rec');
      stopMic = listen({
        onresult: (alts) => exec(alts.find((a) => W.parse(a, A, st)) || alts[0] || '', false),
        onend: () => mic.classList.remove('rec'),
      });
    } }, '🎤');
    const acts = W.actions(A, st).filter((a) => a.verb !== 'talk' && a.verb !== 'take');
    const pending = p.drill?.length && !st.drilled.includes(st.place) && !(p.people || []).some((id) => !A.people[id].taxi);

    mode = 'city';
    show(
      gameBar(),
      h('figure', { class: 'adv-banner' }, photo(p.photo, 'adv-banner-img'),
        h('figcaption', {}, h('span', { class: 'adv-you' }, '📍 Si tu'), h('b', {}, p.title), h('span', {}, p.sk))),
      credit(p.photo),
      logEl,
      h('article', { class: 'story adv-place', onclick: R.close },
        desc,
        (people.length > 0 || things.length > 0) && h('div', { class: 'adv-sec' }, h('div', { class: 'adv-lbl' }, '👥 Tu je'), h('div', { class: 'adv-here' }, people, things)),
        bag.length > 0 && h('div', { class: 'adv-sec' }, h('div', { class: 'adv-lbl' }, '🎒 Máš pri sebe (ťukni a pozri sa)'), h('div', { class: 'adv-here' }, bag)),
        quest(),
        pending && h('button', { class: 'btn ghost small adv-practice', type: 'button', onclick: () => practice(() => city(false)) }, '🏋️ Precvič si vety z tohto miesta')),
      h('div', { class: 'adv-cmdbox' },
        h('div', { class: 'adv-label' }, '🧭 Čo urobíš? Napíš alebo povedz (po anglicky)'),
        h('div', { class: 'adv-cmdrow' }, input, mic,
          h('button', { class: 'btn small', type: 'button', onclick: () => input.value.trim() && exec(input.value.trim(), false) }, 'OK')),
        h('div', { class: 'adv-acts' }, acts.map((a) => h('button', { class: 'chip adv-act', type: 'button', onclick: () => exec(a.text, true) }, a.text)))),
      R.sheet);
    if (!first && log.length) input.focus({ preventScroll: true });
  }

  // Úloha a čo ďalej: ktoré veci chýbajú a kde ich zohnať.
  function quest() {
    const F = A.final, fp = A.places[F.place];
    const missing = A.goal.items.filter((id) => !st.items.includes(id) && !st.given.includes(id));
    const items = A.goal.items.map((id) => {
      const it = A.items[id], pl = A.places[it.where];
      const have = st.items.includes(id), given = st.given.includes(id);
      let where;
      if (given) where = 'Tom ho už má 🎉';
      else if (have) where = 'máš ✓';
      else if (W.knowsWhere(A, st, id) && pl) where = it.where === st.place ? `tu: ${pl.sk} 👈` : pl.sk;
      else where = h('span', {}, 'nevieš kde – opýtaj sa: ', h('code', {}, W.command(A, 'where', id)));
      return h('li', { class: have || given ? 'done' : '' }, h('span', {}, have || given ? '✅' : '⬜'), h('span', {}, it.icon, ' ', h('b', {}, it.sk), ' – ', where));
    });
    let next = null;
    if (st.flags.includes(F.flag)) next = st.items.some((id) => A.goal.items.includes(id)) ? 'Daj Tomovi darčeky (give … to Tom) a potom mu napíš pohľadnicu: write the birthday card' : 'Napíš Tomovi pohľadnicu: write the birthday card';
    else if (!missing.length) next = st.place === F.place ? 'Všetko máš! Počkaj na Toma: wait for Tom' : `Všetko máš! Choď do kaviarne (${fp.sk}) a počkaj na Toma.`;
    else if (W.knownPlaces(A, st).length <= 1) next = 'Nevieš, kam ísť. Porozprávaj sa s niekým, kto tu je.';
    return h('details', { class: 'adv-quest', open: true },
      h('summary', {}, '🎯 Úloha: ', A.goal.sk.toLowerCase(), ` · Tom čaká o ${W.clock(A.state.deadline)} – ${fp.sk}`),
      h('ul', {}, items),
      next && h('p', { class: 'adv-next-hint' }, '👉 ', next));
  }

  // ---------- Hráčske menu (vždy navrchu): čas, peniaze, mapa, batoh, úloha ----------
  function gameBar() {
    const hasMap = A.mapItem && st.items.includes(A.mapItem);
    const goal = A.goal.items.map((id) => {
      const it = A.items[id], given = st.given.includes(id), have = st.items.includes(id);
      return h('span', { class: 'adv-goal-item' + (given ? ' given' : have ? ' have' : ''), title: it.sk }, it.icon, (have || given) && h('i', {}, '✓'));
    });
    return h('div', { class: 'adv-hud' },
      h('span', { class: 'adv-clock' + (st.time >= A.state.deadline - 30 ? ' late' : '') }, '🕙 ', W.clock(st.time)),
      h('span', {}, '💷 £', st.money),
      h('nav', { class: 'adv-menu', 'aria-label': 'Menu hráča' },
        hasMap && h('button', { class: 'adv-menubtn', type: 'button', onclick: () => panel('map') }, '🗺️', h('span', {}, 'Mapa')),
        h('button', { class: 'adv-menubtn', type: 'button', onclick: () => panel('bag') }, '🎒', h('span', {}, `Batoh ${st.items.length}`)),
        h('button', { class: 'adv-menubtn goal', type: 'button', onclick: () => panel('quest'), 'aria-label': 'Úloha' }, goal)));
  }

  // Okno nad hrou (mapa, batoh, úloha). Nič sa tým nezavrie – ani rozhovor.
  let curPanel = null;
  const closePanel = () => { curPanel?.remove(); curPanel = null; };
  function panel(kind) {
    closePanel();
    const R = reader();
    let title, body;
    if (kind === 'map') {
      const it = A.items[A.mapItem];
      for (const ad of it.ads || []) {
        for (const i of ad.items) if (!st.where.includes(i)) st.where.push(i);
        if (ad.place && !st.known.includes(ad.place)) st.known.push(ad.place);
      }
      save();
      title = `🗺️ ${capital(it.name)}`;
      body = [mapBox(),
        h('p', { class: 'hint' }, mode === 'city' ? '📍 = tu si. Ťukni na miesto a pôjdeš tam – alebo napíš go to …' : '📍 = tu si. Počas rozhovoru sa nedá odísť – najprv ho dokonči.'),
        h('div', { class: 'adv-sec' }, h('div', { class: 'adv-lbl' }, '📰 Reklamy na mape'),
          (it.ads || []).map((ad) => h('div', { class: 'adv-ad' }, R.lineEl(ad.en, ad.sk, 'adv-ad-line'))))];
    } else if (kind === 'bag') {
      title = '🎒 Batoh';
      body = [h('p', {}, `💷 Peniaze: £${st.money}`),
        st.items.length ? h('div', { class: 'adv-bagl' }, st.items.map((id) => {
          const it = A.items[id];
          return h('div', { class: 'adv-bagi' }, h('div', { class: 'adv-bagi-head' }, h('span', { class: 'adv-bagi-icon' }, it.icon), h('b', {}, it.name), h('span', { class: 'muted' }, ` – ${it.sk}`)),
            (it.desc || []).map(([en, sk]) => R.lineEl(en, sk, 'adv-log-line')));
        })) : h('p', { class: 'muted' }, 'Zatiaľ nič. Veci dostaneš alebo kúpiš v meste.'),
        st.given.length > 0 && h('p', { class: 'muted' }, 'Tom už dostal: ', st.given.map((id) => A.items[id].icon).join(' '))];
    } else {
      title = '🎯 Úloha';
      body = [quest()];
    }
    curPanel = h('div', { class: 'adv-modal', onclick: (e) => { if (e.target === curPanel) closePanel(); } },
      h('div', { class: 'adv-modal-box', onclick: R.close },
        h('div', { class: 'adv-modal-head' }, h('b', {}, title), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Zavrieť', onclick: closePanel }, '✕')),
        body),
      R.sheet);
    el.append(curPanel);
  }

  // Kresba mapy: rieka a miesta. V meste sa dá na miesto ťuknúť a ísť tam.
  function mapBox() {
    const known = W.knownPlaces(A, st);
    const river = h('div', { class: 'adv-river', 'aria-hidden': 'true' });
    river.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M -5 100 C 15 85, 25 70, 30 55 S 38 30, 45 18 S 55 2, 62 -5" /></svg>';
    const pins = Object.entries(A.places).filter(([, p]) => p.xy).map(([id, p]) =>
      h('button', { class: 'adv-pin' + (id === st.place ? ' here' : ''), type: 'button', style: `left:${p.xy[0]}%;top:${p.xy[1]}%`, disabled: mode !== 'city',
        onclick: () => { closePanel(); if (id !== st.place) exec(W.command(A, 'go', id), true); } },
      h('span', { class: 'adv-pin-dot' }, id === st.place ? '📍' : known.includes(id) ? '●' : '○'),
      h('span', { class: 'adv-pin-label' }, p.title)));
    return h('div', { class: 'adv-map' }, river, h('span', { class: 'adv-map-river' }, 'River Ouse'), pins);
  }

  // Taxík: hráč povie, kam chce ísť (jedna veta za každé známe miesto).
  function taxiRide(pid) {
    const T = A.people[pid].taxi;
    const sub = (x, id) => x.replace(/\{place\}/g, A.places[id].name).replace(/\{placeSk\}/g, A.places[id].sk);
    const dests = W.knownPlaces(A, st).filter((id) => id !== st.place);
    conversation(pid, [
      { say: T.greet },
      { choose: [
        ...dests.map((id) => ({ label: `🚕 ${A.places[id].sk}`, sk: sub(T.ask.sk, id), t: sub(T.ask.t, id), alt: T.ask.alt.map((x) => sub(x, id)), then: [{ taxi: id }] })),
        { ...T.bye, exit: true },
      ] },
    ]);
  }

  // Vykoná príkaz. fromButton: ťuknuté tlačidlo (bez bodov aj bez opravy).
  function exec(text, fromButton) {
    const r = W.parse(text, A, st);
    log = []; // záznam ukazuje len posledný príkaz a odpoveď naň
    me(text);
    if (!r) {
      sfx.buzz();
      const ex = W.actions(A, st).slice(0, 3).map((a) => a.text).join(' · ');
      sys(`${config.mascot.face} ${pick(MASCOT.unknown || ['Tomu nerozumiem.'])} Skús napr.: ${ex}`);
      if (!fromButton) S.gain(0, 1);
      return city(false);
    }
    if (!fromButton) {
      if (r.quality === 'exact') S.gain(1, 1);
      else {
        S.gain(0, 1);
        // Ukáž správny tvar a pri chýbajúcom to/the aj tip.
        const missing = diffWords(text, r.canonical).filter((x) => !x.ok).map((x) => normalize(x.w));
        const tip = (A.tips || []).find((tp) => tp.words.some((w) => missing.includes(w)));
        log.push({ html: h('div', { class: 'adv-fixcmd' },
          '✍️ Rozumiem. Správne sa povie: ',
          h('b', {}, diffWords(text, r.canonical).map((x, i) => [i ? ' ' : '', x.ok ? x.w : h('mark', {}, x.w)])),
          tip && h('details', { class: 'adv-tipbox' }, h('summary', {}, '🧠 ', tip.title), tipCard(tip, (pts, e) => S.gain(pts, 0, e)))) });
        S.miss({ id: `${lesson.id}:cmd:${normalize(r.canonical)}`, p: `Príkaz v hre (${A.title})`, t: r.canonical, alt: [] });
      }
    }
    act(r);
  }

  function act(r) {
    const p = A.places[st.place];
    const M = A.msgs;
    const known = W.knownPlaces(A, st);
    switch (r.verb) {
      case 'go': {
        if (r.id === st.place) { say(M.here); return city(false); }
        if (!known.includes(r.id)) { say(tpl(M.unknownPlace, { place: A.places[r.id].name })); sfx.buzz(); return city(false); }
        st.time += p.exits?.[r.id] ?? 15;
        st.place = r.id;
        log = log.includes(cmdEntry) ? log.slice(log.indexOf(cmdEntry)) : [];
        save();
        if (lateCheck()) return;
        return arrive(false);
      }
      case 'take': {
        if (!W.itemsHere(A, st).includes(r.id)) { say(tpl(M.notHere, { item: iname(r.id) })); return city(false); }
        st.items.push(r.id); st.flags.push(`took:${r.id}`); save();
        say(tpl(M.take, { item: iname(r.id) })); sfx.pop(2);
        return city(false);
      }
      case 'where': {
        const asker = W.peopleHere(A, st).find((id) => id !== A.final.person);
        if (!asker) { say(M.nobodyToAsk); return city(false); }
        const pe = A.people[asker];
        const it = A.items[r.id];
        const pid = it ? it.where : r.id;
        const pl = A.places[pid];
        if (it && !st.where.includes(r.id)) st.where.push(r.id);
        if (pl && !st.known.includes(pid)) st.known.push(pid);
        save();
        const [en, sk] = it ? M.whereAnswer : M.whereIs;
        const vars = { item: it?.a, itemSk: it ? capital(it.sk) : '', place: pl.name, placeSk: pl.sk };
        log.push({ html: h('span', { class: 'adv-asker' }, face(pe.who, 'adv-bubble-face'), h('b', {}, pe.who?.name || pe.name), ':') });
        say(capital(tpl(en, vars)), capital(tpl(sk, vars)), 'npc');
        speak(capital(tpl(en, vars)));
        return city(false);
      }
      case 'examine': {
        const it = A.items[r.id];
        if (r.id === A.mapItem && st.items.includes(r.id)) { city(false); return panel('map'); }
        if (!st.items.includes(r.id) && !W.itemsHere(A, st).includes(r.id)) { say(tpl(M.notGot, { item: it.name })); return city(false); }
        for (const [en, sk] of it.desc || []) say(en, sk);
        return city(false);
      }
      case 'talk': {
        if (!W.peopleHere(A, st).includes(r.id)) { say(tpl(M.nobody, { person: capital(A.people[r.id].name) })); return city(false); }
        if (A.people[r.id].taxi) return taxiRide(r.id);
        return conversation(r.id, W.talkSteps(A, r.id, st));
      }
      case 'give': {
        if (!st.flags.includes(A.final.flag)) { say(M.notYet); return city(false); }
        if (!st.items.includes(r.id)) { say(tpl(M.notGot, { item: iname(r.id) })); return city(false); }
        st.items = st.items.filter((x) => x !== r.id); st.given.push(r.id); save();
        say(tpl(M.give, { item: iname(r.id) }));
        const [en, sk] = A.items[r.id].tom || [];
        if (en) say(en, sk, 'npc');
        sfx.fanfare();
        speak(en || tpl(M.give, { item: iname(r.id) }));
        return city(false);
      }
      case 'look': {
        log = [];
        return city(true);
      }
      case 'time': {
        const t = tpl(M.time, { time: W.clock(st.time) });
        say(t); speak(t);
        return city(false);
      }
      case 'inventory': {
        const all = [...st.items].map(iname);
        say(all.length ? tpl(M.inventory, { items: all.join(', '), money: st.money }) : tpl(M.empty, { money: st.money }));
        return city(false);
      }
      case 'wait': {
        if (st.place !== A.final.place) { say(M.notYet); return city(false); }
        say(M.wait);
        st.time = Math.max(st.time, A.state.deadline);
        save();
        return tomArrives();
      }
      case 'card': {
        if (!st.flags.includes(A.final.flag)) { say(M.notYet); return city(false); }
        return write(S, A.final.write, (sc10) => ending(sc10));
      }
    }
    return city(false);
  }
  const capital = (s) => s[0].toUpperCase() + s.slice(1);

  // O 14:00 príde Tom. Ak je hráč inde, dostane správu.
  function lateCheck() {
    if (st.flags.includes(A.final.flag) || st.time < A.state.deadline) return false;
    if (st.place === A.final.place) { arrive(true); tomArrives(); return true; }
    if (!st.flags.includes('lateMsg')) { st.flags.push('lateMsg'); save(); log.push({ sys: `📱 ${W.clock(st.time)}` }); say(A.msgs.late); }
    return false;
  }

  function tomArrives() {
    st.flags.push(A.final.flag); save();
    conversation(A.final.person, A.final.arrive);
  }

  // ---------- Rozhovor ----------
  function conversation(pid, steps) {
    stop();
    log = [];
    const pe = A.people[pid];
    const R = reader();
    const chat = h('div', { class: 'adv-chat' });
    const bottom = h('div', { class: 'adv-chat-bottom' });
    let voice = [];
    const flush = () => { if (voice.length) { speakSeq(voice.flatMap((v) => [v, 300])); voice = []; } };
    const bubble = (cls, ...kids) => { chat.append(h('div', { class: 'adv-bubble ' + cls }, ...kids)); chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
    const sysb = (text) => { bubble('sys', text); main.querySelector('.adv-hud')?.replaceWith(gameBar()); };
    const firstHere = !pe.taxi && !st.drilled.includes(st.place) && A.places[st.place].drill?.length;
    let moved = false;

    mode = 'talk';
    show(gameBar(), who(pe.who, true), h('article', { class: 'story', onclick: R.close }, chat), bottom, R.sheet);

    function run(list, next) {
      let i = 0;
      const go = () => (i < list.length ? step(list[i++], go) : next());
      go();
    }
    function step(s, next) {
      if (s.say) {
        const [en, sk] = s.say;
        bubble('npc', face(pe.who, 'adv-bubble-face'), R.lineEl(en, sk, 'adv-bubble-line'));
        voice.push(plain(en));
        return next();
      }
      if (s.ask) { flush(); return ask(s.ask, next); }
      if (s.choose) { flush(); return choose(s, next); }
      if (s.give) {
        st.items.push(s.give); save(); sfx.fanfare();
        sysb(`🎁 ${A.items[s.give].icon} ${iname(s.give)} – ${A.items[s.give].sk}`);
        return next();
      }
      if (s.buy) {
        const it = A.items[s.buy];
        if (st.money >= it.price) {
          st.money -= it.price;
          if (!it.consume) st.items.push(s.buy);
          save(); sfx.pop(3);
          sysb(`💷 −£${it.price} · ${it.icon} ${iname(s.buy)}${it.consume ? '' : ' – ' + it.sk} · zostáva £${st.money}`);
          return run(s.then || [], next);
        }
        sfx.buzz();
        sysb(`💷 Máš len £${st.money}, ${iname(s.buy)} stojí £${it.price}.`);
        return run(s.else || [{ say: A.msgs.noMoney }], next);
      }
      if (s.taxi) {
        const T = pe.taxi;
        if (st.money < T.price) { sfx.buzz(); return run([{ say: A.msgs.noMoney }], next); }
        st.money -= T.price; st.time += T.minutes; st.place = s.taxi; moved = true;
        log = [];
        save(); sfx.pop(3);
        sysb(`🚕 −£${T.price} · ${T.minutes} min · ${A.places[s.taxi].title}`);
        return run([{ say: T.arrive }], next);
      }
      if (s.pay) { st.money = Math.max(0, st.money - s.pay); save(); return next(); }
      if (s.flag) { if (!st.flags.includes(s.flag)) st.flags.push(s.flag); save(); return next(); }
      if (s.reveal) {
        const nw = s.reveal.filter((id) => !st.known.includes(id));
        st.known.push(...nw); save();
        if (nw.length) sysb(`📍 Teraz vieš, kde je: ${nw.map((id) => A.places[id].name).join(', ')}`);
        return next();
      }
      if (s.if) return run(W.cond(s.if, st) ? s.then || [] : s.else || [], next);
      return next();
    }
    // Hráč musí odpovedať; príbeh ide ďalej až po správnej vete.
    function ask(a, next) {
      const card = askCard({
        label: '✍️ Odpovedz po anglicky',
        p: a.sk, t: a.t, alt: a.alt,
        onAnswer: (r, input) => {
          if (r.tries === 0) S.gain(r.ok ? (r.hints === 0 ? 3 : r.hints === 1 ? 1 : 0) : 0, 3, input);
          if (!r.ok) S.miss({ id: `${lesson.id}:c:${normalize(a.t)}`, p: a.sk, t: a.t, alt: a.alt || [] });
          if (r.ok) card.answer = r.best;
          return !r.ok;
        },
        onNext: () => { fill(bottom); bubble('me', card.answer || display(a.t)); next(); },
        bonus: (pts, e) => S.gain(pts, 0, e),
      });
      fill(bottom, card.el);
      card.focus();
    }
    function choose(s, next) {
      const opts = s.choose.filter((o) => W.cond(o.if, st));
      const pickOpt = (o) => {
        const after = s.loop && !o.exit ? () => choose(s, next) : next;
        ask(o, () => run(o.then || [], after));
      };
      // Odpoveď napísaná/povedaná rovno, bez ťukania na možnosť → plné body.
      const fb = h('div', { class: 'adv-free-fb', hidden: true });
      const tryFree = (texts) => {
        const said = texts.map((x) => x.trim()).filter(Boolean);
        if (!said.length) return;
        for (const o of opts) {
          const hit = said.find((x) => check(x, o.t, o.alt).ok) || said.find((x) => [o.t, ...(o.alt || [])].some((v) => heardRatio([x], display(v)) >= 0.85));
          if (hit) {
            S.gain(3, 3, free); sfx.pop(3);
            fill(bottom); bubble('me', hit);
            const after = s.loop && !o.exit ? () => choose(s, next) : next;
            return run(o.then || [], after);
          }
        }
        sfx.buzz();
        fb.hidden = false;
        fb.textContent = `${config.mascot.face} Tomu nerozumiem. Vyber jednu z možností hore, alebo to skús povedať inak.`;
      };
      const free = h('input', { class: 'adv-input', type: 'text', placeholder: '…alebo to rovno napíš po anglicky', 'aria-label': 'Odpoveď po anglicky',
        autocomplete: 'off', autocorrect: 'off', autocapitalize: 'sentences', spellcheck: 'false',
        onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); tryFree([free.value]); } } });
      const mic = canListen() && h('button', { class: 'btn ghost small mic', type: 'button', 'aria-label': 'Povedať nahlas', onclick: () => {
        mic.classList.add('rec');
        stopMic = listen({ onresult: (alts) => { free.value = alts[0] || ''; tryFree(alts); }, onend: () => mic.classList.remove('rec') });
      } }, '🎤');
      fill(bottom,
        h('div', { class: 'adv-label' }, '💭 Čo povieš? Ťukni na možnosť…'),
        h('div', { class: 'options stacked' }, opts.map((o) => h('button', { class: 'btn option adv-opt', type: 'button', onclick: () => pickOpt(o) }, o.label || o.sk))),
        h('div', { class: 'adv-cmdrow adv-free' }, free, mic,
          h('button', { class: 'btn small', type: 'button', onclick: () => tryFree([free.value]) }, 'OK')),
        fb);
    }

    run(steps, () => {
      flush();
      if (!moved && !pe.taxi) st.time += A.talkMinutes || 10;
      save();
      fill(bottom, h('button', { class: 'btn adv-play', type: 'button', onclick: () => {
        if (moved) { if (!lateCheck()) arrive(false); }
        else if (firstHere) practice(() => { if (!lateCheck()) arrive(true); });
        else if (!lateCheck()) city(false);
      } }, moved ? '🚕 Vystúpiť →' : firstHere ? '🏋️ Precvič si to a pokračuj →' : `↩ Späť: ${A.places[st.place].title}`));
      bottom.querySelector('button').focus({ preventScroll: true });
    });
  }

  // Dril viet z miesta + vypočuj a zopakuj (raz na miesto).
  function practice(done) {
    const p = A.places[st.place];
    st.drilled.push(st.place); save();
    const ws = S.words.splice(0, MAX_WORDS).map((w) => ({ id: `${lesson.id}:w:${w.key}`, p: w.sk, t: w.text, alt: w.lemma ? [w.lemma] : [] }));
    const ds = shuffle(p.drill || []).slice(0, 5).map((d) => ({ id: `${lesson.id}:d:${normalize(d.t)}`, p: d.sk, t: d.t, alt: d.alt || [] }));
    const after = () => (p.speak?.length ? speaking(S, shuffle(p.speak).slice(0, 2), done) : done());
    if (ws.length + ds.length) drill(S, [...ws, ...ds], `🏋️ ${p.title}: dril`, 'Napíš po anglicky. Chyba nevadí – veta sa vráti, kým ju nedáš.', after);
    else after();
  }

  // ---------- Tip: prečo je to tak + pomôcka + vety na vyslovenie ----------
  // tips: [{ words: ['do'], title, text, memo, say: ['How do I get to…?'] }] v dátach príbehu.
  function tipCard(tip, bonus) {
    const lines = tip.say.map((sent) => {
      const [en, note] = sent.split(' = ');
      const row = h('li', {}, h('span', { class: 'adv-say-text' }, en, note && h('small', {}, ` = ${note}`)), speakBtn(en));
      if (canListen()) {
        const mic = h('button', { class: 'icon-btn mic', type: 'button', 'aria-label': 'Povedať nahlas', onclick: () => {
          mic.classList.add('rec');
          stopMic = listen({
            onresult: (alts) => {
              const ok = heardRatio(alts, en) >= 0.8;
              if (ok && !row.classList.contains('said')) { row.classList.add('said'); sfx.pop(2); bonus?.(1, mic); }
              if (!ok) { row.classList.add('miss'); setTimeout(() => row.classList.remove('miss'), 600); sfx.buzz(); }
            },
            onend: () => mic.classList.remove('rec'),
          });
        } }, '🎤');
        row.append(mic);
      }
      return row;
    });
    return h('div', { class: 'adv-tip' },
      h('div', { class: 'adv-tip-title' }, '🧠 ', tip.title),
      h('p', {}, tip.text),
      tip.memo && h('p', { class: 'adv-memo' }, '💡 ', tip.memo),
      h('div', { class: 'adv-lbl' }, canListen() ? '🗣️ Povedz nahlas (za každú vetu +1)' : '🗣️ Povedz nahlas'),
      h('ul', { class: 'adv-say' }, lines));
  }

  // ---------- Karta s odpoveďou (písanie alebo hlas) ----------
  // onAnswer(r) vráti true, ak sa má dať ďalší pokus (inak sa ukáže „Ďalej“).
  function askCard({ label, p, t, alt, onAnswer, onNext, sub, bonus }) {
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

    async function submit(spoken = false) {
      if (locked || !input.value.trim()) return;
      const answer = input.value.trim();
      const r = { ...check(answer, t, alt), hints, tries, ms: performance.now() - t0, spoken };
      // Iné znenie, než je vo vzore: či je správne, posúdi AI (ak je zapnutá).
      let ai = null;
      if (!r.ok && canAssess() && words(answer) >= 2) {
        locked = true;
        tools.hidden = true;
        fb.hidden = false;
        fb.className = 'feedback';
        fill(fb, h('div', { class: 'muted' }, `${config.mascot.face} Tvoja veta je iná ako vo vzore. ${config.mascot.name} premýšľa, či je správne…`));
        ai = await checkAnswer({ sk: p, t: display(t), alt: (alt || []).map(display), answer });
        locked = false;
        tools.hidden = false;
        if (ai?.ok) Object.assign(r, { ok: true, typo: false, best: answer });
      }
      tries++;
      const again = onAnswer(r, input);
      fb.hidden = false;
      fb.className = 'feedback ' + (r.ok ? 'ok' : 'ko');
      const note = ai?.note && h('div', { class: 'adv-ai-note' }, '💬 ', ai.note);
      const nextBtn = h('button', { class: 'btn', type: 'button', onclick: onNext }, 'Ďalej →');
      const finish = () => { locked = true; input.disabled = true; tools.hidden = true; };
      if (r.ok) {
        sfx.pop(3 - hints);
        speak(r.best);
        finish();
        const typo = r.typo && typoWord(answer, r.best);
        const [pre, mid, post] = typo ? wordFix(typo[0], typo[1]) : [];
        fill(fb,
          h('div', { class: 'fb-head' }, ai ? 'Správne, aj takto sa to dá povedať ✓' : r.typo ? `✍️ ${pick(MASCOT.typo || ['Preklep!'])}` : pick(MASCOT.ok), speakBtn(r.best)),
          typo && h('div', { class: 'adv-typo' }, h('s', {}, typo[0]), h('span', { class: 'adv-arrow' }, '→'),
            h('span', { class: 'adv-typo-right' }, pre, h('mark', {}, mid || '·'), post)),
          h('div', { class: 'adv-right' + (r.typo ? ' small' : '') }, r.best),
          note,
          ai && h('div', { class: 'muted' }, 'Vo vzore: ', display(t)),
          sub && h('div', { class: 'muted' }, sub), nextBtn);
        nextBtn.focus();
        return;
      }
      sfx.buzz();
      speak(r.best);
      const marks = diffWords(answer, r.best);
      const right = h('div', { class: 'adv-right' }, marks.map((x, i) => [i ? ' ' : '', x.ok ? x.w : h('mark', { class: 'd-add' }, x.w)]));
      const yours = h('div', { class: 'adv-yours' }, h('span', { class: 'muted' }, 'Ty: '),
        extraWords(answer, r.best).map((x, i) => [i ? ' ' : '', x.ok ? x.w : h('s', {}, x.w)]));
      const fixed = ai?.better && normalize(ai.better) !== normalize(answer) && normalize(ai.better) !== normalize(r.best) &&
        h('div', { class: 'muted' }, 'Tvoja veta opravená: ', h('b', {}, ai.better));
      // Vysvetlenie k prvému vynechanému slovu, ku ktorému má príbeh tip (do, the, is…).
      const missing = marks.filter((x) => !x.ok).map((x) => normalize(x.w));
      const tip = (A.tips || []).find((tp) => tp.words.some((w) => missing.includes(w)));
      const head = h('div', { class: 'fb-head' }, pick(MASCOT.ko), speakBtn(r.best));
      if (again) {
        fill(fb, head, h('div', { class: 'adv-lbl' }, 'Správne je:'), right, yours, note, fixed, tip && tipCard(tip, bonus),
          h('div', { class: 'adv-retry' }, '☝️ Teraz to napíš sám do políčka hore.'));
        input.value = '';
        input.focus();
      } else {
        finish();
        fill(fb, head, h('div', { class: 'adv-lbl' }, 'Správne je (vráti sa ti ešte):'), right, yours, note, fixed, tip && tipCard(tip, bonus), nextBtn);
        if (!tip) nextBtn.focus();
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
        bonus: (pts, el) => S.gain(pts, 0, el),
      });
      show(h('h2', { class: 'adv-step' }, title, h('span', { class: 'muted' }, ` ${done + 1}/${total}${queue.length > total - done ? ' +' : ''}`)),
        done === 0 && it.tries === 0 && h('p', { class: 'hint' }, hint), bar, card.el);
      card.focus();
    }
    step();
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

  // ---------- Písanie s hodnotením AI ----------
  // done(skóre 0–10 alebo null)
  function write(S, w, done) {
    const [min, max] = w.words || [30, 80];
    const draftKey = `${saveKey}.draft`;
    const area = h('textarea', { class: 'adv-write', rows: 8, 'aria-label': 'Tvoj text', spellcheck: 'false', autocapitalize: 'sentences' });
    area.value = store.get(draftKey, '');
    const counter = h('div', { class: 'muted adv-count' });
    const list = h('ul', { class: 'adv-must' });
    const send = h('button', { class: 'btn', type: 'button', onclick: submit }, canAssess() ? '📨 Poslať na kontrolu' : 'Hotovo – porovnať so vzorom');
    const out = h('div', {});
    let result = null;
    function update() {
      const n = words(area.value);
      counter.textContent = `${n} slov (treba ${min}–${max})`;
      counter.classList.toggle('ok', n >= min && n <= max);
      fill(list, w.must.map((m) => h('li', { class: hasPhrase(area.value, m) ? 'ok' : '' }, m)));
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
        fill(out, h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), `${config.mascot.name} číta tvoj text…`));
        res = await assessWriting({ task: w.sk, must: w.must, text });
      }
      const doneBtn = h('button', { class: 'btn', type: 'button', onclick: () => { store.set(draftKey, ''); done(result); } }, 'Dokončiť →');
      if (res && !res.error && typeof res.score === 'number') {
        result = Math.max(0, Math.min(10, Math.round(res.score)));
        S.gain(result, 10, send);
        for (const c of res.corrections || []) {
          if (c.wrong && c.right) S.miss({ id: `${lesson.id}:fix:${normalize(c.right)}`, p: `Oprav chybu: ${c.wrong}`, t: c.right, alt: [] });
        }
        if (result >= 8) sfx.fanfare();
        fill(out,
          h('div', { class: 'qcard adv-ai' },
            h('div', { class: 'result-big' }, `${result}/10`),
            h('p', {}, res.summary),
            res.corrections?.length > 0 && h('div', {}, h('h3', {}, 'Opravy'),
              res.corrections.map((c) => h('div', { class: 'adv-fix' },
                h('div', {}, h('s', {}, c.wrong), ' → ', h('b', {}, c.right)),
                h('div', { class: 'muted' }, c.why)))),
            res.better && h('div', {}, h('h3', {}, 'Lepšia verzia', ' ', speakBtn(res.better)), h('p', { class: 'adv-model' }, res.better))),
          doneBtn);
      } else {
        result = Math.round((10 * used.length) / Math.max(1, w.must.length));
        S.gain(result, 10, send);
        fill(out,
          res?.error && h('p', { class: 'feedback ko' }, res.error),
          h('div', { class: 'qcard' },
            h('div', { class: 'adv-label' }, 'Porovnaj so vzorom'),
            h('p', { class: 'adv-model' }, w.model, ' ', speakBtn(w.model)),
            h('p', {}, `Použil si ${used.length} z ${w.must.length} fráz.`),
            h('p', { class: 'muted' }, 'Prečítaj si svoj text nahlas a oprav, čo znie inak ako vo vzore.')),
          doneBtn);
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

  // ---------- Koniec hry ----------
  function ending(sc10) {
    stop();
    st.over = true; save();
    const g = st.given.length, n = A.goal.items.length;
    const stars = g === n && (sc10 ?? 0) >= 6 ? 3 : g >= n - 1 ? 2 : g >= 1 ? 1 : 0;
    const isBest = store.record(key, st.pts, stars);
    if (stars >= 2) sfx.fanfare();
    const big = h('div', { class: 'result-big' }, `${st.pts} b`);
    show(h('div', { class: 'result' },
      h('div', { class: 'result-stars', 'aria-label': `${stars} z 3 hviezd` }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
      h('div', { class: 'adv-goal-big' }, A.goal.items.map((id) => h('span', { class: st.given.includes(id) ? '' : 'missing', title: A.items[id].sk }, A.items[id].icon))),
      big,
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face),
        (isBest && st.pts > 0 ? 'Nový rekord! ' : '') + `Tom dostal ${g} z ${n} vecí. ` + config.mascot.verdicts[stars]),
      h('p', { class: 'muted' }, `🕙 ${W.clock(st.time)} · 💷 zostalo £${st.money}`),
      recap(S),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: () => begin(true) }, '↻ Hrať znova'),
        h('button', { class: 'btn ghost', type: 'button', onclick: menu }, 'Menu'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Domov'))));
    if (stars === 3) burst(big);
  }

  function recap(s) {
    return s?.added.size > 0 && h('div', { class: 'recap' },
      h('h2', {}, `Do opakovania pribudlo ${s.added.size}`),
      h('p', { class: 'muted' }, 'Vrátia sa ti zajtra v rozcvičke.'),
      [...s.added.values()].map((it) => h('div', { class: 'recap-row' },
        h('div', { class: 'recap-text' }, h('div', { class: 'it' }, display(it.t)), h('div', { class: 'sk' }, it.p)),
        speakBtn(display(it.t)))));
  }

  function reviewDone(s) {
    const ratio = s.max ? s.pts / s.max : 0;
    const stars = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.3 ? 1 : 0;
    show(h('div', { class: 'result' },
      h('div', { class: 'result-stars' }, '★'.repeat(stars) + '☆'.repeat(3 - stars)),
      h('div', { class: 'result-big' }, `${s.pts} b`),
      h('p', { class: 'verdi' }, h('span', { class: 'verdi-face' }, config.mascot.face), config.mascot.verdicts[stars]),
      recap(s),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: menu }, 'Menu'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Domov'))));
  }

  menu();
  return { el, cleanup: stop };
}

// ---------- Kontrola dát (node tools/validate.mjs) ----------
export function validate(l, err) {
  const A = l.adventure;
  const e = (m) => err(`adventure: ${m}`);
  if (!A?.places || !A.start || !A.people || !A.items) { e('chýba places, people, items alebo start'); return '0 miest'; }
  if (!A.places[A.start]) e(`štart „${A.start}“ neexistuje`);
  for (const v of ['go', 'talk', 'take', 'examine', 'give', 'look', 'time', 'inventory', 'wait', 'card', 'where', 'whereIs']) if (!A.verbs?.[v]?.length) e(`chýba sloveso verbs.${v}`);
  for (const m of ['take', 'notHere', 'nobody', 'unknownPlace', 'here', 'time', 'inventory', 'empty', 'give', 'notGot', 'wait', 'late', 'notYet', 'noMoney', 'whereAnswer', 'whereIs', 'nobodyToAsk']) if (!A.msgs?.[m]) e(`chýba hláška msgs.${m}`);
  const has = (k) => !!lookup(l, k);
  let words = 0, drills = 0, speaks = 0, asks = 0;
  const text = (where, en, sk) => {
    if (!sk) e(`${where}: chýba preklad „${en}“`);
    for (const t of tokenize(en || '')) {
      if (t.sep !== undefined) continue;
      words++;
      if (!has(t.key)) e(`${where}: slovo „${t.text}“ (${t.key}) nemá preklad v gloss`);
    }
  };
  const sentence = (where, t, alt = []) => {
    if (!t || /[[\]|]/.test(t)) e(`${where}: chýba alebo pokazená veta „${t}“`);
    if ((t?.match(/\(/g) || []).length !== (t?.match(/\)/g) || []).length) e(`${where}: nespárované zátvorky v „${t}“`);
    for (const a of alt) if (/[[\]|]/.test(a)) e(`${where}: pokazené alt „${a}“`);
  };
  const gives = new Set(), buys = new Set();
  const steps = (where, list) => {
    for (const s of W.walkSteps(list)) {
      if (s.say) text(where, ...s.say);
      const a = s.ask || (s.sk && s.t ? s : null);
      if (a) { asks++; sentence(where, a.t, a.alt); if (!a.sk) e(`${where}: otázka bez sk`); }
      if (s.give) { if (!A.items[s.give]) e(`${where}: give neznámej veci „${s.give}“`); gives.add(s.give); }
      if (s.buy) { if (!A.items[s.buy]?.price) e(`${where}: buy veci bez ceny „${s.buy}“`); buys.add(s.buy); }
      for (const id of s.reveal || []) if (!A.places[id]) e(`${where}: reveal neznámeho miesta „${id}“`);
    }
  };
  for (const [id, p] of Object.entries(A.places)) {
    if (!p.name || !p.title || !p.sk || !p.lines?.length) e(`miesto „${id}“ potrebuje name, title, sk a lines`);
    for (const [en, sk] of [...(p.lines || []), ...(p.look || [])]) text(id, en, sk);
    for (const x of Object.keys(p.exits || {})) if (!A.places[x]) e(`${id}: cesta na neznáme miesto „${x}“`);
    for (const x of p.people || []) if (!A.people[x]) e(`${id}: neznáma postava „${x}“`);
    for (const x of p.items || []) if (!A.items[x]) e(`${id}: neznáma vec „${x}“`);
    for (const x of [...(p.known || []), ...(p.reveal || [])]) if (!A.places[x]) e(`${id}: neznáme miesto „${x}“`);
    for (const d of p.drill || []) { drills++; if (!d.sk) e(`${id}: drill bez sk`); sentence(`${id}/drill`, d.t, d.alt); }
    for (const s of p.speak || []) { speaks++; sentence(`${id}/speak`, s); if (/[()]/.test(s)) e(`${id}/speak: bez zátvoriek „${s}“`); }
  }
  for (const [id, pe] of Object.entries(A.people)) {
    if (!pe.name || !pe.talk?.length) e(`postava „${id}“ potrebuje name a talk`);
    if (pe.taxi) {
      const T = pe.taxi;
      if (!T.price || !T.minutes || !T.greet || !T.ask?.t?.includes('{place}') || !T.bye?.t || !T.arrive) e(`taxík „${id}“ potrebuje price, minutes, greet, ask (s {place}), bye a arrive`);
      else { text(`taxík ${id}`, ...T.greet); text(`taxík ${id}`, ...T.arrive); }
    }
    for (const v of pe.talk || []) steps(`postava ${id}`, v.steps);
  }
  for (const [id, it] of Object.entries(A.items)) {
    if (!it.name || !it.icon || !it.sk) e(`vec „${id}“ potrebuje name, icon a sk`);
    for (const [en, sk] of it.desc || []) text(`vec ${id}`, en, sk);
    for (const ad of it.ads || []) { text(`reklama ${id}`, ad.en, ad.sk); for (const x of ad.items) if (!A.items[x]) e(`reklama: neznáma vec „${x}“`); if (ad.place && !A.places[ad.place]) e(`reklama: neznáme miesto „${ad.place}“`); }
    if (A.goal.items.includes(id) && (!it.a || !A.places[it.where])) e(`vec „${id}“ z cieľa potrebuje a (napr. 'a mug') a where (miesto)`);
    if (it.tom) text(`vec ${id}`, ...it.tom);
    for (const pl of Object.values(A.places)) if (pl.items?.includes(id)) gives.add(id);
  }
  const F = A.final;
  if (!F || !A.places[F.place] || !A.people[F.person] || !F.flag || !F.write?.must) e('final potrebuje place, person, flag a write');
  else steps('finále', F.arrive);
  // Dá sa cieľ splniť? Každá vec sa dá dostať a nákupy sa zmestia do rozpočtu.
  let cost = 0;
  for (const id of A.goal?.items || []) {
    if (!A.items[id]) { e(`cieľ: neznáma vec „${id}“`); continue; }
    if (!gives.has(id) && !buys.has(id)) e(`cieľ: vec „${id}“ sa nedá nikde získať`);
    if (!gives.has(id)) cost += A.items[id].price || 0;
  }
  if (cost > A.state.money) e(`cieľ: nákupy stoja £${cost}, hráč má len £${A.state.money}`);
  // Dosiahnuteľnosť miest: štart + reveal z miest a rozhovorov (+ mapa).
  const reach = new Set([A.start, ...(A.places[A.start].known || [])]);
  const rev = new Set();
  for (const p of Object.values(A.places)) for (const x of p.reveal || []) rev.add(x);
  for (const pe of Object.values(A.people)) for (const v of pe.talk) for (const s of W.walkSteps(v.steps)) for (const x of s.reveal || []) rev.add(x);
  for (const id of Object.keys(A.places)) if (!reach.has(id) && !rev.has(id) && !(A.mapItem && A.places[id].onMap)) e(`miesto „${id}“ sa nedá objaviť`);
  for (const tp of A.tips || []) {
    if (!tp.words?.length || !tp.title || !tp.text || !tp.say?.length) e(`tip „${tp.title}“ potrebuje words, title, text a say`);
    for (const w of tp.words || []) if (w !== w.toLowerCase()) e(`tip „${tp.title}“: slová vo words malými písmenami`);
  }
  for (const k of Object.keys(A.clues || {})) if (!has(k)) e(`nápoveda k „${k}“, ktoré nie je v gloss`);
  return `${Object.keys(A.places).length} miest, ${Object.keys(A.people).length} postáv, ${words} slov, ${asks} odpovedí v rozhovoroch, ${drills} viet na dril, ${speaks} na hovorenie`;
}
