// Renders the prototype's synthesized sound (prototype/index.html, `Sound`)
// to audio files for the app. The synthesis code is taken verbatim from the
// prototype; only the scheduling (timers → sample-accurate offline times) and
// the random source (seeded, for reproducible files) change.
//
//   node tools/audio/render.js   (needs Playwright + Chromium, and ffmpeg)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'app/assets/audio');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const html = fs.readFileSync(path.join(ROOT, 'prototype/index.html'), 'utf8');
const start = html.indexOf('const mtof=');
const end = html.indexOf('const LABELS=');
if (start < 0 || end < 0) throw new Error('Sound engine not found in the prototype');
const engine = html.slice(start, end);

const RATE = 44100;
const AMB_SECONDS = 48;   // loop length
// Districts added after the prototype: same instruments, each its own key and texture.
const EXTRA_PLACES = `
  PLACES.biblio = { n: 'La Bibliothèque', chord: [47, 54, 59, 62, 66], scale: [59, 62, 64, 66, 69, 71], texture: 'room', crickets: false, ticks: false, sparkle: [5, 10] };
  PLACES.theatre = { n: 'Le Théâtre d’Ombres', chord: [46, 53, 58, 61, 65], scale: [58, 61, 63, 65, 68, 70], texture: 'room', crickets: false, ticks: false, sparkle: [3, 7] };
  PLACES.obs = { n: 'L’Observatoire', chord: [52, 59, 64, 66, 71], scale: [64, 66, 71, 73, 76, 78], texture: 'wind', crickets: true, ticks: false, sparkle: [7, 13] };`;
// node tools/audio/render.js --only biblio,theatre,obs : renders those places' effects and ambiences only.
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1].split(',') : null; })();
const XFADE = 4;          // overlap used by the app to chain loops

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: `
    let _seed = 1;
    Math.random = () => { _seed = (_seed + 0x6D2B79F5) >>> 0; let t = _seed; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    ${engine}
    ${EXTRA_PLACES}
    window.__engine = { PLACES, SFX, noiseBuffer, noiseBurst, tone, celesta, mtof };
    function masterBus(c, busGain) {
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      const m = c.createGain(); m.gain.value = .8; m.connect(comp); comp.connect(c.destination);
      const bus = c.createGain(); bus.gain.value = busGain; bus.connect(m); return bus;
    }
    function pcm(buf) { return Array.from(buf.getChannelData(0), v => Math.max(-1, Math.min(1, v))); }
    window.renderSfx = async (name, place, seed) => {
      _seed = seed;
      const { PLACES, SFX, noiseBuffer } = window.__engine;
      const dur = { roomComplete: 4.5, newDistrict: 6.5, unlock: 3.2, lanternLit: 2.8 }[name] || 1.8;
      const c = new OfflineAudioContext(1, Math.ceil(dur * ${RATE}), ${RATE});
      noise = noiseBuffer(c);
      SFX[name](c, masterBus(c, .9), .01, PLACES[place]);
      return pcm(await c.startRendering());
    };
    window.renderAmbience = async (key, seconds, seed) => {
      _seed = seed;
      const { PLACES, noiseBuffer, noiseBurst, tone, celesta, mtof } = window.__engine;
      const P = PLACES[key];
      const c = new OfflineAudioContext(1, Math.ceil(seconds * ${RATE}), ${RATE});
      noise = noiseBuffer(c);
      const out = c.createGain(); out.gain.value = 1; out.connect(masterBus(c, .55));
      // Same graph as startAmbience(), at steady state (no 2.5 s fade-in).
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
      const lfo = c.createOscillator(), lfoG = c.createGain(); lfo.frequency.value = .05; lfoG.gain.value = 350; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      P.chord.forEach((m, i) => { [0, 7].forEach(det => { const o = c.createOscillator(), g = c.createGain(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = mtof(m); o.detune.value = det - 3.5; g.gain.value = .022; o.connect(g); g.connect(lp); o.start(); }); });
      const src = c.createBufferSource(); src.buffer = noise; src.loop = true; const bp = c.createBiquadFilter(); bp.type = P.texture === 'water' ? 'lowpass' : 'bandpass';
      bp.frequency.value = P.texture === 'water' ? 420 : P.texture === 'wind' ? 700 : 300; bp.Q.value = .7; const tg = c.createGain(); tg.gain.value = P.texture === 'room' ? .02 : .06;
      const tl = c.createOscillator(), tlg = c.createGain(); tl.frequency.value = P.texture === 'water' ? .18 : .07; tlg.gain.value = P.texture === 'room' ? .01 : .035; tl.connect(tlg); tlg.connect(tg.gain); tl.start();
      src.connect(bp); bp.connect(tg); tg.connect(out); src.start();
      // Timed events (the prototype uses setTimeout / setInterval).
      if (P.ticks) { let tock = false; for (let t = 1; t < seconds; t += 1) { noiseBurst(c, out, t + .02, { dur: .012, type: 'highpass', freq: tock ? 2600 : 3400, q: 3, vol: .05 }); tock = !tock; } }
      const every = (fn, min, max) => { let t = min * .5; while (t < seconds - 3) { fn(t); t += min + Math.random() * (max - min); } };
      if (P.crickets) every(t0 => { for (let i = 0; i < 3; i++) tone(c, out, t0 + .05 + i * .07, { f0: 4300 + Math.random() * 300, dur: .035, vol: .008, lp: 9000 }); }, 4, 10);
      every(t0 => celesta(c, out, P.scale[Math.floor(Math.random() * P.scale.length)] + 12, t0 + .05, .05, 2.5), P.sparkle[0], P.sparkle[1]);
      return pcm(await c.startRendering());
    };
  ` });

  const wav = (file, samples) => {
    const b = Buffer.alloc(44 + samples.length * 2);
    b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24);
    b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40);
    samples.forEach((v, i) => b.writeInt16LE(Math.round(v * 32767), 44 + i * 2));
    fs.writeFileSync(file, b);
  };
  const encode = (wavFile, outFile, kbps) => {
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', wavFile, '-c:a', 'aac', '-b:a', `${kbps}k`, outFile]);
    fs.unlinkSync(wavFile);
  };
  const trimSilence = s => { let n = s.length; while (n > RATE * .3 && Math.abs(s[n - 1]) < 1e-4) n--; return s.slice(0, n); };

  const places = ONLY ?? ['nuit', 'phare', 'horlo', 'marche', 'serre', 'biblio', 'theatre', 'obs'];
  const perPlace = ['manipulate', 'lanternLit', 'roomComplete', 'unlock', 'newDistrict', 'hint'];
  const shared = ['error', 'shards', 'locked'];
  // --only keeps the other files (and their seeds) as they are.
  let seed = ONLY ? 1000 : 100;
  const manifest = ONLY ? JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')) : { rate: RATE, ambienceSeconds: AMB_SECONDS, crossfadeSeconds: XFADE, sfx: {}, ambiences: {} };
  for (const name of ONLY ? [] : shared) {
    const f = `sfx_${name}`;
    wav(path.join(OUT, f + '.wav'), trimSilence(await page.evaluate(([n, s]) => window.renderSfx(n, 'phare', s), [name, seed++])));
    encode(path.join(OUT, f + '.wav'), path.join(OUT, f + '.m4a'), 128);
    manifest.sfx[name] = f + '.m4a';
  }
  for (const name of perPlace) for (const place of places) {
    const f = `sfx_${name}_${place}`;
    wav(path.join(OUT, f + '.wav'), trimSilence(await page.evaluate(([n, p, s]) => window.renderSfx(n, p, s), [name, place, seed++])));
    encode(path.join(OUT, f + '.wav'), path.join(OUT, f + '.m4a'), 128);
    manifest.sfx[`${name}_${place}`] = f + '.m4a';
  }
  for (const place of places) {
    // Render loop + overlap. The app starts the next copy XFADE seconds before
    // the end and crossfades, so the file carries XFADE extra seconds.
    const s = await page.evaluate(([p, len, sd]) => window.renderAmbience(p, len, sd), [place, AMB_SECONDS + XFADE, seed++]);
    const f = `amb_${place}`;
    wav(path.join(OUT, f + '.wav'), s);
    encode(path.join(OUT, f + '.wav'), path.join(OUT, f + '.m4a'), 80);
    manifest.ambiences[place] = f + '.m4a';
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await browser.close();
  console.log('rendered', Object.keys(manifest.sfx).length, 'effects and', places.length, 'ambiences');
}
main().catch(e => { console.error(e); process.exit(1); });
