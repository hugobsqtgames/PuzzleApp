// Films the real app (web build served on :8768) for the promo: each clip is a series of sharp
// frames taken by Chromium's screencast at the iPhone's pixels, with the time of each frame and of
// each sound the player triggers. Nothing is staged: the puzzles are really played.
//   node record.js   (from a work folder) → store/promo-clips/<clip>/f00001.jpg + clip.json
//   IPAD=1 node record.js → store/promo-clips-ipad/… (the same scenes in the iPad layout)
// Needs plan.json (npx tsx plan.ts) and Playwright (PLAYWRIGHT=…, CHROMIUM=…).
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

// IPAD=1 films the iPad layout (1032 × 1376, the iPad 13" in portrait) into store/promo-clips-ipad.
const IPAD = !!process.env.IPAD;
const W = IPAD ? 1032 : 443, H = IPAD ? 1376 : 960, OUT_W = IPAD ? 1032 : 886, OUT_H = IPAD ? 1376 : 1920;
const OUT = path.resolve(IPAD ? 'store/promo-clips-ipad' : 'store/promo-clips');
const PLAN = require('./plan.json');
const URL = 'http://localhost:8768';
const night = new Date(2026, 8, 30, 20, 30);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  /** A save, optionally with some lanterns not yet lit (so that lighting one is a first success). */
  const page = async (save, at, unlit = []) => {
    const ctx = await b.newContext({ locale: 'fr-FR', viewport: { width: W, height: H }, deviceScaleFactor: OUT_W / W });
    const env = JSON.parse(fs.readFileSync(path.join(__dirname, '..', save), 'utf8'));
    for (const id of unlit) { delete env.state.solved[id]; delete env.checksum; }
    await ctx.addInitScript((s) => { if (!localStorage.getItem('fs:lampion/save.json')) localStorage.setItem('fs:lampion/save.json', s); }, JSON.stringify(env));
    await ctx.addInitScript(() => setInterval(() => { const el = [...document.querySelectorAll('div')].find((d) => d.childElementCount === 0 && /^C.est parti$/.test(d.textContent)); if (el) el.click(); }, 400));
    const pg = await ctx.newPage();
    await pg.clock.install({ time: at });
    await pg.goto(URL + '/'); await pg.waitForTimeout(9000); // the made-up save's achievements are credited once
    return pg;
  };
  const vis = (l) => l.filter({ visible: true });
  const go = async (pg, url, wait = 3000) => { await pg.goto(URL + url); await pg.waitForTimeout(wait); };

  /** Films while `act` runs (and at least `seconds`); `mark(kind, data)` notes an event at this instant. */
  const film = async (pg, name, seconds, act = async () => {}) => {
    const dir = path.join(OUT, name);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const frames = [], events = [];
    const cdp = await pg.context().newCDPSession(pg);
    const began = Date.now();
    cdp.on('Page.screencastFrame', async (f) => {
      const file = `f${String(frames.length + 1).padStart(5, '0')}.jpg`;
      fs.writeFileSync(path.join(dir, file), Buffer.from(f.data, 'base64'));
      frames.push({ t: (Date.now() - began) / 1000, file });
      await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, maxWidth: OUT_W, maxHeight: OUT_H, everyNthFrame: 1 });
    await act((kind, data = {}) => events.push({ t: (Date.now() - began) / 1000, kind, ...data }));
    const left = seconds * 1000 - (Date.now() - began);
    if (left > 0) await pg.waitForTimeout(left);
    await cdp.send('Page.stopScreencast'); await cdp.detach();
    const clip = { name, duration: (Date.now() - began) / 1000, frames, events };
    fs.writeFileSync(path.join(dir, 'clip.json'), JSON.stringify(clip));
    console.log(name, clip.duration.toFixed(1) + ' s', frames.length + ' frames', events.map((e) => `${e.kind}@${e.t.toFixed(2)}`).join(' '));
  };

  // The evening home screen, Nilo touched; the map, scrolled.
  let pg = await page('saveMock.json', night);
  await go(pg, '/', 3500);
  await film(pg, 'home', 5.5, async (mark) => {
    await pg.waitForTimeout(2600);
    const nilo = vis(pg.getByLabel(/Nilo/)).first();
    if (await nilo.count()) { mark('poke'); await nilo.click({ force: true }).catch(() => {}); }
  });
  await go(pg, '/map', 3000);
  await film(pg, 'map', 4.5, async () => {
    await pg.waitForTimeout(700);
    await pg.mouse.move(W / 2, H / 2);
    for (let i = 0; i < 24; i++) { await pg.mouse.wheel(0, 14); await pg.waitForTimeout(60); }
  });

  // A real Carillon: the room, the lantern, the melody, the bells rung back, the lantern lit.
  const cr = PLAN.carillon;
  await go(pg, '/room/' + cr.room, 3500);
  await film(pg, 'carillon', 4, async (mark) => {
    await pg.waitForTimeout(1300);
    mark('tapLantern'); await vis(pg.getByLabel(new RegExp('^Lanterne ' + cr.n + ' sur'))).first().click();
    await pg.waitForTimeout(900);
    mark('play'); await vis(pg.getByText(/^(Allumer|Reprendre)$/)).first().click();
    await pg.waitForTimeout(6800);
    for (const bell of cr.bells) { mark('bell', { bell }); await vis(pg.getByLabel('Cloche ' + (bell + 1))).first().click(); await pg.waitForTimeout(620); }
    mark('solved');
    await pg.waitForTimeout(3600);
  });
  await pg.context().close();

  // Passerelles, built bridge by bridge until the lantern catches.
  const br = PLAN.bridges;
  pg = await page('save800.json', night, [`${br.room}.${br.n}`]);
  await go(pg, '/room/' + br.room, 3500);
  await vis(pg.getByLabel(new RegExp('^Lanterne ' + br.n + ' sur'))).first().click(); await pg.waitForTimeout(800);
  await vis(pg.getByText(/^(Allumer|Rejouer|Reprendre)$/)).first().click(); await pg.waitForTimeout(2500);
  await film(pg, 'bridges', 3, async (mark) => {
    await pg.waitForTimeout(600);
    const islands = pg.getByRole('button', { name: /^Îlot/ });
    for (const k of br.taps) { mark('tap', { k }); await islands.nth(k).click({ force: true }); await pg.waitForTimeout(250); }
    mark('solved');
    await pg.waitForTimeout(3000);
  });
  await pg.context().close();

  // The spring festival: petals, Nilo in flowers, the sky lanterns.
  pg = await page('save800.json', new Date(2027, 2, 30, 20, 30));
  await go(pg, '/event', 3500);
  await film(pg, 'spring', 4.5);
  await go(pg, '/', 3500);
  await film(pg, 'springHome', 3.5);
  await pg.context().close();
  await b.close();
})().catch((e) => { console.error('FAIL', e.message.slice(0, 500)); process.exit(1); });
