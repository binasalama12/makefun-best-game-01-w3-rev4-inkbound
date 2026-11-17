[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w3-rev4-inkbound/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w3-rev4-inkbound/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# INKBOUND: draw ink loops to bind the beasts of the manuscript — 8 chapters, 7 beasts, 9 illuminations, 8 marginalia and the Illuminated Leviathan

A haunted manuscript's bestiary has escaped into its own margins. You are the scribe on
night duty, and your quill is the only cage: **draw a closed loop of ink around a beast
and the ink itself becomes the binding.** Bind each chapter's quota before the candle
burns down, draft illuminations between chapters, collect the marginalia doodles that
live in the margins — and on the final page, spend your gold leaf wisely, because only
gold ink holds **THE ILLUMINATED LEVIATHAN**.

INKBOUND is a complete, original browser game in plain static files: vanilla canvas 2D,
ES modules, no libraries, no build step, no network calls, deterministic seeded runs.

## How to play

- **Draw** — hold the mouse (or a finger) and drag a loop on the parchment page.
  Release with the ends close together to snap the loop shut.
- **Bind** — a beast *fully inside* the closed loop (its centre plus a small margin)
  is bound. Partial enclosures bind nothing. Every loop costs ink in proportion to
  its length; the ink meter refills over time and with every bind.
- **Combo** — binds chained within a short window raise the combo multiplier up to ×6.
  Multi-binds in a single loop pay out banners: DOUBLE BIND, TRIPLE BIND, MEGA BIND.
- **Gold ink** — hold `G` (or tap the Gold Ink Seal) to draw with gold ink, paid for in
  gold leaf instead of ink. Gold ink is the *only* ink that holds the Leviathan.
- **WIN a chapter** — meet the bind quota (and bind the chapter's boss, where one
  stalks the page) before the candle dies. **LOSE** — the candle burns out first.

## The bestiary — 7 beast kinds, each with its own behaviour

| Beast | Behaviour |
| --- | --- |
| **Pagemite** | Wanders the margin at a scribe's pace, nibbling letters. |
| **Quillshy Dasher** | Flees your quill the moment it comes near — corner it. |
| **Splitworm** | Looped alone it divides in two; bind it with company. |
| **Aegis Tortoise** | Its shell laughs at one loop — crack it, then bind it. |
| **Inkdrinker Leech** | Sips your ink meter dry while it roams free. Bind it first. |
| **Dormouse Sleeper** | Easy prey while it dreams — a careless loop wakes it angry. |
| **Mimic Marginal** | Poses as a harmless doodle bloom. Binding it breaks your combo. |

Plus two bosses: **THE MARGOT WYRM** (Chapter IV — a long serpent bound only by three
loops struck along different thirds of its body in quick succession) and **THE
ILLUMINATED LEVIATHAN** (Chapter VIII — huge, sheds lesser beasts onto the page, and
only gold-ink loops can hold it; it takes two).

## Systems

- **8 chapters**, each a distinct manuscript page — procedurally textured parchment
  (grain, fibres, tea stains, ruled lines, corner doodles) in its own ink and palette:
  the Pristine Folio, Tea-Stained Verses, the Worm-Eaten Leaf, the Margot Wyrm,
  Indigo Marginalia, the Verdigris Choir, Rubricated Doom, the Illuminated Leviathan.
- **Illumination draft** — after every chapter, choose 1 of 3 illuminations from a pool
  of 11 with real effects: Longer Ink, Deep Well, Gilded Quill (gold loops score
  double), Wide Nib, Slow Verse, Candle Wax, Twin Quill (a ghost loop mirrors yours
  and binds too), Swift Hand, Combo Saint, Greedy Gloss, Phoenix Verse (a dying candle
  rekindles once per run).
- **Marginalia collection** — 8 named margin-doodles with small real effects (Gilt
  Initial, Doodled Sun, Wax Seal, Pressed Flower, Tiny Knight, Marginal Cat, Gold
  Tooth, Scribe's Thumb), earned from flawless chapters and bound bosses, and listed
  in the HUD collection panel while you play.
- **HUD** — explicit WIN and LOSE lines, bound X/Y quota, candle timer bar and ink
  meter (dual resource bars), score, combo multiplier and chain timer, gold-leaf
  currency, a threat panel counting the beasts on the page by kind, the collection
  and illuminations panels, and a controls strip.
- **Juice** — floating score numbers, event banners, ink-splash particles, gold
  sparkles on gold binds, loop-fill shimmer, sketchy hand-inked beast art.
- **Scoring** — combo chains, multi-bind bonuses, flawless-chapter bonuses (+750),
  time bonuses and boss bounties (4,000 and 12,000) carry a full run well into five
  figures; the victory screen awards a letter rank (S/A/B/C) with ten run statistics
  and a full recap of the illuminations and marginalia you carried.
- **3 difficulties** — Scribe, Illuminator, Grand Illuminator — scaling candle time,
  ink, beast speed and quotas.

## Screens

Title (how-to-play + full bestiary + difficulties) → chapter play with the full HUD →
illumination draft between chapters → victory screen with letter rank, statistics and
collection recap (or the candle-lit defeat screen, and click to begin a new manuscript).

## Layout

```
game/index.html        the page (canvas, no external assets)
game/src/data.js       chapters, bestiary, illuminations, marginalia, difficulties
game/src/world.js      simulation: beasts, bosses, loop capture, combo scoring, effects
game/src/render.js     parchment texture, ink art, HUD, title/draft/victory screens
game/src/shots.js      deterministic screenshot scenes (?shot=cover|meta|title|end)
game/src/main.js       input, game loop, screen flow
game/src/rng.js        seeded RNG (mulberry32)
vendor/makefun-game.ts the make.fun dossier library (kit copy, unchanged)
main.ts                hand-in program: copies game/ + screenshots/, writes dossier.json
serve.ts               tiny local static server for game/
screenshots/           1-cover.jpg (Leviathan boss action), 2-meta.jpg (illumination
                       draft), 3-title.jpg, 4-end.jpg (victory) — see shots.json
```

## Run it

```
node serve.ts            # then open http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the hand-in dossier
```

Deterministic screenshot scenes: `http://localhost:8080/?shot=cover&seed=7` (and
`meta`, `title`, `end`) pose real run states built through the game's own world
functions, for reproducible 1280×720 captures.

## License

MIT — see `LICENSE` (SPDX-License-Identifier: MIT).
