// Captures real app screens for the store pages (430 × 932 @3x).
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const W = +(process.env.W || 430), H = +(process.env.H || 932), DSF = +(process.env.DSF || 3), P = process.env.PREFIX || 'app';
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = async (saveFile) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
    const save = fs.readFileSync(saveFile, 'utf8');
    await ctx.addInitScript((s) => { if (!localStorage.getItem('fs:lampion/save.json')) localStorage.setItem('fs:lampion/save.json', s); }, save);
    const pg = await ctx.newPage();
    // Achievements of the made-up save are credited at the first launch: let their toast pass once.
    await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(9000);
    return pg;
  };
  const vis = (pg, l) => l.filter({ visible: true });
  const shot = (pg, n) => pg.screenshot({ path: `store/${P}-${n}.png` });
  const open = async (pg, room, n, wait = 1500) => { await pg.goto('http://localhost:8768/room/' + room); await pg.waitForTimeout(2500); await vis(pg, pg.getByLabel(new RegExp('^Lanterne ' + n + ' sur'))).first().click(); await pg.waitForTimeout(700); await vis(pg, pg.getByText(/^(Allumer|Rejouer|Reprendre)$/)).first().click(); await pg.waitForTimeout(wait); };

  let pg = await page(__dirname + '/saveMock.json');
  await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(3500); await shot(pg, 'home');
  await pg.goto('http://localhost:8768/map'); await pg.waitForTimeout(3000); await shot(pg, 'map');
  await pg.goto('http://localhost:8768/room/horlo.b1.r2'); await pg.waitForTimeout(3000); await shot(pg, 'room-etabli');
  await pg.goto('http://localhost:8768/nilo'); await pg.waitForTimeout(3000); await shot(pg, 'nilo');
  await pg.goto('http://localhost:8768/daily'); await pg.waitForTimeout(3000); await shot(pg, 'daily');
  await pg.goto('http://localhost:8768/district/horlo'); await pg.waitForTimeout(3000); await shot(pg, 'district');
  await pg.context().close();

  pg = await page(__dirname + '/save800.json');
  for (const r of ['serre.b4.r4', 'marche.b1.r1', 'theatre.b4.r4', 'obs.b2.r1', 'biblio.b4.r3', 'serre.b2.r4']) { await pg.goto('http://localhost:8768/room/' + r); await pg.waitForTimeout(3000); await shot(pg, 'room-' + r); }
  // Vitraux, a few filters set.
  await open(pg, 'theatre.b3.r4', 7);
  const f = vis(pg, pg.getByLabel(/Toucher pour changer\.$/));
  for (const i of [0, 0, 2, 3, 3, 3]) { await f.nth(i).click().catch(() => {}); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(600); await shot(pg, 'vitraux');
  await open(pg, 'marche.b4.r4', 4, 9000); await shot(pg, 'carillon');
  await open(pg, 'serre.b4.r4', 6);
  const pics = vis(pg, pg.getByLabel(/^Première image/));
  const box = await pics.first().boundingBox();
  await shot(pg, 'differences');
  await open(pg, 'marche.b4.r4', 8); await shot(pg, 'etagere');
  await open(pg, 'serre.b4.r4', 7); await vis(pg, pg.getByLabel(/^Ombre 2/)).first().click(); await pg.waitForTimeout(400); await shot(pg, 'ombres');
  await open(pg, 'horlo.b4.r4', 7);
  // Hints sheet.
  await vis(pg, pg.getByLabel('Indices')).last().click(); await pg.waitForTimeout(900); await shot(pg, 'hints');
  await vis(pg, pg.getByRole('button', { name: /^Gratuit$/ })).last().click().catch(() => {}); await pg.waitForTimeout(1200); await shot(pg, 'hint-shown');
  // A success screen, caught while the lantern catches.
  for (const price of ['5', '10', '20']) {
    await vis(pg, pg.getByLabel('Indices')).last().click(); await pg.waitForTimeout(450);
    const bt = vis(pg, pg.getByRole('button', { name: new RegExp('^' + price + '$') }));
    if (await bt.count()) { await bt.last().click(); await pg.waitForTimeout(700); }
    const back = vis(pg, pg.getByText('Revenir au puzzle')); if (await back.count()) { await back.last().click(); await pg.waitForTimeout(300); }
    if (pg.url().includes('success')) break;
  }
  await pg.waitForTimeout(1500); await shot(pg, 'success');
  await pg.goto('http://localhost:8768/building/biblio.b1'); await pg.waitForTimeout(2500);
  await vis(pg, pg.getByLabel(/^Lanterne-clé/)).first().click(); await pg.waitForTimeout(1800); await shot(pg, 'seal');
  await pg.goto('http://localhost:8768/carnet'); await pg.waitForTimeout(2500); await shot(pg, 'carnet');
  await b.close();
  console.log('done');
})().catch((e) => { console.error('FAIL', e.message.slice(0, 400)); process.exit(1); });
