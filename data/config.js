// Všetko, čím sa táto appka líši od inej jazykovej verzie: jazyk, značka, maskot, texty.
// Kód v js/ je spoločný pre všetky jazyky – jazykové veci patria sem.
export default {
  speechLang: 'it-IT',
  storeKey: 'impattozero.v1',
  defaultLesson: '6a',
  // Jedno ťukateľné slovo (regex bez príznakov). Taliančina: písmená + elízia (l', dell').
  word: "\\p{L}+'?",
  // Slová, ktoré sa na začiatku vety v skladačke nezmenšujú
  keepCaps: [],

  // Zdieľanie so žiakmi (tlačidlo 📲 na úvodnej obrazovke): verejná adresa appky a jej QR kód.
  share: { url: 'https://jurzon.github.io/taliancina/', qr: 'docs/qr.svg' },

  brand: {
    kicker: 'Lezione 6 · Un ambiente prezioso',
    title: ['Albergo', 'Impatto Zero'],
    source: 'Podľa učebnice DIECI, lezione 6 · na domáce precvičovanie',
    author: 'Juraj Zonnenschein',
    email: 'jurzon@seznam.cz',
  },

  // Texty hier v cieľovom jazyku
  ui: {
    reader: 'Lettura viva',
    vf: 'Vero o falso?',
    vfTrue: 'Vero',
    vfFalse: 'Falso',
    stars: 'Costellazioni',
    starsExample: 'a → chilometro → zero',
    build: 'Costruisci la frase',
    buildHint: 'Povedz to po taliansky. Pozor, jedno slovo je navyše.',
    buildDesc: 'Poskladaj taliansku vetu z dlaždíc',
  },

  mascot: {
    name: 'Signor Verdi',
    face: '🌿',
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
    // Podľa počtu hviezd 0–3
    verdicts: [
      'Dnes to bolo na kompost, ale z kompostu rastú najlepšie paradajky.',
      'Dobrý začiatok! Signor Verdi vám drží miesto na bicykli.',
      'Molto bene! Ešte kúsok a ste a impatto zero.',
      'Perfetto! Signor Verdi vám na počesť zasadil strom.',
    ],
    chapterDone: 'Kapitola prečítaná. Signor Verdi už chystá ďalšiu.',
    watching: 'Signor Verdi sa díva.',
  },
};
