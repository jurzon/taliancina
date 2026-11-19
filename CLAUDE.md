# Taliančina hrou

Učebná hra pre slovensky hovoriacich. Čisté HTML/CSS/JS bez buildu, nasadené cez GitHub Pages (https://jurzon.github.io/taliancina/).

## Zdieľaný engine
- `js/` a `tools/` sú **spoločný engine**, ktorý je identický so sesterským repozitárom `../anglictina`. Každú zmenu v `js/` alebo `tools/` treba preniesť aj tam (skopírovať priečinok) a skontrolovať oba repozitáre cez `diff -r`.
- V `js/` nesmie byť nič jazykovo špecifické. Jazyk, značka, maskot a texty hier patria do `data/config.js`, zoznam lekcií do `data/index.js`.
- Minihry: register je v `js/games/index.js`. Každá hra exportuje `view(lesson, rerender)` a `validate(lesson, err)`. Lekcia si hry vyberá cez `games: [...]`.

## Obsah
- Lekcie: `data/lezioneX.js` (príbeh, otázky, slovník, súhvezdia, karty, skladačka; formát je opísaný v komentároch v súbore).
- Fotky učebnice sú v `DATA/`. Sú chránené autorským právom, preto sú v .gitignore a nikdy nesmú ísť do gitu.
- Po každej zmene obsahu spusti `node tools/validate.mjs`.
- Rozhranie je po slovensky.

Lokálne: `python3 -m http.server 8000`.
