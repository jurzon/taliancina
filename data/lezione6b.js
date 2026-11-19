// Lezione 6B – Dove viviamo
export default {
  id: '6b',
  code: '6B',
  title: 'Dove viviamo',
  subtitle: 'mesto, vidiek, ostrov · periodo ipotetico',
  storyTitle: 'Il sogno del signor Verdi',
  choiceTitle: 'Se potessi…',
  choiceHint: '1. typ: se + presente → presente. 2. typ: se + congiuntivo imperfetto → condizionale.',
  games: ['stars', 'choice', 'build'],

  chapters: [
    {
      title: 'In città',
      sk: 'V meste',
      lines: [
        ["Il signor Verdi abita in una grande città, [sebbene] [ami|q=a1] il silenzio.",
          'Pán Verdi býva vo veľkom meste, hoci miluje ticho.'],
        ["Ogni mattina [c'è] traffico, e lui resta [in coda] per un'ora.",
          'Každé ráno je premávka a on zostane hodinu v kolóne.'],
        ["«[Se|q=a2] trovo parcheggio, oggi sono fortunato», pensa. Ma non trova mai parcheggio.",
          '„Ak nájdem parkovanie, mám dnes šťastie," myslí si. Ale parkovanie nenájde nikdy.'],
        ["Certo, la città ha molti vantaggi: se uno vuole andare al cinema o a vedere una mostra, [può farlo] ogni sera.",
          'Iste, mesto má veľa výhod: ak chce človek ísť do kina alebo na výstavu, môže to urobiť každý večer.'],
        ["I servizi sono vicini: negozi, ospedali, uffici.",
          'Služby sú blízko: obchody, nemocnice, úrady.'],
        ["Però [c'è] troppo rumore, l'aria è [inquinata|q=a3] e gli affitti sono cari.",
          'Je tu však priveľa hluku, vzduch je znečistený a nájmy sú drahé.'],
        ["«Se [avessi|q=a4] più coraggio, [cambierei|q=a5] vita», dice al suo cactus. Il cactus non risponde, ma sembra [d'accordo].",
          '„Keby som mal viac odvahy, zmenil by som život," hovorí svojmu kaktusu. Kaktus neodpovedá, ale zdá sa, že súhlasí.'],
      ],
      vf: [
        ['Il signor Verdi trova sempre parcheggio.', false, 'Non trova mai parcheggio. Mai.'],
        ['In città i servizi sono vicini.', true, 'Negozi, ospedali, uffici – všetko poruke.'],
        ['Il cactus risponde al signor Verdi.', false, 'Non risponde, ma sembra d\'accordo.'],
      ],
    },
    {
      title: "L'isola",
      sk: 'Ostrov',
      lines: [
        ["Il signor Verdi sogna un'isola lontana da tutto.",
          'Pán Verdi sníva o ostrove ďaleko od všetkého.'],
        ["«Se [vivessi|q=b1] su un'isola, [mi sveglierei] con il rumore del mare, non con quello delle macchine.»",
          '„Keby som žil na ostrove, zobúdzal by som sa na šum mora, nie na hluk áut."'],
        ["«Se [potessi|q=b2], aprirei un piccolo albergo: zero emissioni, zero traffico, zero vicini curiosi.»",
          '„Keby som mohol, otvoril by som si malý hotel: nulové emisie, nulová premávka, nula zvedavých susedov."'],
        ["In un [paesino|q=b3], invece, tutti sanno tutto: se esci di casa, sanno dove vai e con chi sei.",
          'V dedinke naopak všetci vedia všetko: ak vyjdeš z domu, vedia, kam ideš a s kým si.'],
        ["Su un'isola, almeno, i pesci non fanno domande.",
          'Na ostrove aspoň ryby nekladú otázky.'],
        ["Ma [ci sono] anche gli svantaggi. Se i servizi [fossero|q=b4] lontani e i prezzi alti, sarebbe un problema?",
          'Sú tu však aj nevýhody. Keby boli služby ďaleko a ceny vysoké, bol by to problém?'],
        ["«Se mi mancasse la città, tornerei per un [fine settimana]», decide.",
          '„Keby mi mesto chýbalo, vrátil by som sa na víkend," rozhodne sa.'],
        ["La sera scrive un messaggio a sua sorella: «Se domani [c'è|q=b5] il sole, compro una barca.»",
          'Večer napíše sestre správu: „Ak bude zajtra slnko, kúpim loďku."'],
        ["Il giorno dopo piove. Il signor Verdi compra un ombrello e resta in città. [Per ora].",
          'Na druhý deň prší. Pán Verdi si kúpi dáždnik a zostane v meste. Zatiaľ.'],
      ],
      vf: [
        ["Il signor Verdi vorrebbe aprire un albergo su un'isola.", true, 'Se potesse, aprirebbe un piccolo albergo.'],
        ['In un paesino si ha molta privacy.', false, 'Tutti sanno tutto – kam ideš aj s kým si.'],
        ['Alla fine il signor Verdi compra una barca.', false, 'Compra un ombrello. Per ora.'],
      ],
    },
  ],

  questions: {
    a1: ['Prečo «ami» a nie «ama»?',
      'Sebbene + konjunktív – opakovanie z 6A! Amare → che lui ami.'],
    a2: ['Aký čas je vo vete so «se» a aký v hlavnej vete?',
      'Prítomný + prítomný: Se trovo…, sono… To je periodo ipotetico 1. typu: reálna, pravdepodobná podmienka. (Aj keď u pána Verdiho je to s tým parkovaním skôr sci-fi.)'],
    a3: ['Prečo sa «inquinata» končí na -a?',
      'Zhoduje sa s «l\'aria», ktorá je ženského rodu. Il fiume inquinato, ale l\'aria inquinata.'],
    a4: ['Aký je to tvar slovesa «avere»?',
      'Congiuntivo imperfetto: avessi, avessi, avesse, avessimo, aveste, avessero. Používa sa po «se», keď je podmienka málo pravdepodobná (2. typ).'],
    a5: ['Prečo tu nie je jednoducho «cambio»?',
      '2. typ: se + congiuntivo imperfetto → condizionale presente. Verdi odvahu (zatiaľ) nemá, takže len „zmenil by".'],
    b1: ['Môže po «se» nasledovať kondicionál – «se vivrei»?',
      'Nikdy! „Se vivrei" je chyba, pri ktorej Talianov bolia uši. Po «se» ide vivessi; kondicionál patrí do druhej polovice vety.'],
    b2: ['Od ktorého slovesa je «potessi»?',
      'Potere: potessi, potessi, potesse, potessimo, poteste, potessero. «Se potessi…» = keby som mohol… Výborná veta na snívanie.'],
    b3: ['Čo robí prípona -ino?',
      'Zdrobňuje: paese (dedina) → paesino (dedinka). Pozor, il Paese s veľkým P je krajina.'],
    b4: ['Nepravidelný tvar. Od ktorého slovesa?',
      'Essere: fossi, fossi, fosse, fossimo, foste, fossero. Se fossi ricco… = Keby som bol bohatý…'],
    b5: ['Prečo tu po «se» stačí obyčajný prítomný čas?',
      'Slnko zajtra je reálna možnosť → 1. typ: se + presente, presente (alebo futuro). Verdi to myslí vážne. Aspoň do rána.'],
  },

  gloss: `
abita | býva | abitare
città | mesto | | v množnom čísle sa nemení: le città
ami | miluje (konjunktív) | amare
traffico | premávka, doprava
resta | zostáva | restare
in coda | v kolóne, v rade | | la coda = chvost aj rad
ora | hodina
parcheggio | parkovanie, parkovacie miesto
oggi | dnes
fortunato | šťastný (má šťastie)
pensa | myslí si | pensare
trova | nachádza | trovare
certo | iste, pravdaže
molti | veľa | molto
vantaggi | výhody | il vantaggio
vuole | chce | volere
andare | ísť
cinema | kino | | pozor: il cinema je mužského rodu
vedere | vidieť
mostra | výstava
può farlo | môže to urobiť | potere + fare
servizi | služby | il servizio
vicini | blízko; susedia | vicino
negozi | obchody | il negozio
ospedali | nemocnice | l'ospedale
uffici | úrady, kancelárie | l'ufficio
troppo | priveľa, príliš
inquinata | znečistená | inquinato
affitti | nájmy | l'affitto
cari | drahé | caro
avessi | keby som mal | avere | congiuntivo imperfetto
coraggio | odvaha
cambierei | zmenil by som | cambiare | condizionale presente
vita | život
cactus | kaktus
risponde | odpovedá | rispondere
sembra | zdá sa, vyzerá | sembrare
d'accordo | zajedno | | essere d'accordo = súhlasiť
sogna | sníva (o) | sognare
isola | ostrov
lontana | vzdialená | lontano
vivessi | keby som žil | vivere | congiuntivo imperfetto
mi sveglierei | zobúdzal by som sa | svegliarsi | condizionale presente
mare | more
macchine | autá | la macchina
potessi | keby som mohol | potere | congiuntivo imperfetto
aprirei | otvoril by som | aprire | condizionale presente
curiosi | zvedaví | curioso
paesino | dedinka | il paese
invece | naopak, zato
sanno | vedia | sapere
esci | vyjdeš | uscire | nepravidelné: esco, esci, esce
vai | ideš | andare
chi | kto; kým
sei | si | essere
almeno | aspoň
pesci | ryby | il pesce
fanno | robia; kladú (otázky) | fare
domande | otázky | la domanda
svantaggi | nevýhody | lo svantaggio
fossero | keby boli | essere | congiuntivo imperfetto
lontani | vzdialené | lontano
prezzi | ceny | il prezzo
alti | vysoké | alto
sarebbe | bol by, bolo by | essere | condizionale presente
problema | problém | | pozor: il problema je mužského rodu, mn. č. i problemi
mancasse | keby (mi) chýbalo | mancare | mi manca la città = chýba mi mesto
tornerei | vrátil by som sa | tornare | condizionale presente
fine settimana | víkend
decide | rozhodne sa | decidere
scrive | píše | scrivere
messaggio | správa
sua | svoja, jeho | suo
sorella | sestra
domani | zajtra
sole | slnko
compro | kúpim, kupujem | comprare
barca | loďka, čln
piove | prší | piovere
compra | kupuje | comprare
ombrello | dáždnik
per ora | zatiaľ
`,

  rounds: [
    { c: 'vivere', chains: [
      ['in|città', 'žiť v meste'], ['in|campagna', 'žiť na vidieku'], ["su|un'isola", 'žiť na ostrove'],
      ['in|un paese', 'žiť na dedine'], ['lontano|da tutto', 'žiť ďaleko od všetkého'],
    ], x: ['a coda', 'di rumore', 'parcheggio', 'sul traffico', 'inquinato'] },
    { c: 'restare', chains: [
      ['in|coda', 'stáť v kolóne'], ['in|città', 'zostať v meste'], ['a|casa', 'zostať doma'],
    ], x: ['di traffico', 'rumore', 'su', 'isolato', 'il prezzo'] },
    { c: 'andare', chains: [
      ['al|cinema', 'ísť do kina'], ['a|piedi', 'ísť pešo'], ['al|lavoro', 'ísť do práce'],
      ["a|vivere|all'estero", 'odísť žiť do zahraničia'],
    ], x: ['alla coda', 'il traffico', 'di', 'rumore', 'inquinata'] },
    { c: 'aria', chains: [
      ['pulita', 'čistý vzduch'], ['inquinata', 'znečistený vzduch'], ['fresca', 'čerstvý vzduch'],
    ], x: ['cara', 'vicina', 'curiosa', 'isolata', 'alta'] },
    { c: 'Se potessi,', chains: [
      ["vivrei|su un'isola", 'Keby som mohol, žil by som na ostrove.'],
      ['cambierei|vita', 'Keby som mohol, zmenil by som život.'],
      ['aprirei|un albergo', 'Keby som mohol, otvoril by som hotel.'],
    ], x: ['vivo', 'cambio', 'aprirò', 'vivessi', 'cambiassi'] },
    { c: 'Se trovo parcheggio,', chains: [
      ['sono|fortunato', 'Ak nájdem parkovanie, mám šťastie.'],
      ['vado|al cinema', 'Ak nájdem parkovanie, idem do kina.'],
      ['resto|in centro', 'Ak nájdem parkovanie, zostanem v centre.'],
    ], x: ['sarei', 'andrei', 'resterei', 'fossi', 'andassi'] },
  ],

  cards: [
    { s: "Se ___, vivrei su un'isola.", o: ['potessi', 'posso', 'potrei'],
      why: '«Vivrei» je kondicionál → 2. typ. Po «se» ide congiuntivo imperfetto: potessi. Nikdy kondicionál!', sk: 'Keby som mohol, žil by som na ostrove.' },
    { s: 'Se uno abita a Roma, ___ andare al cinema ogni sera.', o: ['può', 'potesse'],
      why: '«Abita» je prítomný čas → 1. typ, reálna podmienka. V hlavnej vete tiež presente.', sk: 'Ak človek býva v Ríme, môže ísť do kina každý večer.' },
    { s: 'Sarebbe bello se le grandi città ___ come Ferrara.', o: ['fossero', 'sono', 'sarebbero'],
      why: '«Sarebbe» = 2. typ. Po «se»: congiuntivo imperfetto od essere → fossero.', sk: 'Bolo by pekné, keby veľké mestá boli ako Ferrara.' },
    { s: 'Avrei troppa paura di perdere la mia privacy, se ___ in un posto così.', o: ['vivessi', 'vivrei', 'vivo'],
      why: 'Poradie viet sa môže obrátiť, pravidlo ostáva: pri «se» je vivessi, kondicionál (avrei) je v druhej vete.', sk: 'Mala by som priveľký strach, že stratím súkromie, keby som žila na takom mieste.' },
    { s: 'Se abiti in un paesino ed esci, tutti ___ dove sei.', o: ['sanno', 'sapessero'],
      why: '1. typ: «abiti» a «esci» sú prítomný čas → aj dôsledok je v prítomnom čase.', sk: 'Ak bývaš v dedinke a vyjdeš von, všetci vedia, kde si.' },
    { s: "Se facessimo più attenzione all'ambiente, le generazioni future ___ meglio.", o: ['vivrebbero', 'vivessero', 'vivono'],
      why: '«Facessimo» je congiuntivo imperfetto → dôsledok v kondicionáli: vivrebbero.', sk: 'Keby sme dávali väčší pozor na životné prostredie, budúce generácie by žili lepšie.' },
    { s: 'Se tu ___ al lavoro sempre a piedi, saresti più in forma.', o: ['andassi', 'andresti', 'vai'],
      why: '«Saresti» = 2. typ → po «se» andassi.', sk: 'Keby si chodil do práce vždy pešo, bol by si vo forme.' },
    { s: 'Comprerei quella casa, se non ___ così tanto.', o: ['costasse', 'costerebbe', 'costa'],
      why: '«Comprerei» je kondicionál → pri «se» congiuntivo imperfetto: costasse.', sk: 'Kúpil by som ten dom, keby nestál tak veľa.' },
    { s: "Se domani c'è il sole, ___ una barca.", o: ['compro', 'comprassi'],
      why: '«C\'è» je presente → 1. typ. Reálny plán, žiadne snívanie.', sk: 'Ak bude zajtra slnko, kúpim loďku.' },
    { s: 'Se ___ più coraggio, cambierei vita.', o: ['avessi', 'avrei', 'ho'],
      why: '2. typ: se + congiuntivo imperfetto (avessi) → condizionale (cambierei).', sk: 'Keby som mal viac odvahy, zmenil by som život.' },
    { s: "Se mi ___ di trasferirmi all'estero, accetterei subito.", o: ['proponessero', 'proporrebbero', 'propongono'],
      why: '«Accetterei» = 2. typ → proporre: proponessero.', sk: 'Keby mi navrhli presťahovať sa do zahraničia, hneď by som to prijal.' },
    { s: 'La temperatura mondiale diminuirebbe se ___ meno la macchina.', o: ['usassimo', 'useremmo', 'usiamo'],
      why: '«Diminuirebbe» je kondicionál → pri «se» usassimo.', sk: 'Svetová teplota by klesla, keby sme menej používali auto.' },
    { s: 'Se avessimo una bambina, la ___ Serafina.', o: ['chiameremmo', 'chiamassimo', 'chiamiamo'],
      why: '«Avessimo» je congiuntivo imperfetto → dôsledok v kondicionáli: chiameremmo.', sk: 'Keby sme mali dievčatko, volali by sme ju Serafina.' },
    { s: 'Se piove, ___ in città.', o: ['resto', 'restassi'],
      why: '1. typ: se + presente → presente.', sk: 'Ak prší, zostanem v meste.' },
    { s: 'Se i servizi fossero lontani, ___ un problema.', o: ['sarebbe', 'fosse', 'è'],
      why: '«Fossero» → 2. typ → sarebbe.', sk: 'Keby boli služby ďaleko, bol by to problém.' },
    { s: 'Se trovi parcheggio in centro, ___ fortunato!', o: ['sei', 'fossi'],
      why: '1. typ: «trovi» je presente → sei.', sk: 'Ak nájdeš parkovanie v centre, máš šťastie!' },
    { s: 'Se io ___ realizzare il mio grande sogno, aprirei un Eco-Hotel.', o: ['potessi', 'potrei', 'posso'],
      why: '«Aprirei» = 2. typ → se potessi.', sk: 'Keby som si mohol splniť svoj veľký sen, otvoril by som eko-hotel.' },
    { s: "«Se potessi, vivrei su un'isola.» Aká je to hypotéza? ___", o: ['možná, málo pravdepodobná (2. typ)', 'istá alebo pravdepodobná (1. typ)'],
      why: 'Congiuntivo imperfetto + condizionale = 2. typ: dá sa to, ale skôr sa to nestane.', sk: 'Keby som mohla, žila by som na ostrove.' },
    { s: '«Se esci, tutti sanno dove sei.» Aká je to hypotéza? ___', o: ['istá alebo pravdepodobná (1. typ)', 'možná, málo pravdepodobná (2. typ)'],
      why: 'Presente + presente = 1. typ: takto to jednoducho chodí.', sk: 'Ak vyjdeš von, všetci vedia, kde si.' },
    { s: 'Il signor Verdi abita in città, sebbene ___ il silenzio.', o: ['ami', 'ama'],
      why: 'Opakovanie z 6A: sebbene + konjunktív.', sk: 'Pán Verdi býva v meste, hoci miluje ticho.' },
  ],

  build: [
    { sk: 'Keby som mohol, žil by som na ostrove.', t: "Se potessi, vivrei su un'isola.", x: ['potrei'],
      alt: ["Vivrei su un'isola se potessi."] },
    { sk: 'Ak nájdem parkovanie, mám šťastie.', t: 'Se trovo parcheggio, sono fortunato.', x: ['sarei'],
      alt: ['Sono fortunato se trovo parcheggio.'] },
    { sk: 'Keby som mal viac odvahy, zmenil by som život.', t: 'Se avessi più coraggio, cambierei vita.', x: ['avrei'],
      alt: ['Cambierei vita se avessi più coraggio.'] },
    { sk: 'Bolo by pekné, keby mestá boli ako Ferrara.', t: 'Sarebbe bello se le città fossero come Ferrara.', x: ['sono'] },
    { sk: 'V meste je priveľa hluku a premávky.', t: "In città c'è troppo rumore e traffico.", x: ['troppa'],
      alt: ["In città c'è troppo traffico e rumore.", "C'è troppo rumore e traffico in città.", "C'è troppo traffico e rumore in città."] },
    { sk: 'Keby boli služby ďaleko, bol by to problém.', t: 'Se i servizi fossero lontani, sarebbe un problema.', x: ['fosse'],
      alt: ['Sarebbe un problema se i servizi fossero lontani.'] },
    { sk: 'Ak bude zajtra slnko, kúpim loďku.', t: "Se domani c'è il sole, compro una barca.", x: ['comprerei'],
      alt: ["Compro una barca se domani c'è il sole."] },
    { sk: 'Na vidieku je vzduch čistý a je tam ticho.', t: "In campagna l'aria è pulita e c'è silenzio.", x: ['inquinata'] },
  ],
};
