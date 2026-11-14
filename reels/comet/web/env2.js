// ---------- Comet reel: planes, tank, stress diagram ----------
const JET = { body: '#f4f6f8', belly: '#c3ccd6', stripe: '#1f4fa8', fin: '#1f4fa8', win: '#2b3c55' };

// side-view jet, nose to the right. local units: fuselage ~1000 long, 120 tall.
// o: { s, win: 'square'|'round', split: 0..1, cut: x where it tears, faces: true, t, tint, flame }
function jetBody(ctx) {
  ctx.beginPath();
  ctx.moveTo(-470, -40);
  ctx.lineTo(360, -60); ctx.bezierCurveTo(450, -60, 520, -30, 530, 5); ctx.bezierCurveTo(520, 45, 450, 60, 360, 60);
  ctx.lineTo(-330, 60); ctx.quadraticCurveTo(-440, 50, -520, -10); ctx.lineTo(-520, -40); ctx.closePath();
}
function drawJetParts(ctx, o, part) {
  const t = o.t || 0, tint = o.tint || 0;
  const c = k => tint ? mix(JET[k], '#1a2236', tint) : JET[k];
  // tail fin + tailplane (back part)
  if (part !== 'front') {
    ctx.beginPath(); ctx.moveTo(-330, -45); ctx.lineTo(-470, -230); ctx.quadraticCurveTo(-505, -235, -520, -215); ctx.lineTo(-520, -40); ctx.closePath(); fillStroke(ctx, c('fin'), 7);
    ctx.beginPath(); ctx.moveTo(-400, -10); ctx.lineTo(-540, -40); ctx.lineTo(-560, -25); ctx.lineTo(-470, 10); ctx.closePath(); fillStroke(ctx, c('belly'), 6);
  }
  // far wing (behind fuselage)
  if (part !== 'back') { ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(-120, -110); ctx.lineTo(-170, -110); ctx.lineTo(-60, 0); ctx.closePath(); fillStroke(ctx, mix(c('belly'), '#55606e', .3), 6); }
  // fuselage
  jetBody(ctx); ctx.fillStyle = c('body'); ctx.fill();
  ctx.save(); jetBody(ctx); ctx.clip();
  ctx.fillStyle = c('belly'); ctx.fillRect(-600, 22, 1200, 60);
  ctx.fillStyle = c('stripe'); ctx.fillRect(-600, 4, 1200, 14);
  ctx.fillStyle = 'rgba(30,20,50,.10)'; ctx.fillRect(-600, 30, 1200, 60);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-600, -48, 1200, 9);
  // windows
  const round = o.win === 'round';
  for (let i = 0; i < 13; i++) {
    const wx = -280 + i * 50; if (wx > 330) break;
    if (round) { rrect(ctx, wx - 12, -36, 24, 30, 11); } else { ctx.beginPath(); ctx.rect(wx - 14, -36, 28, 28); }
    ctx.fillStyle = c('win'); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    if (o.faces) { circle(ctx, wx, -20, 9); ctx.fillStyle = HEAD; ctx.fill(); circle(ctx, wx - 3, -22, 1.8); circle(ctx, wx + 3, -22, 1.8); ctx.fillStyle = INK; ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(wx - 8, -33, 5, 10);
  }
  // cockpit
  ctx.beginPath(); ctx.moveTo(430, -38); ctx.quadraticCurveTo(480, -36, 500, -15); ctx.lineTo(452, -15); ctx.closePath(); fillStroke(ctx, c('win'), 4);
  ctx.restore();
  jetBody(ctx); fillStroke(ctx, null, 7);
  // near wing with buried engines (front part)
  if (part !== 'back') {
    ctx.beginPath(); ctx.moveTo(120, 20); ctx.lineTo(-150, 150); ctx.lineTo(-230, 150); ctx.lineTo(-60, 30); ctx.closePath(); fillStroke(ctx, c('belly'), 6);
    rrect(ctx, 60, 14, 90, 26, 12); fillStroke(ctx, '#3a4250', 5);
    if (o.flame) { const f = o.flame * (0.8 + .2 * Math.sin(t * 60)); ctx.beginPath(); ctx.moveTo(-40, 30); ctx.lineTo(-40 - 160 * f, 40); ctx.lineTo(-40, 50); ctx.closePath(); ctx.fillStyle = 'rgba(255,200,90,.7)'; ctx.fill(); }
  }
}
function jagged(ctx, cut, side, seed = 4) {
  // clip polygon for one half, with a zigzag edge at x = cut
  const R = rng(seed); const pts = [];
  for (let y = -260; y <= 200; y += 26) pts.push([cut + (R() - .5) * 46, y]);
  ctx.beginPath();
  if (side < 0) { ctx.moveTo(-2000, -400); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(cut, 400); ctx.lineTo(-2000, 400); }
  else { ctx.moveTo(2000, -400); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(cut, 400); ctx.lineTo(2000, 400); }
  ctx.closePath(); return pts;
}
function drawJet(ctx, x, y, o = {}) {
  const s = o.s || 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s * (o.flip || 1), s);
  if (o.shadow) { ellipse(ctx, 0, 300, 520, 40); ctx.fillStyle = 'rgba(30,30,60,.18)'; ctx.fill(); }
  const sp = o.split || 0;
  if (!sp) drawJetParts(ctx, o, 'all');
  else {
    const cut = o.cut != null ? o.cut : 20;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * sp * 90, sp * sp * 160 * (side < 0 ? 1.3 : 1));
      ctx.translate(cut, 0); ctx.rotate(side * sp * .55); ctx.translate(-cut, 0);
      const pts = jagged(ctx, cut, side, o.seed || 4); ctx.save(); ctx.clip();
      drawJetParts(ctx, o, side < 0 ? 'back' : 'front');
      ctx.restore();
      // dark torn interior edge
      ctx.beginPath(); pts.filter(p => p[1] > -60 && p[1] < 62).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineWidth = 10; ctx.strokeStyle = '#2b2430'; ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}
// small debris bits flying out of a tear
function debris(ctx, x, y, k, seed = 1, n = 14, spread = 420) {
  if (k <= 0) return; const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, v = spread * (.4 + R() * .8); const px = x + Math.cos(a) * v * k, py = y + Math.sin(a) * v * k + 300 * k * k;
    ctx.save(); ctx.translate(px, py); ctx.rotate(k * 8 * (R() - .5)); const sz = 10 + R() * 18;
    ctx.globalAlpha = clamp(1.4 - k); ctx.beginPath(); ctx.rect(-sz, -sz * .5, sz * 2, sz); fillStroke(ctx, R() > .5 ? '#dfe4ea' : '#9aa6b4', 3); ctx.restore();
  }
}
function flash(ctx, a, col = '255,255,255') { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(${col},${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// sky with altitude gradient
function skyBG(ctx, cam, t, top = '#2f8fe0', bot = '#bfe6fb', clouds = 1) {
  applyCam(ctx, cam, .08); drawSky(ctx, top, bot, -600, 1900);
  applyCam(ctx, cam, .2);
  if (clouds) { drawCloud(ctx, 140 + t * 10, 330, 130, 1); drawCloud(ctx, 900 + t * 8, 560, 100, 2); drawCloud(ctx, 420 + t * 12, 1650, 150, 3); drawCloud(ctx, -60 + t * 9, 1100, 90, 4, .9); }
}
// speed lines across the frame
function speedLines(ctx, t, a = 1, seed = 5, dir = -1) {
  if (a <= 0) return; const R = rng(seed); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  for (let i = 0; i < 26; i++) { const y = R() * H, len = 120 + R() * 300, sp = 2400 + R() * 1800; const x = ((R() * 3000 + dir * t * sp) % 3000 + 3000) % 3000 - 600; line(ctx, x, y, x + len, y, 4 + R() * 5, 'rgba(255,255,255,.75)'); }
  ctx.restore();
}
// hard hat drawn on a stick figure's head (call after drawStick with same x,y,s)
function hardHat(ctx, x, y, s, col = '#f5c518', lean = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(lean); const hy = -.765, hr = .19;
  ctx.beginPath(); ctx.arc(0, hy - hr * .15, hr * 1.02, Math.PI, 0); ctx.closePath(); fillStroke(ctx, col, .017);
  rrect(ctx, -hr * 1.3, hy - hr * .2, hr * 2.6, .045, .02); fillStroke(ctx, col, .017);
  rrect(ctx, -.02, hy - hr * 1.15, .04, hr * .9, .02); fillStroke(ctx, mix(col, '#ffffff', .35), .012);
  ctx.restore();
}
function headPos(x, y, s) { return [x, y - .765 * s]; }

// pressure gauge
function gauge(ctx, x, y, r, v, label) {
  circle(ctx, x, y, r); fillStroke(ctx, '#f7f3ea', r * .1);
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i <= 8; i++) { const a = -Math.PI * 1.25 + i / 8 * Math.PI * 1.5; line(ctx, Math.cos(a) * r * .72, Math.sin(a) * r * .72, Math.cos(a) * r * .86, Math.sin(a) * r * .86, r * .05, i > 6 ? '#e0392f' : INK); }
  const a = -Math.PI * 1.25 + clamp(v) * Math.PI * 1.5; line(ctx, 0, 0, Math.cos(a) * r * .7, Math.sin(a) * r * .7, r * .07, '#e0392f');
  circle(ctx, 0, 0, r * .1); ctx.fillStyle = INK; ctx.fill();
  if (label) text(ctx, label, 0, r * .45, r * .22, INK, INK, 0, 'Poppins', 700);
  ctx.restore();
}
// big counter panel
function counter(ctx, x, y, n, sc = 1, col = '#ffe14d') {
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  rrect(ctx, -220, -80, 440, 160, 26); fillStroke(ctx, '#1d2433', 9);
  text(ctx, String(Math.floor(n)).padStart(4, '0'), 0, 8, 120, col, INK, 0, 'Poppins', 700);
  ctx.restore();
}
// water tank (front glass), returns inner rect
function drawTank(ctx, x, y, w, h, water = 1, t = 0) {
  rrect(ctx, x - w / 2, y - h, w, h, 30); fillStroke(ctx, '#d9e6ee', 12);
  const wl = y - h * water * .92;
  ctx.save(); rrect(ctx, x - w / 2 + 14, y - h + 14, w - 28, h - 28, 20); ctx.clip();
  ctx.beginPath(); ctx.moveTo(x - w, wl);
  for (let k = 0; k <= 40; k++) { const px = x - w / 2 + k / 40 * w; ctx.lineTo(px, wl + Math.sin(k * .7 + t * 4) * 8); }
  ctx.lineTo(x + w, y + 10); ctx.lineTo(x - w, y + 10); ctx.closePath();
  const g = ctx.createLinearGradient(0, wl, 0, y); g.addColorStop(0, 'rgba(70,180,230,.55)'); g.addColorStop(1, 'rgba(20,90,170,.7)'); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  return { wl };
}
function tankGlass(ctx, x, y, w, h) {
  ctx.save(); rrect(ctx, x - w / 2 + 14, y - h + 14, w - 28, h - 28, 20); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(x - w / 2 + 60, y - h); ctx.lineTo(x - w / 2 + 160, y - h); ctx.lineTo(x - w / 2 - 40, y); ctx.lineTo(x - w / 2 - 140, y); ctx.closePath(); ctx.fill();
  ctx.restore();
  rrect(ctx, x - w / 2, y - h, w, h, 30); fillStroke(ctx, null, 12);
  // steel frame bands
  for (const k of [.33, .66]) line(ctx, x - w / 2, y - h * k, x + w / 2, y - h * k, 10, 'rgba(34,28,34,.55)');
}
// a fuselage tube (side) for the tank shots: square windows, optional crack + bulge
function tube(ctx, x, y, len, ht, o = {}) {
  const b = o.bulge || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 1 + b * .07);
  rrect(ctx, -len / 2, -ht / 2, len, ht, ht / 2); fillStroke(ctx, '#eef1f4', 9);
  ctx.save(); rrect(ctx, -len / 2, -ht / 2, len, ht, ht / 2); ctx.clip();
  ctx.fillStyle = '#c3ccd6'; ctx.fillRect(-len, ht * .2, len * 2, ht); ctx.fillStyle = '#1f4fa8'; ctx.fillRect(-len, ht * .08, len * 2, ht * .09);
  // rivet seams
  for (let i = -6; i <= 6; i++) line(ctx, i * len / 13, -ht / 2, i * len / 13, ht / 2, 2.5, 'rgba(60,70,90,.35)');
  ctx.restore();
  const n = o.n || 7; const ww = ht * .2;
  for (let i = 0; i < n; i++) { const wx = -len * .38 + i * (len * .76) / (n - 1); ctx.beginPath(); ctx.rect(wx - ww / 2, -ht * .3, ww, ww); fillStroke(ctx, '#2b3c55', 5); }
  rrect(ctx, -len / 2, -ht / 2, len, ht, ht / 2); fillStroke(ctx, null, 9);
  ctx.restore();
}
// zigzag crack from (x,y) heading angle a with length L
function crack(ctx, x, y, a, L, lw = 8, seed = 2, col = '#e0392f') {
  if (L <= 0) return; const R = rng(seed); ctx.beginPath(); ctx.moveTo(x, y); let px = x, py = y, d = 0;
  const step = 22; while (d < L) { const s = Math.min(step, L - d); const j = (R() - .5) * 1.1; px += Math.cos(a + j) * s; py += Math.sin(a + j) * s; ctx.lineTo(px, py); d += s; }
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  if (col) { ctx.lineWidth = lw * .45; ctx.strokeStyle = col; ctx.stroke(); }
  return [px, py];
}
// ---- stress diagram: a metal plate with an opening; lines of stress flow around it ----
// shape: 'square' | 'round'. hw/hh: half size of opening. r: corner radius
function holePath(ctx, cx, cy, hw, hh, r) { ctx.beginPath(); ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, r); }
function stressPlate(ctx, cx, cy, o) {
  const { hw, hh, r, t, glow = 0, pulse = 0, flow = 1, crackL = 0, plateW = 900, plateH = 1000, lines = 13 } = o;
  // plate
  rrect(ctx, cx - plateW / 2, cy - plateH / 2, plateW, plateH, 26); fillStroke(ctx, '#dfe4ea', 10);
  ctx.save(); rrect(ctx, cx - plateW / 2, cy - plateH / 2, plateW, plateH, 26); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(cx - plateW / 2, cy - plateH / 2, plateW, 40);
  // rivets around the edge
  for (let i = 0; i < 12; i++) { circle(ctx, cx - plateW / 2 + 40 + i * (plateW - 80) / 11, cy - plateH / 2 + 32, 7); circle(ctx, cx - plateW / 2 + 40 + i * (plateW - 80) / 11, cy + plateH / 2 - 32, 7); }
  ctx.fillStyle = '#aeb7c2'; ctx.fill();
  // stress lines run vertically (load pulls top/bottom); they detour around the opening
  const R = r / Math.max(hw, 1);
  const prof = y => { // how far the opening pushes a line sideways at height y (0..1)
    const u = Math.abs(y - cy) / hh;
    if (u >= 1.25) return 0;
    if (R > .6) { const k = clamp(u / 1.2); return Math.sqrt(Math.max(0, 1 - k * k)); }
    const e = .045; return u < 1 ? 1 : clamp(1 - (u - 1) / e) * 1 + 0; // nearly a step: sharp kink at the corner
  };
  for (let i = 0; i < lines; i++) {
    const k = (i + .5) / lines; const x0 = cx - plateW / 2 + 60 + k * (plateW - 120); const dx0 = x0 - cx; const sgn = dx0 < 0 ? -1 : 1;
    const pts = [];
    for (let y = cy - plateH / 2; y <= cy + plateH / 2; y += 6) {
      const p = prof(y); const base = Math.abs(dx0); const push = hw + 16;
      const nx = sgn * Math.sqrt(base * base + (push * p) * (push * p) * (base < push ? 1 : Math.max(0, 1 - (base - push) / 260)));
      pts.push([cx + nx, y]);
    }
    const near = Math.abs(dx0) < hw * 1.2;
    const hot = near ? glow : 0;
    ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.lineWidth = 7; ctx.strokeStyle = mix('#3a7bd5', '#e0392f', hot * .9); ctx.globalAlpha = .9; ctx.stroke();
    // moving dashes = the stress flowing
    ctx.setLineDash([26, 40]); ctx.lineDashOffset = -t * 160 * flow; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  ctx.restore();
  // hot spots at the corners (square) or a soft band (round)
  if (glow > 0) {
    const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const [sx, sy] of corners) {
      const px = cx + sx * (hw - r * .3), py = cy + sy * (hh - r * .3);
      const rad = (R > .6 ? 70 : 110) * (1 + pulse * .45);
      const g = ctx.createRadialGradient(px, py, 4, px, py, rad);
      const col = R > .6 ? '80,200,140' : '255,70,40';
      g.addColorStop(0, `rgba(${col},${.85 * glow})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
  }
  // the opening itself (a window)
  holePath(ctx, cx, cy, hw, hh, r); const sg = ctx.createLinearGradient(0, cy - hh, 0, cy + hh); sg.addColorStop(0, '#3ea6ee'); sg.addColorStop(1, '#c9ecfb'); ctx.fillStyle = sg; ctx.fill();
  ctx.save(); holePath(ctx, cx, cy, hw, hh, r); ctx.clip(); drawCloud(ctx, cx - hw * .3 + t * 20, cy + hh * .2, hw * .35, 2); ctx.restore();
  holePath(ctx, cx, cy, hw, hh, r); fillStroke(ctx, null, 12);
  if (crackL > 0) crack(ctx, cx + hw, cy - hh, -.75, crackL, 9, 3);
}
// cabin interior for the final shot
function cabinBG(ctx, cam, t) {
  applyCam(ctx, cam, 1);
  ctx.fillStyle = '#ede6dc'; ctx.fillRect(-600, -600, 2400, 3200);
  const g = ctx.createLinearGradient(0, 300, 0, 1900); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,90,70,.18)'); ctx.fillStyle = g; ctx.fillRect(-600, -600, 2400, 3200);
  // overhead bins
  rrect(ctx, -400, -300, 1900, 420, 40); fillStroke(ctx, '#f7f3ec', 9);
  line(ctx, -400, 70, 1500, 70, 6, 'rgba(34,28,34,.25)');
}
function bigWindow(ctx, cx, cy, hw, hh, r, t, frame = 1) {
  rrect(ctx, cx - hw - 40, cy - hh - 40, (hw + 40) * 2, (hh + 40) * 2, r + 40); fillStroke(ctx, '#f9f6f0', 10);
  holePath(ctx, cx, cy, hw, hh, r); const g = ctx.createLinearGradient(0, cy - hh, 0, cy + hh); g.addColorStop(0, '#2f8fe0'); g.addColorStop(1, '#d6f0fc'); ctx.fillStyle = g; ctx.fill();
  ctx.save(); holePath(ctx, cx, cy, hw, hh, r); ctx.clip();
  drawCloud(ctx, cx - 120 - t * 40, cy + hh * .45, 120, 3); drawCloud(ctx, cx + 200 - t * 25, cy - hh * .2, 80, 5, .9); drawCloud(ctx, cx + 500 - t * 40, cy + hh * .7, 140, 6);
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(cx - hw, cy - hh * .2); ctx.lineTo(cx - hw * .2, cy - hh); ctx.lineTo(cx, cy - hh); ctx.lineTo(cx - hw, cy + hh * .1); ctx.closePath(); ctx.fill();
  ctx.restore();
  holePath(ctx, cx, cy, hw, hh, r); fillStroke(ctx, null, 12);
}
