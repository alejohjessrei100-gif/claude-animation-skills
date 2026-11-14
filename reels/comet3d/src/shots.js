import * as THREE from 'three';
import { makeHuman } from './human.js';
import { glowSprite, sparks, rippleOverlay } from './props.js';
import { materials } from './materials.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake, ikArm } from './anim.js';
import { hideGround, setSky, jet, splitJet, crackTube, fuseCrackPts, cloud, cloudField, propPlane, hardHat, labFloor, tank, TANK, fuseSection, crane, pump, gauge, plate, PLATE, stressLines, shadow } from './comet.js';
import { rng } from './textures.js';

export const DURATION = 37.2;

// [start, text, end?]
export const CAPTIONS = [
  [0.00, 'What if one'], [0.64, 'sharp corner could'], [1.52, 'tear a jet'], [2.24, 'in half?'],
  [3.12, 'In 1952'], [4.24, 'the Comet became'], [5.12, 'the world\'s first'], [5.84, 'jet airliner'],
  [6.80, 'It flew higher'], [7.60, 'and faster than'], [8.32, 'any passenger plane'], [9.28, 'before it'],
  [9.84, 'But in 1954'], [11.12, 'two Comets broke'], [12.00, 'apart in mid-air'], [13.04, 'just three months'], [13.68, 'apart'],
  [14.32, 'So engineers sank'], [15.44, 'a whole Comet'], [16.16, 'in a giant'], [16.64, 'water tank'],
  [17.36, 'They pumped the cabin'], [18.24, 'up and let'], [18.72, 'it down'], [19.28, 'again and again'], [20.24, 'like flight after'], [21.04, 'flight'],
  [21.68, 'After about 3000'], [22.80, 'cycles'], [23.44, 'it ripped open'],
  [24.40, 'The crack began'], [25.20, 'at the sharp'], [25.76, 'corner of a cabin'], [26.56, 'opening'],
  [27.04, 'Every flight'], [27.76, 'stress piled up'], [28.64, 'at those corners'], [29.28, 'and tiny cracks'], [30.16, 'grew a little'], [30.72, 'longer'],
  [31.28, 'A rounded corner'], [32.16, 'lets that stress'], [32.80, 'flow smoothly around'], [33.68, 'the curve'],
  [34.32, 'That\'s why every'], [34.88, 'plane window you\'ve'], [35.68, 'ever looked through'], [36.24, 'is round', 37.0],
];
// dip to black on the "But" turn
export const FADES = [[9.62, 9.76, 9.8, 9.94]];

const STAND = { lSh: [0.05, 0, 0.16], rSh: [0.05, 0, -0.16], lEl: [-0.25, 0, 0], rEl: [-0.25, 0, 0], lHip: [0, 0, 0.07], rHip: [0, 0, -0.07], lAn: [0, 0, -0.07], rAn: [0, 0, 0.07] };
function standPose(h, t, extra = {}) { const p = { ...STAND, ...extra }; p.chest = [Math.sin(t * 1.6) * 0.012 + (extra.chest?.[0] || 0), extra.chest?.[1] || 0, extra.chest?.[2] || 0]; h.setPose(p); }
function ripple(target, center, { amp, radius, rings = 260, spot = 0.03, spotAmp = 1, t = 0, blot = 0 }) {
  const u = target.material.uniforms; u.uCenter.value.copy(center); u.uAmp.value = amp; u.uRadius.value = radius; u.uRings.value = rings; u.uSpot.value = spot; u.uSpotAmp.value = spotAmp; u.uTime.value = t; u.uBlot.value = blot;
}
// debris chunks thrown from a point (deterministic in t)
function debris(scene, n, seed, mat, size = 0.05) {
  const R = rng(seed); const items = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(size * (0.5 + R()), size * 0.15, size * (0.4 + R())), mat); m.castShadow = true; scene.add(m); items.push({ m, v: V(R() - 0.5, R() * 0.8 - 0.2, R() - 0.5).normalize().multiplyScalar(0.6 + R() * 1.4), w: V(R() * 9, R() * 9, R() * 9) }); }
  return (origin, it) => { for (const d of items) { d.m.visible = it > 0; if (it <= 0) continue; d.m.position.copy(origin).addScaledVector(d.v, it).add(V(0, -1.2 * it * it, 0)); d.m.rotation.set(d.w.x * it, d.w.y * it, d.w.z * it); } };
}
function smoke(scene, n, seed, color = 0x55565c) {
  const R = rng(seed); const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.8, depthWrite: false });
  const items = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat); scene.add(m); items.push({ m, v: V(R() - 0.5, R() * 0.5, R() - 0.5), s: 0.1 + R() * 0.15 }); }
  return (origin, it) => { mat.opacity = clamp(0.85 - it * 0.35); for (const d of items) { d.m.visible = it > 0; d.m.position.copy(origin).addScaledVector(d.v, it * 0.8); d.m.scale.setScalar(d.s * (0.4 + it * 1.2)); } };
}

// ============ 1: a sharp window corner cracks and the jet tears in half ============
function shot1({ makeStage }) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-2, 6, 5] }); hideGround(scene);
  const J = jet({ cut: 0.425 }); scene.add(J); // window at x=0.39: its top-right corner sits on the cut
  const corner = J.corner(0.39);
  scene.add(cloudField(3, 10, [30, 20], -4, 1.3));
  const rB = rippleOverlay(J.fuseBack), rF = rippleOverlay(J.fuseFront);
  const ang0 = Math.atan2(corner.y, corner.z);
  const c1 = crackTube(fuseCrackPts(corner.x, ang0, 0.002, 0.16, 14, 4)); J.back.add(c1);
  const c2 = crackTube(fuseCrackPts(corner.x, ang0, -0.002, -0.2, 16, 7)); J.back.add(c2);
  const sp = sparks(160, { speed: 1.6, spread: 1.4, gravity: -2, life: 1.2, size: 0.035, seed: 5, dir: V(0, 0, 1), color: [1, 0.7, 0.35] }); scene.add(sp);
  const deb = debris(scene, 24, 2, materials().paint, 0.09);
  const sm = smoke(scene, 10, 4);
  const c = cam(32);
  const TS = 2.4;
  return {
    scene, camera: c,
    update(t) {
      J.position.y = Math.sin(t * 1.5) * 0.01;
      const it = t - TS;
      splitJet(J, it > 0 ? easeOut(range(it, 0, 0.6)) * 0.6 + it * 0.12 : 0);
      const amp = smooth(range(t, 0.05, 0.6)) * (it > 0 ? clamp(1 - it * 2) : 1);
      for (const r of [rB, rF]) ripple(r, corner, { amp, radius: 0.05 + easeOut(range(t, 0.1, 2.4)) * 0.45, rings: 320, spot: 0.02, t });
      const g = easeIn(range(t, 1.45, 2.4)); c1.grow(g); c2.grow(g);
      scene.updateMatrixWorld(true);
      const cw = J.back.localToWorld(corner.clone());
      sp.position.copy(cw); sp.update(it); deb(cw, it); sm(cw, it);
      // camera: tight on the corner, pulls back to a 3/4 view as it cracks
      const k = easeInOut(range(t, 0.9, 2.35));
      const s = shake(t, it > 0 ? 6 * Math.exp(-it * 3) + 0.8 : 0.8, 1);
      const pos = [lerp(cw.x + 0.15, 2.4, k) + s[0], lerp(cw.y + 0.1, 0.75, k) + s[1], lerp(cw.z + 0.95, 3.4, k)];
      const look = [lerp(cw.x, 0.25, k), lerp(cw.y, -0.05, k), lerp(cw.z, 0, k)];
      place(c, pos, look, Math.sin(t * 0.7) * 0.02);
      return { dof: { focus: c.position.distanceTo(cw), aperture: lerp(0.03, 0.004, k), maxblur: 0.012 }, bloom: it > 0 ? 0.9 : 0.4 };
    },
  };
}

// ============ 2: 1952, the Comet, the first jet airliner ============
function shot2({ makeStage }) {
  const scene = makeStage({ shadowSize: 3, sunDir: [-1, 6, 4], sun: 2.6 }); hideGround(scene);
  const J = jet(); scene.add(J);
  const cf = cloudField(7, 14, [40, 24], -3.5, 1.4); scene.add(cf);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      J.rotation.set(Math.sin(t * 0.8) * 0.04, 0, 0.03); J.position.y = Math.sin(t * 1.3) * 0.03;
      cf.position.x = -t * 3.5;
      const k = easeInOut(range(t, 0, 3.75));
      const a = lerp(0.55, 1.35, k); const R = lerp(4.8, 4.2, k);
      place(c, [Math.cos(a) * R + 0.3, lerp(-0.6, 0.35, k), Math.sin(a) * R], [lerp(0.6, 0.0, k), 0.05, 0]);
      return { dof: { focus: R, aperture: 0.0015, maxblur: 0.006 }, bloom: 0.45 };
    },
  };
}

// ============ 3: higher and faster than any passenger plane ============
function shot3({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-2, 6, 4] }); hideGround(scene);
  setSky(scene, 0x1c5fc4, 0x4a95e6, 0x9ccbf4, 0xb8dcf8);
  const P = propPlane(); scene.add(P);
  const J = jet(); J.scale.setScalar(0.9); scene.add(J);
  const cf = cloudField(11, 16, [50, 24], -3, 1.4); scene.add(cf);
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      P.prop.rotation.x = t * 40; P.position.y = Math.sin(t * 2) * 0.03; P.rotation.z = Math.sin(t * 1.3) * 0.03;
      cf.position.x = -t * 2.5;
      // the jet roars past above and climbs away
      const x = kf(t, [[0, -7], [1.2, 0.5], [3.05, 9]], v => v);
      const climb = smooth(range(t, 0.7, 3));
      J.position.set(x, 0.9 + climb * 1.6, -1.6); J.rotation.z = 0.04 + climb * 0.22;
      const k = easeInOut(range(t, 0, 3.05));
      const s = shake(t, 1.2 + 2 * Math.exp(-((t - 1.2) ** 2) * 6), 3);
      place(c, [lerp(-3.2, -2.6, k) + s[0], 0.7 + s[1], 4.4], [lerp(0.6, 1.6, k), lerp(0.55, 1.2, k), -0.8]);
      return { dof: { focus: 3.4, aperture: 0.002, maxblur: 0.008 }, bloom: 0.4 };
    },
  };
}

// ============ 4: 1954, two Comets break apart in mid-air ============
function shot4({ makeStage }) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-4, 3, 4], sun: 2.0 }); hideGround(scene);
  setSky(scene, 0x2a3f78, 0x6f6aa0, 0xf0a46e, 0xf6c79a);
  const M = materials();
  const mk = (pos, seed) => {
    const J = jet({ cut: 0.425 }); J.position.copy(pos); scene.add(J);
    const sp = sparks(140, { speed: 2.2, spread: 1.5, gravity: -2, life: 1.2, size: 0.06, seed, dir: V(0, 0.2, 1), color: [1, 0.6, 0.25] }); scene.add(sp);
    const fire = glowSprite(0xff8a3a, 1); scene.add(fire);
    return { J, sp, fire, deb: debris(scene, 22, seed, M.paint, 0.1), sm: smoke(scene, 12, seed + 1, 0x3c3c44) };
  };
  const A = mk(V(0, 0, 0), 21), B = mk(V(5.5, -0.6, -4), 31);
  scene.add(cloudField(17, 14, [40, 30], -4.5, 1.5));
  const h1 = 11.85 - 9.8, h2 = 13.35 - 9.8;
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      for (const [P, h] of [[A, h1], [B, h2]]) {
        const it = t - h;
        P.J.position.x = (P === A ? 0 : 5.5) + t * 0.4;
        splitJet(P.J, it > 0 ? easeOut(range(it, 0, 0.7)) * 0.7 + it * 0.15 : 0);
        P.J.updateMatrixWorld(true);
        const o = P.J.localToWorld(V(0.425, 0, 0));
        P.sp.position.copy(o); P.sp.update(it); P.deb(o, it); P.sm(o, it);
        P.fire.position.copy(o); P.fire.scale.setScalar(it > 0 ? 1.4 * Math.exp(-it * 2) + 0.2 : 0.001); P.fire.material.opacity = it > 0 ? clamp(1 - it * 0.4) : 0;
      }
      // follow jet A, then swing over to jet B
      const pan = easeInOut(range(t, 2.6, 3.4));
      const it = Math.min(Math.abs(t - h1), Math.abs(t - h2));
      const s = shake(t, (t > h1 ? 5 * Math.exp(-(t - h1) * 3) : 0) + (t > h2 ? 5 * Math.exp(-(t - h2) * 3) : 0) + 0.8, 5);
      const ax = 0.4 + t * 0.4, bx = 5.9 + t * 0.4;
      place(c, [lerp(ax + 1.5, bx - 1.2, pan) + s[0], lerp(0.6, 0.2, pan) + s[1], lerp(5.0, 1.2, pan)], [lerp(ax, bx, pan), lerp(-0.1, -0.7, pan), lerp(0, -4, pan)]);
      return { dof: { focus: 5, aperture: 0.0015, maxblur: 0.006 }, bloom: 0.9, exposure: 0.95 };
    },
  };
}

// ============ shared lab scene ============
function labScene(makeStage, opts = {}) {
  const scene = makeStage({ shadowSize: 6, sunDir: [-3, 7, 5], ...opts });
  setSky(scene, 0x3f7fd0, 0x7aaee8, 0xb8d6f2, 0xb8d6f2);
  labFloor(scene);
  const T = tank(); scene.add(T);
  const F = fuseSection(); scene.add(F);
  return { scene, T, F };
}
function worker(scene, pos, rotY) { const h = makeHuman('worker'); h.root.position.copy(pos); h.root.rotation.y = rotY; hardHat(h); scene.add(h.root); return h; }

// ============ 5: engineers sink a whole Comet in a giant water tank ============
function shot5({ makeStage }) {
  const { scene, T, F } = labScene(makeStage);
  const C = crane(); scene.add(C);
  const w1 = worker(scene, V(-2.2, 0, 2.2), 0.9), w2 = worker(scene, V(-1.4, 0, 2.7), 0.5);
  const sp = sparks(220, { speed: 2.2, spread: 0.9, gravity: -5, life: 1.0, size: 0.06, seed: 8, dir: V(0, 1, 0), color: [0.6, 0.85, 1] }); sp.position.set(0, 2.1, 0.9); scene.add(sp);
  const sp2 = sparks(220, { speed: 2.2, spread: 0.9, gravity: -5, life: 1.0, size: 0.06, seed: 9, dir: V(0, 1, 0), color: [0.6, 0.85, 1] }); sp2.position.set(0, 2.1, -0.9); scene.add(sp2);
  const c = cam(40);
  const TS = 15.85 - 14.25;
  return {
    scene, camera: c,
    update(t) {
      const y = kf(t, [[0, 3.4], [0.5, 3.4], [TS, 1.15, easeIn], [TS + 0.4, 1.12]]);
      F.position.set(0, y, 0); C.setLoad(y);
      T.setWater(0.82 + 0.1 * smooth(range(t, TS, TS + 0.3)));
      const it = t - TS; sp.update(it); sp2.update(it);
      const look = smooth(range(t, 0.3, 1.0));
      standPose(w1, t, { neck: [-0.25 * look, -0.25, 0], head: [-0.1, 0, 0] }); w1.setMouth(it > 0 ? 0.6 : 0);
      standPose(w2, t + 1, { neck: [-0.3 * look, 0.2, 0], head: [-0.1, 0, 0], rSh: [-1.6 * smooth(range(t, 0.6, 1.0)), 0, -0.3], rEl: [-0.3, 0, 0] });
      const k = easeInOut(range(t, 0, 3.05));
      const s = shake(t, it > 0 ? 3 * Math.exp(-it * 3) + 0.6 : 0.6, 2);
      place(c, [lerp(-4.3, -3.6, k) + s[0], lerp(2.6, 2.2, k) + s[1], lerp(6.6, 5.8, k)], [0.6, 1.5, 0]);
      return { dof: { focus: 6.5, aperture: 0.0012, maxblur: 0.005 }, bloom: 0.4 };
    },
  };
}

// ============ 6: pumped up and down, flight after flight ============
function pumpPhase(lt) { const x = Math.max(0, lt - 0.2); return x < 1.6 ? x / 1.6 : 1 + (x - 1.6) * (1.2 + (x - 1.6) * 2.4); }
function shot6({ makeStage }) {
  const { scene, T, F } = labScene(makeStage);
  F.position.set(0, 1.12, 0); T.setWater(0.92);
  const pm = pump(); pm.position.set(-3.2, 0, 1.7); pm.rotation.y = 0.3; scene.add(pm);
  const ga = gauge(); ga.position.set(-2.62, 1.55, 1.25); ga.rotation.y = 0.35; scene.add(ga);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), materials().steelDark); pole.position.set(-2.62, 0.75, 1.2); scene.add(pole);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-3.2, 0.5, 1.5), V(-2.9, 0.2, 1.3), V(-2.6, 0.1, 0.4), V(-2.6, 1.3, 0)]), 30, 0.04, 8), materials().gunDark); hose.castShadow = true; scene.add(hose);
  const w = worker(scene, V(-3.75, 0, 1.95), 1.2);
  const rp = rippleOverlay(F.skin);
  const corner = F.corner(-0.32);
  const bub = sparks(90, { speed: 0.35, spread: 0.6, gravity: 0.6, life: 2.5, size: 0.04, seed: 3, dir: V(0, 1, 0), color: [0.8, 0.95, 1] }); bub.position.set(0, 0.6, 0.65); scene.add(bub);
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      const ph = pumpPhase(t); const p = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
      F.body.scale.set(1, 1 + p * 0.04, 1 + p * 0.04);
      pm.lever.rotation.z = lerp(0.55, -0.55, p);
      ga.set(0.15 + p * 0.75);
      bub.update((t % 2.5) + 0.3);
      ripple(rp, corner, { amp: p * 0.95, radius: 0.08 + p * 0.22, rings: 300, spot: 0.025, t });
      // worker works the lever with both hands
      scene.updateMatrixWorld(true);
      const grip = pm.lever.localToWorld(V(0, 0.8, 0));
      standPose(w, t, { spine: [0.15 + p * 0.15, 0, 0], drop: -0.05 - p * 0.05, neck: [0.1, 0.3, 0] });
      w.root.updateMatrixWorld(true);
      ikArm(w, 'l', grip.clone().add(V(0, 0, 0.06)), w.root.localToWorld(V(0.6, 1.0, -0.4)), V(0, 0, 1));
      ikArm(w, 'r', grip.clone().add(V(0, 0, -0.06)), w.root.localToWorld(V(-0.6, 1.0, -0.4)), V(0, 0, 1));
      w.setMouth(ph > 4 ? 0.35 : 0);
      // camera: wide on the rig, then pushes in on the window corner
      const k = easeInOut(range(t, 0, 4.3));
      const s = shake(t, 0.7, 4);
      place(c, [lerp(-3.4, -0.7, k) + s[0], lerp(2.3, 1.55, k) + s[1], lerp(5.6, 2.9, k)], [lerp(-1.5, -0.3, k), lerp(1.15, 1.3, k), lerp(0.6, 0.5, k)]);
      return { dof: { focus: lerp(5, 2.5, k), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.45 };
    },
  };
}

// ============ 7: about 3000 cycles, it rips open ============
function shot7({ makeStage }) {
  const { scene, T, F } = labScene(makeStage);
  F.position.set(0, 1.12, 0); T.setWater(0.92);
  const rp = rippleOverlay(F.skin);
  const corner = F.corner(-0.32);
  const ang0 = Math.atan2(corner.y, corner.z);
  const ck1 = crackTube(fuseCrackPts(corner.x, ang0, 0.012, 0.09, 16, 2, F.r + 0.006), 0.012); F.body.add(ck1);
  const ck2 = crackTube(fuseCrackPts(corner.x, ang0, 0.05, 0.0, 16, 6, F.r + 0.006), 0.012); F.body.add(ck2);
  const panel = new THREE.Mesh(new THREE.CylinderGeometry(F.r + 0.01, F.r + 0.01, 0.5, 24, 1, true, -0.2, 0.7), materials().alu.clone()); panel.material.side = THREE.DoubleSide; panel.rotation.z = Math.PI / 2; scene.add(panel);
  const jetW = sparks(500, { speed: 3.2, spread: 0.7, gravity: -4, life: 1.6, size: 0.06, seed: 12, dir: V(0.2, 0.6, 1), color: [0.55, 0.85, 1] }); scene.add(jetW);
  const deb = debris(scene, 18, 5, materials().alu, 0.08);
  const c = cam(34);
  const TR = 23.6 - 21.6;
  return {
    scene, camera: c,
    update(t) {
      const it = t - TR;
      const tense = smooth(range(t, 0.8, TR));
      const vib = it < 0 ? Math.sin(t * 60) * 0.006 * tense : 0;
      F.body.scale.set(1, 1.03 + vib + tense * 0.02, 1.03 + vib + tense * 0.02);
      ripple(rp, corner, { amp: 0.4 + 0.6 * tense, radius: 0.15 + tense * 0.35, rings: 280, spot: 0.03 + tense * 0.02, spotAmp: 1.3, t, blot: tense * 0.4 });
      const g = it < 0 ? tense * 0.15 : 0.15 + easeOut(range(it, 0, 0.35)) * 0.85; ck1.grow(g); ck2.grow(g);
      scene.updateMatrixWorld(true);
      const cw = F.body.localToWorld(corner.clone());
      // the torn panel flies out
      panel.visible = it > 0.05;
      panel.position.copy(cw).add(V(0.2 + it * 0.4, it * 1.6 - it * it * 2, 0.15 + it * 2.2)); panel.rotation.set(it * 3, it * 2, Math.PI / 2 + it * 4);
      jetW.position.copy(cw); jetW.update(it); deb(cw, it);
      const k = easeInOut(range(t, 0, TR));
      const s = shake(t, it > 0 ? 9 * Math.exp(-it * 2.5) + 1 : 0.5 + tense * 3, 6);
      const R = it > 0 ? lerp(1.6, 3.2, easeOut(range(it, 0, 0.7))) : lerp(2.4, 1.6, k);
      place(c, [cw.x - 0.5 + s[0], cw.y + 0.25 + s[1], cw.z + R], [cw.x, cw.y, cw.z]);
      return { dof: { focus: R, aperture: 0.004, maxblur: 0.01 }, bloom: it > 0 ? 0.7 : 0.45 };
    },
  };
}

// ============ 8: the crack began at the sharp corner of a cabin opening ============
function shot8({ makeStage }) {
  const scene = makeStage({ shadowSize: 2.5, sunDir: [-3, 6, 5] });
  labFloor(scene);
  const M = materials();
  const tbl = new THREE.Group(); scene.add(tbl);
  tbl.add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.2), M.woodDark)); tbl.children[0].position.y = 0.9;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), M.steelDark); l.position.set(sx * 0.9, 0.45, sz * 0.5); tbl.add(l); }
  shadow(tbl);
  const P = plate(0.004); P.position.set(0, 0.95, -0.25); P.rotation.x = -1.15; P.scale.setScalar(0.55); scene.add(P);
  const { hw, hh } = PLATE;
  const crack = crackTube((() => { const R = rng(9); const pts = []; let x = hw, y = hh; for (let i = 0; i < 14; i++) { pts.push(V(x, y, 0.016)); x += 0.025 + (R() - 0.5) * 0.03; y += 0.025 + (R() - 0.5) * 0.03; } return pts; })(), 0.006); P.add(crack); crack.grow(1);
  const rp = rippleOverlay(P.face);
  const w = worker(scene, V(-0.75, 0, 0.45), Math.PI - 0.9);
  // magnifying glass
  const mg = new THREE.Group(); scene.add(mg);
  mg.add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 12, 48), M.rivet));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 48), new THREE.MeshPhysicalMaterial({ color: 0xddeeff, transparent: true, opacity: 0.18, roughness: 0, depthWrite: false })); mg.add(lens);
  const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.22, 12), M.leather); hdl.position.set(0, -0.22, 0); mg.add(hdl);
  shadow(mg);
  const c = cam(36);
  return {
    scene, camera: c,
    update(t) {
      scene.updateMatrixWorld(true);
      const cw = P.localToWorld(V(hw, hh, 0.02));
      const mk = easeInOut(range(t, 0.2, 1.3));
      mg.position.copy(cw).add(V(lerp(-0.25, 0.0, mk), lerp(0.3, 0.17, mk), lerp(0.25, 0.06, mk)));
      mg.lookAt(cw.clone().add(V(0, 0.6, 0.5)));
      standPose(w, t, { spine: [0.35, 0, 0], chest: [0.25, 0, 0], neck: [0.35, 0, 0], head: [0.2, 0, 0], drop: -0.04 });
      w.root.updateMatrixWorld(true);
      ikArm(w, 'r', mg.localToWorld(V(0, -0.3, 0)), w.root.localToWorld(V(-0.6, 1.0, 0.2)), V(0, 1, 0));
      w.setMouth(t > 1.4 ? 0.5 : 0);
      const lc = P.face.worldToLocal(cw.clone());
      ripple(rp, lc, { amp: smooth(range(t, 1.35, 1.6)), radius: 0.05 + easeOut(range(t, 1.35, 2.6)) * 0.25, rings: 260, spot: 0.03, t });
      const k = easeInOut(range(t, 0, 2.65));
      const s = shake(t, 0.6, 8);
      place(c, [lerp(cw.x - 0.5, cw.x - 0.05, k) + s[0], lerp(cw.y + 0.9, cw.y + 0.6, k) + s[1], lerp(cw.z + 1.3, cw.z + 0.6, k)], [lerp(cw.x - 0.1, cw.x, k), cw.y, cw.z]);
      return { dof: { focus: c.position.distanceTo(cw), aperture: lerp(0.004, 0.012, k), maxblur: 0.01 }, bloom: 0.45 };
    },
  };
}

// ============ stress-plate scenes (9 and 10) ============
function plateScene(makeStage, round) {
  const scene = makeStage({ shadowSize: 2, sunDir: [-2, 5, 6] }); hideGround(scene);
  setSky(scene, round ? 0x1f4f8a : 0x2a3150, round ? 0x33689e : 0x3b4466, round ? 0x5a8fc0 : 0x535c7a, round ? 0x5a8fc0 : 0x535c7a);
  const P = plate(round ? 0.24 : 0.004); P.position.set(0, 1.4, 0); scene.add(P);
  const L = stressLines(round); P.add(L);
  const dots = [];
  L.lines.forEach((ln, i) => { for (let j = 0; j < 4; j++) { const d = glowSprite(ln.near && !round ? 0xff6040 : 0x8fc4ff, 0.05); P.add(d); dots.push({ d, ln, ph: (j / 4 + i * 0.137) % 1 }); } });
  const moveDots = (t, sp = 0.18) => { for (const { d, ln, ph } of dots) { const u = (ph + t * sp) % 1; const p = ln.curve.getPointAt(u); d.position.set(p.x, p.y, 0.03); } };
  return { scene, P, L, moveDots };
}
// ============ 9: stress piles up at the corners every flight; cracks grow ============
function shot9({ makeStage }) {
  const { scene, P, L, moveDots } = plateScene(makeStage, false);
  const { hw, hh } = PLATE;
  const rps = [-1, 1].flatMap(sx => [-1, 1].map(sy => [rippleOverlay(P.face), V(sx * hw, sy * hh, 0)]));
  const cracks = [[1, 1, 3], [-1, -1, 5], [1, -1, 7], [-1, 1, 11]].map(([sx, sy, seed]) => {
    const R = rng(seed); const pts = []; let x = sx * hw, y = sy * hh;
    for (let i = 0; i < 12; i++) { pts.push(V(x, y, 0.016)); x += sx * (0.02 + (R() - 0.3) * 0.02); y += sy * (0.02 + (R() - 0.3) * 0.02); }
    const c = crackTube(pts, 0.006); P.add(c); return c;
  });
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      moveDots(t);
      const glow = smooth(range(t, 0.7, 1.9));
      const beat = Math.max(0, t - 1.0) / 0.55; const pulse = t > 1 ? Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 3) : 0;
      for (const [r, cen] of rps) ripple(r, cen, { amp: glow * (0.55 + 0.45 * pulse), radius: 0.06 + glow * 0.12 + pulse * 0.05, rings: 420, spot: 0.025 + pulse * 0.012, spotAmp: 1.3, t });
      const grows = t > 2.4 ? Math.min(5, Math.floor((t - 2.4) / 0.55) + 1) : 0;
      cracks.forEach((ck, i) => ck.grow(grows / 6 * (i === 0 ? 1 : 0.6) + (t > 2.4 ? pulse * 0.03 : 0)));
      P.scale.setScalar(1 + pulse * 0.006);
      const k = easeInOut(range(t, 0, 4.2));
      const s = shake(t, 0.5 + pulse * 1.2, 9);
      place(c, [lerp(-0.7, -0.35, k) + s[0], lerp(1.65, 1.55, k) + s[1], lerp(3.9, 3.1, k)], [0.05, 1.42, 0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.4, 0)), aperture: 0.0015, maxblur: 0.006 }, bloom: 0.75 };
    },
  };
}
// ============ 10: a rounded corner lets the stress flow around the curve ============
function shot10({ makeStage }) {
  const { scene, P, moveDots } = plateScene(makeStage, true);
  const c = cam(34);
  return {
    scene, camera: c,
    update(t) {
      moveDots(t, 0.22);
      const pop = t < 0.45 ? 0.85 + 0.15 * easeOut(t / 0.45) + Math.sin(t * 25) * 0.02 * (1 - t / 0.45) : 1;
      P.scale.setScalar(pop);
      P.rotation.y = lerp(0.35, -0.15, easeInOut(range(t, 0, 3.05)));
      const k = easeInOut(range(t, 0, 3.05));
      const s = shake(t, 0.5, 10);
      place(c, [lerp(0.4, -0.2, k) + s[0], lerp(1.5, 1.45, k) + s[1], lerp(3.3, 3.0, k)], [0, 1.42, 0]);
      return { dof: { focus: 3.1, aperture: 0.0015, maxblur: 0.006 }, bloom: 0.8 };
    },
  };
}

// ============ 11: every plane window you've looked through is round ============
function shot11({ makeStage }) {
  const scene = makeStage({ shadowSize: 2.5, sunDir: [-2, 5, 4], sun: 2.2 }); hideGround(scene);
  const M = materials();
  // cabin side wall at x = 0.55 with a rounded window beside the passenger's head
  const wz = 0.1, wy = 1.42, ww = 0.36, wh = 0.5, wr = 0.17;
  const s = new THREE.Shape(); s.moveTo(-4, -1); s.lineTo(4, -1); s.lineTo(4, 4); s.lineTo(-4, 4); s.closePath();
  const hole = new THREE.Path(); { const x = wz - ww / 2, y = wy - wh / 2; hole.moveTo(x + wr, y); hole.lineTo(x + ww - wr, y); hole.quadraticCurveTo(x + ww, y, x + ww, y + wr); hole.lineTo(x + ww, y + wh - wr); hole.quadraticCurveTo(x + ww, y + wh, x + ww - wr, y + wh); hole.lineTo(x + wr, y + wh); hole.quadraticCurveTo(x, y + wh, x, y + wh - wr); hole.lineTo(x, y + wr); hole.quadraticCurveTo(x, y, x + wr, y); }
  s.holes.push(hole);
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 24 }), M.cabinWall);
  wall.rotation.y = -Math.PI / 2; wall.position.x = 0.69; wall.receiveShadow = true; scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0x5a6378, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const bin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 6), M.cabinWall); bin.position.set(0.25, 2.4, 0); scene.add(bin);
  const seat = new THREE.Group(); scene.add(seat);
  const add = (g, p) => { const m = new THREE.Mesh(g, M.seat); m.position.set(...p); seat.add(m); return m; };
  add(new THREE.BoxGeometry(0.62, 0.14, 0.6), [0, 0.5, 0.1]); const back = add(new THREE.BoxGeometry(0.62, 1.05, 0.14), [0, 1.0, -0.25]); back.rotation.x = 0.1;
  add(new THREE.BoxGeometry(0.5, 0.2, 0.12), [0, 1.6, -0.3]);
  // the seat in front, low in frame
  const front = add(new THREE.BoxGeometry(0.62, 1.05, 0.14), [0, 0.85, 1.25]); front.rotation.x = 0.1;
  shadow(seat);
  const pas = makeHuman('passenger'); pas.root.position.set(0, 0, 0.0); scene.add(pas.root);
  const cf = cloudField(23, 14, [6, 40], 0.4, 0.7); cf.position.x = 7; scene.add(cf);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffe066, toneMapped: false, transparent: true }));
  frame.scale.set(ww / 0.4 + 0.08, wh / 0.4 + 0.06, 1); frame.rotation.y = -Math.PI / 2; frame.position.set(0.55, wy, wz); scene.add(frame);
  const c = cam(38);
  return {
    scene, camera: c,
    update(t) {
      cf.position.z = 10 - t * 2.4;
      const turn = smooth(range(t, 0.2, 0.9));
      const wave = t > 1.9 ? smooth(range(t, 1.9, 2.3)) : 0;
      pas.setPose({ drop: -0.4, lHip: [-1.5, 0, 0.08], rHip: [-1.5, 0, -0.08], lKn: [1.5, 0, 0], rKn: [1.5, 0, 0],
        spine: [-0.06, 0, 0], neck: [0, lerp(-0.2, 0.75, turn), 0], head: [0.05, lerp(0, 0.35, turn), 0],
        lSh: [-0.5, 0, 0.1], lEl: [-1.0, 0, 0], rSh: [-0.5 - 1.2 * wave, 0, -0.1 - 0.5 * wave], rEl: [-1.0 + 0.6 * wave, 0, 0] });
      pas.setMouth(t > 2.0 ? 0.35 : 0.05);
      const fa = smooth(range(t, 1.95, 2.15)) * (1 - smooth(range(t, 2.6, 3.0))); frame.material.opacity = fa; frame.visible = fa > 0.01;
      const k = easeInOut(range(t, 0, 3.05));
      const sk = shake(t, 0.6, 12);
      place(c, [lerp(-1.1, -0.8, k) + sk[0], lerp(1.6, 1.55, k) + sk[1], lerp(2.4, 1.85, k)], [lerp(0.15, 0.3, k), 1.38, 0.0]);
      return { dof: { focus: c.position.distanceTo(V(0, 1.45, 0.1)), aperture: 0.0025, maxblur: 0.008 }, bloom: 0.6 };
    },
  };
}

export const SHOTS = [
  { start: 0.0, end: 3.0, build: shot1 },
  { start: 3.0, end: 6.75, build: shot2 },
  { start: 6.75, end: 9.8, build: shot3 },
  { start: 9.8, end: 14.25, build: shot4 },
  { start: 14.25, end: 17.3, build: shot5 },
  { start: 17.3, end: 21.6, build: shot6 },
  { start: 21.6, end: 24.35, build: shot7 },
  { start: 24.35, end: 27.0, build: shot8 },
  { start: 27.0, end: 31.2, build: shot9 },
  { start: 31.2, end: 34.25, build: shot10 },
  { start: 34.25, end: DURATION + 1, build: shot11 },
];
