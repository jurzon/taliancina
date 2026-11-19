// Lezione 6A – Impatto zero
// Značky v texte: [fráza] = jedna ťukateľná jednotka, [slovo|q=id] = slovo s otázkou.
export default {
  id: '6a',
  code: '6A',
  title: 'Impatto zero',
  subtitle: 'ekológia · sebbene, benché, nonostante',
  storyTitle: 'Albergo Impatto Zero',
  choiceTitle: 'Congiuntivo o indicativo?',
  choiceHint: 'Sebbene, benché, nonostante + konjunktív. Anche se + indikatív.',
  games: ['stars', 'choice', 'build'],

  chapters: [
    {
      title: "L'arrivo",
      sk: 'Príchod',
      lines: [
        ["Arrivo all'Albergo [Impatto Zero] [di sera], [sebbene|q=a1] il treno [sia partito|q=a2] [in orario].",
          'Do hotela Impatto Zero prichádzam večer, hoci vlak odišiel načas.'],
        ["Alla reception [c'è] il signor Verdi, un uomo gentile con una cravatta verde.",
          'Na recepcii je pán Verdi, milý muž so zelenou kravatou.'],
        ["«Benvenuto! Qui tutto è ecologico», dice. «Anche l'ascensore.»",
          '„Vitajte! Tu je všetko ekologické," hovorí. „Aj výťah."'],
        ["«[Dov'è] l'ascensore?» «Sono le scale. Zero emissioni!»",
          '„Kde je výťah?" „Sú to schody. Nulové emisie!"'],
        ["La mia camera è al quinto piano. [Benché] io [abbia|q=a3] una valigia pesante, salgo [a piedi].",
          'Moja izba je na piatom poschodí. Hoci mám ťažký kufor, idem hore pešo.'],
        ["In camera non [c'è] la luce. Vedo solo una bicicletta.",
          'V izbe nie je svetlo. Vidím len bicykel.'],
        ["«Per accendere la lampadina [a basso consumo] deve pedalare», spiega il signor Verdi. «È energia rinnovabile: [la Sua|q=a4]!»",
          '„Aby ste rozsvietili úspornú žiarovku, musíte šliapať," vysvetľuje pán Verdi. „Je to obnoviteľná energia: tá Vaša!"'],
        ["Pedalo per dieci minuti. La lampadina [si accende], [anche se|q=a5] sono molto stanco.",
          'Šliapem desať minút. Žiarovka sa rozsvieti, aj keď som veľmi unavený.'],
        ["[Penso che] questo hotel [sia|q=a6] [un po'] strano. Ma l'aria è pulita e [c'è] un grande silenzio.",
          'Myslím si, že tento hotel je trochu čudný. Ale vzduch je čistý a je tu veľké ticho.'],
      ],
      vf: [
        ["Nell'albergo c'è un ascensore elettrico.", false, "Výťah sú schody. Zero emissioni!"],
        ['Per avere la luce bisogna pedalare.', true, 'Presne tak – energia rinnovabile: la Sua.'],
        ['La camera è al primo piano.', false, 'Al quinto piano. S ťažkým kufrom.'],
      ],
    },
    {
      title: 'La colazione',
      sk: 'Raňajky',
      lines: [
        ["La mattina ho fame. Scendo a [fare colazione] nel giardino.",
          'Ráno som hladný. Schádzam na raňajky do záhrady.'],
        ["«Qui mangiamo solo prodotti [a chilometro zero|q=b1]», dice il signor Verdi, e mi dà un cestino vuoto.",
          '„Tu jeme iba produkty z nultého kilometra," hovorí pán Verdi a podáva mi prázdny košík.'],
        ["«Il cibo [dov'è]?» «Nell'[orto urbano], sul tetto. Frutta e verdura [di stagione]!»",
          '„A kde je jedlo?" „V mestskej záhrade na streche. Sezónne ovocie a zelenina!"'],
        ["[Nonostante|q=b2] sia novembre, trovo tre pomodori e una mela. Tutto biologico, naturalmente, e senza OGM.",
          'Napriek tomu, že je november, nájdem tri paradajky a jablko. Všetko bio, samozrejme, a bez GMO.'],
        ["«E il caffè?» «Il caffè viene da lontano: troppe emissioni. [Beva|q=b3] l'[acqua del rubinetto], è buonissima.»",
          '„A káva?" „Káva prichádza zďaleka: priveľa emisií. Pite vodu z vodovodu, je výborná."'],
        ["Bevo l'acqua. È buona, [anche se] non è un espresso.",
          'Pijem vodu. Je dobrá, aj keď to nie je espresso.'],
        ["Dopo colazione devo fare la [raccolta differenziata]. [Ci sono] sette contenitori: carta, plastica, vetro, [rifiuti|q=b4] organici…",
          'Po raňajkách musím triediť odpad. Je tu sedem kontajnerov: papier, plast, sklo, bioodpad…'],
        ["«E questo?» chiedo con il torsolo della mela in mano.",
          '„A toto?" pýtam sa s ohryzkom z jablka v ruke.'],
        ["«I resti di cibo vanno nell'organico. [È importante che] ogni ospite [ricicli|q=b5] tutto.»",
          '„Zvyšky jedla patria do bioodpadu. Je dôležité, aby každý hosť všetko recykloval."'],
        ["[Sebbene] [abbia studiato] all'università, sbaglio contenitore due volte.",
          'Hoci som študoval na univerzite, dvakrát si pomýlim kontajner.'],
      ],
      vf: [
        ['A colazione il protagonista beve un buon espresso.', false, 'Káva má priveľa emisií. Je len voda z vodovodu.'],
        ["La frutta e la verdura vengono dall'orto sul tetto.", true, 'A chilometro zero – doslova.'],
        ['Il protagonista non sbaglia mai contenitore.', false, 'Sbaglia due volte. Napriek univerzite.'],
      ],
    },
    {
      title: 'Il conto',
      sk: 'Účet',
      lines: [
        ["La sera il signor Verdi mi invita sul tetto. [Benché] [faccia|q=c1] freddo, il panorama è bellissimo.",
          'Večer ma pán Verdi pozve na strechu. Hoci je zima, výhľad je nádherný.'],
        ["«Vede? Niente [inquinamento|q=c2], niente rumore. Riduciamo i consumi e i rifiuti ogni giorno.»",
          '„Vidíte? Žiadne znečistenie, žiadny hluk. Každý deň znižujeme spotrebu a odpad."'],
        ["Devo dire che [ha ragione]. [Sebbene] questo albergo sia strano, comincia a piacermi.",
          'Musím povedať, že má pravdu. Hoci je tento hotel čudný, začína sa mi páčiť.'],
        ["Il giorno dopo chiedo il conto. Il signor Verdi sorride.",
          'Na druhý deň si pýtam účet. Pán Verdi sa usmeje.'],
        ["«Può pagare con la carta, [a patto che] poi [pianti|q=c3] un albero.»",
          '„Môžete platiť kartou, pod podmienkou, že potom zasadíte strom."'],
        ["«Un albero? Dove?» «Qui, nell'orto. Così il Suo soggiorno è davvero [a impatto zero].»",
          '„Strom? Kde?" „Tu, v záhrade. Tak bude Váš pobyt naozaj s nulovým dopadom."'],
        ["Pianto un piccolo [melo|q=c4] e gli do un nome: Jožko.",
          'Zasadím malú jabloň a dám jej meno: Jožko.'],
        ["[Nonostante] l'albergo sia caro e io [abbia pedalato] tre ore per guardare un film, voglio tornare.",
          'Napriek tomu, že hotel je drahý a že som tri hodiny šliapal, aby som si pozrel film, chcem sa vrátiť.'],
        ["[Anche se], la prossima volta, porto il caffè da casa. Biodegradabile, naturalmente.",
          'Aj keď nabudúce si prinesiem kávu z domu. Biologicky rozložiteľnú, samozrejme.'],
      ],
      vf: [
        ['Dopo aver pagato, il protagonista deve piantare un albero.', true, 'A patto che pianti un albero!'],
        ["Il protagonista non vuole più tornare all'albergo.", false, 'Voglio tornare – len s vlastnou kávou.'],
        ["L'albero si chiama Jožko.", true, 'Najslovenskejšia jabloň v Taliansku.'],
      ],
    },
  ],

  questions: {
    a1: ['Aký slovesný spôsob musí nasledovať po «sebbene»?',
      'Konjunktív (congiuntivo). Sebbene, benché a nonostante ho vyžadujú vždy; jedine «anche se» ide s indikatívom. Pozri sa o tri slová ďalej: «sia partito».'],
    a2: ['Prečo «sia partito» a nie «è partito»?',
      'Lebo vetu uvádza «sebbene». «Sia partito» je congiuntivo passato: konjunktív slovesa essere (sia) + príčastie. S «anche se» by to bolo: anche se il treno è partito in orario.'],
    a3: ['Taliani zámená zvyčajne vynechávajú. Prečo je tu výslovne «io»?',
      'V konjunktíve sú tvary pre io / tu / lui rovnaké (abbia, abbia, abbia). Bez zámena by nebolo jasné, kto má ten ťažký kufor.'],
    a4: ['Prečo je «Sua» s veľkým S?',
      'Je to vykanie (Lei). «La Sua» = tá Vaša (energia). Signor Verdi je zdvorilý, aj keď vás práve núti šliapať.'],
    a5: ['«Anche se» znamená to isté čo «sebbene». V čom je teda rozdiel?',
      'V gramatike: po «anche se» ide indikatív (sono), po «sebbene» konjunktív (sia). Anche se sono stanco = sebbene sia stanco.'],
    a6: ['Tu nie je žiadne «sebbene». Prečo zasa konjunktív?',
      '«Penso che» vyjadruje názor, nie istotu → konjunktív. Rovnako: credo che, mi sembra che, ho l\'impressione che. Pozor na výnimku: «secondo me» ide s indikatívom!'],
    b1: ['Čo znamená «a chilometro zero» doslova a čo v skutočnosti?',
      'Doslova „na nultom kilometri": jedlo od miestnych výrobcov, ktoré nikam necestovalo. Signor Verdi to len berie o niečo doslovnejšie než ostatní.'],
    b2: ['Ako by táto veta znela s «anche se»?',
      'Anche se è novembre… Význam ostáva, zmení sa len spôsob: sia → è.'],
    b3: ['Aký je to tvar slovesa «bere»?',
      'Zdvorilý rozkaz (Lei): Beva! = Pite! Zdvorilý imperatív má rovnaký tvar ako konjunktív. Pri tykaní by to bolo: Bevi!'],
    b4: ['«Rifiuti» súvisí so slovesom «rifiutare» (odmietnuť). Vidíš spojitosť?',
      'Odpad je to, čo sme „odmietli". V jednotnom čísle il rifiuto znamená odmietnutie aj kus odpadu.'],
    b5: ['Prečo «ricicli» a nie «ricicla»?',
      '«È importante che» + konjunktív. Slovesá na -are majú v konjunktíve koncovku -i: ricicli, parli, studi. Slovesá na -ere a -ire naopak -a: prenda, parta.'],
    c1: ['Od ktorého slovesa je «faccia»?',
      'Fare, nepravidelne: faccia, faccia, faccia, facciamo, facciate, facciano. «Fa freddo» → «benché faccia freddo». A áno, la faccia znamená aj tvár.'],
    c2: ['Poznáš sloveso a prídavné meno z tej istej rodiny?',
      'Inquinare = znečisťovať, inquinato = znečistený. L\'aria inquinata, l\'inquinamento dell\'aria.'],
    c3: ['Kto je podmetom «pianti»? A prečo konjunktív?',
      'Podmet je Lei (vykanie): che Lei pianti. «A patto che» = pod podmienkou, že – vždy s konjunktívom.'],
    c4: ['«La mela» poznáš. Čo je potom «il melo»?',
      'Jabloň. Ovocie je ženského rodu, strom mužského: la mela / il melo, la pera / il pero, l\'arancia / l\'arancio.'],
  },

  gloss: `
arrivo | prichádzam | arrivare
albergo | hotel | | synonymum: l'hotel
impatto zero | nulový dopad (na životné prostredie)
di sera | večer
treno | vlak
sia partito | odišiel (konjunktív) | partire | congiuntivo passato: sia + partito
in orario | načas
reception | recepcia
signor | pán | signore | pred menom sa skracuje: il signor Verdi
verdi | Verdi – priezvisko, doslova „Zelení" | verde
uomo | muž | | množné číslo nepravidelne: gli uomini
gentile | milý, zdvorilý
cravatta | kravata
verde | zelený
benvenuto | vitajte
ecologico | ekologický
dice | hovorí | dire
ascensore | výťah
scale | schody | la scala
zero | nula, nulový
emissioni | emisie | l'emissione
mia | moja | mio
camera | izba | | falošný priateľ: nie kamera!
quinto | piaty
piano | poschodie | | aj: pomaly, potichu
abbia | mám (konjunktív) | avere | abbia, abbia, abbia, abbiamo, abbiate, abbiano
valigia | kufor
pesante | ťažký
salgo | idem hore, vystupujem | salire | nepravidelné: salgo, sali, sale
a piedi | pešo
luce | svetlo
vedo | vidím | vedere
bicicletta | bicykel
accendere | zapnúť, rozsvietiť
lampadina | žiarovka
a basso consumo | úsporný, s nízkou spotrebou
deve | musíte (Lei) / musí | dovere
pedalare | šliapať do pedálov
spiega | vysvetľuje | spiegare
energia | energia
rinnovabile | obnoviteľný
la sua | tá Vaša (vykanie)
pedalo | šliapem | pedalare
dieci | desať
minuti | minúty | il minuto
si accende | rozsvieti sa | accendersi
stanco | unavený
penso che | myslím si, že | pensare | + konjunktív
hotel | hotel
sia | je (konjunktív) | essere | sia, sia, sia, siamo, siate, siano
strano | čudný
aria | vzduch
pulita | čistá | pulito
grande | veľký
silenzio | ticho
mattina | ráno
fame | hlad | | avere fame = byť hladný
scendo | schádzam | scendere
fare colazione | raňajkovať
giardino | záhrada
mangiamo | jeme | mangiare
prodotti | výrobky, produkty | il prodotto
a chilometro zero | od miestnych výrobcov (doslova „na nultom kilometri")
dà | dáva | dare | s prízvukom, aby sa odlíšilo od predložky «da»
cestino | košík
vuoto | prázdny
cibo | jedlo
orto urbano | mestská zeleninová záhrada
orto | zeleninová záhrada
tetto | strecha
frutta | ovocie
verdura | zelenina
di stagione | sezónny
novembre | november
trovo | nachádzam, nájdem | trovare
tre | tri
pomodori | paradajky | il pomodoro | doslova „zlaté jablko" (pomo d'oro)
mela | jablko
biologico | bio, ekologicky pestovaný
naturalmente | samozrejme
senza | bez
ogm | GMO, geneticky modifikované organizmy | | organismi geneticamente modificati
caffè | káva
viene | prichádza, pochádza | venire
lontano | ďaleko
troppe | priveľa | troppo
beva | pite! (vykanie) | bere
acqua del rubinetto | voda z vodovodu | | il rubinetto = kohútik
buonissima | výborná | buono
bevo | pijem | bere
acqua | voda
buona | dobrá | buono
espresso | espresso
dopo | po, potom
colazione | raňajky
devo | musím | dovere
fare | robiť
raccolta differenziata | triedený zber odpadu
sette | sedem
contenitori | kontajnery, nádoby | il contenitore
carta | papier; (platobná) karta
plastica | plast
vetro | sklo
rifiuti | odpad | il rifiuto
organici | organické | organico
chiedo | pýtam sa; žiadam | chiedere
torsolo | ohryzok
mano | ruka | | pozor: la mano je ženského rodu, mn. č. le mani
resti | zvyšky | il resto
vanno | idú; patria (niekam) | andare
organico | bioodpad; organický
è importante che | je dôležité, aby | | + konjunktív
ospite | hosť
ricicli | recykloval (konjunktív) | riciclare
abbia studiato | študoval som (konjunktív) | studiare | congiuntivo passato: abbia + studiato
università | univerzita
sbaglio | mýlim sa, pletiem si | sbagliare
contenitore | kontajner, nádoba
due | dva
volte | -krát | la volta
sera | večer
invita | pozýva | invitare
faccia | je (o počasí), robí (konjunktív) | fare
freddo | zima, chlad
panorama | výhľad | | pozor: il panorama je mužského rodu
bellissimo | nádherný | bello
vede | vidíte (Lei) | vedere
niente | nič, žiadny
inquinamento | znečistenie
rumore | hluk
riduciamo | znižujeme | ridurre | nepravidelné: riduco, riduci, riduce
consumi | spotreba | il consumo
giorno | deň
dire | povedať
ha ragione | má pravdu | avere ragione
comincia | začína | cominciare
piacermi | páčiť sa mi | piacere
conto | účet
sorride | usmieva sa | sorridere
può | môžete (Lei) / môže | potere
pagare | zaplatiť
a patto che | pod podmienkou, že | | + konjunktív
pianti | zasadíte (konjunktív) | piantare
albero | strom
così | tak, takto
suo | Váš (vykanie); jeho, svoj
soggiorno | pobyt | | aj: obývačka
davvero | naozaj
a impatto zero | s nulovým dopadom na prostredie
pianto | sadím | piantare | il pianto je aj plač, ale to je iný príbeh
piccolo | malý
melo | jabloň
do | dávam | dare
nome | meno
jožko | Jožko. Aj talianska jabloň si zaslúži poriadne meno.
caro | drahý
abbia pedalato | šliapal som (konjunktív) | pedalare | congiuntivo passato
ore | hodiny | l'ora
guardare | pozerať
film | film
voglio | chcem | volere
tornare | vrátiť sa
prossima | budúca, najbližšia | prossimo
volta | raz, -krát
porto | prinesiem, nosím | portare
casa | dom, domov
biodegradabile | biologicky rozložiteľný
`,

  // Costellazioni: c = slovo v strede, chains = [slová oddelené |, preklad celého spojenia], x = nezmysly
  rounds: [
    { c: 'energia', chains: [
      ['solare', 'slnečná energia'], ['eolica', 'veterná energia'], ['rinnovabile', 'obnoviteľná energia'],
      ['elettrica', 'elektrická energia'], ['pulita', 'čistá energia'],
    ], x: ['differenziata', 'urbano', 'di stagione', 'transgenica', 'del rubinetto', 'organici'] },
    { c: 'a', chains: [
      ['chilometro|zero', 'od miestnych výrobcov'], ['basso|consumo', 'úsporný, s nízkou spotrebou'],
      ['impatto|zero', 's nulovým dopadom'], ['piedi', 'pešo'], ['patto|che', 'pod podmienkou, že'],
    ], x: ['alto', 'rifiuti', 'verde', 'eolica', 'sebbene', 'orto'] },
    { c: 'ridurre', chains: [
      ['i|consumi', 'znížiť spotrebu'], ['i|rifiuti', 'znížiť množstvo odpadu'],
      ['le|emissioni', 'znížiť emisie'], ["l'inquinamento", 'znížiť znečistenie'],
    ], x: ['la colazione', 'il silenzio', 'gli alberi', 'biologico', 'il tetto'] },
    { c: 'fare', chains: [
      ['la|raccolta|differenziata', 'triediť odpad'], ['colazione', 'raňajkovať'],
      ['attenzione', 'dávať pozor'], ["bene|all'ambiente", 'prospievať životnému prostrediu'],
    ], x: ['il rubinetto', 'emissioni', 'biologico', 'eolica', 'il consumo'] },
    { c: 'frutta', chains: [
      ['e|verdura', 'ovocie a zelenina'], ['di|stagione', 'sezónne ovocie'],
      ['fresca', 'čerstvé ovocie'], ['biologica', 'bio ovocie'],
    ], x: ['eolica', 'a basso consumo', 'urbana', 'differenziata', 'elettrica'] },
    { c: 'prodotti', chains: [
      ['locali', 'miestne produkty'], ['biologici', 'bio produkty'], ['biodegradabili', 'biologicky rozložiteľné výrobky'],
      ['a|chilometro|zero', 'produkty od miestnych výrobcov'], ['cosmetici', 'kozmetické výrobky'],
    ], x: ['eolici', 'differenziati', 'del rubinetto', 'urbani', 'rinnovabile'] },
    { c: 'zero', chains: [
      ['emissioni', 'nulové emisie'], ['chilometri', 'nula kilometrov'], ['rifiuti', 'nulový odpad'],
    ], x: ['lampadine', 'colazione', 'verdura', 'sebbene', 'ascensore'] },
    { c: 'acqua', chains: [
      ['del|rubinetto', 'voda z vodovodu'], ['in|bottiglia', 'balená voda'], ['minerale', 'minerálka'],
    ], x: ['eolica', 'differenziata', 'urbano', 'a pedali', 'transgenica'] },
  ],

  // Karty: s = veta s medzerou ___, o = možnosti (PRVÁ je správna), why = prečo, sk = preklad
  cards: [
    { s: "___ l'hotel sia caro, è sempre pieno.", o: ['Sebbene', 'Anche se'],
      why: 'Vo vete je «sia» – konjunktív. Ten si pýta sebbene (alebo benché, nonostante).', sk: 'Hoci je hotel drahý, je vždy plný.' },
    { s: "___ l'hotel è caro, è sempre pieno.", o: ['Anche se', 'Benché'],
      why: '«È» je indikatív, takže jediná možnosť je «anche se».', sk: 'Aj keď je hotel drahý, je vždy plný.' },
    { s: 'Benché ___ freddo, usciamo in bicicletta.', o: ['faccia', 'fa'],
      why: 'Benché + konjunktív: fare → faccia.', sk: 'Hoci je zima, ideme von na bicykli.' },
    { s: 'Anche se ___ freddo, usciamo in bicicletta.', o: ['fa', 'faccia'],
      why: 'Anche se je jediná z tých štyroch spojok, ktorá chce indikatív.', sk: 'Aj keď je zima, ideme von na bicykli.' },
    { s: 'Nonostante al sud gli Eco-Hotel ___ pochi, alcuni sono molto interessanti.', o: ['siano', 'sono'],
      why: 'Nonostante + konjunktív: essere → siano (loro).', sk: 'Napriek tomu, že na juhu je eko-hotelov málo, niektoré sú veľmi zaujímavé.' },
    { s: "L'ecoturismo è diventato importante, anche se ___ ancora caro.", o: ['è', 'sia'],
      why: 'Anche se + indikatív. Presne takto je to v texte z učebnice.', sk: 'Ekoturizmus sa stal dôležitým, aj keď je stále drahý.' },
    { s: 'Sebbene io ___ poco tempo, faccio sempre la raccolta differenziata.', o: ['abbia', 'ho'],
      why: 'Sebbene + konjunktív: avere → abbia.', sk: 'Hoci mám málo času, vždy triedim odpad.' },
    { s: "Penso che l'energia solare ___ il futuro.", o: ['sia', 'è'],
      why: '«Penso che» je názor, nie fakt → konjunktív.', sk: 'Myslím si, že slnečná energia je budúcnosť.' },
    { s: "Secondo me l'energia solare ___ il futuro.", o: ['è', 'sia'],
      why: 'Pasca! «Secondo me» tiež vyjadruje názor, ale ide s indikatívom – nie je tam «che».', sk: 'Podľa mňa je slnečná energia budúcnosť.' },
    { s: 'È importante che tutti ___ i rifiuti.', o: ['riciclino', 'riciclano'],
      why: '«È importante che» + konjunktív: riciclare → riciclino (loro).', sk: 'Je dôležité, aby všetci recyklovali odpad.' },
    { s: 'Potete usare la macchina, a patto che la ___ poco.', o: ['usiate', 'usate'],
      why: '«A patto che» (pod podmienkou, že) + konjunktív: usare → usiate (voi).', sk: 'Môžete používať auto pod podmienkou, že ho budete používať málo.' },
    { s: 'I miei genitori vogliono che io ___ anche enologia.', o: ['studi', 'studio'],
      why: 'Volere che + konjunktív. Niekto chce, aby niekto iný niečo robil.', sk: 'Moji rodičia chcú, aby som študovala aj enológiu.' },
    { s: 'Non sopporto che lei ___ continuamente di vino.', o: ['parli', 'parla'],
      why: '«Non sopporto che» vyjadruje pocit → konjunktív: parlare → parli.', sk: 'Neznesiem, že stále rozpráva o víne.' },
    { s: "So che l'acqua del rubinetto ___ buona.", o: ['è', 'sia'],
      why: '«So che» = viem, že. Istota → indikatív. Konjunktív je pre názory, želania a pochybnosti.', sk: 'Viem, že voda z vodovodu je dobrá.' },
    { s: 'Credo che ___ a te decidere il tuo futuro.', o: ['tocchi', 'tocca'],
      why: 'Credo che + konjunktív: toccare → tocchi (pribudne h, aby sa zachovala výslovnosť k).', sk: 'Verím, že je na tebe rozhodnúť o svojej budúcnosti.' },
    { s: 'Ridurre i consumi è necessario, ___ può essere difficile.', o: ['anche se', 'nonostante'],
      why: '«Può» je indikatív → anche se. S nonostante by muselo byť «possa».', sk: 'Znižovať spotrebu je nutné, aj keď to môže byť ťažké.' },
    { s: '___ nel Sud Italia ci siano pochi Eco-Hotel, ne ho trovato uno bellissimo.', o: ['Benché', 'Anche se'],
      why: '«Ci siano» je konjunktív → benché.', sk: 'Hoci je v južnom Taliansku málo eko-hotelov, našiel som jeden nádherný.' },
    { s: "Quest'estate passiamo le vacanze in un Eco-Hotel, ___ sia una grossa spesa.", o: ['sebbene', 'anche se'],
      why: '«Sia» je konjunktív → sebbene.', sk: 'Toto leto strávime dovolenku v eko-hoteli, hoci je to veľký výdavok.' },
    { s: "Ho l'impressione che i tuoi genitori ___ un po' egoisti.", o: ['siano', 'sono'],
      why: '«Ho l\'impressione che» je dojem, nie istota → konjunktív.', sk: 'Mám dojem, že tvoji rodičia sú trochu sebeckí.' },
    { s: 'È giusto che tu ___ le tue decisioni.', o: ['prenda', 'prendi'],
      why: '«È giusto che» + konjunktív. Slovesá na -ere majú -a: prendere → prenda.', sk: 'Je správne, aby si robil vlastné rozhodnutia.' },
    { s: 'Sebbene il signor Verdi ___ tutto, dimentica sempre le chiavi.', o: ['ricicli', 'ricicla'],
      why: 'Sebbene + konjunktív: riciclare → ricicli.', sk: 'Hoci pán Verdi všetko recykluje, vždy zabudne kľúče.' },
    { s: 'Mangio frutta di stagione perché ___ più buona.', o: ['è', 'sia'],
      why: '«Perché» (lebo) uvádza dôvod, teda fakt → indikatív.', sk: 'Jem sezónne ovocie, lebo je chutnejšie.' },
    { s: "Spero che l'albergo ___ lampadine a basso consumo.", o: ['usi', 'usa'],
      why: '«Spero che» je želanie → konjunktív: usare → usi.', sk: 'Dúfam, že hotel používa úsporné žiarovky.' },
    { s: 'Vogliono che io ___ un tecnico del vino.', o: ['diventi', 'divento'],
      why: 'Volere che + konjunktív: diventare → diventi.', sk: 'Chcú, aby som sa stala vinárskou technologičkou.' },
  ],

  // Skladačka: sk = zadanie, it = riešenie, x = dlaždice navyše, alt = iné správne poradia
  build: [
    { sk: 'Hoci je hotel drahý, je vždy plný.', t: "Sebbene l'hotel sia caro, è sempre pieno.", x: ['sono'] },
    { sk: 'Každý deň triedim odpad.', t: 'Faccio la raccolta differenziata ogni giorno.', x: ['rifiuti'],
      alt: ['Ogni giorno faccio la raccolta differenziata.'] },
    { sk: 'Jeme len sezónne ovocie a zeleninu.', t: 'Mangiamo solo frutta e verdura di stagione.', x: ['stazione'],
      alt: ['Mangiamo solo verdura e frutta di stagione.'] },
    { sk: 'Myslím si, že voda z vodovodu je dobrá.', t: "Penso che l'acqua del rubinetto sia buona.", x: ['è'] },
    { sk: 'Aj keď som unavený, idem pešo.', t: 'Anche se sono stanco, vado a piedi.', x: ['sia'],
      alt: ['Vado a piedi anche se sono stanco.'] },
    { sk: 'Je dôležité, aby každý znižoval spotrebu.', t: 'È importante che ognuno riduca i consumi.', x: ['riduce'] },
    { sk: 'Hotel používa úsporné žiarovky.', t: "L'hotel usa lampadine a basso consumo.", x: ['alto'] },
    { sk: 'Hoci je zima, výhľad je nádherný.', t: 'Benché faccia freddo, il panorama è bellissimo.', x: ['fa'] },
    { sk: 'Môžete platiť kartou pod podmienkou, že zasadíte strom.', t: 'Può pagare con la carta a patto che pianti un albero.', x: ['pianta'] },
    { sk: 'Napriek tomu, že je november, nachádzam tri paradajky.', t: 'Nonostante sia novembre, trovo tre pomodori.', x: ['è'] },
  ],
};
