// INKBOUND simulation: run state, chapters, beasts, bosses, loop capture, combo scoring,
// illumination + marginalia effects. Pure logic; rendering lives in render.js.

import { BEASTS, BOSSES, CHAPTERS, ILLUMINATIONS, MARGINALIA, DIFFICULTIES } from './data.js';
import { makeRng, range } from './rng.js';

export const FIELD = { x: 24, y: 66, w: 868, h: 596 };

export function has(run, list, id) { return run[list].includes(id); }

// ---- derived effect values (illuminations + marginalia + difficulty) ----
export function inkMax(run) { return Math.round(100 * run.diff.inkMul + (has(run, 'illuminations', 'longer-ink') ? 40 : 0)); }
export function inkRegen(run) { return 7.5 * (has(run, 'illuminations', 'deep-well') ? 1.6 : 1); }
export function loopCostMul(run) {
  let m = 1;
  if (has(run, 'illuminations', 'swift-hand')) m *= 0.75;
  if (has(run, 'marginalia', 'pressed-flower')) m *= 0.88;
  return m;
}
export function bindMargin(run) {
  let m = 4;
  if (has(run, 'illuminations', 'wide-nib')) m += 16;
  if (has(run, 'marginalia', 'scribes-thumb')) m += 7;
  return m;
}
export function beastSpeedMul(run) {
  let m = run.diff.speedMul;
  if (has(run, 'illuminations', 'slow-verse')) m *= 0.85;
  if (has(run, 'marginalia', 'marginal-cat')) m *= 0.94;
  return m;
}
export function comboWindow(run) {
  let w = 3.0;
  if (has(run, 'illuminations', 'combo-saint')) w += 1.2;
  if (has(run, 'marginalia', 'wax-seal')) w += 0.6;
  return w;
}
export function candleBonus(run) {
  let b = 0;
  if (has(run, 'illuminations', 'candle-wax')) b += 14;
  if (has(run, 'marginalia', 'doodled-sun')) b += 5;
  return b;
}
export function scoreMul(run) { return has(run, 'marginalia', 'gilt-initial') ? 1.1 : 1; }
export function goldCostMul(run) { return has(run, 'marginalia', 'gold-tooth') ? 0.7 : 1; }

export function createRun(seed, diffIdx) {
  const run = {
    mode: 'title', diff: DIFFICULTIES[diffIdx], diffIdx,
    rng: makeRng(seed * 7919 + diffIdx * 131 + 17),
    chapterIdx: 0, ch: null,
    score: 0, gold: 24, goldEarned: 24,
    illuminations: [], marginalia: [], draftChoices: [],
    totalBound: 0, totalLoops: 0, whiffedLoops: 0, bestChain: 0,
    perfectChapters: 0, chaptersCleared: 0, bossesBound: [], timePlayed: 0,
    phoenixUsed: false, banner: null,
  };
  return run;
}

function weightedType(rng, mix) {
  let total = 0; for (const k in mix) total += mix[k];
  let roll = rng() * total;
  for (const k in mix) { roll -= mix[k]; if (roll <= 0) return k; }
  return 'pagemite';
}

export function spawnBeast(run, type, x, y, mini) {
  const def = BEASTS[type];
  const a = run.rng() * Math.PI * 2;
  const sp = def.speed * beastSpeedMul(run) * range(run.rng, 0.8, 1.25);
  const b = {
    type, x: x ?? range(run.rng, FIELD.x + 60, FIELD.x + FIELD.w - 60),
    y: y ?? range(run.rng, FIELD.y + 60, FIELD.y + FIELD.h - 60),
    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
    r: def.r * (mini ? 0.62 : range(run.rng, 0.92, 1.1)),
    phase: run.rng() * Math.PI * 2, wanderT: range(run.rng, 0.5, 2),
    armour: type === 'armoured', awake: type !== 'sleeper', revealed: false,
    canSplit: type === 'splitter' && !mini, wobble: run.rng() * 10,
  };
  run.ch.beasts.push(b);
  return b;
}

export function startChapter(run) {
  const def = CHAPTERS[run.chapterIdx];
  run.ch = {
    def, beasts: [], boss: null, bossBound: false,
    timeLeft: def.time * run.diff.timeMul + candleBonus(run), timeMax: def.time * run.diff.timeMul + candleBonus(run),
    ink: inkMax(run), bound: 0, quota: Math.max(3, def.quota + run.diff.quotaAdd),
    spawnT: 0, spawned: 0, spawnCap: def.quota + run.diff.quotaAdd + 9,
    chain: 0, comboT: 0, whiffs: 0, knightUsed: false,
    floaters: [], particles: [], banners: [], shimmers: [], clearT: 0,
  };
  if (def.boss === 'wyrm') {
    const spine = [];
    for (let i = 0; i < 15; i++) spine.push({ x: FIELD.x + 140 - i * 20, y: FIELD.y + 150 });
    run.ch.boss = { kind: 'wyrm', name: BOSSES.wyrm.name, spine, angle: 0.4, hits: [], hitFlash: 0 };
  } else if (def.boss === 'leviathan') {
    run.ch.boss = { kind: 'leviathan', name: BOSSES.leviathan.name, x: FIELD.x + FIELD.w / 2, y: FIELD.y + 240,
      vx: 14, vy: 9, r: BOSSES.leviathan.r, goldHits: 0, shedT: 5, phase: 0 };
  }
  for (let i = 0; i < 4; i++) { spawnBeast(run, weightedType(run.rng, def.mix)); run.ch.spawned++; }
  pushBanner(run, 'CHAPTER ' + def.name);
}

export function pushBanner(run, text, sub) {
  if (!run.ch) return;
  run.ch.banners.push({ text, sub: sub || '', t: 0, life: 2.4 });
  if (run.ch.banners.length > 2) run.ch.banners.shift();
}

function floater(run, x, y, text, color, big) {
  run.ch.floaters.push({ x, y, text, color, big: !!big, t: 0, life: 1.25 });
}
function splash(run, x, y, gold) {
  for (let i = 0; i < (gold ? 16 : 11); i++) {
    const a = run.rng() * Math.PI * 2, sp = range(run.rng, 24, 120);
    run.ch.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 26, t: 0,
      life: range(run.rng, 0.4, 0.9), gold, size: range(run.rng, 1.6, 3.6) });
  }
}

// ---- geometry ----
export function polyLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return L;
}
export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distToSeg(px, py, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
  let t = ((px - a.x) * dx + (py - a.y) * dy) / L2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}
export function nearPoly(x, y, poly, dist) {
  if (pointInPoly(x, y, poly)) return true;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if (distToSeg(x, y, poly[j], poly[i]) < dist) return true;
  return false;
}

// ---- the loop: the heart of INKBOUND ----
export function closeLoop(run, rawPts, goldMode) {
  const ch = run.ch; if (!ch || run.mode !== 'play') return;
  const pts = rawPts;
  if (pts.length < 8) return;
  const L = polyLength(pts) + Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  if (L < 90) { pushBanner(run, 'TOO SMALL TO BIND'); return; }

  if (goldMode) {
    const cost = Math.ceil(L * 0.022 * goldCostMul(run));
    if (run.gold < cost) { pushBanner(run, 'NOT ENOUGH GOLD LEAF'); return; }
    run.gold -= cost;
  } else {
    const cost = L * 0.055 * loopCostMul(run);
    if (ch.ink < cost) { pushBanner(run, 'THE INK RUNS DRY'); return; }
    ch.ink -= cost;
  }
  run.totalLoops++;

  const polys = [pts];
  if (has(run, 'illuminations', 'twin-quill')) {
    const cx = FIELD.x + FIELD.w / 2;
    polys.push(pts.map(p => ({ x: 2 * cx - p.x, y: p.y })));
  }
  for (const poly of polys) ch.shimmers.push({ poly, t: 0, gold: goldMode });

  // wake sleepers the quill passed near
  for (const b of ch.beasts) if (b.type === 'sleeper' && !b.awake) {
    for (const p of pts) if (Math.hypot(p.x - b.x, p.y - b.y) < 52) { b.awake = true; const s = 74 * beastSpeedMul(run); const a = run.rng() * 6.28; b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s; floater(run, b.x, b.y - 20, 'AWAKENED!', '#a52a21'); break; }
  }

  const margin = bindMargin(run);
  const caught = ch.beasts.filter(b => polys.some(poly => nearPoly(b.x, b.y, poly, margin + b.r * 0.3)));
  let binds = 0, loopScore = 0;

  for (const b of caught) {
    if (b.type === 'splitter' && b.canSplit && caught.length === 1) {
      ch.beasts.splice(ch.beasts.indexOf(b), 1);
      spawnBeast(run, 'splitter', b.x - 16, b.y, true); spawnBeast(run, 'splitter', b.x + 16, b.y, true);
      pushBanner(run, 'IT SPLITS IN TWO!'); splash(run, b.x, b.y, false);
      continue;
    }
    if (b.type === 'armoured' && b.armour) {
      b.armour = false; splash(run, b.x, b.y, false);
      floater(run, b.x, b.y - 24, 'SHELL CRACKED!', '#8c5a10');
      pushBanner(run, 'THE SHELL CRACKS!');
      continue;
    }
    // a true bind
    ch.beasts.splice(ch.beasts.indexOf(b), 1);
    binds++;
    ch.chain++; ch.comboT = comboWindow(run);
    run.bestChain = Math.max(run.bestChain, ch.chain);
    const mult = Math.min(1 + 0.5 * (ch.chain - 1), 6) * (goldMode && has(run, 'illuminations', 'gilded') ? 2 : 1);
    let sc = Math.round(BEASTS[b.type].score * mult * scoreMul(run));
    if (b.type === 'mimic') { sc = Math.round(60 * scoreMul(run)); ch.chain = 0; ch.comboT = 0; pushBanner(run, 'IT WAS A MIMIC!', 'combo broken'); }
    loopScore += sc; run.score += sc; run.totalBound++;
    ch.bound++; ch.ink = Math.min(inkMax(run), ch.ink + BEASTS[b.type].ink);
    const g = Math.round(3 * (has(run, 'illuminations', 'greedy-gloss') ? 1.5 : 1));
    run.gold += g; run.goldEarned += g;
    floater(run, b.x, b.y - 14, '+' + sc, goldMode ? '#c99612' : '#3a2a18', binds > 1);
    splash(run, b.x, b.y, goldMode);
  }

  // bosses
  if (ch.boss && !ch.bossBound) {
    if (ch.boss.kind === 'wyrm') {
      const zones = new Set();
      for (const poly of polys) ch.boss.spine.forEach((s, i) => { if (nearPoly(s.x, s.y, poly, margin + 10)) zones.add(Math.floor(i / 5)); });
      const now = run.timePlayed;
      for (const z of zones) if (!ch.boss.hits.some(h => h.zone === z && now - h.t < 7)) {
        ch.boss.hits.push({ zone: z, t: now }); ch.boss.hitFlash = 0.5;
        floater(run, ch.boss.spine[z * 5 + 2].x, ch.boss.spine[z * 5 + 2].y - 30, 'WYRM LOOPED ' + ch.boss.hits.filter(h => now - h.t < 7).length + '/3', '#8c2f39', true);
      }
      if (new Set(ch.boss.hits.filter(h => now - h.t < 7).map(h => h.zone)).size >= 3) bindBoss(run);
    } else if (ch.boss.kind === 'leviathan') {
      const hit = polys.some(poly => nearPoly(ch.boss.x, ch.boss.y, poly, margin + ch.boss.r * 0.55));
      if (hit && goldMode) {
        ch.boss.goldHits++; splash(run, ch.boss.x, ch.boss.y, true);
        if (ch.boss.goldHits >= 2) bindBoss(run);
        else { pushBanner(run, 'THE LEVIATHAN STRAINS!', 'one more gold loop'); floater(run, ch.boss.x, ch.boss.y - 100, 'GOLD BINDS IT 1/2', '#c99612', true); }
      } else if (hit) pushBanner(run, 'ONLY GOLD INK HOLDS IT!');
    }
  }

  if (binds >= 3) pushBanner(run, (binds === 3 ? 'TRIPLE' : binds === 4 ? 'QUAD' : 'MEGA') + ' BIND!', '+' + loopScore);
  else if (binds === 2) pushBanner(run, 'DOUBLE BIND!', '+' + loopScore);
  if (binds === 0 && caught.length === 0) {
    ch.whiffs++; run.whiffedLoops++;
    if (has(run, 'marginalia', 'tiny-knight') && !ch.knightUsed) { ch.knightUsed = true; pushBanner(run, 'THE TINY KNIGHT COVERS YOU', 'whiff forgiven'); }
    else if (ch.chain > 0) { ch.chain = 0; ch.comboT = 0; }
  }
  checkChapterEnd(run);
}

function bindBoss(run) {
  const ch = run.ch;
  ch.bossBound = true;
  const def = BOSSES[ch.boss.kind];
  const sc = Math.round(def.score * scoreMul(run));
  run.score += sc; run.bossesBound.push(def.name);
  floater(run, FIELD.x + FIELD.w / 2, FIELD.y + 200, '+' + sc, '#c99612', true);
  pushBanner(run, def.name + ' IS BOUND!', '+' + sc);
  for (let i = 0; i < 40; i++) splash(run, FIELD.x + run.rng() * FIELD.w, FIELD.y + run.rng() * FIELD.h, true);
  if (ch.boss.kind === 'wyrm') awardMarginalia(run, ['wax-seal', 'tiny-knight']);
  else awardMarginalia(run, ['gold-tooth', 'scribes-thumb']);
  ch.boss = null;
  checkChapterEnd(run);
}

const FLAWLESS_POOL = ['gilt-initial', 'doodled-sun', 'pressed-flower', 'marginal-cat'];
export function awardMarginalia(run, ids) {
  for (const id of ids) if (!run.marginalia.includes(id)) {
    run.marginalia.push(id);
    const m = MARGINALIA.find(x => x.id === id);
    pushBanner(run, 'MARGINALIA: ' + m.name.toUpperCase(), m.desc);
  }
}

function checkChapterEnd(run) {
  const ch = run.ch;
  if (!ch || run.mode !== 'play') return;
  if (ch.bound >= ch.quota && (!ch.def.boss || ch.bossBound)) {
    const timeBonus = Math.round(ch.timeLeft * 15);
    run.score += 1000 + timeBonus;
    run.chaptersCleared++;
    if (ch.whiffs === 0) {
      run.perfectChapters++; run.score += 750;
      const next = FLAWLESS_POOL.find(id => !run.marginalia.includes(id));
      if (next) awardMarginalia(run, [next]);
      pushBanner(run, 'FLAWLESS CHAPTER! +750');
    }
    if (run.chapterIdx >= CHAPTERS.length - 1) { run.mode = 'victory'; return; }
    // build the draft: 3 distinct illuminations not yet owned
    const pool = ILLUMINATIONS.filter(i => !run.illuminations.includes(i.id));
    const choices = [];
    while (choices.length < 3 && pool.length) choices.push(pool.splice(Math.floor(run.rng() * pool.length), 1)[0]);
    run.draftChoices = choices;
    run.mode = 'draft';
  }
}

export function chooseIllumination(run, id) {
  if (!run.illuminations.includes(id)) run.illuminations.push(id);
  run.chapterIdx++;
  startChapter(run);
  run.mode = 'play';
}

// ---- per-frame update ----
export function update(run, dt, pointer) {
  run.timePlayed += dt;
  const ch = run.ch;
  if (!ch || run.mode !== 'play') return;

  ch.timeLeft -= dt;
  if (ch.timeLeft <= 0) {
    if (has(run, 'illuminations', 'phoenix') && !run.phoenixUsed) {
      run.phoenixUsed = true; ch.timeLeft += 18; pushBanner(run, 'THE PHOENIX VERSE REKINDLES!', '+18 seconds');
    } else { run.mode = 'defeat'; return; }
  }

  let drain = 0;
  for (const b of ch.beasts) if (b.type === 'drinker') drain += 1.5;
  ch.ink = Math.max(0, Math.min(inkMax(run), ch.ink + (inkRegen(run) - drain) * dt));

  if (ch.comboT > 0) { ch.comboT -= dt; if (ch.comboT <= 0) ch.chain = 0; }

  // spawning keeps the page alive until the spawn cap
  const target = Math.min(4 + run.chapterIdx, 8);
  ch.spawnT -= dt;
  if (ch.beasts.length < target && ch.spawned < ch.spawnCap && ch.spawnT <= 0) {
    spawnBeast(run, weightedType(run.rng, ch.def.mix)); ch.spawned++; ch.spawnT = 0.9;
  }

  const sm = beastSpeedMul(run);
  for (const b of ch.beasts) {
    b.phase += dt * 3; b.wanderT -= dt;
    if (b.wanderT <= 0) {
      b.wanderT = range(run.rng, 0.6, 2.2);
      const sp = BEASTS[b.type].speed * sm * range(run.rng, 0.75, 1.3);
      const cur = Math.atan2(b.vy, b.vx), turn = range(run.rng, -1.1, 1.1);
      b.vx = Math.cos(cur + turn) * sp; b.vy = Math.sin(cur + turn) * sp;
    }
    if (b.type === 'dasher' && pointer && pointer.x != null) {
      const d = Math.hypot(pointer.x - b.x, pointer.y - b.y);
      if (d < 125 && d > 1) { const f = (125 - d) * 3.2; b.vx += ((b.x - pointer.x) / d) * f * dt * 8; b.vy += ((b.y - pointer.y) / d) * f * dt * 8; }
    }
    if (b.type === 'sleeper' && !b.awake) { b.vx *= 0.9; b.vy *= 0.9; }
    // keep speed near the type's pace
    const spNow = Math.hypot(b.vx, b.vy), spWant = BEASTS[b.type].speed * sm * (b.type === 'sleeper' && !b.awake ? 0.06 : 1);
    if (spNow > 1) { const k = 1 + (spWant / spNow - 1) * Math.min(1, dt * 2); b.vx *= k; b.vy *= k; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < FIELD.x + b.r) { b.x = FIELD.x + b.r; b.vx = Math.abs(b.vx); }
    if (b.x > FIELD.x + FIELD.w - b.r) { b.x = FIELD.x + FIELD.w - b.r; b.vx = -Math.abs(b.vx); }
    if (b.y < FIELD.y + b.r) { b.y = FIELD.y + b.r; b.vy = Math.abs(b.vy); }
    if (b.y > FIELD.y + FIELD.h - b.r) { b.y = FIELD.y + FIELD.h - b.r; b.vy = -Math.abs(b.vy); }
  }

  if (ch.boss) {
    const boss = ch.boss;
    if (boss.kind === 'wyrm') {
      boss.angle += Math.sin(run.timePlayed * 0.35) * dt * 0.7;
      const head = boss.spine[0];
      head.x += Math.cos(boss.angle) * 46 * dt; head.y += Math.sin(boss.angle) * 46 * dt;
      if (head.x < FIELD.x + 60 || head.x > FIELD.x + FIELD.w - 60) boss.angle = Math.PI - boss.angle;
      if (head.y < FIELD.y + 60 || head.y > FIELD.y + FIELD.h - 60) boss.angle = -boss.angle;
      head.x = Math.max(FIELD.x + 40, Math.min(FIELD.x + FIELD.w - 40, head.x));
      head.y = Math.max(FIELD.y + 40, Math.min(FIELD.y + FIELD.h - 40, head.y));
      for (let i = 1; i < boss.spine.length; i++) {
        const p = boss.spine[i], q = boss.spine[i - 1];
        const d = Math.hypot(p.x - q.x, p.y - q.y) || 1, want = 23;
        p.x = q.x + ((p.x - q.x) / d) * want; p.y = q.y + ((p.y - q.y) / d) * want;
      }
      boss.hits = boss.hits.filter(h => run.timePlayed - h.t < 7);
      if (boss.hitFlash > 0) boss.hitFlash -= dt;
    } else {
      boss.phase += dt;
      boss.x += boss.vx * dt; boss.y += boss.vy * dt;
      if (boss.x < FIELD.x + 130 || boss.x > FIELD.x + FIELD.w - 130) boss.vx *= -1;
      if (boss.y < FIELD.y + 130 || boss.y > FIELD.y + FIELD.h - 130) boss.vy *= -1;
      boss.shedT -= dt;
      if (boss.shedT <= 0 && ch.beasts.length < 9) {
        boss.shedT = 7;
        const t = ['pagemite', 'dasher', 'splitter'][Math.floor(run.rng() * 3)];
        spawnBeast(run, t, boss.x + range(run.rng, -70, 70), boss.y + range(run.rng, -70, 70));
        floater(run, boss.x, boss.y - 110, 'IT SHEDS A BEAST!', '#a52a21');
      }
    }
  }

  for (const f of ch.floaters) { f.t += dt; f.y -= 34 * dt; }
  ch.floaters = ch.floaters.filter(f => f.t < f.life);
  for (const p of ch.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt; }
  ch.particles = ch.particles.filter(p => p.t < p.life);
  for (const b of ch.banners) b.t += dt;
  ch.banners = ch.banners.filter(b => b.t < b.life);
  for (const s of ch.shimmers) s.t += dt;
  ch.shimmers = ch.shimmers.filter(s => s.t < 0.85);
}

export function rankFor(score, victory) {
  if (!victory) return '—';
  if (score >= 52000) return 'S';
  if (score >= 40000) return 'A';
  if (score >= 26000) return 'B';
  return 'C';
}
