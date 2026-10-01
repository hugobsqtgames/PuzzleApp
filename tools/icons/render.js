// Renders Lampion's app icon (prototype/index.html, appIconSVG) and its variants
// to the PNG files Expo needs: iOS icon, Android adaptive icon (foreground,
// background, monochrome), iOS dark and tinted icons, splash image and favicon.
//   node tools/icons/render.js
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const OUT = path.resolve(__dirname, '../../app/assets');

const nilo = (fl, body, stroke = true) => `
  <path d="M52 92c10-2 16-12 14-24-1-8 0-16 2-24" stroke="${body}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
  <g transform="translate(6,30) scale(.64)"><path d="M36 54Q30 30 30 18q1-4 5-1q9 9 15 21z" fill="${body}"/><path d="M80 54Q86 30 86 18q-1-4-5-1q-9 9-15 21z" fill="${body}"/><path d="M58 34c22 0 32 22 32 42s-14 28-32 28-32-8-32-28 10-42 32-42z" fill="${body}" ${stroke ? `stroke="${fl}" stroke-opacity=".45" stroke-width="1.6"` : ''}/></g>`;
const glow = (fl) => `<defs><radialGradient id="f"><stop offset="0" stop-color="${fl}" stop-opacity=".9"/><stop offset=".35" stop-color="${fl}" stop-opacity=".35"/><stop offset="1" stop-color="${fl}" stop-opacity="0"/></radialGradient>
  <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080914"/><stop offset="1" stop-color="#1d2146"/></linearGradient></defs>`;
const flame = (fl) => `<circle cx="68" cy="36" r="30" fill="url(#f)"/>`;
const core = (fl) => `<circle cx="68" cy="36" r="8.5" fill="${fl}"/><circle cx="68" cy="36" r="4" fill="#FFF7E4"/>`;

const FL = '#F4B45E', BODY = '#151936';
const files = {
  // iOS: square, opaque (the system rounds the corners).
  'icon.png': [1024, `<svg viewBox="0 0 100 100">${glow(FL)}<rect width="100" height="100" fill="url(#b)"/>${flame(FL)}${nilo(FL, BODY)}${core(FL)}</svg>`],
  // iOS 18 dark and tinted icons: no background (the system draws it), a tinted one in greys only.
  'icon-dark.png': [1024, `<svg viewBox="0 0 100 100">${glow(FL)}${flame(FL)}${nilo(FL, '#2A3068')}${core(FL)}</svg>`],
  'icon-tinted.png': [1024, `<svg viewBox="0 0 100 100">${glow('#FFFFFF')}${flame('#FFFFFF')}${nilo('#FFFFFF', '#8C8C8C')}${core('#FFFFFF')}</svg>`],
  // Android adaptive: the foreground must fit the inner 66 % safe zone.
  'android-icon-foreground.png': [1024, `<svg viewBox="-25 -25 150 150">${glow(FL)}${flame(FL)}${nilo(FL, BODY)}${core(FL)}</svg>`],
  'android-icon-background.png': [1024, `<svg viewBox="0 0 100 100">${glow(FL)}<rect width="100" height="100" fill="url(#b)"/></svg>`],
  'android-icon-monochrome.png': [1024, `<svg viewBox="-25 -25 150 150">${nilo('#fff', '#fff', false)}<circle cx="68" cy="36" r="8.5" fill="#fff"/></svg>`],
  // Splash: Nilo and his flame on the night (the background colour is set in app.json).
  'splash-icon.png': [1024, `<svg viewBox="0 0 100 100">${glow(FL)}${flame(FL)}${nilo(FL, '#1E2347')}${core(FL)}</svg>`],
  'favicon.png': [196, `<svg viewBox="0 0 100 100">${glow(FL)}<rect width="100" height="100" rx="22" fill="url(#b)"/>${flame(FL)}${nilo(FL, BODY)}${core(FL)}</svg>`],
};

// Seasonal icons (store/… mockup « Saisons »): the flame's colour, the sky, and what falls around Nilo.
// Swapped by the app (expo-alternate-app-icons, needs a development or store build).
const SEASONS = {
  Printemps: { fl: '#F29BC4', sky: ['#140c24', '#3a2350'], accent: '#F7B6D2', particle: 'petal', extra: '<circle cx="34" cy="22" r="5" fill="#F7B6D2"/><circle cx="34" cy="22" r="2" fill="#FFF3D6"/>' },
  Ete: { fl: '#FFD98E', sky: ['#061219', '#13414a'], accent: '#FFE89A', particle: 'firefly', extra: '' },
  Automne: { fl: '#E8744A', sky: ['#140a07', '#45231a'], accent: '#F0924A', particle: 'leaf', extra: '' },
  Hiver: { fl: '#BFE6F0', sky: ['#070c1c', '#22335a'], accent: '#EAF6FF', particle: 'snow', extra: '<path d="M28 84q30 10 60 0v8q-30 10-60 0z" fill="#E0625A"/>' },
  Halloween: { fl: '#F28C28', sky: ['#0c0612', '#3b1640'], accent: '#F28C28', particle: 'bat', extra: '<path d="M38 26l20-22 20 22z" fill="#2a1030" stroke="#F28C28" stroke-width="1.5"/>',
    deco: '<circle cx="82" cy="84" r="9" fill="#F28C28"/><path d="M82 75v-4" stroke="#6b8f3a" stroke-width="2"/><path d="M78 83l2-2 2 2M84 83l2-2 2 2M78 88q4 3 8 0" stroke="#3b1640" stroke-width="1.4" fill="none"/>' },
  // Nilo as Father Christmas: red coat with fur and belt, white beard, floppy hat (same drawing as the app, src/ui/art.ts).
  Noel: { fl: '#FFE6B0', sky: ['#060b1a', '#1d3a5a'], accent: '#E0625A', particle: 'snow',
    extra: '<defs><clipPath id="nb"><path d="M58 34c22 0 32 22 32 42s-14 28-32 28-32-8-32-28 10-42 32-42z"/></clipPath></defs><g clip-path="url(#nb)"><rect x="20" y="70" width="80" height="38" fill="#D9473F"/><rect x="54" y="88" width="8" height="20" fill="#FFF7EC"/><rect x="20" y="91" width="80" height="5" fill="#1B1F3A"/><rect x="54" y="90" width="8" height="7" rx="1.5" fill="none" stroke="#FFD98E" stroke-width="1.6"/><path d="M20 101q38 8 76 0v8H20z" fill="#FFF7EC"/></g>'
      + '<path d="M41 75q2 13 9 19q4 6 8 7q4-1 8-7q7-6 9-19q-4 4-8 3q-4 3-9 3q-5 0-9-3q-4 1-8-3z" fill="#FFF7EC"/><path d="M58 76q-6-3-11 1q4 4 11 0q7 4 11 0q-5-4-11-1z" fill="#FFFFFF"/>'
      + '<path d="M44 41Q47 18 66 16Q81 15 88 31L84 33Q78 25 71 27Q75 34 75 41Z" fill="#D9473F"/><rect x="40" y="36" width="38" height="9" rx="4.5" fill="#FFF7EC"/><circle cx="87" cy="34" r="5.5" fill="#FFF7EC"/>',
    deco: '<path d="M18 14l2 5 5 .5-4 3 1.5 5-4.5-3-4.5 3 1.5-5-4-3 5-.5z" fill="#FFE6B0"/>' },
};
function rng(seed) { let x = seed; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; }
function particles(kind, n, accent, seed) {
  const r = rng(seed); let out = '';
  for (let i = 0; i < n; i++) {
    const x = (r() * 100).toFixed(1), y = (r() * 100).toFixed(1), a = Math.round(r() * 360), s = 0.6 + r() * 0.8;
    if (kind === 'petal') out += `<ellipse cx="${x}" cy="${y}" rx="${(2.4 * s).toFixed(1)}" ry="${(1.3 * s).toFixed(1)}" fill="${accent}" opacity=".85" transform="rotate(${a} ${x} ${y})"/>`;
    else if (kind === 'firefly') out += `<circle cx="${x}" cy="${y}" r="${(3.4 * s).toFixed(1)}" fill="${accent}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${(1.1 * s).toFixed(1)}" fill="${accent}"/>`;
    else if (kind === 'leaf') out += `<path d="M${x} ${y}q${3 * s} ${-3 * s} ${6 * s} 0q${-3 * s} ${3 * s} ${-6 * s} 0z" fill="${[accent, '#C8553D', '#E8B04A'][i % 3]}" transform="rotate(${a} ${x} ${y})"/>`;
    else if (kind === 'snow') out += `<circle cx="${x}" cy="${y}" r="${(1.3 * s).toFixed(1)}" fill="#FFFFFF" opacity="${(0.5 + r() * 0.45).toFixed(2)}"/>`;
    else if (kind === 'bat') out += i % 2 ? `<circle cx="${x}" cy="${y}" r="${(0.9 * s).toFixed(1)}" fill="#F7C68A" opacity=".7"/>` : `<path d="M${x} ${y}q${3 * s} ${-3 * s} ${5 * s} ${-1 * s}q${s} ${2 * s} ${3 * s} 0q${2 * s} ${2 * s} ${3 * s} 0q${2 * s} ${-2 * s} ${5 * s} ${s}q${-4 * s} ${s} ${-8 * s} ${4 * s}q${-4 * s} ${-3 * s} ${-8 * s} ${-4 * s}z" fill="#05020a" opacity=".85"/>`;
  }
  return out;
}
const niloWith = (fl, body, extra) => nilo(fl, body).replace('</g>', `<circle cx="49" cy="66" r="3.4" fill="${fl}"/><circle cx="67" cy="66" r="3.4" fill="${fl}"/>${extra}</g>`);
for (const [name, c] of Object.entries(SEASONS)) {
  const defs = `<defs><radialGradient id="f"><stop offset="0" stop-color="${c.fl}" stop-opacity=".9"/><stop offset=".35" stop-color="${c.fl}" stop-opacity=".35"/><stop offset="1" stop-color="${c.fl}" stop-opacity="0"/></radialGradient>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.sky[0]}"/><stop offset="1" stop-color="${c.sky[1]}"/></linearGradient></defs>`;
  const deco = particles(c.particle, c.particle === 'bat' ? 10 : 14, c.accent, name.length * 97) + (c.deco ?? '');
  const art = `${flame(c.fl)}${niloWith(c.fl, BODY, c.extra)}${core(c.fl)}`;
  files[`icons/season-${name.toLowerCase()}.png`] = [1024, `<svg viewBox="0 0 100 100">${defs}<rect width="100" height="100" fill="url(#b)"/>${deco}${art}</svg>`];
  files[`icons/season-${name.toLowerCase()}-fg.png`] = [1024, `<svg viewBox="-25 -25 150 150">${defs}${art}</svg>`];
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const [name, [size, svg]] of Object.entries(files)) {
    const pg = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await pg.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await pg.screenshot({ path: path.join(OUT, name), omitBackground: !(name === 'icon.png' || name === 'favicon.png' || name.includes('background') || (name.startsWith('icons/') && !name.endsWith('-fg.png'))) });
    await pg.close();
    console.log('wrote', name, size);
  }
  await b.close();
})();
