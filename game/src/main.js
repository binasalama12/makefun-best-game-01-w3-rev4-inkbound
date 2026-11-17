// INKBOUND entry point: canvas loop, pointer/keyboard input, screen flow.
// Screens: title -> play <-> draft (after each chapter) -> victory / defeat -> title.

import { createRun, startChapter, update, closeLoop, chooseIllumination, polyLength, FIELD } from './world.js';
import { drawPlay, drawTitle, drawDraft, drawVictory, drawDefeat, titleButtons, draftCards } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot');

const view = { stroke: null, goldMode: false, goldLatch: false, pointer: { x: null, y: null }, t: 0 };
let run = createRun(seed, 1);
let drawing = false;

if (shot) {
  const staged = stageShot(run, shot);
  if (staged) { if (staged.view) Object.assign(view, staged.view); }
} 

function toGame(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
function inRect(p, r) { return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; }
const GOLD_SEAL = { x: 924, y: 618, w: 316, h: 32 };

canvas.addEventListener('pointerdown', (e) => {
  const p = toGame(e); view.pointer = p;
  if (shot) return;
  if (run.mode === 'title') {
    for (const b of titleButtons()) {
      if (inRect(p, { x: b.x - 130, y: b.y, w: b.w, h: b.h })) {
        run = createRun(seed + Math.floor(Math.random() * 100000), b.diffIdx);
        startChapter(run); run.mode = 'play';
        return;
      }
    }
    return;
  }
  if (run.mode === 'draft') {
    for (const c of draftCards(run)) if (inRect(p, c)) { chooseAndNext(c.id); return; }
    return;
  }
  if (run.mode === 'victory' || run.mode === 'defeat') { run = createRun(seed + Math.floor(Math.random() * 100000), run.diffIdx); return; }
  if (run.mode === 'play') {
    if (inRect(p, GOLD_SEAL)) { view.goldLatch = !view.goldLatch; view.goldMode = view.goldLatch; return; }
    if (p.x >= FIELD.x && p.x <= FIELD.x + FIELD.w && p.y >= FIELD.y && p.y <= FIELD.y + FIELD.h) {
      drawing = true; view.stroke = [p];
      canvas.setPointerCapture(e.pointerId);
    }
  }
});
canvas.addEventListener('pointermove', (e) => {
  const p = toGame(e); view.pointer = p;
  if (drawing && view.stroke) {
    const last = view.stroke[view.stroke.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 3) view.stroke.push(p);
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (!drawing) return;
  drawing = false;
  const pts = view.stroke; view.stroke = null;
  if (!pts || run.mode !== 'play') return;
  const first = pts[0], last = pts[pts.length - 1];
  const closed = pts.length >= 8 && Math.hypot(first.x - last.x, first.y - last.y) < 58 && polyLength(pts) >= 90;
  if (closed) closeLoop(run, pts, view.goldMode);
});
function chooseAndNext(id) { chooseIllumination(run, id); }
window.addEventListener('keydown', (e) => {
  if (e.key === 'g' || e.key === 'G') view.goldMode = true;
  if (e.key === 'Escape') { drawing = false; view.stroke = null; }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'g' || e.key === 'G') view.goldMode = view.goldLatch;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  view.t += dt;
  if (!shot) update(run, dt, view.pointer);
  if (run.mode === 'title') drawTitle(ctx, run, view);
  else if (run.mode === 'draft') drawDraft(ctx, run, view);
  else if (run.mode === 'victory') drawVictory(ctx, run, view);
  else if (run.mode === 'defeat') drawDefeat(ctx, run, view);
  else drawPlay(ctx, run, view);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
