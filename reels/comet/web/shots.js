// ---------- characters ----------
const ENG = { cols: ['#f08a24', '#f08a24'], hat: 'none', belt: false };
const ENG2 = { cols: ['#3fa35b', '#3fa35b'], hat: 'none', belt: false };
const PILOT = { cols: ['#24365f', '#24365f'], hat: 'captain', belt: false };
const PASS = { cols: ['#7a4bc4', '#7a4bc4'], hat: 'none', belt: false };
const C = (base, extra) => Object.assign({}, base, extra);
const handheld = (t, a = 4) => shake(t * .35, a, 1, 2);
function stamp(ctx, str, x, y, k, size = 170, col = '#ffe14d', rot = -.06) {
  if (k <= 0) return; const sc = backOut(clamp(k));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
  text(ctx, str, 0, 0, size, col, INK, size * .14, 'Poppins', 700); text(ctx, str, 0, 0, size, col, INK, 0, 'Poppins', 700); ctx.restore();
}
function propPlane(ctx, x, y, s, t, face) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-200, -20); ctx.lineTo(120, -35); ctx.quadraticCurveTo(170, -30, 175, 0); ctx.quadraticCurveTo(170, 30, 120, 30); ctx.lineTo(-170, 15); ctx.closePath(); fillStroke(ctx, '#d94a3a', 7);
  ctx.beginPath(); ctx.moveTo(-160, -15); ctx.lineTo(-215, -100); ctx.lineTo(-185, -100); ctx.lineTo(-110, -20); ctx.closePath(); fillStroke(ctx, '#f2b52a', 6);
  rrect(ctx, -60, 0, 170, 22, 10); fillStroke(ctx, '#f2b52a', 6);
  circle(ctx, 50, -40, 34); fillStroke(ctx, '#bfe3f7', 6);
  if (face) { circle(ctx, 50, -44, 22); ctx.fillStyle = HEAD; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); circle(ctx, 44, -48, 4); circle(ctx, 58, -48, 4); ctx.fillStyle = INK; ctx.fill(); ellipse(ctx, 51, -34, 5, 6); ctx.fillStyle = '#5a1e24'; ctx.fill(); }
  const sp = Math.sin(t * 50); ellipse(ctx, 180, 0, 10, 70 * Math.abs(sp) + 8); fillStroke(ctx, '#55606e', 5);
  ctx.restore();
}
function runway(ctx, cam, horizon) {
  applyCam(ctx, cam, .5);
  ctx.fillStyle = '#7cc46a'; ctx.fillRect(-2000, horizon, 5080, 3000);
  ctx.fillStyle = '#5aa552'; ctx.fillRect(-2000, horizon, 5080, 40);
  applyCam(ctx, cam, 1);
  path(ctx, [[-600, horizon + 120], [1700, horizon + 120], [1700, horizon + 380], [-600, horizon + 380]]); fillStroke(ctx, '#5d6470', 0);
  for (let i = 0; i < 12; i++) rrect(ctx, -500 + i * 200, horizon + 240, 110, 16, 8), fillStroke(ctx, '#f4f1e8', 0);
}
function gear(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); for (const gx of [-120, 380]) { line(ctx, gx, 50, gx, 120, 10); circle(ctx, gx, 128, 22); fillStroke(ctx, '#2d2a30', 5); } ctx.restore(); }

const SHOTS = [];
// A — hook: a sharp window corner cracks and the jet tears in half
SHOTS.push({ start: 0, end: 3.0, tr: 'whip', draw(ctx, lt, t) {
  const hh = handheld(t, 4); const jx = 520, jy = 860, js = 1.1;
  const cx = jx + 34 * js, cy = jy - 36 * js;
  const z = kf(lt, [[0, 2.6], [1.3, 2.3], [2.25, 1.15, easeOut]]);
  const k2 = clamp((z - 1.15) / 1.45);
  const sk = lt > 2.4 ? shake(t, 26 * clamp(1 - (lt - 2.4) * 1.6), 3) : [0, 0];
  const cam = { x: lerp(540, cx, k2) + hh[0] + sk[0], y: lerp(900, cy + 40, k2) + hh[1] + sk[1], z, r: Math.sin(t * .6) * .01 };
  skyBG(ctx, cam, t);
  applyCam(ctx, cam, .6); speedLines(ctx, t, .5, 3);
  applyCam(ctx, cam, 1);
  const split = kf(lt, [[2.4, 0], [3.0, .75, easeOut]]);
  const bob = Math.sin(t * 2) * 6;
  drawJet(ctx, jx, jy + bob, { s: js, win: 'square', faces: true, t, split, cut: 34, seed: 9, flame: 1 });
  if (split === 0) {
    ctx.save(); ctx.translate(jx, jy + bob); ctx.scale(js, js);
    // corner warning ring
    const ra = kf(lt, [[.15, 0], [.5, 1], [2.2, 1], [2.4, 0]]);
    if (ra > 0) { const pr = 16 + Math.sin(t * 14) * 3; circle(ctx, 34, -36, pr); ctx.lineWidth = 3.5; ctx.strokeStyle = `rgba(224,57,47,${ra})`; ctx.stroke(); }
    // crack races from the corner
    const L = kf(lt, [[1.45, 0], [2.35, 1, easeIn]]);
    crack(ctx, 34, -36, -1.2, 50 * L, 6, 4); crack(ctx, 34, -36, 1.5, 110 * L, 6, 6);
    ctx.restore();
  } else {
    const k = clamp((lt - 2.4) / .5);
    burst(ctx, jx + 34 * js, jy + bob, 260 * easeOut(k) * (1 - k * .3), 13, '#ffd23a', 5);
    debris(ctx, jx + 34 * js, jy + bob, k, 3, 16, 520);
    flash(ctx, kf(lt, [[2.4, .85], [2.6, 0]]));
  }
} });
// B — 1952: the Comet, first jet airliner
SHOTS.push({ start: 3.0, end: 6.75, tr: 'cut', draw(ctx, lt, t) {
  const hh = handheld(t, 3);
  const cam = { x: 540 + hh[0] + lt * 10, y: 960 + hh[1], z: 1.0 + lt * .04, r: 0 };
  applyCam(ctx, cam, .08); drawSky(ctx, '#3ea6ee', '#d8f1fc', -300, 1050);
  applyCam(ctx, cam, .1); drawSun(ctx, 860, 330, 80, t, .9);
  applyCam(ctx, cam, .2); drawCloud(ctx, 160 + t * 6, 560, 110, 1); drawCloud(ctx, 980 + t * 4, 720, 80, 2);
  runway(ctx, cam, 1030);
  applyCam(ctx, cam, 1);
  const jx = 470, jy = 930;
  gear(ctx, jx, jy, .8);
  drawJet(ctx, jx, jy, { s: .8, win: 'square', t, faces: lt > 1.2 });
  // shine sweep
  const sw = kf(lt, [[1.3, -1], [2.1, 1.4]]);
  if (sw > -1 && sw < 1.4) { ctx.save(); ctx.translate(jx, jy); ctx.scale(.8, .8); jetBody(ctx); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); const sx = sw * 600; ctx.moveTo(sx - 40, -80); ctx.lineTo(sx + 40, -80); ctx.lineTo(sx - 20, 80); ctx.lineTo(sx - 100, 80); ctx.closePath(); ctx.fill(); ctx.restore(); }
  if (lt > 1.6) { sparkle(ctx, jx + 330, jy - 60, 34 * clamp((lt - 1.6) * 4), 1); sparkle(ctx, jx - 260, jy - 40, 24 * clamp((lt - 1.8) * 4), 1); }
  // pilot, proud
  const px = 860, py = 1235, ps = 360;
  const thumb = kf(lt, [[2.4, 0], [2.7, 1, backOut]]);
  drawStick(ctx, C(PILOT, { x: px, y: py, s: ps, headTilt: -.05 + Math.sin(t * 2) * .02,
    arms: { L: [.9, -2.2], R: thumb > 0 ? { ik: [lerp(.25, .28, thumb), lerp(-.45, -.78, thumb)], bend: -1 } : [.9, -2.2] },
    face: { eyes: lt > 2.4 ? 'happy' : 'normal', mouth: 'grin', look: [-.6, 0], browUp: 1 } }));
  // year stamp, then "1st" badge
  stamp(ctx, '1952', 540, 330, (lt - .28) * 3.5, 190);
  const ba = clamp((lt - 2.6) * 3.5);
  if (ba > 0) { ctx.save(); ctx.translate(250, 640); ctx.scale(backOut(ba), backOut(ba)); ctx.rotate(Math.sin(t * 3) * .05);
    path(ctx, [[-40, 40], [-70, 170], [-20, 140], [0, 180], [10, 40]]); fillStroke(ctx, '#e0392f', 6); path(ctx, [[40, 40], [70, 170], [20, 140], [0, 180], [-10, 40]]); fillStroke(ctx, '#2f63c9', 6);
    circle(ctx, 0, 0, 100); fillStroke(ctx, '#f2c230', 9); circle(ctx, 0, 0, 74); fillStroke(ctx, '#ffd84a', 5); text(ctx, '1st', 0, 6, 70, INK, INK, 0, 'Poppins', 700); ctx.restore(); }
} });
// C — higher and faster than any passenger plane
SHOTS.push({ start: 6.75, end: 9.8, tr: 'whip', draw(ctx, lt, t) {
  const hh = handheld(t, 4);
  const climb = kf(lt, [[.4, 0], [1.4, 1]]);
  const cam = { x: 540 + hh[0], y: 960 + hh[1] - climb * 260, z: kf(lt, [[0, 1.1], [3, 1.0]]), r: -climb * .03 };
  applyCam(ctx, cam, .08); drawSky(ctx, mix('#3ea6ee', '#1d5fc0', climb), '#cdeefc', -900, 1700);
  applyCam(ctx, cam, .25);
  drawCloud(ctx, 200 - t * 60, 1500, 160, 1); drawCloud(ctx, 900 - t * 80, 1700, 130, 2); drawCloud(ctx, 1500 - t * 70, 1550, 150, 3);
  applyCam(ctx, cam, 1);
  speedLines(ctx, t, kf(lt, [[.9, 0], [1.2, .9]]), 7);
  // the old propeller plane, falling behind below
  const ppx = kf(lt, [[0, 760], [3, 120]], x => x), ppy = 1470 + Math.sin(t * 2) * 8;
  propPlane(ctx, ppx, ppy, .9, t, true);
  if (lt > 1.4) sweat(ctx, ppx + 100, ppy - 120, 26, clamp((lt - 1.4) * 3));
  // the Comet zooms past above
  const jx = kf(lt, [[0, -500], [1.1, 520, easeOut], [3, 640]], x => x), jy = kf(lt, [[0, 900], [1.4, 520]]);
  drawJet(ctx, jx, jy, { s: .78, win: 'square', faces: true, t, rot: -.12 * (1 - clamp((lt - 1.5) / 1)), flame: 1.4 });
  // altitude gauge on the right
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  rrect(ctx, 90, 380, 70, 520, 35); fillStroke(ctx, 'rgba(255,255,255,.85)', 7);
  const lv = .25 + climb * .65; rrect(ctx, 102, 380 + 508 - 496 * lv, 46, 496 * lv, 23); fillStroke(ctx, '#3fa35b', 0);
  text(ctx, '↑', 125, 330, 80, '#fff', INK, 12, 'Poppins', 700);
  ctx.restore();
} });
// D — 1954: two Comets break apart in mid-air
SHOTS.push({ start: 9.8, end: 14.25, tr: 'cut', draw(ctx, lt, t) {
  const hh = handheld(t, 4);
  const hit1 = 11.85 - 9.8, hit2 = 13.35 - 9.8;
  const sk = shake(t, 22 * (clamp(1 - (lt - hit1) * 2) * (lt > hit1) + clamp(1 - (lt - hit2) * 2) * (lt > hit2)), 3);
  const cam = { x: 540 + hh[0] + sk[0], y: 960 + hh[1] + sk[1], z: 1 + lt * .02, r: 0 };
  applyCam(ctx, cam, .08); drawSky(ctx, '#3b5b9a', '#f2b48a', -300, 1800);
  applyCam(ctx, cam, .2); drawCloud(ctx, 150 + t * 8, 1180, 120, 4, .85); drawCloud(ctx, 980 + t * 6, 380, 90, 2, .8);
  applyCam(ctx, cam, 1);
  stamp(ctx, '1954', 540, 280, (lt - .3) * 3.5, 190, '#ff9a3a');
  const planes = [[330, 640, hit1, 'JAN', 11], [720, 1010, hit2, 'APR', 21]];
  for (const [x, y, hit, mon, seed] of planes) {
    const appear = clamp((lt - (hit - 1.3)) * 2.5); if (appear <= 0) continue;
    const sp = kf(lt, [[hit, 0], [hit + 1.2, 1, easeOut]]);
    const px = x + (lt - hit + 1.3) * 60;
    ctx.save(); ctx.globalAlpha = appear;
    drawJet(ctx, px, y + sp * sp * 160, { s: .5, win: 'square', t, split: sp, cut: 34, seed, flame: 1 - sp });
    ctx.restore();
    if (lt > hit) { const k = clamp((lt - hit) / .5); burst(ctx, px + 17, y, 170 * easeOut(k) * (1 - k * .4), 12, '#ffd23a', seed); debris(ctx, px + 17, y, k * 1.2, seed, 12, 300); puff(ctx, px + 17, y, 80 * (1 + k), t, '#bdb6b0', seed, clamp(1.3 - k) * .9); }
    // month tag
    const ta = clamp((lt - hit - .25) * 4);
    if (ta > 0) { ctx.save(); ctx.translate(px - 30, y - 190); ctx.scale(backOut(ta), backOut(ta)); rrect(ctx, -85, -45, 170, 90, 18); fillStroke(ctx, '#fff', 7); text(ctx, mon, 0, 3, 56, '#e0392f', INK, 0, 'Poppins', 700); ctx.restore(); }
  }
  flash(ctx, kf(lt, [[hit1, .7], [hit1 + .18, 0]]) * (lt >= hit1) + kf(lt, [[hit2, .7], [hit2 + .18, 0]]) * (lt >= hit2));
} });
// E — engineers sink a whole Comet in a giant water tank
const TK = { x: 640, y: 1220, w: 720, h: 760 };
function lab(ctx, cam) {
  applyCam(ctx, cam, .3);
  ctx.fillStyle = '#d7dbe8'; ctx.fillRect(-1000, -1000, 3080, 4000);
  for (let i = -3; i < 9; i++) { rrect(ctx, -200 + i * 220, 120, 150, 260, 10); fillStroke(ctx, '#a9d4ee', 6); }
  ctx.fillStyle = '#b9bfcf'; ctx.fillRect(-1000, 1180, 3080, 3000);
  applyCam(ctx, cam, 1);
  ctx.fillStyle = '#8f96a8'; ctx.fillRect(-1000, 1220, 3080, 3000); line(ctx, -1000, 1220, 2080, 1220, 8);
}
SHOTS.push({ start: 14.25, end: 17.3, tr: 'whip', draw(ctx, lt, t) {
  const hh = handheld(t, 4);
  const cam = { x: 560 + hh[0], y: 900 + hh[1], z: kf(lt, [[0, 1.05], [3, 1.12]]), r: 0 };
  lab(ctx, cam);
  // crane
  line(ctx, 640, -300, 640, -100, 18, '#f2b52a'); line(ctx, 200, -100, 1100, -100, 26, '#f2b52a');
  const drop = kf(lt, [[.6, 0], [1.6, 1, easeIn], [2.0, 1.04, easeOut]]);
  const ty = lerp(220, 860, drop);
  line(ctx, 640, -100, 640, ty - 110, 6, INK);
  for (const s of [-1, 1]) line(ctx, 640, ty - 110, 640 + s * 230, ty - 60, 5, INK);
  const tk = drawTank(ctx, TK.x, TK.y, TK.w, TK.h, drop > .9 ? 1 : .82, t);
  ctx.save(); if (drop >= 1) { rrect(ctx, TK.x - TK.w / 2, TK.y - TK.h, TK.w, TK.h, 30); ctx.clip(); }
  tube(ctx, 640, ty, 620, 170, { n: 7 });
  // wings poking out of the tank
  ctx.restore();
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(640 + s * 40, ty + 40); ctx.lineTo(640 + s * 40 - 70, ty + 40); ctx.lineTo(640 + s * 40 - 200, ty + 170); ctx.lineTo(640 + s * 40 - 120, ty + 170); ctx.closePath(); if (drop < .97) fillStroke(ctx, '#c3ccd6', 6); }
  tankGlass(ctx, TK.x, TK.y, TK.w, TK.h);
  // splash
  if (drop >= .97) { const k = clamp((lt - 1.55) / .7); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .28; const r = 260 * easeOut(k); circle(ctx, 640 + Math.cos(a) * r * 1.4, TK.y - TK.h * .76 + Math.sin(a) * r - 300 * k * k * -1, 26 * (1 - k)); fillStroke(ctx, '#8fd8ff', 5); } }
  // engineers
  const e1 = [150, 1225, 300];
  drawStick(ctx, C(ENG, { x: e1[0], y: e1[1], s: e1[2], arms: { L: [.3, -.1], R: lt > .4 ? { ik: [.42, -.75] } : [.3, -.1] }, face: { eyes: drop > .97 ? 'wide' : 'normal', mouth: drop > .97 ? 'o' : 'smile', look: [1, -.6] } }));
  hardHat(ctx, e1[0], e1[1], e1[2]);
  if (drop > .97) sweat(ctx, e1[0] + 70, e1[1] - 290, 22, 1);
} });
// F — pump the cabin up and down, flight after flight
function pumpCycle(lt) {
  // returns [pressure 0..1, cycle count]: first two cycles slow (up / down), then faster and faster
  const t0 = .2; const x = Math.max(0, lt - t0);
  const ph = x < 1.6 ? x / 1.6 * 1 : 1 + (x - 1.6) * (1.2 + (x - 1.6) * 2.4);
  const p = .5 - .5 * Math.cos(ph * TAU);
  return [p, Math.floor(ph)];
}
SHOTS.push({ start: 17.3, end: 21.6, tr: 'cut', draw(ctx, lt, t) {
  const hh = handheld(t, 3);
  const cam = { x: 530 + hh[0], y: 880 + hh[1], z: kf(lt, [[0, 1.08], [4.3, 1.16]]), r: 0 };
  lab(ctx, cam);
  const [p, cyc] = pumpCycle(lt);
  drawTank(ctx, TK.x, TK.y, TK.w, TK.h, 1, t);
  ctx.save(); rrect(ctx, TK.x - TK.w / 2, TK.y - TK.h, TK.w, TK.h, 30); ctx.clip();
  tube(ctx, 640, 880, 620, 170, { n: 7, bulge: p });
  // bubbles
  const R = rng(4); for (let i = 0; i < 14; i++) { const by = 1180 - ((t * 120 + R() * 700) % 700); circle(ctx, 360 + R() * 560, by, 6 + R() * 8); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke(); }
  ctx.restore();
  tankGlass(ctx, TK.x, TK.y, TK.w, TK.h);
  // pipe to the pump
  ctx.beginPath(); ctx.moveTo(TK.x - TK.w / 2, 1000); ctx.lineTo(120, 1000); ctx.lineTo(120, 1080); ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#9aa6b4'; ctx.stroke();
  // engineer pumping a lever
  const ex = 120, ey = 1225, es = 290;
  rrect(ctx, ex + 30, 1080, 90, 140, 12); fillStroke(ctx, '#d94a3a', 7);
  const lev = lerp(-.5, .5, p); const lx = ex + 75 + Math.cos(-Math.PI / 2 + lev) * 0, ly = 1080; const tipx = ex + 75 + Math.sin(lev) * 150, tipy = ly - Math.cos(lev) * 150;
  line(ctx, ex + 75, 1080, tipx, tipy, 14, INK); line(ctx, ex + 75, 1080, tipx, tipy, 7, '#c9ced6');
  drawStick(ctx, C(ENG2, { x: ex - 40, y: ey, s: es, lean: lev * .2, arms: { L: { ik: [(tipx - ex + 40) / es, (tipy - ey) / es] }, R: { ik: [(tipx - ex + 40) / es, (tipy - ey) / es + .03] } }, face: { eyes: cyc > 3 ? 'squint' : 'normal', mouth: cyc > 3 ? 'teeth' : 'flat', look: [1, 0] } }));
  hardHat(ctx, ex - 40, ey, es, '#f5c518', lev * .2);
  // gauge + counter
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  gauge(ctx, 870, 330, 120, p);
  const n = Math.min(2000, Math.round(Math.pow(Math.max(0, lt - .2) / 4.1, 2.2) * 2000));
  counter(ctx, 330, 330, Math.max(n, cyc), .9);
  text(ctx, 'flights', 330, 450, 44, '#fff', INK, 9, 'Poppins', 700);
  // up / down arrows on the words
  if (lt > .9 && lt < 1.4) stamp(ctx, '↑', 640, 620, (lt - .9) * 6, 160, '#3fa35b', 0);
  if (lt > 1.55 && lt < 2.0) stamp(ctx, '↓', 640, 620, (lt - 1.55) * 6, 160, '#2f63c9', 0);
  ctx.restore();
} });
// G — about 3000 cycles... it rips open
SHOTS.push({ start: 21.6, end: 24.35, tr: 'whip', draw(ctx, lt, t) {
  const rip = 23.6 - 21.6;
  const tense = clamp((lt - 1.2) / .8);
  const sk = shake(t, lt < rip ? tense * 6 : 34 * clamp(1 - (lt - rip) * 1.4), 4);
  const cam = { x: 640 + sk[0], y: 820 + sk[1], z: kf(lt, [[0, 1.1], [rip, 1.45], [rip + .2, 1.25, easeOut]]), r: 0 };
  lab(ctx, cam);
  drawTank(ctx, TK.x, TK.y, TK.w, TK.h, 1, t);
  ctx.save(); rrect(ctx, TK.x - TK.w / 2, TK.y - TK.h, TK.w, TK.h, 30); ctx.clip();
  const bulge = lt < rip ? .5 + .5 * Math.sin(t * 30) * (.3 + tense * .7) : 1.4;
  tube(ctx, 640, 880, 620, 170, { n: 7, bulge });
  if (lt > rip) {
    const k = clamp((lt - rip) / .6);
    crack(ctx, 640 + 62, 880 - 30, -1.2, 160 * easeOut(k), 12, 3); crack(ctx, 640 + 62, 880 - 30, 1.7, 140 * easeOut(k), 12, 8);
  } else if (tense > 0) crack(ctx, 640 + 62, 880 - 30, -1.2, 30 * tense, 6, 3);
  ctx.restore();
  tankGlass(ctx, TK.x, TK.y, TK.w, TK.h);
  if (lt > rip) {
    const k = clamp((lt - rip) / .7);
    burst(ctx, 700, 840, 300 * easeOut(k) * (1 - k * .3), 14, '#ffd23a', 7);
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i - 7.5) * .16; const r = 620 * easeOut(k); circle(ctx, 700 + Math.cos(a) * r, 840 + Math.sin(a) * r + 500 * k * k, 30 * (1 - k * .6)); fillStroke(ctx, '#8fd8ff', 6); }
    debris(ctx, 700, 840, k, 7, 14, 500);
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const n = Math.round(kf(lt, [[0, 2000], [1.2, 3000, easeOut]]));
  counter(ctx, 540, 300, n, 1.25, lt > 1.1 ? '#ff6a4a' : '#ffe14d');
  ctx.restore();
  flash(ctx, kf(lt, [[rip, .8], [rip + .2, 0]]) * (lt >= rip));
} });
// H — the crack began at the sharp corner of a cabin opening
SHOTS.push({ start: 24.35, end: 27.0, tr: 'cut', draw(ctx, lt, t) {
  const hh = handheld(t, 3);
  const cx = 540, cy = 800;
  const focus = kf(lt, [[1.2, 0], [1.7, 1]]);
  const cam = { x: lerp(540, cx + 90, focus) + hh[0], y: lerp(900, cy + 20, focus) + hh[1], z: lerp(1.0, 1.15, focus), r: 0 };
  applyCam(ctx, cam, .2); ctx.fillStyle = '#2d3550'; ctx.fillRect(-1000, -1000, 3080, 4000);
  applyCam(ctx, cam, 1);
  stressPlate(ctx, cx, cy, { hw: 220, hh: 260, r: 8, t, lines: 0, plateW: 860, plateH: 960 });
  // torn edge and the crack from the top-right corner
  crack(ctx, cx + 220, cy - 260, -.75, 300, 12, 3); crack(ctx, cx + 220, cy - 260, -1.6, 130, 8, 11);
  // magnifying glass moving onto the corner
  const mx = kf(lt, [[0, 260], [1.2, cx + 220]]), my = kf(lt, [[0, 1150], [1.2, cy - 260]]);
  ctx.save(); circle(ctx, mx, my, 150); ctx.clip();
  ctx.fillStyle = '#e8edf2'; ctx.fillRect(mx - 160, my - 160, 320, 320);
  ctx.translate(mx, my); ctx.scale(1.9, 1.9); ctx.translate(-mx, -my);
  stressPlate(ctx, cx, cy, { hw: 220, hh: 260, r: 8, t, lines: 0, plateW: 860, plateH: 960 });
  crack(ctx, cx + 220, cy - 260, -.75, 300, 12, 3); crack(ctx, cx + 220, cy - 260, -1.6, 130, 8, 11);
  ctx.restore();
  circle(ctx, mx, my, 150); ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 12; ctx.strokeStyle = '#c9a14a'; ctx.stroke();
  line(ctx, mx - 106, my + 106, mx - 230, my + 230, 34, INK); line(ctx, mx - 106, my + 106, mx - 230, my + 230, 22, '#8a4f24');
  // red ring on the corner when the word lands
  const ra = clamp((lt - 1.45) * 4);
  if (ra > 0) { circle(ctx, cx + 220, cy - 260, 60 + Math.sin(t * 12) * 6); ctx.lineWidth = 10 * ra; ctx.strokeStyle = '#e0392f'; ctx.stroke(); }
  // engineer peeking from the bottom left
  const ex = 200, ey = 1880, es = 560;
  drawStick(ctx, C(ENG, { x: ex, y: ey, s: es, shadow: false, arms: { L: [.3, -.1], R: { ik: [(mx - 230 - ex) / es, (my + 230 - ey) / es] } }, face: { eyes: 'wide', mouth: 'o', look: [.8, -.8], browUp: 1 } }));
  hardHat(ctx, ex, ey, es);
} });
// I — every flight, stress piles up at the corners, cracks grow
SHOTS.push({ start: 27.0, end: 31.2, tr: 'whip', draw(ctx, lt, t) {
  const hh = handheld(t, 3);
  const cam = { x: 540 + hh[0], y: 880 + hh[1], z: kf(lt, [[0, 1.0], [4.2, 1.1]]), r: 0 };
  applyCam(ctx, cam, .2); ctx.fillStyle = '#2d3550'; ctx.fillRect(-1000, -1000, 3080, 4000);
  applyCam(ctx, cam, 1);
  const glow = kf(lt, [[.9, 0], [1.9, 1]]);
  const beat = Math.max(0, lt - 1.0) / .55; const pulse = Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 3) * (lt > 1.0);
  const grows = Math.floor(Math.max(0, lt - 2.4) / .55) + (lt > 2.4 ? 1 : 0);
  const crackL = Math.min(5, grows) * 34 + (lt > 2.4 ? pulse * 8 : 0);
  stressPlate(ctx, 540, 820, { hw: 220, hh: 260, r: 8, t, glow, pulse, flow: 1, crackL, plateW: 900, plateH: 1000 });
  // "load" arrows top and bottom
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const ax = 360 + i * 180, ay = 820 + s * 560; const k = 1 + pulse * .25; ctx.save(); ctx.translate(ax, ay); ctx.scale(k, k); path(ctx, [[-26, 0], [26, 0], [26, s * 40], [46, s * 40], [0, s * 90], [-46, s * 40], [-26, s * 40]]); fillStroke(ctx, '#ffe14d', 6); ctx.restore(); }
  // flight counter, small
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fl = 1 + Math.floor(beat);
  if (lt > 1.0) { rrect(ctx, 760, 150, 230, 90, 20); fillStroke(ctx, '#1d2433', 7); text(ctx, '✈ ' + fl, 875, 198, 50, '#fff', INK, 0, 'Poppins', 700); }
  ctx.restore();
} });
// J — a rounded corner lets the stress flow around the curve
SHOTS.push({ start: 31.2, end: 34.25, tr: 'whip', draw(ctx, lt, t) {
  const hh = handheld(t, 3);
  const cam = { x: 540 + hh[0], y: 880 + hh[1], z: kf(lt, [[0, 1.08], [3, 1.0]]), r: 0 };
  applyCam(ctx, cam, .2); ctx.fillStyle = '#21486a'; ctx.fillRect(-1000, -1000, 3080, 4000);
  applyCam(ctx, cam, 1);
  const m = kf(lt, [[.2, 0], [.9, 1, backOut]]);
  const r = lerp(8, 200, clamp(m, 0, 1.1));
  stressPlate(ctx, 540, 820, { hw: 220, hh: 260, r: Math.min(r, 219), t, glow: kf(lt, [[.9, 0], [1.5, .8]]), pulse: 0, flow: 1.2, plateW: 900, plateH: 1000 });
  // big green check
  const ca = clamp((lt - 1.9) * 4);
  if (ca > 0) { ctx.save(); ctx.translate(860, 300); ctx.scale(backOut(ca), backOut(ca)); circle(ctx, 0, 0, 90); fillStroke(ctx, '#3fa35b', 9); ctx.beginPath(); ctx.moveTo(-42, 2); ctx.lineTo(-10, 34); ctx.lineTo(46, -30); ctx.lineWidth = 22; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
} });
// K — payoff: every window you've looked through is round
SHOTS.push({ start: 34.25, end: 37.3, tr: 'cut', draw(ctx, lt, t) {
  const hh = handheld(t, 3);
  const cam = { x: 600 + hh[0], y: 900 + hh[1], z: kf(lt, [[0, 1.0], [3, 1.12]]), r: 0 };
  cabinBG(ctx, cam, t);
  bigWindow(ctx, 700, 760, 210, 290, 170, t);
  // seat back
  rrect(ctx, 40, 860, 230, 700, 60); fillStroke(ctx, '#2f63c9', 9);
  rrect(ctx, 60, 860, 190, 150, 50); fillStroke(ctx, '#f4f1e8', 6);
  const px = 330, py = 1560, ps = 640;
  const turn = kf(lt, [[0, -.6], [.6, .8]]);
  drawStick(ctx, C(PASS, { x: px, y: py, s: ps, shadow: false, headTilt: .08,
    arms: { L: [.4, -1.2], R: lt > 2.0 ? { ik: [.42, -.95] } : [.5, -1.3] },
    legs: { L: [1.4, -1.5], R: [1.4, -1.5] },
    face: { eyes: lt > 2.1 ? 'happy' : 'normal', mouth: lt > 2.1 ? 'grin' : 'smile', look: [turn, -.2], turn: .4 } }));
  // window outline sparkle on "round"
  const sa = kf(lt, [[1.95, 0], [2.15, 1], [2.9, 0]]);
  if (sa > 0) { ctx.save(); holePath(ctx, 700, 760, 210 + 20, 290 + 20, 190); ctx.lineWidth = 14 * sa; ctx.strokeStyle = `rgba(255,225,77,${sa})`; ctx.stroke(); ctx.restore(); sparkle(ctx, 700 + 200, 760 - 230, 60 * sa, sa); sparkle(ctx, 700 - 200, 760 + 240, 44 * sa, sa); }
} });
