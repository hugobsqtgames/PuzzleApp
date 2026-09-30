const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const W = +(process.env.W || 430), H = +(process.env.H || 932), DSF = +(process.env.DSF || 3), P = process.env.PREFIX || 'app';
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = async (saveFile) => {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF });
    await ctx.addInitScript((s) => { if (!localStorage.getItem('fs:lampion/save.json')) localStorage.setItem('fs:lampion/save.json', s); }, fs.readFileSync(saveFile, 'utf8'));
    const pg = await ctx.newPage(); await pg.goto('http://localhost:8768/'); await pg.waitForTimeout(9000); return pg;
  };
  const shot = (pg, n) => pg.screenshot({ path: `store/${P}-${n}.png` });
  let pg = await page(__dirname + '/saveMock.json');
  await pg.goto('http://localhost:8768/room/horlo.b1.r2'); await pg.waitForTimeout(3500); await shot(pg, 'room-etabli');
  await pg.context().close();
  pg = await page(__dirname + '/save800.json');
  for (const r of (process.env.ROOMS || 'serre.b4.r4,biblio.b4.r3,marche.b1.r1').split(',')) { await pg.goto('http://localhost:8768/room/' + r); await pg.waitForTimeout(6000); await shot(pg, 'room-' + r); }
  await b.close(); console.log('done');
})().catch((e) => { console.error('FAIL', e.message.slice(0, 400)); process.exit(1); });
