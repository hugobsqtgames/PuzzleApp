// The App Store « creative assets » (iOS 27): the product page header and the search results image,
// in the look of the screenshots (night sky, warm glow, real captures of the app in phones).
//   node creative.js            → store/out/creative-{header,search,universal}-fr.png
//   LANG_=en node creative.js   → …-en.png (captures store/app-en-*.png)
// Sizes from Apple's creative assets specifications: header 21:9 3840 × 1646, search results 3:2
// 3840 × 2560, universal 16:9 5244 × 2950 (used for both). No transparency. The focal point (title
// and phones) stays in the centre, where every placement and crop keeps it.
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const EN = process.env.LANG_ === 'en';
const PFX = EN ? 'app-en' : 'app';
const img = (n) => 'data:image/png;base64,' + fs.readFileSync(`store/${fs.existsSync(`store/${PFX}-${n}.png`) ? PFX : 'app'}-${n}.png`).toString('base64');
const icon = 'data:image/png;base64,' + fs.readFileSync(__dirname + '/../../app/assets/icon.png').toString('base64');
const T = EN
  ? { k: 'Lampion', t: 'Every puzzle<br>brings back a light', s: '1,000 lanterns to relight · 26 kinds of puzzles · No ads, no account' }
  : { k: 'Lampion', t: 'Chaque énigme<br>rallume une lumière', s: '1 000 lanternes à rallumer · 26 familles d’énigmes · Sans pub, sans compte' };

const KINDS = {
  header: { w: 3840, h: 1646, layout: 'wide' },
  search: { w: 3840, h: 2560, layout: 'tall' },
  universal: { w: 5244, h: 2950, layout: 'universal' },
};

const stars = (n, seed) => { let s = seed, o = ''; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < n; i++) { const x = r() * 100, y = r() * 70, z = 1.5 + r() * 4, a = 0.25 + r() * 0.6; o += `<i style="left:${x}%;top:${y}%;width:${z}px;height:${z}px;opacity:${a}"></i>`; } return o; };
const lanterns = (n, seed, W, H) => { let s = seed, o = ''; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < n; i++) { const x = r() * W, y = H * (0.55 + r() * 0.45), z = 8 + r() * 18, pink = r() < 0.3; o += `<b style="left:${x}px;top:${y}px;width:${z}px;height:${z * 1.2}px;background:radial-gradient(circle,${pink ? '#FFE6F0' : '#FFF3D6'} 0%,${pink ? '#F7A8C8' : '#F4B45E'} 45%,rgba(244,180,94,0) 72%);box-shadow:0 0 ${z * 3}px ${pink ? 'rgba(247,168,200,.5)' : 'rgba(244,180,94,.55)'}"></b>`; } return o; };

/** A phone with a real capture, w wide, centred on (cx, top), turned by rot degrees. */
function phone(src, w, cx, top, rot, z) {
  const b = Math.round(w * 0.022), r = Math.round(w * 0.12);
  return `<div class="ph" style="left:${Math.round(cx - w / 2)}px;top:${Math.round(top)}px;width:${w}px;padding:${b}px;border-radius:${r + b}px;transform:rotate(${rot}deg);z-index:${z}"><img src="${src}" style="width:100%;display:block;border-radius:${r}px"></div>`;
}

function html({ w: W, h: H, layout }) {
  let body = '', textTop, f;
  if (layout === 'wide') {
    // Title in the middle, a phone on each side, lanterns rising behind.
    f = 1;
    const pw = 560;
    body = phone(img('map'), pw, W / 2 - 1380, H * 0.16, -8, 1) + phone(img('carillon'), pw, W / 2 + 1380, H * 0.16, 8, 1);
    textTop = H * 0.13;
  } else if (layout === 'tall') {
    // The game itself: three phones side by side under a short line.
    f = 1.05;
    const pw = 820;
    body = phone(img('map'), pw, W / 2 - 1000, H * 0.36, -5, 1) + phone(img('carillon'), pw, W / 2 + 1000, H * 0.36, 5, 1) + phone(img('home'), pw + 40, W / 2, H * 0.31, 0, 2);
    textTop = H * 0.07;
  } else {
    // 16:9, cropped to 21:9 (header) or 3:2 (search): the title and phones stay in the centre.
    f = 1.25;
    const pw = 720;
    body = phone(img('map'), pw, W / 2 - 1650, H * 0.27, -8, 1) + phone(img('carillon'), pw, W / 2 + 1650, H * 0.27, 8, 1);
    textTop = H * 0.25;
  }
  const iconSize = Math.round((layout === 'wide' ? 200 : 230) * f);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;position:relative;background:radial-gradient(ellipse 60% 55% at 50% 70%,#3a2a1c 0%,rgba(40,30,30,0) 70%),linear-gradient(180deg,#141833 0%,#0D0F1E 60%,#090a15 100%);font-family:'Liberation Sans',sans-serif}
  .st i{position:absolute;border-radius:50%;background:#FFF3D6}
  .ln b{position:absolute;border-radius:50%}
  .ph{position:absolute;background:#1b1e36;box-shadow:0 0 0 4px #2c3052,0 60px 160px rgba(0,0,0,.65),0 0 220px rgba(244,180,94,.2)}
  .txt{position:absolute;left:0;right:0;top:${textTop}px;text-align:center;z-index:5}
  .ic{width:${iconSize}px;height:${iconSize}px;border-radius:${Math.round(iconSize * 0.225)}px;box-shadow:0 0 0 3px rgba(255,255,255,.06),0 40px 120px rgba(0,0,0,.55),0 0 200px rgba(244,180,94,.45)}
  .k{color:#F4B45E;font-size:${54 * f}px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-top:${44 * f}px}
  .t{color:#F6EEDC;font-family:'Bitstream Charter',Georgia,serif;font-weight:700;font-size:${layout === 'tall' ? 132 : 150 * f}px;line-height:1.06;margin-top:${22 * f}px}
  .s{color:#A9ADCB;font-size:${50 * f}px;margin-top:${30 * f}px}
  </style></head><body><div class="st">${stars(layout === 'universal' ? 320 : 240, 11)}</div><div class="ln">${lanterns(38, 5, W, H)}</div>
  ${body}
  <div class="txt">${layout === 'tall' ? '' : `<img class="ic" src="${icon}">`}<div class="k">${T.k}</div><div class="t">${T.t}</div><div class="s">${T.s}</div></div>
  </body></html>`;
}

(async () => {
  fs.mkdirSync('store/out', { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const [name, k] of Object.entries(KINDS)) {
    const pg = await b.newPage({ viewport: { width: k.w, height: k.h } });
    await pg.setContent(html(k)); await pg.waitForTimeout(400);
    await pg.screenshot({ path: `store/out/creative-${name}-${EN ? 'en' : 'fr'}.png` });
    await pg.close();
  }
  await b.close(); console.log('done');
})();
