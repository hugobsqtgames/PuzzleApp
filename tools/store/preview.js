// Records the App Store preview video from the real app (web build served on :8768).
// Each shot is filmed with Chromium's screencast (sharp frames at the device's pixels),
// then ffmpeg joins them at 30 fps with the app's own music and the bells that are played.
//   node preview.js            → store/out/preview-iphone.mp4 (886 × 1920, for 6.9" iPhones)
// Needs ffmpeg (FFMPEG=/path/to/ffmpeg) and Playwright (PLAYWRIGHT=…, CHROMIUM=…).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const W = 443, H = 960, OUT_W = 886, OUT_H = 1920;
const AUDIO = path.join(__dirname, '../../app/assets/audio');
const PACK = require(path.join(__dirname, '../../app/src/content/generated/pack.json'));
const WORK = path.resolve('store/preview-frames');
fs.rmSync(WORK, { recursive: true, force: true }); fs.mkdirSync(WORK, { recursive: true });

const frames = []; // { file, t } on one timeline (seconds)
const sounds = []; // { file, t }
let clock = 0;

(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const night = new Date(2026, 8, 30, 20, 30);
  const page = async (save, at) => {
    const ctx = await b.newContext({ locale: 'fr-FR', viewport: { width: W, height: H }, deviceScaleFactor: OUT_W / W });
    await ctx.addInitScript((s) => { if (!localStorage.getItem('fs:lampion/save.json')) localStorage.setItem('fs:lampion/save.json', s); }, fs.readFileSync(path.join(__dirname, save), 'utf8'));
    await ctx.addInitScript(() => setInterval(() => { const el = [...document.querySelectorAll('div')].find((d) => d.childElementCount === 0 && /^C.est parti$/.test(d.textContent)); if (el) el.click(); }, 400));
    const pg = await ctx.newPage();
    await pg.clock.install({ time: at });
    await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(9000);
    return pg;
  };
  /** Films `seconds` of the page while `act` runs; `act` gets `mark(sound)` to place a sound at the current moment. */
  const film = async (pg, seconds, act = async () => {}) => {
    const cdp = await pg.context().newCDPSession(pg);
    const start = clock;
    let t0 = null;
    cdp.on('Page.screencastFrame', async (f) => {
      const t = f.metadata.timestamp;
      if (t0 === null) t0 = t;
      const file = path.join(WORK, `f${String(frames.length).padStart(5, '0')}.jpg`);
      fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
      frames.push({ file, t: start + (t - t0) });
      await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: OUT_W, maxHeight: OUT_H, everyNthFrame: 1 });
    const began = Date.now();
    await act((file) => sounds.push({ file, t: start + (Date.now() - began) / 1000 }));
    const left = seconds * 1000 - (Date.now() - began);
    if (left > 0) await pg.waitForTimeout(left);
    await cdp.send('Page.stopScreencast');
    await cdp.detach();
    clock = start + Math.max(seconds, (Date.now() - began) / 1000);
  };
  const vis = (l) => l.filter({ visible: true });
  const go = async (pg, url, wait = 3000) => { await pg.goto('http://localhost:8768' + url); await pg.waitForTimeout(wait); };

  // 1. Home, then the map.
  let pg = await page('saveMock.json', night);
  await go(pg, '/');
  await film(pg, 3.2);
  await go(pg, '/map');
  await film(pg, 2.6);
  // 2. A real Carillon: listen, ring it back, the lantern catches.
  const room = PACK.world.districts.find((d) => d.id === 'horlo').buildings[1].rooms[0];
  const MOCK = new Set(Object.keys(require('./saveMock.json').state.solved));
  const k = room.lanterns.findIndex((l) => l.family === 'CR' && !MOCK.has(l.id));
  const cr = PACK.puzzles[room.lanterns[k].id].p;
  await go(pg, '/room/' + room.id, 3500);
  await film(pg, 1.6);
  await vis(pg.getByLabel(new RegExp('^Lanterne ' + (k + 1) + ' sur'))).first().click(); await pg.waitForTimeout(700);
  await vis(pg.getByText(/^(Allumer|Reprendre)$/)).first().click(); await pg.waitForTimeout(6500);
  await film(pg, 6.5, async (mark) => {
    await pg.waitForTimeout(500);
    for (const bell of (cr.reverse ? cr.melody.slice().reverse() : cr.melody)) {
      mark(`sfx_bell_${bell}.m4a`);
      await vis(pg.getByLabel('Cloche ' + (bell + 1))).first().click();
      await pg.waitForTimeout(650);
    }
  });
  await pg.context().close();

  // 3. Rooms of an advanced game.
  pg = await page('save800.json', night);
  await go(pg, '/room/serre.b4.r4', 5000);
  await film(pg, 2.4);
  await go(pg, '/room/biblio.b4.r3', 5000);
  await film(pg, 2.2);
  // 4. Constellations, in the mode Libre.
  await go(pg, '/free', 2500);
  await vis(pg.getByRole('radio', { name: 'Constellations' })).first().click(); await pg.waitForTimeout(300);
  await vis(pg.getByText('Jouer', { exact: true })).first().click(); await pg.waitForTimeout(3500);
  await film(pg, 4, async () => {
    await pg.waitForTimeout(400);
    await vis(pg.getByLabel('Indices')).last().click(); await pg.waitForTimeout(700);
    await vis(pg.getByLabel(/^Éclairage/)).first().click().catch(() => {}); await pg.waitForTimeout(500);
    await vis(pg.getByText('Revenir au puzzle')).last().click({ force: true, timeout: 3000 }).catch(() => {});
  });
  await pg.context().close();

  // 5. The spring event, then back home under the cherry petals.
  pg = await page('save800.json', new Date(2027, 2, 30, 20, 30));
  await go(pg, '/event', 3500);
  await film(pg, 2.8);
  await go(pg, '/', 3500);
  await film(pg, 2.6);
  await pg.context().close();
  await b.close();

  // Frames → a 30 fps video.
  const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(1 / 60, ((frames[i + 1]?.t ?? clock) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].file}'\n`;
  fs.writeFileSync(path.join(WORK, 'list.txt'), list);
  fs.mkdirSync('store/out', { recursive: true });
  const silent = path.join(WORK, 'video.mp4');
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'list.txt'),
    '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos,fps=30,format=yuv420p`, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '16', '-t', clock.toFixed(2), silent]);
  // Music: the Horlogerie's ambience, faded in and out, with the bells rung.
  const inputs = ['-i', silent, '-stream_loop', '-1', '-i', path.join(AUDIO, 'amb_horlo.m4a')];
  sounds.forEach((s) => inputs.push('-i', path.join(AUDIO, s.file)));
  const fx = sounds.map((s, i) => `[${i + 2}:a]adelay=${Math.round(s.t * 1000)}|${Math.round(s.t * 1000)},volume=0.9[s${i}]`).join(';');
  const mix = `[1:a]atrim=0:${clock.toFixed(2)},afade=t=in:d=1,afade=t=out:st=${(clock - 1.5).toFixed(2)}:d=1.5,volume=0.8[m];${fx}${fx ? ';' : ''}[m]${sounds.map((_, i) => `[s${i}]`).join('')}amix=inputs=${sounds.length + 1}:normalize=0,volume=2.6,alimiter=limit=0.89,aformat=sample_rates=44100:channel_layouts=stereo[a]`;
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', clock.toFixed(2), '-movflags', '+faststart', 'store/out/preview-iphone.mp4']);
  console.log('done', clock.toFixed(1) + ' s', frames.length + ' frames', sounds.length + ' bells');
})().catch((e) => { console.error('FAIL', e.message.slice(0, 600)); process.exit(1); });
