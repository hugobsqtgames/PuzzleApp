// Renders the App Store preview: stage.html drawn frame by frame (30 fps, 886 × 1920), the app's
// ambience music and the sounds the player really triggers, mixed to the App Store's loudness.
//   node render.js   (from the folder that holds store/promo-clips and the store/app-*.png captures)
//   → store/out/promo-iphone.mp4  (H.264 High, 30 fps, AAC stereo 44.1 kHz: App Preview for 6.5" and 6.9" iPhones)
// IPAD=1: the iPad preview (stage-ipad.html, 1200 × 1600, clips of store/promo-clips-ipad) → store/out/promo-ipad.mp4.
// Options: FROM=s TO=s renders a part only; FFMPEG=…, PLAYWRIGHT=…, CHROMIUM=….
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 30;
const ROOT = process.cwd();
const AUDIO = path.join(__dirname, '../../../app/assets/audio');
const url = (p) => 'file://' + path.resolve(p);
const IPAD = !!process.env.IPAD;
const SIZE = IPAD ? { width: 1200, height: 1600 } : { width: 886, height: 1920 };
const NAME = IPAD ? 'ipad' : 'iphone';

(async () => {
  const clipsDir = path.join(ROOT, IPAD ? 'store/promo-clips-ipad' : 'store/promo-clips');
  const clips = {};
  for (const name of fs.readdirSync(clipsDir)) {
    const j = JSON.parse(fs.readFileSync(path.join(clipsDir, name, 'clip.json'), 'utf8'));
    clips[name] = { dir: url(path.join(clipsDir, name)), frames: j.frames, events: j.events };
  }
  const stills = {};
  for (const n of ['vitraux', 'carillon', 'constellations', 'ombres']) stills[n] = url(path.join(ROOT, `store/${IPAD ? 'ipad' : 'app'}-${n}.png`));
  const PROMO = { clips, stills, icon: url(path.join(__dirname, '../../../app/assets/icon.png')) };

  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const pg = await b.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
  await pg.addInitScript((p) => { window.PROMO = p; }, PROMO);
  await pg.goto(url(path.join(__dirname, IPAD ? 'stage-ipad.html' : 'stage.html')));
  await pg.evaluate(() => document.fonts.ready);
  const T = await pg.evaluate(() => window.DURATION);
  // SNAP=3,9.5,15 : a few frames as images (store/out/snap-<t>.png), to check the framing.
  if (process.env.SNAP) {
    fs.mkdirSync(path.join(ROOT, 'store/out'), { recursive: true });
    for (const t of process.env.SNAP.split(',').map(Number)) { await pg.evaluate((x) => window.renderAt(x), t); await pg.screenshot({ path: path.join(ROOT, `store/out/snap-${NAME}-${t}.png`) }); }
    await b.close(); console.log('snaps done'); return;
  }
  const from = Number(process.env.FROM || 0), to = Math.min(T, Number(process.env.TO || T));
  fs.mkdirSync(path.join(ROOT, 'store/out'), { recursive: true });
  const silent = path.join(ROOT, `store/out/promo-video-${NAME}.mp4`);
  const enc = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', String(FPS), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(from * FPS), n1 = Math.round(to * FPS);
  const t0 = Date.now();
  for (let f = n0; f < n1; f++) {
    await pg.evaluate((t) => window.renderAt(t), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 96 });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`\r${(f / FPS).toFixed(1)} s / ${to} s  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  enc.stdin.end();
  await new Promise((r) => enc.on('close', r));
  const cues = (await pg.evaluate(() => window.cues())).filter((c) => c.t >= from && c.t < to).map((c) => ({ ...c, t: c.t - from }));
  await b.close();

  // Sound: the night ambience under everything, the real sounds of the app on top.
  const len = (to - from).toFixed(3);
  const inputs = ['-i', silent, '-stream_loop', '-1', '-i', path.join(AUDIO, 'amb_nuit.m4a')];
  cues.forEach((c) => inputs.push('-i', path.join(AUDIO, c.file)));
  const fx = cues.map((c, i) => `[${i + 2}:a]adelay=${Math.round(c.t * 1000)}|${Math.round(c.t * 1000)},volume=${c.vol}[s${i}]`).join(';');
  const music = `[1:a]atrim=0:${len},afade=t=in:d=1.6,afade=t=out:st=${(to - from - 2.4).toFixed(2)}:d=2.4,volume=0.75[m]`;
  const mix = `${music};${fx}${fx ? ';' : ''}[m]${cues.map((_, i) => `[s${i}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a]`;
  const out = path.join(ROOT, `store/out/promo-${NAME}.mp4`);
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', len, '-movflags', '+faststart', out]);
  console.log(`\ndone ${out} (${len} s, ${cues.length} sounds)`);
})().catch((e) => { console.error('FAIL', e.message.slice(0, 600)); process.exit(1); });
