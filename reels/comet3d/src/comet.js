import * as THREE from 'three';
import { materials } from './materials.js';
import { rng } from './textures.js';

export const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const mesh = (g, m, p = [0, 0, 0], r = [0, 0, 0]) => { const x = new THREE.Mesh(g, m); x.position.set(...p); x.rotation.set(...r); return x; };
const smooth = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// ---------------- sky stage helpers ----------------
export function hideGround(scene) { scene.traverse(o => { if (o.isMesh && o.material && o.material.isShadowMaterial) o.visible = false; }); }
export function setSky(scene, top, mid, horizon, floorC) {
  const u = scene.userData.sky.material.uniforms;
  u.top.value.set(top); u.mid.value.set(mid); u.horizon.value.set(horizon); u.floorC.value.set(floorC);
}

// ---------------- the jet ----------------
// nose along +x, length ~4.1, fuselage radius 0.32. Built as a back piece and a front piece split at x = cut.
const R0 = 0.32;
export function fuseR(x) {
  if (x < -1.3) return Math.max(0.05, R0 * Math.pow(smooth((x + 2.08) / 0.78), 0.6));
  if (x > 1.45) return R0 * Math.sqrt(Math.max(0, 1 - ((x - 1.45) / 0.62) ** 2));
  return R0;
}
function fuseLathe(a, b, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push(new THREE.Vector2(Math.max(1e-3, fuseR(x)), x)); }
  const g = new THREE.LatheGeometry(pts, 64);
  g.rotateZ(-Math.PI / 2); // lathe axis (y) -> +x
  g.rotateX(Math.PI / 2);  // lathe seam to the bottom
  g.computeVertexNormals();
  return g;
}
function winShape(w, h, r) {
  const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export const WIN = { y: 0.07, w: 0.085, h: 0.1, xs: [] };
for (let x = -1.05; x <= 1.3; x += 0.16) WIN.xs.push(+x.toFixed(3));
export function jet({ win = 'square', cut = 0.45, mats = null } = {}) {
  const M = materials();
  const paint = mats?.paint || M.paint, blue = mats?.blue || M.paintBlue;
  const g = new THREE.Group(); const back = new THREE.Group(), front = new THREE.Group(); g.add(back, front);
  const inner = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9, side: THREE.BackSide });
  const fb = mesh(fuseLathe(-2.08, cut), paint), ff = mesh(fuseLathe(cut, 2.07), paint);
  back.add(fb, mesh(fuseLathe(-2.08, cut), inner)); front.add(ff, mesh(fuseLathe(cut, 2.07), inner));
  g.fuseBack = fb; g.fuseFront = ff; g.back = back; g.front = front;
  // cheat line
  const addStripe = (a, b, grp) => { if (b <= a) return; for (const s of [1, -1]) grp.add(mesh(new THREE.BoxGeometry(b - a, 0.04, 0.012), blue, [(a + b) / 2, -0.03, s * 0.319])); };
  addStripe(-1.25, Math.min(cut, 1.4) - 0.01, back); addStripe(Math.max(cut, -1.25) + 0.01, 1.4, front);
  // windows
  const r = win === 'round' ? 0.038 : 0.004;
  const wg = new THREE.ExtrudeGeometry(winShape(WIN.w, WIN.h, r), { depth: 0.012, bevelEnabled: false, curveSegments: 10 });
  for (const x of WIN.xs) for (const s of [1, -1]) {
    const w = mesh(wg, M.glass, [x, WIN.y, s * 0.307]); if (s < 0) w.rotation.y = Math.PI;
    (x + WIN.w / 2 < cut ? back : front).add(w);
  }
  // cockpit
  for (const s of [1, -1]) { const c = mesh(new THREE.BoxGeometry(0.16, 0.06, 0.02), M.glass, [1.72, 0.14, s * 0.19], [0, s * 0.6, s * -0.25]); front.add(c); }
  // wings (swept) + engine intakes in the wing root
  const ws = new THREE.Shape(); ws.moveTo(0.55, 0); ws.lineTo(-0.5, 0); ws.lineTo(-1.25, 2.05); ws.lineTo(-0.98, 2.05); ws.closePath();
  const wgeo = new THREE.ExtrudeGeometry(ws, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }); wgeo.rotateX(Math.PI / 2);
  for (const s of [1, -1]) {
    const w = mesh(wgeo, paint, [0, -0.13, 0]); w.scale.z = s; back.add(w);
    const intake = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 24), M.gunDark, [0.53, -0.14, s * 0.42], [0, 0, Math.PI / 2]); intake.scale.set(1, 1, 1.6); back.add(intake);
    const pod = mesh(new THREE.SphereGeometry(0.11, 24, 12), paint, [0.15, -0.14, s * 0.43]); pod.scale.set(3.6, 0.7, 1.15); back.add(pod);
    back.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), M.gunDark, [-0.24, -0.14, s * 0.43], [0, 0, Math.PI / 2]));
  }
  // tail fin + tailplane
  const fs = new THREE.Shape(); fs.moveTo(-1.35, 0.22); fs.lineTo(-1.85, 1.0); fs.lineTo(-2.1, 1.0); fs.lineTo(-2.06, 0.05); fs.closePath();
  const fgeo = new THREE.ExtrudeGeometry(fs, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }); fgeo.translate(0, 0, -0.02);
  back.add(mesh(fgeo, blue));
  const ts = new THREE.Shape(); ts.moveTo(-1.55, 0); ts.lineTo(-1.95, 0); ts.lineTo(-2.2, 0.72); ts.lineTo(-2.03, 0.72); ts.closePath();
  const tgeo = new THREE.ExtrudeGeometry(ts, { depth: 0.03, bevelEnabled: false }); tgeo.rotateX(Math.PI / 2);
  for (const s of [1, -1]) { const t = mesh(tgeo, paint, [0, 0.06, 0]); t.scale.z = s; back.add(t); }
  shadow(g);
  g.cut = cut;
  // local position of window i's top-right corner on the +z side
  g.corner = (x) => new THREE.Vector3(x + WIN.w / 2, WIN.y + WIN.h / 2, 0.318);
  return g;
}
// split the jet: k 0..1
export function splitJet(j, k) {
  const P = new THREE.Vector3(j.cut, 0, 0);
  const set = (g, rot, off) => { g.rotation.set(...rot); const q = P.clone().applyEuler(g.rotation); g.position.copy(P).sub(q).add(off); };
  set(j.front, [k * 0.35, k * 0.25, -k * 0.6], new THREE.Vector3(k * 0.5, -k * k * 1.1, k * 0.2));
  set(j.back, [-k * 0.2, -k * 0.1, k * 0.3], new THREE.Vector3(-k * 0.25, -k * k * 0.7, -k * 0.1));
}

// ---------------- crack (a thin dark tube that can grow) ----------------
export function crackTube(points, radius = 0.004, mat) {
  const M = materials();
  const path = new THREE.CurvePath();
  for (let i = 0; i < points.length - 1; i++) path.add(new THREE.LineCurve3(points[i], points[i + 1]));
  const segs = (points.length - 1) * 4;
  const g = new THREE.TubeGeometry(path, segs, radius, 6, false);
  const m = new THREE.Mesh(g, mat || M.crackMat);
  const per = 6 * 6; // indices per tubular segment
  m.grow = k => { g.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, k)) * segs) * per); m.visible = k > 0; };
  m.grow(0);
  return m;
}
// zigzag points from p along a direction on the fuselage surface (+z side), dir in (x, angle) space
export function fuseCrackPts(x0, a0, dx, da, n = 12, seed = 3, r = R0 + 0.004) {
  const R = rng(seed); const pts = []; let x = x0, a = a0;
  for (let i = 0; i <= n; i++) { pts.push(new THREE.Vector3(x, Math.sin(a) * r, Math.cos(a) * r)); x += dx + (R() - 0.5) * Math.abs(dx + da) * 0.9; a += da + (R() - 0.5) * Math.abs(da) * 0.8; }
  return pts;
}

// ---------------- clouds ----------------
export function cloud(seed = 1, s = 1) {
  const M = materials(); const R = rng(seed); const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const r = (0.45 + R() * 0.45) * s; const x = (R() - 0.5) * 2.6 * s, z = (R() - 0.5) * 1.2 * s;
    const m = mesh(new THREE.SphereGeometry(r, 24, 16), M.cloud, [x, r * 0.35 - Math.abs(x) * 0.12, z]); m.scale.y = 0.75; g.add(m);
  }
  return g;
}
export function cloudField(seed, n, area, y, s = 1) {
  const R = rng(seed); const g = new THREE.Group();
  for (let i = 0; i < n; i++) { const c = cloud(seed * 10 + i, s * (0.7 + R() * 0.7)); c.position.set((R() - 0.5) * area[0], y + (R() - 0.5) * 0.6, (R() - 0.5) * area[1]); g.add(c); }
  return g;
}

// ---------------- propeller plane (nose +x) ----------------
export function propPlane() {
  const M = materials(); const g = new THREE.Group();
  const f = mesh(new THREE.CapsuleGeometry(0.17, 1.3, 8, 20), M.red, [0, 0, 0], [0, 0, Math.PI / 2]); g.add(f);
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.04, 2.6), M.hatYellow, [0.1, -0.08, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.25, 0.03, 0.8), M.hatYellow, [-0.75, 0.02, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.25, 0.35, 0.03), M.red, [-0.78, 0.2, 0]));
  const cp = mesh(new THREE.SphereGeometry(0.13, 20, 12), M.glass, [0.2, 0.15, 0]); cp.scale.set(1.6, 0.8, 0.9); g.add(cp);
  const hub = mesh(new THREE.ConeGeometry(0.08, 0.15, 16), M.gunDark, [0.88, 0, 0], [0, 0, -Math.PI / 2]); g.add(hub);
  const prop = new THREE.Group(); prop.position.set(0.86, 0, 0); g.add(prop);
  for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(0.02, 0.36, 0.05), M.gunDark, [0, 0.18, 0]); const p = new THREE.Group(); p.rotation.x = i * Math.PI * 2 / 3; p.add(b); prop.add(p); }
  const disc = mesh(new THREE.CircleGeometry(0.38, 32), new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false }), [0.87, 0, 0], [0, Math.PI / 2, 0]); g.add(disc);
  g.prop = prop;
  return shadow(g);
}

// ---------------- hard hat (on a human head group) ----------------
export function hardHat(h) {
  const M = materials(); const g = new THREE.Group();
  const dome = mesh(new THREE.SphereGeometry(0.118, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.hatYellow); dome.scale.set(1, 1.0, 1.1); g.add(dome);
  const brim = mesh(new THREE.CylinderGeometry(0.14, 0.145, 0.014, 32), M.hatYellow, [0, 0.0, 0.02]); brim.scale.z = 1.12; g.add(brim);
  g.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 0.24), M.hatYellow, [0, 0.11, 0]));
  g.position.set(0, 0.155, -0.005); g.rotation.x = -0.12;
  h.j.head.add(shadow(g));
  return g;
}

// ---------------- lab: floor, tank, crane, fuselage section ----------------
export function labFloor(scene) {
  const M = materials();
  const f = mesh(new THREE.CircleGeometry(14, 64), M.concrete, [0, 0.001, 0], [-Math.PI / 2, 0, 0]); f.receiveShadow = true; scene.add(f);
  return f;
}
export const TANK = { w: 5.2, h: 2.3, d: 2.4 };
export function tank() {
  const M = materials(); const g = new THREE.Group(); const { w, h, d } = TANK;
  g.add(mesh(new THREE.BoxGeometry(w + 0.2, 0.12, d + 0.2), M.steelDark, [0, 0.06, 0]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.1, h, 0.1), M.steelDark, [sx * w / 2, h / 2, sz * d / 2]));
  for (const sz of [-1, 1]) for (const y of [h, h * 0.5]) g.add(mesh(new THREE.BoxGeometry(w, 0.08, 0.08), M.steelDark, [0, y, sz * d / 2]));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.08, 0.08, d), M.steelDark, [sx * w / 2, h, 0]));
  shadow(g);
  const glass = mesh(new THREE.BoxGeometry(w - 0.02, h - 0.12, d - 0.02), M.tankGlass, [0, h / 2 + 0.06, 0]); glass.renderOrder = 3; g.add(glass);
  const water = mesh(new THREE.BoxGeometry(w - 0.06, 1, d - 0.06), M.water); water.renderOrder = 2; g.add(water);
  g.setWater = (level) => { water.scale.y = Math.max(0.01, level * (h - 0.2)); water.position.y = 0.12 + water.scale.y / 2; };
  g.setWater(0.9);
  return g;
}
// a fuselage tube (axis x), square windows on the +z/-z sides, stub wings
export function fuseSection(len = 4.2, r = 0.62) {
  const M = materials(); const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const pts = []; const n = 50;
  for (let i = 0; i <= n; i++) { const x = -len / 2 + len * i / n; const e = Math.min(1, (len / 2 - Math.abs(x)) / 0.35); pts.push(new THREE.Vector2(Math.max(0.02, r * Math.sqrt(Math.max(0, 1 - (1 - e) ** 2))), x)); }
  const lg = new THREE.LatheGeometry(pts, 64); lg.rotateZ(-Math.PI / 2); lg.rotateX(Math.PI / 2); lg.computeVertexNormals();
  const skin = mesh(lg, M.alu); body.add(skin); g.skin = skin;
  for (const s of [1, -1]) body.add(mesh(new THREE.BoxGeometry(len - 0.8, 0.07, 0.02), M.paintBlue, [0, -0.08, s * (r - 0.0)]));
  const wg = new THREE.ExtrudeGeometry(winShape(0.16, 0.19, 0.006), { depth: 0.02, bevelEnabled: false });
  g.winXs = [];
  for (let x = -1.4; x <= 1.45; x += 0.36) { g.winXs.push(x); for (const s of [1, -1]) { const w = mesh(wg, M.glass, [x, 0.13, s * (r - 0.03)]); if (s < 0) w.rotation.y = Math.PI; body.add(w); } }
  // rivet seams
  for (let x = -1.6; x <= 1.6; x += 0.4) { const t = mesh(new THREE.TorusGeometry(r + 0.003, 0.006, 6, 64), M.steelDark, [x, 0, 0], [0, Math.PI / 2, 0]); body.add(t); }
  // stub wings (poke out of the tank)
  const ws = new THREE.Shape(); ws.moveTo(0.6, 0); ws.lineTo(-0.6, 0); ws.lineTo(-1.1, 2.0); ws.lineTo(-0.75, 2.0); ws.closePath();
  const wgeo = new THREE.ExtrudeGeometry(ws, { depth: 0.06, bevelEnabled: false }); wgeo.rotateX(Math.PI / 2);
  for (const s of [1, -1]) { const w = mesh(wgeo, M.alu, [0.1, -0.25, 0]); w.scale.z = s; body.add(w); }
  g.body = body; g.r = r;
  g.corner = (x) => new THREE.Vector3(x + 0.08, 0.13 + 0.095, r - 0.01);
  return shadow(g);
}
export function crane(cableTo) {
  const M = materials(); const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(7, 0.25, 0.25), M.craneYellow, [0, 4.6, 0]));
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, 4.7, 0.22), M.craneYellow, [s * 3.4, 2.35, -1.6]));
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.22, 1.8), M.craneYellow, [-3.4, 4.6, -0.8])); g.add(mesh(new THREE.BoxGeometry(0.22, 0.22, 1.8), M.craneYellow, [3.4, 4.6, -0.8]));
  const trolley = mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), M.steelDark, [0, 4.4, 0]); g.add(trolley);
  const cables = [];
  for (const s of [-1, 1]) { const c = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), M.gunDark); g.add(c); cables.push([c, s]); }
  g.setLoad = (y) => { for (const [c, s] of cables) { const top = new THREE.Vector3(0, 4.3, 0), bot = new THREE.Vector3(s * 1.2, y + 0.6, 0); c.position.copy(top).add(bot).multiplyScalar(0.5); const d = bot.clone().sub(top); c.scale.y = d.length(); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); } };
  return shadow(g);
}
// pump with a lever (pivot at .lever)
export function pump() {
  const M = materials(); const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.45, 0.7, 0.4), M.red, [0, 0.35, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 20), M.steelDark, [0, 0.78, 0]));
  const lever = new THREE.Group(); lever.position.set(0, 0.82, 0); g.add(lever);
  lever.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 10), M.steel, [0, 0.4, 0]));
  lever.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 12), M.leather, [0, 0.8, 0], [0, 0, Math.PI / 2]));
  g.lever = lever;
  return shadow(g);
}
// pressure gauge facing +z
export function gauge() {
  const M = materials(); const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 40), M.steelBright, [0, 0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.6 }), [0, 0, 0.041]));
  for (let i = 0; i <= 8; i++) { const a = -Math.PI * 1.25 + i / 8 * Math.PI * 1.5; const t = mesh(new THREE.BoxGeometry(0.008, 0.04, 0.004), i > 6 ? M.red : M.gunDark, [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.043], [0, 0, a - Math.PI / 2]); g.add(t); }
  const needle = new THREE.Group(); needle.position.z = 0.046; g.add(needle);
  needle.add(mesh(new THREE.BoxGeometry(0.012, 0.15, 0.006), M.red, [0, 0.07, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12), M.gunDark, [0, 0, 0.05], [Math.PI / 2, 0, 0]));
  g.set = v => { needle.rotation.z = -(-Math.PI * 1.25 + Math.max(0, Math.min(1, v)) * Math.PI * 1.5 - Math.PI / 2) - Math.PI; };
  return shadow(g);
}

// ---------------- the stress plate: a metal panel with a window opening ----------------
export const PLATE = { w: 1.5, h: 1.9, hw: 0.27, hh: 0.33, t: 0.05 };
export function plate(cornerR) {
  const M = materials(); const { w, h, hw, hh, t } = PLATE;
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
  s.holes.push(winShape(hw * 2, hh * 2, Math.max(0.004, cornerR)));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -t);
  const grp = new THREE.Group();
  const m = mesh(g, M.alu); grp.add(m); grp.panel = m;
  // flat front face for the ripple overlay (sits on the front)
  const fs = new THREE.ShapeGeometry(s, 24); const face = mesh(fs, new THREE.MeshBasicMaterial({ visible: false }), [0, 0, 0.0115]); grp.add(face); grp.face = face;
  // rivets around the edge
  for (let i = 0; i < 9; i++) for (const sy of [-1, 1]) grp.add(mesh(new THREE.SphereGeometry(0.018, 12, 8), M.steelDark, [-w / 2 + 0.1 + i * (w - 0.2) / 8, sy * (h / 2 - 0.08), 0.012]));
  for (let i = 1; i < 10; i++) for (const sx of [-1, 1]) grp.add(mesh(new THREE.SphereGeometry(0.018, 12, 8), M.steelDark, [sx * (w / 2 - 0.08), -h / 2 + 0.08 + i * (h - 0.16) / 10, 0.012]));
  return shadow(grp);
}
// stress flow lines over the plate (vertical load), detouring round the opening. round: soft detour; else a hard kink at the corner
export function stressLines(round, n = 15) {
  const { w, h, hw, hh } = PLATE; const g = new THREE.Group(); const lines = [];
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n; const x0 = -w / 2 + 0.1 + k * (w - 0.2); const sg = x0 < 0 ? -1 : 1; const base = Math.abs(x0);
    const pts = [];
    for (let y = -h / 2 + 0.1; y <= h / 2 - 0.1 + 1e-6; y += 0.02) {
      const u = Math.abs(y) / hh; let p;
      if (round) { const kk = Math.min(1, u / 1.35); p = Math.sqrt(Math.max(0, 1 - kk * kk)); }
      else p = u < 1 ? 1 : Math.max(0, 1 - (u - 1) / 0.06);
      const push = hw + 0.03; const fall = base < push ? 1 : Math.max(0, 1 - (base - push) / 0.32);
      const nx = sg * Math.sqrt(base * base + (push * p) ** 2 * fall);
      pts.push(new THREE.Vector3(nx, y, 0.02));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const near = base < hw * 1.25;
    const mat = new THREE.MeshBasicMaterial({ color: near && !round ? 0xff3a2a : 0x3b8cff, toneMapped: false, transparent: true, opacity: 0.85 });
    const tube = mesh(new THREE.TubeGeometry(curve, 120, 0.007, 6, false), mat); g.add(tube);
    lines.push({ curve, near, mat });
  }
  g.lines = lines;
  return g;
}
