// INKBOUND rendering: procedurally textured parchment, ink-stroke beasts, the two bosses,
// the full HUD (WIN/LOSE, dual bars, threat + collection panels), title / draft / victory screens.

import { BEASTS, BOSSES, CHAPTERS, ILLUMINATIONS, MARGINALIA, DIFFICULTIES } from './data.js';
import { FIELD, inkMax, comboWindow, rankFor } from './world.js';
import { makeRng } from './rng.js';

const W = 1280, H = 720;
const PANEL = { x: 908, y: 66, w: 348, h: 596 };
const INK = '#2e2113';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function txt(ctx, s, x, y, size, color, align, bold, font) {
  ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.font = (bold ? 'bold ' : '') + size + 'px ' + (font || 'Georgia, "Times New Roman", serif');
  ctx.fillText(s, x, y);
}
function wrap(ctx, s, x, y, maxW, size, color, lh) {
  ctx.font = size + 'px Georgia, serif'; ctx.fillStyle = color; ctx.textAlign = 'left';
  const words = s.split(' '); let line = '', yy = y;
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = ''; }
    line += w + ' ';
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

// ---- procedural parchment (grain, stains, fibres, doodles, ruled lines) ----
const parchmentCache = new Map();
export function parchment(chapterIdx) {
  if (parchmentCache.has(chapterIdx)) return parchmentCache.get(chapterIdx);
  const def = CHAPTERS[chapterIdx];
  const c = document.createElement('canvas'); c.width = FIELD.w; c.height = FIELD.h;
  const g = c.getContext('2d'); const rng = makeRng(1000 + chapterIdx * 77);
  g.fillStyle = def.tint; g.fillRect(0, 0, FIELD.w, FIELD.h);
  // large soft tonal patches
  for (let i = 0; i < 26; i++) {
    const x = rng() * FIELD.w, y = rng() * FIELD.h, r = 60 + rng() * 190;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = rng() > 0.5 ? '120,86,30' : '255,246,214';
    gr.addColorStop(0, `rgba(${tone},${0.05 + rng() * 0.07})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // tea / ink stains
  for (let i = 0; i < 4; i++) {
    const x = rng() * FIELD.w, y = rng() * FIELD.h, r = 22 + rng() * 54;
    g.strokeStyle = `rgba(122,84,32,${0.12 + rng() * 0.12})`; g.lineWidth = 2 + rng() * 3;
    g.beginPath(); g.arc(x, y, r, rng() * 3, rng() * 3 + 3.6); g.stroke();
    g.fillStyle = 'rgba(122,84,32,0.05)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  // grain speckle + fibres
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = rng() > 0.5 ? 'rgba(90,64,28,0.06)' : 'rgba(255,252,238,0.07)';
    g.fillRect(rng() * FIELD.w, rng() * FIELD.h, 1.4, 1.4);
  }
  g.strokeStyle = 'rgba(96,70,34,0.05)';
  for (let i = 0; i < 260; i++) {
    const x = rng() * FIELD.w, y = rng() * FIELD.h, a = rng() * 6.28, l = 4 + rng() * 12;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // faint ruled lines of the manuscript
  g.strokeStyle = 'rgba(70,50,90,0.10)'; g.lineWidth = 1;
  for (let y = 64; y < FIELD.h - 30; y += 34) { g.beginPath(); g.moveTo(46, y); g.lineTo(FIELD.w - 46, y); g.stroke(); }
  g.strokeStyle = 'rgba(165,42,33,0.16)';
  g.beginPath(); g.moveTo(46, 30); g.lineTo(46, FIELD.h - 30); g.stroke();
  // marginalia doodles in the corners (flowers, stars, a tiny knight, a cat)
  g.strokeStyle = 'rgba(46,33,19,0.4)'; g.lineWidth = 1.6;
  doodleFlower(g, 24, 26, rng); doodleFlower(g, FIELD.w - 30, FIELD.h - 30, rng);
  doodleStar(g, FIELD.w - 34, 30, rng); doodleStar(g, 26, FIELD.h - 34, rng);
  doodleCat(g, FIELD.w - 60, FIELD.h - 44, rng); doodleKnight(g, 58, FIELD.h - 46, rng);
  // illuminated border
  g.strokeStyle = def.accent; g.lineWidth = 3; g.strokeRect(7, 7, FIELD.w - 14, FIELD.h - 14);
  g.strokeStyle = 'rgba(201,150,18,0.55)'; g.lineWidth = 1.2; g.strokeRect(13, 13, FIELD.w - 26, FIELD.h - 26);
  parchmentCache.set(chapterIdx, c);
  return c;
}
function doodleFlower(g, x, y, rng) {
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; g.beginPath(); g.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 4.4, 0, 7); g.stroke(); }
  g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(x, y + 8); g.quadraticCurveTo(x + 3, y + 16, x + 1, y + 22); g.stroke();
}
function doodleStar(g, x, y) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28, r = i % 2 ? 3.4 : 8.4; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.closePath(); g.stroke();
}
function doodleCat(g, x, y) {
  g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(x - 7, y - 6); g.lineTo(x - 4, y - 14); g.lineTo(x - 1, y - 7); g.moveTo(x + 7, y - 6); g.lineTo(x + 4, y - 14); g.lineTo(x + 1, y - 7); g.stroke();
  g.beginPath(); g.moveTo(x + 9, y + 3); g.quadraticCurveTo(x + 18, y, x + 17, y - 8); g.stroke();
}
function doodleKnight(g, x, y) {
  g.strokeRect(x - 5, y - 12, 10, 15);
  g.beginPath(); g.moveTo(x + 5, y - 10); g.lineTo(x + 13, y - 18); g.moveTo(x + 11, y - 14); g.lineTo(x + 15, y - 12); g.stroke();
  g.beginPath(); g.moveTo(x - 5, y - 16); g.lineTo(x + 5, y - 16); g.stroke();
}

// ---- beasts, drawn as ink illustrations ----
function sketchCircle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 1.6, y + 1.2, r, 0.4, 5.6); ctx.strokeStyle = 'rgba(46,33,19,0.35)'; ctx.lineWidth = 1; ctx.stroke();
}
function eyes(ctx, x, y, dx, dy, r) {
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(x - dx, y + dy, r, 0, 7); ctx.arc(x + dx, y + dy, r, 0, 7); ctx.fill();
}
export function drawBeast(ctx, b, t) {
  const bob = Math.sin(b.phase) * 1.6;
  const x = b.x, y = b.y + bob, r = b.r;
  ctx.save(); ctx.translate(x, y);
  if (b.type === 'mimic' && !b.revealed) {
    // poses as a harmless doodle bloom
    ctx.strokeStyle = '#5d7031'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(3, 14, 1, 20); ctx.stroke();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; ctx.beginPath(); ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7 - 2, 5.4, 0, 7); ctx.fillStyle = '#d9a441'; ctx.fill(); ctx.strokeStyle = '#8c5a10'; ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, -2, 3.4, 0, 7); ctx.fillStyle = '#f3d98b'; ctx.fill();
    ctx.restore(); return;
  }
  switch (b.type) {
    case 'pagemite':
      sketchCircle(ctx, 0, 0, r, '#cbb27f', INK); eyes(ctx, 0, -2, 6, 0, 2.1);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 8, r - 3); ctx.lineTo(i * 8 - 3, r + 5); ctx.moveTo(i * 8, -r + 3); ctx.lineTo(i * 8 - 3, -r - 4); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 4, 5, 0.2, 2.9); ctx.stroke(); break;
    case 'dasher': {
      ctx.beginPath(); ctx.ellipse(0, 0, r + 5, r - 4, Math.atan2(b.vy, b.vx) * 0.2, 0, 7); ctx.fillStyle = '#a8bfce'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      eyes(ctx, 4, -2, 5, 0, 2);
      ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-r - 4, 0); ctx.lineTo(-r - 13, -6); ctx.moveTo(-r - 4, 3); ctx.lineTo(-r - 12, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -r + 2); ctx.lineTo(6, -r - 6); ctx.lineTo(10, -r + 1); ctx.stroke(); break;
    }
    case 'splitter':
      for (let i = 0; i < 4; i++) sketchCircle(ctx, -r + 6 + i * (r * 0.62), Math.sin(b.phase + i) * 2.4, r * 0.52, '#9db873', INK);
      eyes(ctx, r - 2, -3, 4, 0, 1.9); break;
    case 'armoured':
      sketchCircle(ctx, 0, 0, r, b.armour ? '#8a6f4d' : '#c9a86a', INK);
      ctx.fillStyle = b.armour ? '#77603f' : '#b98d54';
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(46,33,19,0.55)'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.66, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.66, 0); ctx.lineTo(r * 0.66, 0); ctx.moveTo(0, -r * 0.66); ctx.lineTo(0, r * 0.66); ctx.stroke();
      if (!b.armour) { ctx.strokeStyle = '#a52a21'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -r + 3); ctx.lineTo(0, -2); ctx.lineTo(6, -r + 4); ctx.stroke(); }
      eyes(ctx, 0, r * 0.42, 6, 0, 2); break;
    case 'drinker':
      for (let i = 0; i < 4; i++) sketchCircle(ctx, -r + 5 + i * (r * 0.6), Math.cos(b.phase + i * 1.3) * 2, r * 0.5, '#5d4a72', INK);
      ctx.fillStyle = '#241a33'; ctx.beginPath(); ctx.arc(r - 1, -2, 2.2, 0, 7); ctx.fill();
      ctx.strokeStyle = '#241a33'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(r + 2, 2); ctx.quadraticCurveTo(r + 9, 8, r + 4, 13); ctx.stroke(); break;
    case 'sleeper':
      sketchCircle(ctx, 0, 0, r, '#c9a0a8', INK);
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.moveTo(-r + 3, -r + 4); ctx.lineTo(-r + 9, -r - 5); ctx.lineTo(-r + 13, -r + 5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r - 3, -r + 4); ctx.lineTo(r - 9, -r - 5); ctx.lineTo(r - 13, -r + 5); ctx.closePath(); ctx.fill();
      if (!b.awake) { eyes(ctx, 0, 0, 6, 0, 0.9); txt(ctx, 'z z', r - 2, -r - 6 + bob * 0, 12, 'rgba(46,33,19,0.65)', 'left', true); }
      else { eyes(ctx, 0, -1, 6, 0, 2.3); ctx.strokeStyle = '#a52a21'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-2, -5); ctx.moveTo(8, -8); ctx.lineTo(2, -5); ctx.stroke(); }
      break;
    case 'mimic':
      sketchCircle(ctx, 0, 0, r, '#7a4a63', INK); eyes(ctx, 0, -3, 6, 0, 2.4);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 2, 8, 0.3, 2.8); ctx.stroke();
      ctx.fillStyle = INK; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 4 - 1.4, 8); ctx.lineTo(i * 4 + 1.4, 8); ctx.lineTo(i * 4, 12); ctx.closePath(); ctx.fill(); }
      break;
    default: sketchCircle(ctx, 0, 0, r, '#cbb27f', INK);
  }
  ctx.restore();
}

function drawWyrm(ctx, boss, t) {
  const hitZones = new Set(boss.hits.map(h => h.zone));
  for (let i = boss.spine.length - 1; i >= 0; i--) {
    const s = boss.spine[i], zone = Math.floor(i / 5);
    const r = 24 - i * 0.75;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 7);
    ctx.fillStyle = i === 0 ? '#7d2a33' : (hitZones.has(zone) ? '#c99612' : '#96606a'); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(240,226,188,0.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.6, 0.6, 2.6); ctx.stroke();
  }
  const hd = boss.spine[0];
  eyes(ctx, hd.x, hd.y, 7, -2, 2.6);
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hd.x - 8, hd.y - 20); ctx.quadraticCurveTo(hd.x - 16, hd.y - 34, hd.x - 6, hd.y - 38);
  ctx.moveTo(hd.x + 8, hd.y - 20); ctx.quadraticCurveTo(hd.x + 16, hd.y - 34, hd.x + 6, hd.y - 38); ctx.stroke();
  txt(ctx, 'THE MARGOT WYRM \u00b7 loop 3 zones, quick!', hd.x, hd.y - 48, 13, '#8c2f39', 'center', true);
}

function drawLeviathan(ctx, boss, t) {
  ctx.save(); ctx.translate(boss.x, boss.y);
  const pulse = Math.sin(boss.phase * 2) * 3;
  // fins
  ctx.fillStyle = '#8c6d1f'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(s * 52, -18); ctx.quadraticCurveTo(s * 118, -52 - pulse, s * 104, 8); ctx.quadraticCurveTo(s * 76, 18, s * 52, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 40, 44); ctx.quadraticCurveTo(s * 92, 74 + pulse, s * 58, 86); ctx.quadraticCurveTo(s * 40, 66, s * 30, 52); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // body
  ctx.beginPath(); ctx.ellipse(0, 0, 92, 74 + pulse * 0.4, 0, 0, 7);
  const gr = ctx.createRadialGradient(-24, -26, 8, 0, 0, 110);
  gr.addColorStop(0, '#f6e3a1'); gr.addColorStop(0.6, '#dcb84e'); gr.addColorStop(1, '#a87c1e');
  ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  // gold illumination patterns
  ctx.strokeStyle = 'rgba(122,84,16,0.8)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 6, 62 - i * 16, 46 - i * 11, 0, 0.4, 5.9); ctx.stroke(); }
  ctx.fillStyle = '#8c2f39';
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + boss.phase * 0.2; ctx.beginPath(); ctx.arc(Math.cos(a) * 74, Math.sin(a) * 56, 3, 0, 7); ctx.fill(); }
  // horns + crown
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 44, -58); ctx.quadraticCurveTo(s * 66, -92, s * 48, -104); ctx.stroke(); }
  ctx.fillStyle = '#c99612'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-22, -66); ctx.lineTo(-14, -84); ctx.lineTo(-5, -68); ctx.lineTo(3, -86); ctx.lineTo(11, -68); ctx.lineTo(19, -84); ctx.lineTo(24, -64); ctx.closePath(); ctx.fill(); ctx.stroke();
  // face
  eyes(ctx, 0, -18, 20, 0, 5);
  ctx.fillStyle = '#fff8e2'; ctx.beginPath(); ctx.arc(-20, -18, 2, 0, 7); ctx.arc(20, -18, 2, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 16, 30, 0.35, 2.79); ctx.stroke();
  ctx.fillStyle = INK;
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 11 - 3, 34); ctx.lineTo(i * 11 + 3, 34); ctx.lineTo(i * 11, 42); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  txt(ctx, 'THE ILLUMINATED LEVIATHAN \u00b7 GOLD binds: ' + boss.goldHits + '/2', boss.x, boss.y - 122, 14, '#8c5a10', 'center', true);
}

// ---- HUD ----
function bar(ctx, x, y, w, h, frac, fill, label, value) {
  rr(ctx, x, y, w, h, 4); ctx.fillStyle = 'rgba(46,33,19,0.25)'; ctx.fill();
  rr(ctx, x, y, Math.max(6, w * Math.max(0, Math.min(1, frac))), h, 4); ctx.fillStyle = fill; ctx.fill();
  rr(ctx, x, y, w, h, 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  txt(ctx, label, x + 2, y - 4, 11.5, '#e8d9ae', 'left', true);
  txt(ctx, value, x + w, y - 4, 11.5, '#e8d9ae', 'right', true);
}

export function drawPlay(ctx, run, view) {
  const ch = run.ch, def = ch.def;
  ctx.fillStyle = '#1d1206'; ctx.fillRect(0, 0, W, H);
  // top strip: chapter + explicit WIN / LOSE
  txt(ctx, 'CHAPTER ' + def.name, 24, 26, 17, '#e8d9ae', 'left', true);
  const bossBit = def.boss ? (ch.bossBound ? ' \u00b7 boss BOUND \u2713' : ' \u00b7 boss still free!') : '';
  txt(ctx, 'WIN: Bind ' + ch.bound + '/' + ch.quota + ' beasts' + bossBit + ' before the candle dies', 24, 50, 14.5, '#9fd48a', 'left', true);
  txt(ctx, 'LOSE: The candle burns out with the quota unmet', 560, 50, 14.5, '#e08a7a', 'left', true);
  txt(ctx, 'SCORE ' + run.score.toLocaleString('en-US'), 1256, 30, 19, '#f3d98b', 'right', true);
  txt(ctx, '\u2766 ' + run.gold + ' gold leaf', 1256, 52, 13.5, '#e8d9ae', 'right', true);

  // the page
  ctx.drawImage(parchment(run.chapterIdx), FIELD.x, FIELD.y);
  ctx.save();
  ctx.beginPath(); ctx.rect(FIELD.x, FIELD.y, FIELD.w, FIELD.h); ctx.clip();

  for (const s of ch.shimmers) {
    ctx.beginPath(); s.poly.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
    const a = 0.34 * (1 - s.t / 0.85);
    ctx.fillStyle = s.gold ? `rgba(230,190,60,${a})` : `rgba(70,50,110,${a})`; ctx.fill();
    ctx.strokeStyle = s.gold ? `rgba(201,150,18,${a + 0.25})` : `rgba(46,33,19,${a + 0.25})`; ctx.lineWidth = 2.5; ctx.stroke();
  }
  if (ch.boss) { if (ch.boss.kind === 'wyrm') drawWyrm(ctx, ch.boss, view.t); else drawLeviathan(ctx, ch.boss, view.t); }
  for (const b of ch.beasts) drawBeast(ctx, b, view.t);
  for (const p of ch.particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.gold ? '#e6be3c' : '#33270f';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // the stroke being drawn
  if (view.stroke && view.stroke.length > 1) {
    ctx.beginPath(); view.stroke.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.strokeStyle = view.goldMode ? '#c99612' : def.inkTone; ctx.lineWidth = 3.4; ctx.lineJoin = 'round'; ctx.stroke();
    const first = view.stroke[0], last = view.stroke[view.stroke.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 58) {
      ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(first.x, first.y);
      ctx.strokeStyle = 'rgba(165,42,33,0.8)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
    }
    if (run.illuminations.includes('twin-quill')) {
      const cx = FIELD.x + FIELD.w / 2;
      ctx.beginPath(); view.stroke.forEach((p, i) => i ? ctx.lineTo(2 * cx - p.x, p.y) : ctx.moveTo(2 * cx - p.x, p.y));
      ctx.strokeStyle = 'rgba(70,50,110,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  if (view.pointer && view.pointer.x != null) {
    ctx.strokeStyle = view.goldMode ? '#c99612' : INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(view.pointer.x - 8, view.pointer.y + 8); ctx.lineTo(view.pointer.x + 7, view.pointer.y - 9); ctx.stroke();
    ctx.fillStyle = view.goldMode ? '#e6be3c' : INK; ctx.beginPath(); ctx.arc(view.pointer.x + 7, view.pointer.y - 9, 2.6, 0, 7); ctx.fill();
  }
  // floaters
  for (const f of ch.floaters) {
    ctx.globalAlpha = 1 - (f.t / f.life) * 0.85;
    txt(ctx, f.text, f.x, f.y, f.big ? 21 : 15.5, f.color, 'center', true);
  }
  ctx.globalAlpha = 1;
  // banners
  ch.banners.forEach((b, i) => {
    const a = b.t < 0.18 ? b.t / 0.18 : (b.t > b.life - 0.4 ? Math.max(0, (b.life - b.t) / 0.4) : 1);
    ctx.globalAlpha = a;
    const bw = Math.max(300, b.text.length * 13.5), bx = FIELD.x + FIELD.w / 2 - bw / 2, by = FIELD.y + 26 + i * 56;
    rr(ctx, bx, by, bw, b.sub ? 50 : 38, 8); ctx.fillStyle = 'rgba(38,26,12,0.88)'; ctx.fill();
    ctx.strokeStyle = '#c99612'; ctx.lineWidth = 1.6; ctx.stroke();
    txt(ctx, b.text, FIELD.x + FIELD.w / 2, by + 26, 19, '#f3d98b', 'center', true);
    if (b.sub) txt(ctx, b.sub, FIELD.x + FIELD.w / 2, by + 43, 12, '#e8d9ae', 'center');
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  drawPanel(ctx, run, view);
  // bottom strip: controls + chapter pips
  txt(ctx, 'Drag to draw a loop \u00b7 release closed to BIND \u00b7 hold G or tap the gold seal for GOLD ink \u00b7 loops cost ink by length', 24, 692, 13.5, '#cbb27f', 'left');
  for (let i = 0; i < CHAPTERS.length; i++) {
    ctx.beginPath(); ctx.arc(792 + i * 15, 686, 5.4, 0, 7);
    ctx.fillStyle = i < run.chapterIdx ? '#c99612' : (i === run.chapterIdx ? '#f3d98b' : 'rgba(232,217,174,0.3)'); ctx.fill();
  }
  txt(ctx, view.goldMode ? 'GOLD INK: ON \u2014 loops spend gold leaf' : 'gold ink: off (hold G for gold loops)', 1256, 692, 12.5, view.goldMode ? '#e6be3c' : 'rgba(232,217,174,0.55)', 'right');
}

function drawPanel(ctx, run, view) {
  const ch = run.ch;
  rr(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 10);
  ctx.fillStyle = '#2b1d0d'; ctx.fill(); ctx.strokeStyle = '#c99612'; ctx.lineWidth = 1.6; ctx.stroke();
  let y = PANEL.y + 26;
  const px = PANEL.x + 16, pw = PANEL.w - 32;
  bar(ctx, px, y + 8, pw, 15, ch.timeLeft / ch.timeMax, ch.timeLeft < 15 ? '#c33d2a' : '#e08a3c', '\u{1F56F} CANDLE', Math.ceil(ch.timeLeft) + 's');
  y += 52;
  bar(ctx, px, y + 8, pw, 15, ch.ink / inkMax(run), '#4a5f9e', '\u{1F58B} INK', Math.floor(ch.ink) + '/' + inkMax(run));
  y += 52;
  const mult = ch.chain > 0 ? Math.min(1 + 0.5 * (ch.chain - 1), 6) : 1;
  txt(ctx, 'COMBO \u00d7' + mult.toFixed(1).replace('.0', ''), px, y + 14, 17, ch.chain >= 3 ? '#e6be3c' : '#e8d9ae', 'left', true);
  txt(ctx, 'chain ' + ch.chain + (ch.comboT > 0 ? ' \u00b7 ' + ch.comboT.toFixed(1) + 's' : ''), px + pw, y + 14, 12.5, '#cbb27f', 'right');
  y += 30;
  ctx.strokeStyle = 'rgba(201,150,18,0.4)'; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke(); y += 20;
  txt(ctx, 'THREAT \u2014 beasts on this page', px, y, 13.5, '#e08a7a', 'left', true); y += 17;
  const counts = {};
  for (const b of ch.beasts) counts[b.type === 'mimic' && !b.revealed ? 'bloom' : b.type] = (counts[b.type === 'mimic' && !b.revealed ? 'bloom' : b.type] || 0) + 1;
  const rows = Object.keys(counts);
  if (ch.boss) { txt(ctx, '\u2620 ' + ch.boss.name, px, y, 12.5, '#e6be3c', 'left', true); y += 16; }
  if (!rows.length && !ch.boss) { txt(ctx, 'the page is quiet\u2026', px, y, 12.5, '#cbb27f'); y += 16; }
  for (const k of rows) {
    const name = k === 'bloom' ? 'Doodle Bloom (?)' : BEASTS[k].name;
    txt(ctx, '\u00b7 ' + name, px, y, 12.5, '#e8d9ae'); txt(ctx, '\u00d7' + counts[k], px + pw, y, 12.5, '#f3d98b', 'right', true); y += 16;
  }
  y += 8;
  ctx.strokeStyle = 'rgba(201,150,18,0.4)'; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + pw, y); ctx.stroke(); y += 20;
  // collection + illuminations side by side so a full build still fits the panel
  txt(ctx, 'COLLECTION (' + run.marginalia.length + '/8)', px, y, 13, '#9fd48a', 'left', true);
  txt(ctx, 'ILLUMINATIONS (' + run.illuminations.length + ')', px + 168, y, 13, '#a8bfce', 'left', true);
  y += 16;
  const colRows = Math.max(run.marginalia.length, run.illuminations.length, 1);
  if (!run.marginalia.length) txt(ctx, 'none yet \u2014 flawless', px, y, 11.5, '#cbb27f');
  if (!run.illuminations.length) txt(ctx, 'draft after chapter', px + 168, y, 11.5, '#cbb27f');
  run.marginalia.forEach((id, i) => { const m = MARGINALIA.find(v => v.id === id); txt(ctx, '\u2766 ' + m.name, px, y + i * 15, 11.5, '#e8d9ae'); });
  run.illuminations.forEach((id, i) => { const il = ILLUMINATIONS.find(v => v.id === id); txt(ctx, '\u2726 ' + il.name, px + 168, y + i * 15, 11.5, '#e8d9ae'); });
  y += colRows * 15;
  // gold seal button
  const gy = PANEL.y + PANEL.h - 44;
  rr(ctx, px, gy, pw, 32, 16);
  ctx.fillStyle = view.goldMode ? '#c99612' : 'rgba(201,150,18,0.16)'; ctx.fill();
  ctx.strokeStyle = '#c99612'; ctx.lineWidth = 1.4; ctx.stroke();
  txt(ctx, 'GOLD INK SEAL (G) \u2014 binds the Leviathan', PANEL.x + PANEL.w / 2, gy + 21, 12.5, view.goldMode ? '#2b1d0d' : '#e6be3c', 'center', true);
}

// ---- title screen ----
export function titleButtons() {
  return DIFFICULTIES.map((d, i) => ({ x: 190 + i * 310, y: 566, w: 280, h: 62, diffIdx: i }));
}
export function drawTitle(ctx, run, view) {
  ctx.fillStyle = '#1d1206'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(parchment(0), 60, 36); // reuse folio texture as backdrop page
  rr(ctx, 60, 36, FIELD.w, FIELD.h, 6); ctx.strokeStyle = '#c99612'; ctx.lineWidth = 2.4; ctx.stroke();
  // side strip with a mini bestiary-count seal
  rr(ctx, 972, 36, 248, 648, 8); ctx.fillStyle = '#2b1d0d'; ctx.fill(); ctx.strokeStyle = '#c99612'; ctx.stroke();
  txt(ctx, 'INKBOUND', 96, 118, 64, INK, 'left', true, 'Georgia');
  txt(ctx, 'draw ink loops to bind the beasts of the manuscript', 98, 150, 20, '#7a4a10', 'left', false, 'Georgia');
  txt(ctx, 'Eight chapters of a haunted bestiary are loose in the margins. Your quill is the only cage:', 98, 182, 15.5, INK);
  txt(ctx, 'close a loop around a beast and the ink itself becomes the binding.', 98, 202, 15.5, INK);

  // how to play
  rr(ctx, 92, 224, 500, 206, 8); ctx.fillStyle = 'rgba(255,250,232,0.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(122,84,16,0.6)'; ctx.stroke();
  txt(ctx, 'HOW TO PLAY', 112, 252, 16, '#8c5a10', 'left', true);
  const how = [
    '\u2022 Drag with mouse or finger to draw a loop; release with',
    '   the ends close together to snap it shut.',
    '\u2022 A beast FULLY inside the loop is BOUND. Partial',
    '   enclosures bind nothing. Loops cost ink by length.',
    '\u2022 Chain binds quickly to raise the COMBO multiplier.',
    '\u2022 WIN a chapter: meet the bind quota before the candle',
    '   dies. LOSE: the candle burns out first.',
    '\u2022 GOLD ink (hold G) is the only ink that holds bosses',
    '   of the deep margin \u2014 and it spends gold leaf.',
  ];
  how.forEach((s, i) => txt(ctx, s, 112, 278 + i * 17.5, 13.5, INK));
  // bestiary (short lines so the whole panel fits the page)
  const SHORT = {
    pagemite: 'Wanders the margin, nibbling letters.', dasher: 'Flees your quill \u2014 corner it first.',
    splitter: 'Looped alone, it divides in two.', armoured: 'Crack the shell, then bind it.',
    drinker: 'Drains your ink while it roams free.', sleeper: 'Easy until a careless loop wakes it.',
    mimic: 'Poses as a doodle bloom; breaks combo.',
  };
  rr(ctx, 612, 224, 316, 322, 8); ctx.fillStyle = 'rgba(255,250,232,0.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(122,84,16,0.6)'; ctx.stroke();
  txt(ctx, 'THE BESTIARY', 630, 252, 16, '#8c5a10', 'left', true);
  let y = 280;
  for (const k of Object.keys(BEASTS)) {
    txt(ctx, BEASTS[k].name, 630, y, 13.5, INK, 'left', true);
    txt(ctx, SHORT[k], 630, y + 14, 11.5, '#5a4020');
    y += 30;
  }
  y += 2;
  txt(ctx, BOSSES.wyrm.name, 630, y, 13, '#8c2f39', 'left', true);
  txt(ctx, 'Three quick loops along its body bind it.', 630, y + 14, 11.5, '#5a4020'); y += 32;
  txt(ctx, BOSSES.leviathan.name, 630, y, 13, '#8c5a10', 'left', true);
  txt(ctx, 'Sheds beasts. Only GOLD ink holds it.', 630, y + 14, 11.5, '#5a4020');
  // systems strip
  rr(ctx, 92, 436, 500, 110, 8); ctx.fillStyle = 'rgba(43,29,13,0.9)'; ctx.fill(); ctx.strokeStyle = '#c99612'; ctx.stroke();
  txt(ctx, 'THE SCRIPTORIUM\u2019S SYSTEMS', 112, 464, 15, '#f3d98b', 'left', true);
  const sys = [
    'ILLUMINATION DRAFT \u2014 after each chapter, choose 1 of 3',
    'perks from a pool of 11 (Gilded Quill, Twin Quill, Phoenix\u2026).',
    'MARGINALIA \u2014 8 collectible margin-doodles with real effects,',
    'won from flawless chapters and bound bosses.',
  ];
  sys.forEach((s, i) => txt(ctx, s, 112, 490 + i * 17, 13, '#e8d9ae'));
  // difficulty cards
  titleButtons().forEach((b, i) => {
    const d = DIFFICULTIES[i];
    rr(ctx, b.x - 130, b.y, b.w, b.h, 10);
    ctx.fillStyle = i === 1 ? '#c99612' : '#2b1d0d'; ctx.fill(); ctx.strokeStyle = '#c99612'; ctx.lineWidth = 1.8; ctx.stroke();
    txt(ctx, d.name, b.x + 10, b.y + 26, 16.5, i === 1 ? '#2b1d0d' : '#f3d98b', 'center', true);
    txt(ctx, d.desc, b.x + 10, b.y + 47, 11.5, i === 1 ? '#4a3208' : '#cbb27f', 'center');
  });
  txt(ctx, 'click a difficulty to take up the quill', 490, 656, 13, '#cbb27f', 'center');
  // right strip: counts / spec
  let sy = 74;
  txt(ctx, 'THE SPECIMEN', 996, sy, 15, '#f3d98b', 'left', true); sy += 26;
  const spec = [
    ['Chapters', '8'], ['Beast kinds', '7'], ['Bosses', '2'], ['Illuminations', '11'],
    ['Marginalia', '8'], ['Difficulties', '3'], ['Ink systems', 'ink + gold'], ['Combos', 'to \u00d76'],
  ];
  for (const [k, v] of spec) { txt(ctx, k, 996, sy, 13.5, '#cbb27f'); txt(ctx, v, 1196, sy, 13.5, '#f3d98b', 'right', true); sy += 21; }
  sy += 10;
  txt(ctx, 'A FULL RUN', 996, sy, 15, '#f3d98b', 'left', true); sy += 24;
  const runLines = ['Bind the quota of every', 'chapter, draft 7 illuminations,', 'collect the marginalia, crack', 'the Aegis shells, split no', 'Splitworm alone \u2014 and on the', 'final page, spend your gold', 'leaf to bind the Leviathan', 'with gold ink alone.', '', 'Scores run to five figures:', 'combo chains, flawless-chapter', 'bonuses and two boss bounties', 'of 4,000 and 12,000.'];
  for (const s of runLines) { txt(ctx, s, 996, sy, 12.5, '#e8d9ae'); sy += 17; }
  txt(ctx, '8 chapters \u00b7 7 beasts \u00b7 11 illuminations \u00b7 8 marginalia \u00b7 2 bosses', 640, 706, 13.5, '#e8d9ae', 'center', true);
}

// ---- draft screen ----
export function draftCards(run) {
  return run.draftChoices.map((c, i) => ({ x: 150 + i * 340, y: 218, w: 300, h: 190, id: c.id }));
}
export function drawDraft(ctx, run, view) {
  ctx.fillStyle = '#17100a'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(parchment(run.chapterIdx), 196, 60);
  rr(ctx, 196, 60, FIELD.w, FIELD.h, 6); ctx.fillStyle = 'rgba(30,20,8,0.55)'; ctx.fill();
  txt(ctx, 'CHAPTER ' + CHAPTERS[run.chapterIdx].name + ' \u2014 BOUND AND SEALED', 640, 128, 19, '#f3d98b', 'center', true);
  txt(ctx, 'Choose ONE illumination for your quill', 640, 168, 27, '#fff6da', 'center', true);
  txt(ctx, 'Score so far: ' + run.score.toLocaleString('en-US') + ' \u00b7 gold leaf: ' + run.gold + ' \u00b7 next: Chapter ' + CHAPTERS[run.chapterIdx + 1].name, 640, 198, 14.5, '#e8d9ae', 'center');
  draftCards(run).forEach((card, i) => {
    const c = run.draftChoices[i];
    rr(ctx, card.x, card.y, card.w, card.h, 12);
    ctx.fillStyle = '#f6ecd2'; ctx.fill(); ctx.strokeStyle = '#c99612'; ctx.lineWidth = 2.4; ctx.stroke();
    txt(ctx, '\u2726', card.x + card.w / 2, card.y + 52, 34, '#c99612', 'center');
    txt(ctx, c.name, card.x + card.w / 2, card.y + 92, 21, INK, 'center', true);
    wrap(ctx, c.desc, card.x + 26, card.y + 122, card.w - 52, 14, '#5a4020', 19);
    txt(ctx, 'click to illuminate', card.x + card.w / 2, card.y + card.h - 16, 12, '#8c5a10', 'center');
  });
  // current build recap
  const y = 448;
  rr(ctx, 150, y, 980, 168, 10); ctx.fillStyle = 'rgba(43,29,13,0.92)'; ctx.fill(); ctx.strokeStyle = '#c99612'; ctx.stroke();
  txt(ctx, 'YOUR ILLUMINATIONS (' + run.illuminations.length + ')', 176, y + 32, 15, '#a8bfce', 'left', true);
  run.illuminations.forEach((id, i) => { const il = ILLUMINATIONS.find(v => v.id === id); txt(ctx, '\u2726 ' + il.name + ' \u2014 ' + il.desc, 176, y + 58 + i * 17, 13, '#e8d9ae'); });
  if (!run.illuminations.length) txt(ctx, 'none yet \u2014 this is your first draft', 176, y + 58, 13, '#cbb27f');
  txt(ctx, 'YOUR MARGINALIA (' + run.marginalia.length + '/8)', 660, y + 32, 15, '#9fd48a', 'left', true);
  run.marginalia.forEach((id, i) => { const m = MARGINALIA.find(v => v.id === id); txt(ctx, '\u2766 ' + m.name + ' \u2014 ' + m.desc, 660, y + 58 + i * 17, 13, '#e8d9ae'); });
  if (!run.marginalia.length) txt(ctx, 'none yet', 660, y + 58, 13, '#cbb27f');
  txt(ctx, 'bosses bound: ' + (run.bossesBound.length ? run.bossesBound.join(' \u00b7 ') : 'none yet') + ' \u00b7 flawless chapters: ' + run.perfectChapters, 640, y + 148, 13, '#f3d98b', 'center');
}

// ---- end screens ----
function statsGrid(ctx, run, x, y) {
  const mins = Math.floor(run.timePlayed / 60), secs = Math.floor(run.timePlayed % 60);
  const stats = [
    ['Final score', run.score.toLocaleString('en-US')],
    ['Chapters sealed', run.chaptersCleared + ' / 8'],
    ['Beasts bound', String(run.totalBound)],
    ['Loops drawn', String(run.totalLoops)],
    ['Loops whiffed', String(run.whiffedLoops)],
    ['Best combo chain', '\u00d7' + run.bestChain],
    ['Flawless chapters', String(run.perfectChapters)],
    ['Gold leaf earned', String(run.goldEarned)],
    ['Bosses bound', String(run.bossesBound.length) + ' / 2'],
    ['Time at the desk', mins + 'm ' + String(secs).padStart(2, '0') + 's'],
  ];
  stats.forEach(([k, v], i) => {
    const cx = x + (i % 2) * 300, cy = y + Math.floor(i / 2) * 27;
    txt(ctx, k, cx, cy, 14.5, '#5a4020'); txt(ctx, v, cx + 268, cy, 15.5, INK, 'right', true);
  });
  return stats.length;
}
export function drawVictory(ctx, run, view) {
  ctx.fillStyle = '#1d1206'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(parchment(7), 196, 36);
  rr(ctx, 196, 36, FIELD.w, FIELD.h, 6); ctx.strokeStyle = '#c99612'; ctx.lineWidth = 2.6; ctx.stroke();
  txt(ctx, 'THE MANUSCRIPT IS BOUND', 640, 108, 34, INK, 'center', true);
  txt(ctx, 'The Illuminated Leviathan sleeps between the pages. The scriptorium is quiet.', 640, 138, 15.5, '#7a4a10', 'center');
  // rank seal
  ctx.beginPath(); ctx.arc(330, 226, 62, 0, 7); ctx.fillStyle = '#c99612'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(330, 226, 52, 0, 7); ctx.strokeStyle = 'rgba(46,33,19,0.5)'; ctx.lineWidth = 1.6; ctx.stroke();
  txt(ctx, rankFor(run.score, true), 330, 248, 58, '#2b1d0d', 'center', true);
  txt(ctx, 'RANK', 330, 306, 13, '#7a4a10', 'center', true);
  txt(ctx, run.score.toLocaleString('en-US'), 700, 216, 54, INK, 'center', true);
  txt(ctx, 'FINAL SCORE \u00b7 difficulty: ' + run.diff.name, 700, 248, 14.5, '#7a4a10', 'center');
  txt(ctx, 'bosses bound: ' + run.bossesBound.join(' \u00b7 '), 700, 276, 13.5, '#8c2f39', 'center', true);
  statsGrid(ctx, run, 300, 350);
  const y = 502;
  txt(ctx, 'ILLUMINATIONS CARRIED (' + run.illuminations.length + ')', 268, y, 14, '#35507a', 'left', true);
  run.illuminations.forEach((id, i) => { const il = ILLUMINATIONS.find(v => v.id === id); txt(ctx, '\u2726 ' + il.name, 268, y + 20 + i * 14.5, 12.5, INK); });
  txt(ctx, 'MARGINALIA COLLECTED (' + run.marginalia.length + '/8)', 700, y, 14, '#2e6b4f', 'left', true);
  run.marginalia.forEach((id, i) => { const m = MARGINALIA.find(v => v.id === id); txt(ctx, '\u2766 ' + m.name, 700, y + 20 + i * 14.5, 12.5, INK); });
  txt(ctx, 'click anywhere to take up the quill again', 640, 690, 14, 'rgba(232,217,174,0.8)', 'center');
}
export function drawDefeat(ctx, run, view) {
  ctx.fillStyle = '#140d06'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(parchment(run.chapterIdx), 196, 60);
  rr(ctx, 196, 60, FIELD.w, FIELD.h, 6); ctx.fillStyle = 'rgba(20,12,4,0.72)'; ctx.fill();
  txt(ctx, 'THE CANDLE DIES', 640, 190, 40, '#e08a7a', 'center', true);
  txt(ctx, 'Chapter ' + CHAPTERS[run.chapterIdx].name + ' slips back into the margins, unbound.', 640, 226, 16, '#e8d9ae', 'center');
  txt(ctx, 'Score held: ' + run.score.toLocaleString('en-US') + ' \u00b7 beasts bound: ' + run.totalBound + ' \u00b7 chapters sealed: ' + run.chaptersCleared + '/8', 640, 268, 16, '#f3d98b', 'center', true);
  txt(ctx, 'The beasts remember your hand. Draw tighter, chain faster, spend gold wisely.', 640, 306, 14, '#cbb27f', 'center');
  txt(ctx, 'click anywhere to begin a new manuscript', 640, 380, 15.5, '#fff6da', 'center', true);
}
