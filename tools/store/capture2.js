// Recaptures a first-time success and a well-started stained glass.
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
    await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(9000);
    return pg;
  };
  const vis = (l) => l.filter({ visible: true });
  const shot = (pg, n) => pg.screenshot({ path: `store/${P}-${n}.png` });
  const open = async (pg, room, n, wait = 1500) => { await pg.goto('http://localhost:8768/room/' + room); await pg.waitForTimeout(2500); await vis(pg.getByLabel(new RegExp('^Lanterne ' + n + ' sur'))).first().click(); await pg.waitForTimeout(700); await vis(pg.getByText(/^(Allumer|Rejouer|Reprendre)$/)).first().click(); await pg.waitForTimeout(wait); };

  let pg = await page(__dirname + '/saveMock.json');
  await open(pg, 'horlo.b2.r1', 5, 7000);
  for (const c of [4, 4, 1, 3]) { await vis(pg.getByLabel('Cloche ' + c)).first().click(); await pg.waitForTimeout(500); }
  await pg.waitForTimeout(1800); console.log('url', pg.url()); await shot(pg, 'success');
  await pg.context().close();

  pg = await page(__dirname + '/save800.json');
  await open(pg, 'theatre.b3.r4', 7);
  const clicks = { 'Colonne 1': 2, 'Colonne 2': 1, 'Colonne 3': 2, 'Colonne 4': 3, 'Colonne 5': 2, 'Ligne 1': 2 };
  for (const [l, n] of Object.entries(clicks)) for (let i = 0; i < n; i++) { await vis(pg.getByLabel(new RegExp('^' + l + ' :'))).first().click(); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(800); await shot(pg, 'vitraux');
  await b.close(); console.log('done');
})().catch((e) => { console.error('FAIL', e.message.slice(0, 400)); process.exit(1); });
