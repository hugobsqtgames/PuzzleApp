// Captures real app screens for the store pages (iPhone: 430 × 932 @3x; iPad: W=1032 H=1376 DSF=2 PREFIX=ipad).
// The puzzles are looked up in the content by family, so a rebalanced Forge does not break it.
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const W = +(process.env.W || 430), H = +(process.env.H || 932), DSF = +(process.env.DSF || 3), P = process.env.PREFIX || 'app';
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = async (saveFile, at) => {
    const ctx = await b.newContext({ locale: 'fr-FR', viewport: { width: W, height: H }, deviceScaleFactor: DSF });
    await ctx.addInitScript((s) => { if (!localStorage.getItem('fs:lampion/save.json')) localStorage.setItem('fs:lampion/save.json', s); }, fs.readFileSync(saveFile, 'utf8'));
    await ctx.addInitScript(() => setInterval(() => { const el = [...document.querySelectorAll('div')].find((d) => d.childElementCount === 0 && /^C.est parti$/.test(d.textContent)); if (el) el.click(); }, 400));
    const pg = await ctx.newPage();
    await pg.clock.install({ time: at });
    await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(9000);
    return pg;
  };
  const vis = (l) => l.filter({ visible: true });
  const shot = (pg, n) => pg.screenshot({ path: `store/${P}-${n}.png` });
  const save = __dirname + '/save800.json';
  const PACK = require(__dirname + '/../../app/src/content/generated/pack.json');
  const LIT = new Set(Object.keys(require(save).state.solved));
  /** A lantern of this family already lit in the save (room and number), preferably a harder one in a later district. */
  const find = (code, minTier = 2, district) => {
    for (const d of PACK.world.districts.slice().reverse()) {
      if (district && d.id !== district) continue;
      for (const b of d.buildings) for (const r of b.rooms) {
        const k = r.lanterns.findIndex((l) => l.family === code && l.tier >= minTier && LIT.has(l.id));
        if (k >= 0) return [r.id, k + 1];
      }
    }
    return minTier > 0 ? find(code, minTier - 1, district) : null;
  };
  const open = async (pg, code, wait = 1500, minTier = 2) => {
    const [room, n] = find(code, minTier);
    await pg.goto('http://localhost:8768/room/' + room); await pg.waitForTimeout(2500);
    await vis(pg.getByLabel(new RegExp('^Lanterne ' + n + ' sur'))).first().click(); await pg.waitForTimeout(700);
    await vis(pg.getByText(/^(Allumer|Rejouer|Reprendre)$/)).first().click(); await pg.waitForTimeout(wait);
  };
  const night = new Date(2026, 8, 30, 20, 30);

  // The first screens, with the mock-up's progression (184 lights).
  {
    const pg = await page(__dirname + '/saveMock.json', night);
    for (const [n, path] of [['home', '/'], ['map', '/map'], ['nilo', '/nilo'], ['daily', '/daily'], ['district', '/district/horlo'], ['room-etabli', '/room/horlo.b1.r2']]) { await pg.goto('http://localhost:8768' + path); await pg.waitForTimeout(3500); await shot(pg, n); }
    // A real first success: a Carillon of the Tour du Carillon, its melody played back (read from the content).
    const room = PACK.world.districts.find((d) => d.id === 'horlo').buildings[1].rooms[0];
    const MOCK = new Set(Object.keys(require(__dirname + '/saveMock.json').state.solved));
    const k = room.lanterns.findIndex((l) => l.family === 'CR' && !MOCK.has(l.id));
    const cr = PACK.puzzles[room.lanterns[k].id].p;
    await pg.goto('http://localhost:8768/room/' + room.id); await pg.waitForTimeout(2500);
    await vis(pg.getByLabel(new RegExp('^Lanterne ' + (k + 1) + ' sur'))).first().click(); await pg.waitForTimeout(700);
    await vis(pg.getByText(/^(Allumer|Reprendre)$/)).first().click(); await pg.waitForTimeout(7000);
    for (const bell of (cr.reverse ? cr.melody.slice().reverse() : cr.melody)) { await vis(pg.getByLabel('Cloche ' + (bell + 1))).first().click(); await pg.waitForTimeout(500); }
    await pg.waitForTimeout(1800); await shot(pg, 'success');
    await pg.context().close();
  }

  // An advanced game (800 lights): rooms and puzzles.
  {
    const pg = await page(save, night);
    for (const r of ['serre.b4.r4', 'biblio.b4.r3', 'marche.b1.r1']) { await pg.goto('http://localhost:8768/room/' + r); await pg.waitForTimeout(6000); await shot(pg, 'room-' + r); }
    // Vitraux, as it opens (the achievement toasts of the made-up save have passed).
    await open(pg, 'VI', 6000); await shot(pg, 'vitraux');
    await open(pg, 'CR', 9000); await shot(pg, 'carillon');
    await open(pg, 'DI'); await shot(pg, 'differences');
    await open(pg, 'OM'); await vis(pg.getByLabel(/^Ombre 2/)).first().click().catch(() => {}); await pg.waitForTimeout(400); await shot(pg, 'ombres');
    await open(pg, 'PA'); await shot(pg, 'passerelles');
    await open(pg, 'RU'); await shot(pg, 'rubans');
    // Hints, then a success caught while the lantern catches.
    await open(pg, 'EN');
    await vis(pg.getByLabel('Indices')).last().click(); await pg.waitForTimeout(900); await shot(pg, 'hints');
    await vis(pg.getByRole('button', { name: /^Gratuit$/ })).last().click().catch(() => {}); await pg.waitForTimeout(1200); await shot(pg, 'hint-shown');
    const closeSheet = async () => { const back = vis(pg.getByText('Revenir au puzzle')); if (await back.count()) { await back.last().click({ force: true, timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(700); } };
    for (let k = 0; k < 6 && !pg.url().includes('success'); k++) {
      await closeSheet();
      await vis(pg.getByLabel('Indices')).last().click({ timeout: 5000 }).catch(() => {}); await pg.waitForTimeout(450);
      const bt = vis(pg.getByLabel(/^(Éclairage|Solution)/));
      if (await bt.count()) { await bt.last().click(); await pg.waitForTimeout(700); }
      const back = vis(pg.getByText('Revenir au puzzle')); if (await back.count()) { await back.last().click({ force: true, timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(600); }
    }
    await pg.goto('http://localhost:8768/building/biblio.b1'); await pg.waitForTimeout(2500);
    await vis(pg.getByLabel(/^Lanterne-clé/)).first().click().catch(() => {}); await pg.waitForTimeout(1800); await shot(pg, 'seal');
    await pg.goto('http://localhost:8768/carnet'); await pg.waitForTimeout(2500); await shot(pg, 'carnet');
    await pg.context().close();
  }

  // The three events, each on one of its evenings.
  for (const [name, at] of [['lanternes', new Date(2027, 2, 30, 20, 30)], ['halloween', new Date(2026, 9, 28, 20, 30)], ['noel', new Date(2026, 11, 21, 20, 30)]]) {
    const pg = await page(save, at);
    await pg.goto('http://localhost:8768/event'); await pg.waitForTimeout(3500); await shot(pg, 'event-' + name);
    if (name === 'lanternes') { await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(3500); await shot(pg, 'home-spring'); }
    await pg.context().close();
  }

  const pg = await page(save, night);
  // The house: objects found in the Phare, some on its shelves (seeded, as a player would have done).
  await pg.evaluate((ROOMS) => {
    const rooms = ROOMS;
    const side = JSON.parse(localStorage.getItem('fs:lampion/profile.json') || '{}');
    side.profile = { ...(side.profile || {}), picked: rooms, house: { name: 'La maison du quai', shelf: [rooms[0], null, rooms[2], rooms[3], rooms[5], null, rooms[6], rooms[7]], decor: { rug: 'rug.blue', painting: 'painting.phare', lamp: 'lamp.brass', plant: 'plant.glow' } } };
    localStorage.setItem('fs:lampion/profile.json', JSON.stringify(side));
  }, ['phare.b1.r1', 'phare.b1.r2', 'phare.b1.r3', 'phare.b1.r4', 'biblio.b1.r1', 'biblio.b1.r2', 'biblio.b1.r3', 'biblio.b2.r1']);
  await pg.goto('http://localhost:8768/house'); await pg.waitForTimeout(3500); await shot(pg, 'house');
  // The mode Libre, then a Constellations sky with a few stars.
  await pg.goto('http://localhost:8768/free'); await pg.waitForTimeout(2500);
  await vis(pg.getByRole('radio', { name: 'Constellations' })).first().click(); await pg.waitForTimeout(400);
  await vis(pg.getByRole('radio').filter({ hasText: 'Flamme' })).first().click(); await pg.waitForTimeout(400);
  await shot(pg, 'free');
  await vis(pg.getByText('Jouer', { exact: true })).first().click(); await pg.waitForTimeout(3500);
  await vis(pg.getByLabel('Indices')).last().click(); await pg.waitForTimeout(600);
  await vis(pg.getByLabel(/^Éclairage/)).first().click().catch(() => {}); await pg.waitForTimeout(800);
  const back = vis(pg.getByText('Revenir au puzzle')); if (await back.count()) { await back.last().click(); await pg.waitForTimeout(600); }
  await shot(pg, 'constellations');
  await b.close(); console.log('done');
})().catch((e) => { console.error('FAIL', e.message.slice(0, 400)); process.exit(1); });
