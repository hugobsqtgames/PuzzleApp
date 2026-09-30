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

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const [name, [size, svg]] of Object.entries(files)) {
    const pg = await b.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await pg.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await pg.screenshot({ path: path.join(OUT, name), omitBackground: !(name === 'icon.png' || name === 'favicon.png' || name.includes('background')) });
    await pg.close();
    console.log('wrote', name, size);
  }
  await b.close();
})();
