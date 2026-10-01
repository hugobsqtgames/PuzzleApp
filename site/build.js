// Builds Lampion's small website into site/dist: a home page and the privacy
// policy, in French and English. The policy is read from store/CONFIDENTIALITE.md,
// so the site always says exactly what the App Store page links to.
// No cookie, no analytics, nothing loaded from elsewhere.
//   node site/build.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'dist');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'en'), { recursive: true });
fs.cpSync(path.join(__dirname, 'img'), path.join(OUT, 'img'), { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/"([^"]+)"/g, '“$1”').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/'/g, '’');

/** The little Markdown the policy uses: headings, paragraphs, bold, italics. */
function markdown(md) {
  return md.trim().split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (b.startsWith('# ')) return `<h1>${inline(b.slice(2))}</h1>`;
    if (b.startsWith('## ')) return `<h2>${inline(b.slice(3))}</h2>`;
    return `<p>${inline(b).replace(/\n/g, ' ')}</p>`;
  }).join('\n');
}

const [policyFr, policyEn] = fs.readFileSync(path.join(ROOT, 'store/CONFIDENTIALITE.md'), 'utf8').split(/\n---\n/);

const CSS = `
:root{--bg:#0D0F1E;--s1:#161A33;--line:#2A2F55;--tx:#F6EEDC;--tx2:#A9ADCB;--amber:#F4B45E;--gold:#FFD98E}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;color:var(--tx);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:radial-gradient(ellipse 80% 40% at 50% 0%,#1d2146 0%,rgba(13,15,30,0) 70%),var(--bg);min-height:100vh}
a{color:var(--amber)}
.wrap{max-width:880px;margin:0 auto;padding:24px 16px 64px}
nav{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:15px}
nav .brand{display:flex;align-items:center;gap:10px;color:var(--tx);text-decoration:none;font-family:Georgia,"Times New Roman",serif;font-size:20px}
nav .brand img{width:32px;height:32px;border-radius:8px}
nav .links{display:flex;gap:16px}
h1,h2{font-family:Georgia,"Times New Roman",serif;font-weight:700;line-height:1.15}
h1{font-size:clamp(34px,7vw,54px);margin:48px 0 12px}
h2{font-size:24px;margin:36px 0 8px;color:var(--gold)}
.lead{color:var(--tx2);font-size:20px;max-width:640px}
.hero{text-align:center}
.hero .icon{width:112px;height:112px;border-radius:26px;margin-top:40px;box-shadow:0 0 80px rgba(244,180,94,.25)}
.hero .lead{margin:0 auto}
.badge{display:inline-block;margin-top:24px;padding:12px 22px;border-radius:999px;border:1px solid var(--line);background:var(--s1);color:var(--tx2);font-weight:600}
.shots{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:44px 0 8px}
.shots img{width:100%;border-radius:18px;border:1px solid var(--line);display:block}
@media (max-width:700px){.shots{grid-template-columns:repeat(2,1fr)}}
.points{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:28px}
@media (max-width:700px){.points{grid-template-columns:1fr}}
.point{background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:18px 20px}
.point h3{margin:0 0 6px;font-size:18px}
.point p{margin:0;color:var(--tx2)}
.policy p{color:#DDD6C6}
footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--line);color:var(--tx2);font-size:14px;display:flex;flex-wrap:wrap;gap:8px 20px}
`;

function page({ lang, title, description, body, alt, here }) {
  const fr = lang === 'fr', up = fr ? '' : '../';
  const links = fr
    ? `<a href="./">Accueil</a><a href="confidentialite.html">Confidentialité</a><a href="${alt}" lang="en" hreflang="en">English</a>`
    : `<a href="./">Home</a><a href="privacy.html">Privacy</a><a href="${alt}" lang="fr" hreflang="fr">Français</a>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="icon" href="${up}img/favicon.png">
<link rel="alternate" hreflang="${fr ? 'en' : 'fr'}" href="${alt}">
<style>${CSS}</style>
</head>
<body><div class="wrap">
<nav><a class="brand" href="./"><img src="${up}img/icon.png" alt="">Lampion</a><div class="links">${links}</div></nav>
${body}
<footer><span>Lampion · Hugo BUSQUET</span><span>${fr ? 'Sans compte, sans publicité, sans pistage. Ce site non plus.' : 'No account, no ads, no tracking. This site neither.'}</span>${here === 'home' ? '' : `<a href="./">${fr ? 'Retour à l’accueil' : 'Back home'}</a>`}</footer>
</div></body>
</html>
`;
}

const shots = (up, fr) => `<div class="shots">
<img src="${up}img/home.jpg" alt="${fr ? 'L’accueil de Lampion : la ville de Vesper au crépuscule et Nilo' : 'Lampion’s home: the town of Vesper at dusk, and Nilo'}" loading="lazy">
<img src="${up}img/room.jpg" alt="${fr ? 'Une salle éclairée, ses lanternes allumées' : 'A lit room and its lanterns'}" loading="lazy">
<img src="${up}img/carillon.jpg" alt="${fr ? 'Une énigme du Carillon : rejouer la mélodie des cloches' : 'A Chimes puzzle: play the bells’ melody back'}" loading="lazy">
<img src="${up}img/event.jpg" alt="${fr ? 'L’événement du Printemps des Lanternes' : 'The Lantern Spring event'}" loading="lazy">
</div>`;

const homeFr = page({
  lang: 'fr', here: 'home', alt: 'en/',
  title: 'Lampion · des énigmes pour rallumer une ville',
  description: 'Lampion : 1 000 lanternes à rallumer, 26 familles d’énigmes, un défi chaque soir. Sans compte, sans publicité, sans pistage, hors ligne.',
  body: `<section class="hero">
<img class="icon" src="img/icon.png" alt="L’icône de Lampion : Nilo et sa flamme">
<h1>Chaque énigme rallume une lumière</h1>
<p class="lead">Vesper s’est endormie. Avec Nilo, petit compagnon à la flamme, rallume ses 1 000 lanternes une à une, quartier après quartier.</p>
<span class="badge">Bientôt sur l’App Store · iPhone et iPad</span>
</section>
${shots('', true)}
<div class="points">
<div class="point"><h3>26 familles d’énigmes</h3><p>Engrenages, vitraux, carillon, rubans, constellations, menteurs, balances… De la plus douce à la plus redoutable, chacune arrive avec sa présentation.</p></div>
<div class="point"><h3>Une ville à réveiller</h3><p>Huit quartiers, des salles toutes différentes, des objets cachés, des habitants endormis et les lettres de l’Allumeur.</p></div>
<div class="point"><h3>Chaque soir, et toute l’année</h3><p>Un défi du soir, le même pour tous. Les saisons changent la ville, et trois fêtes reviennent chaque année.</p></div>
<div class="point"><h3>Rien que le jeu</h3><p>Pas de compte, pas de publicité, pas d’achat, pas de pisteur. Tout reste sur ton téléphone, et tout se joue hors ligne.</p></div>
</div>
<h2>Aide</h2>
<p><strong>Ma progression est-elle sauvegardée ?</strong> Oui, sur ton téléphone. Si la sauvegarde iCloud de ton iPhone est activée, elle suit quand tu changes d’appareil. Dans Réglages, « Exporter ma progression » en fait aussi une copie que tu gardes où tu veux.</p>
<p><strong>Je bloque sur une énigme.</strong> Touche l’ampoule : Nilo propose un murmure, une piste, un éclairage ou la solution. Le mode Libre permet aussi de s’entraîner sur une famille, sans rien perdre.</p>
<p><strong>En quelle langue ?</strong> Français et anglais, selon la langue du téléphone, ou au choix dans les Réglages.</p>
<p>Ce que Lampion fait (et surtout ne fait pas) de tes données : <a href="confidentialite.html">politique de confidentialité</a>.</p>`,
});

const homeEn = page({
  lang: 'en', here: 'home', alt: '../',
  title: 'Lampion · puzzles to light a town back up',
  description: 'Lampion: 1,000 lanterns to light again, 26 kinds of puzzles, a new challenge every evening. No account, no ads, no tracking, offline.',
  body: `<section class="hero">
<img class="icon" src="../img/icon.png" alt="Lampion’s icon: Nilo and its flame">
<h1>Every puzzle lights a lantern</h1>
<p class="lead">Vesper has fallen asleep. With Nilo, a small companion with a flame, light its 1,000 lanterns again, one by one, district after district.</p>
<span class="badge">Coming soon to the App Store · iPhone and iPad</span>
</section>
${shots('../', false)}
<div class="points">
<div class="point"><h3>26 kinds of puzzles</h3><p>Gears, stained glass, chimes, ribbons, constellations, liars, scales… From gentle to fearsome, each one is introduced as it comes.</p></div>
<div class="point"><h3>A town to wake up</h3><p>Eight districts, rooms that are all different, hidden objects, sleeping townsfolk and the Lamplighter’s letters.</p></div>
<div class="point"><h3>Every evening, all year long</h3><p>An evening challenge, the same for everyone. The seasons change the town, and three festivals come back every year.</p></div>
<div class="point"><h3>Nothing but the game</h3><p>No account, no ads, no purchases, no trackers. Everything stays on your phone, and it all plays offline.</p></div>
</div>
<h2>Help</h2>
<p><strong>Is my progress saved?</strong> Yes, on your phone. If your iPhone’s iCloud Backup is on, it follows you to a new device. In Settings, “Export my progress” also makes a copy you can keep wherever you like.</p>
<p><strong>I’m stuck on a puzzle.</strong> Tap the light bulb: Nilo offers a whisper, a lead, an insight or the solution. Free play also lets you practise a kind of puzzle with nothing to lose.</p>
<p><strong>Which languages?</strong> French and English, following the phone’s language, or as you choose in Settings.</p>
<p>What Lampion does (and above all doesn’t do) with your data: <a href="privacy.html">privacy policy</a>.</p>`,
});

const privacyFr = page({ lang: 'fr', here: 'privacy', alt: 'en/privacy.html', title: 'Lampion · confidentialité', description: 'La politique de confidentialité de Lampion : aucune donnée collectée.', body: `<article class="policy">${markdown(policyFr)}</article>` });
const privacyEn = page({ lang: 'en', here: 'privacy', alt: '../confidentialite.html', title: 'Lampion · privacy', description: 'Lampion’s privacy policy: no data collected.', body: `<article class="policy">${markdown(policyEn)}</article>` });

fs.writeFileSync(path.join(OUT, 'index.html'), homeFr);
fs.writeFileSync(path.join(OUT, 'confidentialite.html'), privacyFr);
fs.writeFileSync(path.join(OUT, 'en/index.html'), homeEn);
fs.writeFileSync(path.join(OUT, 'en/privacy.html'), privacyEn);
// GitHub Pages: serve the files as they are (no Jekyll).
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('site/dist ready');
