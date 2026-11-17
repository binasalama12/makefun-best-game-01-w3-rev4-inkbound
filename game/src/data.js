// INKBOUND content tables: chapters, the bestiary, illuminations (draft perks),
// marginalia (collection passives), difficulties and the two bosses.

export const BEASTS = {
  pagemite:  { name: 'Pagemite',        glyph: 'mite',  r: 17, speed: 34, score: 100, ink: 4,
               line: 'Wanders the margin at a scribe\u2019s pace, nibbling letters.' },
  dasher:    { name: 'Quillshy Dasher', glyph: 'dash',  r: 15, speed: 62, score: 180, ink: 5,
               line: 'Flees your quill the moment it comes near \u2014 corner it.' },
  splitter:  { name: 'Splitworm',       glyph: 'worm',  r: 18, speed: 30, score: 150, ink: 6,
               line: 'Looped alone it divides in two; bind it with company.' },
  armoured:  { name: 'Aegis Tortoise',  glyph: 'tort',  r: 21, speed: 16, score: 260, ink: 7,
               line: 'Its shell laughs at one loop \u2014 crack it, then bind it.' },
  drinker:   { name: 'Inkdrinker Leech',glyph: 'leech', r: 16, speed: 26, score: 220, ink: 8,
               line: 'Sips your ink meter dry while it roams free. Bind it first.' },
  sleeper:   { name: 'Dormouse Sleeper',glyph: 'mouse', r: 16, speed: 12, score: 140, ink: 5,
               line: 'Easy prey while it dreams \u2014 a careless loop wakes it angry.' },
  mimic:     { name: 'Mimic Marginal',  glyph: 'mimic', r: 15, speed: 40, score: 60,  ink: 2,
               line: 'Poses as a harmless doodle bloom. Binding it breaks your combo.' },
};

export const BOSSES = {
  wyrm:      { name: 'THE MARGOT WYRM', r: 26, score: 4000,
               line: 'A serpent in the margin of Chapter IV. Three loops along its body, struck close together, bind it.' },
  leviathan: { name: 'THE ILLUMINATED LEVIATHAN', r: 88, score: 12000,
               line: 'The beast of the final page. It sheds lesser beasts, and only GOLD ink loops can hold it.' },
};

// quota = beasts to bind; time = candle seconds; mix = spawn weights by beast key.
export const CHAPTERS = [
  { name: 'I \u00b7 The Pristine Folio',  quota: 6,  time: 75,  tint: '#efe3c2', inkTone: '#3a2a18', accent: '#b8860b',
    mix: { pagemite: 5, sleeper: 2, dasher: 1 } },
  { name: 'II \u00b7 Tea-Stained Verses', quota: 8,  time: 80,  tint: '#ecd9ae', inkTone: '#40301c', accent: '#a05a2c',
    mix: { pagemite: 4, dasher: 3, sleeper: 2, splitter: 1 } },
  { name: 'III \u00b7 The Worm-Eaten Leaf', quota: 9, time: 85,  tint: '#e6d3a0', inkTone: '#33270f', accent: '#7a6a1e',
    mix: { pagemite: 3, splitter: 3, dasher: 2, drinker: 1, mimic: 1 } },
  { name: 'IV \u00b7 The Margot Wyrm',    quota: 7,  time: 100, tint: '#e9d6b4', inkTone: '#2e2113', accent: '#8c2f39', boss: 'wyrm',
    mix: { pagemite: 3, armoured: 2, dasher: 2, sleeper: 1 } },
  { name: 'V \u00b7 Indigo Marginalia',   quota: 11, time: 90,  tint: '#ddd6bd', inkTone: '#232c4a', accent: '#35507a',
    mix: { dasher: 3, splitter: 3, drinker: 2, armoured: 1, mimic: 1, pagemite: 2 } },
  { name: 'VI \u00b7 The Verdigris Choir', quota: 12, time: 95, tint: '#d8dcba', inkTone: '#1f3325', accent: '#2e6b4f',
    mix: { armoured: 3, drinker: 2, splitter: 2, dasher: 3, sleeper: 2, mimic: 1 } },
  { name: 'VII \u00b7 Rubricated Doom',   quota: 13, time: 100, tint: '#ecd2b8', inkTone: '#4a1f1a', accent: '#a52a21',
    mix: { dasher: 4, armoured: 3, drinker: 3, splitter: 2, mimic: 2, pagemite: 1 } },
  { name: 'VIII \u00b7 The Illuminated Leviathan', quota: 8, time: 120, tint: '#f0e2bc', inkTone: '#2a1e08', accent: '#c99612', boss: 'leviathan',
    mix: { pagemite: 2, dasher: 2, splitter: 1, drinker: 1, armoured: 1, mimic: 1 } },
];

// Illumination draft pool (choose 1 of 3 after every chapter). Effects live in world.js.
export const ILLUMINATIONS = [
  { id: 'longer-ink',  name: 'Longer Ink',    desc: '+40 maximum ink, refilled now.' },
  { id: 'deep-well',   name: 'Deep Well',     desc: 'Ink refills 60% faster.' },
  { id: 'gilded',      name: 'Gilded Quill',  desc: 'Gold-ink loops score DOUBLE.' },
  { id: 'wide-nib',    name: 'Wide Nib',      desc: 'Loops bind with a generous margin.' },
  { id: 'slow-verse',  name: 'Slow Verse',    desc: 'All beasts move 15% slower.' },
  { id: 'candle-wax',  name: 'Candle Wax',    desc: '+14 seconds on every candle.' },
  { id: 'twin-quill',  name: 'Twin Quill',    desc: 'A ghost loop mirrors yours and binds too.' },
  { id: 'swift-hand',  name: 'Swift Hand',    desc: 'Loops cost 25% less ink.' },
  { id: 'combo-saint', name: 'Combo Saint',   desc: 'Combo window stretches by 1.2 seconds.' },
  { id: 'greedy-gloss',name: 'Greedy Gloss',  desc: '+50% gold leaf from every bind.' },
  { id: 'phoenix',     name: 'Phoenix Verse', desc: 'Once per run, a dying candle rekindles +18s.' },
];

// Marginalia: collection passives earned from bosses and flawless chapters.
export const MARGINALIA = [
  { id: 'gilt-initial', name: 'Gilt Initial',   desc: '+10% to all score.',        from: 'A flawless chapter' },
  { id: 'doodled-sun',  name: 'Doodled Sun',    desc: '+5s on every candle.',      from: 'A flawless chapter' },
  { id: 'wax-seal',     name: 'Wax Seal',       desc: 'Combo window +0.6s.',       from: 'Binding THE MARGOT WYRM' },
  { id: 'pressed-flower', name: 'Pressed Flower', desc: 'Loops cost 12% less ink.', from: 'A flawless chapter' },
  { id: 'tiny-knight',  name: 'Tiny Knight',    desc: 'One wasted loop per chapter is forgiven.', from: 'Binding THE MARGOT WYRM' },
  { id: 'marginal-cat', name: 'Marginal Cat',   desc: 'Beasts move 6% slower.',    from: 'A flawless chapter' },
  { id: 'gold-tooth',   name: 'Gold Tooth',     desc: 'Gold loops cost 30% less gold leaf.', from: 'Binding THE ILLUMINATED LEVIATHAN' },
  { id: 'scribes-thumb', name: 'Scribe\u2019s Thumb', desc: 'Bind margin +7px on every loop.', from: 'Binding THE ILLUMINATED LEVIATHAN' },
];

export const DIFFICULTIES = [
  { id: 'scribe',     name: 'SCRIBE',            desc: 'A kind candle, deep ink, gentle beasts.', timeMul: 1.3, inkMul: 1.3, speedMul: 0.85, quotaAdd: -1 },
  { id: 'illuminator', name: 'ILLUMINATOR',      desc: 'The manuscript as written.',              timeMul: 1.0, inkMul: 1.0, speedMul: 1.0,  quotaAdd: 0 },
  { id: 'grand',      name: 'GRAND ILLUMINATOR', desc: 'Short candle, thin ink, quick beasts.',   timeMul: 0.82, inkMul: 0.85, speedMul: 1.18, quotaAdd: 2 },
];

export const TITLE_LINE = 'INKBOUND: draw ink loops to bind the beasts of the manuscript \u2014 8 chapters, 7 beasts, 9 illuminations, 8 marginalia and the Illuminated Leviathan';
