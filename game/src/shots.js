// Deterministic screenshot staging for INKBOUND (?shot=cover|meta|title|end&seed=N).
// Each scene builds a REAL run state through the same world functions the game uses,
// then poses it: the screenshots are honest renders of the game's own code.

import { startChapter, spawnBeast, pushBanner, FIELD } from './world.js';
import { ILLUMINATIONS } from './data.js';

function circle(cx, cy, r, a0, a1, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
  return pts;
}
function burst(ch, x, y, gold, n) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.28;
    ch.particles.push({ x, y, vx: Math.cos(a) * (40 + (i % 5) * 16), vy: Math.sin(a) * (40 + (i % 5) * 16) - 20, t: 0.15, life: 0.9, gold, size: 2.6 });
  }
}

export function stageShot(run, name) {
  if (name === 'title') { run.mode = 'title'; return {}; }

  if (name === 'cover') {
    run.diffIdx = 1; run.chapterIdx = 7;
    run.score = 38450; run.gold = 86; run.goldEarned = 268;
    run.illuminations = ['gilded', 'wide-nib', 'slow-verse', 'deep-well'];
    run.marginalia = ['gilt-initial', 'wax-seal', 'tiny-knight', 'doodled-sun'];
    run.bossesBound = ['THE MARGOT WYRM'];
    startChapter(run); run.mode = 'play';
    const ch = run.ch;
    ch.bound = 5; ch.timeLeft = 63; ch.ink = 57; ch.chain = 4; ch.comboT = 2.3;
    ch.beasts.length = 0;
    const boss = ch.boss; boss.x = 440; boss.y = 330; boss.goldHits = 1; boss.phase = 0.7;
    const spots = [
      ['dasher', 218, 196], ['splitter', 668, 178], ['armoured', 706, 486],
      ['drinker', 268, 492], ['sleeper', 586, 540], ['mimic', 168, 372], ['pagemite', 782, 316],
    ];
    for (const [t, x, y] of spots) { const b = spawnBeast(run, t, x, y); b.phase = x * 0.01; }
    ch.shimmers.push({ poly: circle(706, 486, 58, 0, 6.28, 26), t: 0.3, gold: false });
    ch.shimmers.push({ poly: circle(268, 492, 52, 0, 6.28, 24), t: 0.55, gold: true });
    ch.floaters.push({ x: 706, y: 420, text: '+780', color: '#3a2a18', big: true, t: 0.3, life: 1.25 });
    ch.floaters.push({ x: 268, y: 428, text: '+440 GOLD', color: '#c99612', big: true, t: 0.5, life: 1.25 });
    ch.floaters.push({ x: 560, y: 240, text: '+180', color: '#3a2a18', big: false, t: 0.7, life: 1.25 });
    burst(ch, 706, 486, false, 12); burst(ch, 268, 492, true, 14);
    pushBanner(run, 'TRIPLE BIND! +1,400', 'combo \u00d7' + '2.5 \u2014 the Leviathan strains against gold');
    ch.banners[0].t = 0.4;
    return { view: { stroke: circle(440, 330, 138, -2.4, 0.9, 30), goldMode: true, pointer: { x: 578, y: 330 } } };
  }

  if (name === 'meta') {
    run.chapterIdx = 3;
    run.score = 14780; run.gold = 57; run.goldEarned = 121;
    run.illuminations = ['slow-verse', 'longer-ink'];
    run.marginalia = ['wax-seal', 'tiny-knight', 'gilt-initial'];
    run.bossesBound = ['THE MARGOT WYRM'];
    run.perfectChapters = 1; run.chaptersCleared = 4;
    startChapter(run); // gives drawDraft a real chapter context; mode overridden below
    run.draftChoices = ['gilded', 'twin-quill', 'candle-wax'].map(id => ILLUMINATIONS.find(i => i.id === id));
    run.mode = 'draft';
    return {};
  }

  if (name === 'end') {
    run.score = 62340; run.gold = 143; run.goldEarned = 412;
    run.chaptersCleared = 8; run.totalBound = 87; run.totalLoops = 64; run.whiffedLoops = 9;
    run.bestChain = 9; run.perfectChapters = 3; run.timePlayed = 754;
    run.bossesBound = ['THE MARGOT WYRM', 'THE ILLUMINATED LEVIATHAN'];
    run.illuminations = ['gilded', 'wide-nib', 'slow-verse', 'deep-well', 'twin-quill', 'candle-wax', 'combo-saint'];
    run.marginalia = ['gilt-initial', 'wax-seal', 'tiny-knight', 'doodled-sun', 'gold-tooth', 'scribes-thumb'];
    run.chapterIdx = 7;
    startChapter(run);
    run.mode = 'victory';
    return {};
  }
  run.mode = 'title';
  return {};
}
