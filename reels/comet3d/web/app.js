import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { glCanvas, renderAt, prepareShot, captionAt, fadeAt, DURATION, SIZE } from './engine.js';

const FPS = 30;
const { W, H } = SIZE;
const $ = id => document.getElementById(id);
const out = $('screen'); out.width = W; out.height = H;
const ctx = out.getContext('2d');
const playBtn = $('play'), makeBtn = $('make'), status = $('status'), bar = $('bar'), timeEl = $('time'), result = $('result');

// ---------- compositor: 3D frame + caption + dip to black ----------
function compose(t) {
  ctx.drawImage(glCanvas, 0, 0, W, H);
  const cap = captionAt(t);
  if (cap) {
    ctx.save();
    ctx.font = "700 46px Montserrat, 'Arial Black', sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#fff'; ctx.fillText(cap, W / 2, 968);
    ctx.shadowBlur = 2; ctx.shadowOffsetY = 0; ctx.fillText(cap, W / 2, 968);
    ctx.restore();
  }
  const f = fadeAt(t);
  if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); }
}
function frame(t) { renderAt(t); compose(t); }

// ---------- sound (voice + music + effects, one track) ----------
const AC = window.AudioContext || window.webkitAudioContext;
let actx = null, audioBuf = null;
async function loadAudio() {
  if (audioBuf) return audioBuf;
  actx = actx || new AC();
  const b64 = document.getElementById('mix').textContent.trim();
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  audioBuf = await new Promise((res, rej) => actx.decodeAudioData(bin.buffer, res, rej));
  return audioBuf;
}

const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function progress(k, t) { bar.style.width = `${(k * 100).toFixed(1)}%`; timeEl.textContent = `${fmt(t)} / ${fmt(DURATION)}`; }
const busy = on => { playBtn.disabled = on; makeBtn.disabled = on; };

// ---------- live playback ----------
let playing = null;
async function play() {
  if (playing) { stopPlay(); return; }
  status.textContent = 'Loading sound…';
  await loadAudio(); await actx.resume();
  const src = actx.createBufferSource(); src.buffer = audioBuf; src.connect(actx.destination);
  const t0 = actx.currentTime + 0.15; src.start(t0);
  playing = { src, raf: 0 };
  playBtn.textContent = 'Stop'; makeBtn.disabled = true;
  status.textContent = 'Playing. Frames are drawn live on this device, so a slow phone skips some.';
  const loop = () => {
    const t = Math.max(0, actx.currentTime - t0);
    if (t >= DURATION) { stopPlay(); return; }
    frame(t); progress(t / DURATION, t);
    playing.raf = requestAnimationFrame(loop);
  };
  loop();
}
function stopPlay() {
  if (!playing) return;
  cancelAnimationFrame(playing.raf); try { playing.src.stop(); } catch (e) {}
  playing = null; playBtn.textContent = 'Play'; makeBtn.disabled = false;
  status.textContent = 'Stopped.';
}

// ---------- export: every frame rendered at full quality, encoded on the phone ----------
async function pickVideoCodec() {
  for (const codec of ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42e01f']) {
    const cfg = { codec, width: W, height: H, bitrate: 8_000_000, framerate: FPS };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return cfg; } catch (e) {}
  }
  return null;
}
async function pickAudioCodec(sr, ch) {
  if (!('AudioEncoder' in window)) return null;
  for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
    const cfg = { codec, sampleRate: sr, numberOfChannels: ch, bitrate: 160_000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { cfg, mux }; } catch (e) {}
  }
  return null;
}
let lastBlob = null;
async function makeVideo() {
  busy(true); result.hidden = true;
  try {
    if (!('VideoEncoder' in window)) throw new Error('This browser cannot encode video. Try Chrome, or Safari 16.4 or newer.');
    const vcfg = await pickVideoCodec();
    if (!vcfg) throw new Error('This browser has no H.264 encoder for a 720×1280 video.');
    status.textContent = 'Loading sound…';
    const buf = await loadAudio();
    const sr = buf.sampleRate, ch = Math.min(2, buf.numberOfChannels);
    const ac = await pickAudioCodec(sr, ch);
    const muxer = new Muxer({
      target: new ArrayBufferTarget(), fastStart: 'in-memory',
      video: { codec: 'avc', width: W, height: H, frameRate: FPS },
      ...(ac ? { audio: { codec: ac.mux, numberOfChannels: ch, sampleRate: sr } } : {}),
    });
    let err = null;
    const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
    venc.configure(vcfg);
    const total = window.__TESTFRAMES || Math.floor(DURATION * FPS); const T0 = performance.now();
    for (let n = 0; n < total; n++) {
      if (err) throw err;
      const t = n / FPS;
      prepareShot(t); frame(t);
      const vf = new VideoFrame(out, { timestamp: Math.round(n * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: n % 60 === 0 }); vf.close();
      while (venc.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 4));
      if (n % 3 === 0) {
        const per = (performance.now() - T0) / (n + 1);
        progress((n + 1) / total, t);
        status.textContent = `Rendering frame ${n + 1} of ${total} · about ${Math.ceil(per * (total - n) / 1000)} s left`;
        await new Promise(r => setTimeout(r, 0));
      }
    }
    await venc.flush(); venc.close();
    if (ac) {
      status.textContent = 'Encoding sound…';
      const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
      aenc.configure(ac.cfg);
      const len = Math.min(buf.length, Math.round(DURATION * sr)); const step = 1024;
      const chans = [...Array(ch)].map((_, i) => buf.getChannelData(i));
      for (let i = 0; i < len; i += step) {
        const n = Math.min(step, len - i); const data = new Float32Array(n * ch);
        for (let c = 0; c < ch; c++) data.set(chans[c].subarray(i, i + n), c * n);
        const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: ch, timestamp: Math.round(i * 1e6 / sr), data });
        aenc.encode(ad); ad.close();
      }
      await aenc.flush(); aenc.close();
    }
    if (err) throw err;
    muxer.finalize();
    lastBlob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
    const secs = ((performance.now() - T0) / 1000).toFixed(0);
    const vid = $('video'); vid.src = URL.createObjectURL(lastBlob);
    result.hidden = false;
    status.textContent = `Done in ${secs} s · ${(lastBlob.size / 1e6).toFixed(1)} MB${ac ? '' : ' · this browser could not encode sound, so the file is silent'}`;
    progress(1, DURATION);
  } catch (e) {
    status.textContent = `Couldn't make the video: ${e.message || e}`;
  } finally { busy(false); }
}
async function save() {
  if (!lastBlob) return;
  const dl = await window.claude?.use?.('downloads');
  if (!dl) { status.textContent = 'Saving isn\'t available here. Long-press the video above to save or share it.'; return; }
  try { await dl.save({ filename: 'comet-window-reel.mp4', data: lastBlob }); status.textContent = 'Saved.'; }
  catch (e) { status.textContent = e.code === 'declined' ? 'Not saved.' : `Couldn't save: ${e.message || e.code}`; }
}

playBtn.addEventListener('click', play);
makeBtn.addEventListener('click', makeVideo);
$('save').addEventListener('click', save);
// first frame on load
(document.fonts?.load ? document.fonts.load("700 46px Montserrat").catch(() => {}) : Promise.resolve()).then(() => { try { frame(1.2); progress(0, 0); status.textContent = 'Ready.'; } catch (e) { status.textContent = `WebGL failed to start: ${e.message}`; } });
