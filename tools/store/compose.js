// Composes the App Store images from real captures. usage: node compose.js [iphone|iphone65|iphone63|duo|ipad]
// LANG_=en: the English images (texts below, captures store/<prefix>-en-*.png) → store/out/<kind>-en-XX.png.
// duo: « iPhone Duo » in App Store Connect (1398 × 2034), captures DUO prefix (699 × 1017 @2x).
// iphone65: the iPhone 6.5" set (1284 × 2778), the same composition as the 6.9" one, drawn 12 px
// shorter (empty background at the bottom) and scaled to 97.3 %.
// iphone63: the iPhone 6.1"/6.3" set (1206 × 2622) asked by App Store Connect for « iPhone with
// Dynamic Island », the same composition drawn 2 px taller and scaled to 91.4 %.
const fs = require('fs');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const KIND = process.argv[2] || 'iphone';
const SIZE = KIND === 'ipad' ? { w: 2064, h: 2752 } : KIND === 'duo' ? { w: 1398, h: 2034 } : KIND === 'iphone65' ? { w: 1320, h: 2856 } : KIND === 'iphone63' ? { w: 1320, h: 2870 } : { w: 1320, h: 2868 };
const EN = process.env.LANG_ === 'en';
const SCALE = KIND === 'iphone65' ? 1284 / 1320 : KIND === 'iphone63' ? 1206 / 1320 : 1;
const PFX = (KIND === 'ipad' ? 'ipad' : KIND === 'duo' ? 'duo' : 'app') + (EN ? '-en' : '');
const img = (n) => 'data:image/png;base64,' + fs.readFileSync(`store/${PFX}-${n}.png`).toString('base64');
const SLIDES = [
  { k: 'Lampion', t: 'Chaque énigme<br>rallume une lumière', s: 'Vesper s’est endormie. À toi de rallumer ses lanternes, une à une.', shots: ['home'] },
  { k: 'Une ville à réveiller', t: 'Huit quartiers,<br>une seule nuit', s: 'Du Phare à l’Observatoire, chaque lumière rendue réveille un peu plus la ville.', shots: ['map'] },
  { k: '101 salles', t: 'Pas deux salles<br>pareilles', s: 'Chaque salle a son décor, son histoire et ses lanternes cachées.', shots: ['room-serre.b4.r4', 'room-biblio.b4.r3', 'room-marche.b1.r1'] },
  { k: 'Des énigmes justes', t: 'La logique,<br>jamais le hasard', s: 'Chaque puzzle se résout par le raisonnement. Pas de chrono, prends ton temps.', shots: ['vitraux'] },
  { k: '26 familles d’énigmes', t: 'Écoute, observe,<br>déduis', s: 'Mélodies, vitraux, ombres, passerelles, rubans, constellations…', shots: ['carillon', 'passerelles', 'ombres'] },
  { k: 'Nilo', t: 'Un compagnon<br>qui veille sur toi', s: 'Nilo cligne, s’étonne, se réjouit… et murmure un indice quand tu bloques.', shots: ['nilo', 'hint-shown'] },
  { k: 'Plus qu’une lanterne', t: 'Objets cachés<br>et sceaux secrets', s: 'Fouille les décors, relève les chiffres des salles, ouvre les lanternes-clés.', shots: ['room-etabli', 'seal'] },
  { k: 'Saisons et fêtes', t: 'Vesper vit<br>au fil de l’année', s: 'Printemps des Lanternes, Nuit des Citrouilles, Veillée de Vesper : trois rendez-vous chaque année.', shots: ['event-halloween', 'event-lanternes', 'event-noel'] },
  { k: 'Chaque soir', t: 'Un défi du soir,<br>le même pour tous', s: 'Une nouvelle énigme chaque jour, une série à entretenir, un carnet à remplir.', shots: ['daily', 'carnet'] },
  { k: 'Rien que le jeu', t: 'Sans compte. Sans pub.<br>Sans pistage.', s: 'Tout reste sur ton appareil. Mode Libre, maison à décorer, et tout se joue hors ligne.', shots: ['house', 'success', 'free'] },
];
const SLIDES_EN = [
  { k: 'Lampion', t: 'Every puzzle<br>brings back a light', s: 'Vesper has fallen asleep. It’s up to you to relight its lanterns, one by one.' },
  { k: 'A city to wake up', t: 'Eight districts,<br>one single night', s: 'From the Lighthouse to the Observatory, every light you bring back wakes the city a little more.' },
  { k: '101 rooms', t: 'No two rooms<br>alike', s: 'Each room has its own setting, its own story and its hidden lanterns.' },
  { k: 'Fair puzzles', t: 'Logic,<br>never luck', s: 'Every puzzle is solved by reasoning. No timer: take your time.' },
  { k: '26 kinds of puzzles', t: 'Listen, look,<br>deduce', s: 'Melodies, stained glass, shadows, bridges, ribbons, constellations…' },
  { k: 'Nilo', t: 'A companion<br>watching over you', s: 'Nilo blinks, wonders, rejoices… and whispers a hint when you’re stuck.' },
  { k: 'More than a lantern', t: 'Hidden objects<br>and secret seals', s: 'Search the scenery, note each room’s number, open the keystone lanterns.' },
  { k: 'Seasons and festivals', t: 'Vesper lives<br>through the year', s: 'The Lantern Spring, the Night of Pumpkins, the Vesper Vigil: three events every year.' },
  { k: 'Every evening', t: 'An evening challenge,<br>the same for all', s: 'A new puzzle every day, a streak to keep, a notebook to fill.' },
  { k: 'Just the game', t: 'No account. No ads.<br>No tracking.', s: 'Everything stays on your device. Free play, a house to decorate, and it all works offline.' },
];
if (EN) SLIDES.forEach((sl, i) => Object.assign(sl, SLIDES_EN[i]));
const stars = (() => { let s = 7, o = ''; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 140; i++) { const x = r() * 100, y = r() * 62, z = 1 + r() * 3.2, a = 0.25 + r() * 0.6; o += `<i style="left:${x}%;top:${y}%;width:${z}px;height:${z}px;opacity:${a}"></i>`; } return o; })();
function phone(src, w, extra = '') {
  const b = Math.round(w * 0.022), r = Math.round(w * (KIND === 'ipad' ? 0.045 : KIND === 'duo' ? 0.075 : 0.12));
  return `<div class="ph" style="width:${w}px;padding:${b}px;border-radius:${r + b}px;${extra}"><img src="${src}" style="width:100%;display:block;border-radius:${r}px"></div>`;
}
function html(sl) {
  const W = SIZE.w, H = SIZE.h, ipad = KIND === 'ipad', duo = KIND === 'duo';
  const top = ipad ? 660 : duo ? 640 : 680;
  const n = sl.shots.length;
  let dev = '';
  const aspect = ipad ? 2752 / 2064 : 2796 / 1290;
  const at = (src, w, cx, y, rot, z) => phone(src, w, `left:${Math.round(W / 2 + cx - w / 2)}px;top:${y}px;transform:rotate(${rot}deg);z-index:${z}`);
  if (n === 1) { const w = ipad ? 1500 : duo ? 900 : 980; dev = at(img(sl.shots[0]), w, 0, top, 0, 1); }
  else if (n === 2) {
    const w = ipad ? 1000 : duo ? 640 : 720, dx = ipad ? 500 : duo ? 340 : 340;
    dev = at(img(sl.shots[0]), w, -dx, top, -3, 1) + at(img(sl.shots[1]), w, dx, top + (ipad ? 260 : duo ? 300 : 420), 3, 2);
  } else {
    const w = ipad ? 820 : duo ? 540 : 600, c = ipad ? 960 : duo ? 660 : 720, dx = ipad ? 640 : duo ? 440 : 440;
    dev = at(img(sl.shots[0]), w, -dx, top + (ipad ? 220 : duo ? 220 : 340), -6, 1) + at(img(sl.shots[2]), w, dx, top + (ipad ? 220 : duo ? 220 : 340), 6, 1) + at(img(sl.shots[1]), c, 0, top, 0, 3);
  }
  const f = ipad ? 1.15 : 1;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;position:relative;background:radial-gradient(ellipse 70% 45% at 50% 62%,#3a2a1c 0%,rgba(40,30,30,0) 70%),linear-gradient(180deg,#141833 0%,#0D0F1E 55%,#090a15 100%);font-family:'Liberation Sans',sans-serif}
  .st i{position:absolute;border-radius:50%;background:#FFF3D6}
  .txt{position:absolute;left:0;right:0;top:${ipad ? 150 : 170}px;text-align:center;padding:0 ${ipad ? 200 : 90}px}
  .k{color:#F4B45E;font-size:${36 * f}px;letter-spacing:.18em;text-transform:uppercase;font-weight:700}
  .t{color:#F6EEDC;font-family:'Bitstream Charter',Georgia,serif;font-weight:700;font-size:${92 * f}px;line-height:1.08;margin-top:${26 * f}px}
  .s{color:#A9ADCB;font-size:${40 * f}px;line-height:1.35;text-wrap:balance;margin-top:${30 * f}px}
  .row{position:absolute;left:0;right:0;display:flex;justify-content:center;align-items:flex-start}
  .ph{position:absolute}
  .ph{background:#1b1e36;box-shadow:0 0 0 3px #2c3052,0 40px 120px rgba(0,0,0,.6),0 0 160px rgba(244,180,94,.18)}
  </style></head><body><div class="st">${stars}</div>
  <div class="txt"><div class="k">${sl.k}</div><div class="t">${sl.t}</div><div class="s">${sl.s}</div></div>${dev}</body></html>`;
}
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const pg = await b.newPage({ viewport: { width: SIZE.w, height: SIZE.h }, deviceScaleFactor: SCALE });
  for (let i = 0; i < SLIDES.length; i++) {
    if (SLIDES[i].shots.some((n) => !fs.existsSync(`store/${PFX}-${n}.png`))) { console.log('skip', i + 1); continue; }
    await pg.setContent(html(SLIDES[i])); await pg.waitForTimeout(300);
    await pg.screenshot({ path: `store/out/${KIND}${EN ? '-en' : ''}-${String(i + 1).padStart(2, '0')}.png` });
  }
  await b.close(); console.log('done');
})();
