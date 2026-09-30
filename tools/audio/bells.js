// Renders the six bells of the Carillon with the prototype's celesta
// (same engine as render.js), one pentatonic note each.
//   node tools/audio/bells.js   (Playwright + Chromium, ffmpeg)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'app/assets/audio');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const html = fs.readFileSync(path.join(ROOT, 'prototype/index.html'), 'utf8');
const engine = html.slice(html.indexOf('const mtof='), html.indexOf('const LABELS='));
const RATE = 44100;
/** D major pentatonic, low to high: the bells from left to right. */
const NOTES = [62, 64, 66, 69, 71, 74];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: `
    ${engine}
    window.__engine = { celesta, mtof };
    window.renderBell = async (midi) => {
      const { celesta, mtof } = window.__engine;
      const c = new OfflineAudioContext(1, Math.ceil(2.4 * ${RATE}), ${RATE});
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      const m = c.createGain(); m.gain.value = .8; m.connect(comp); comp.connect(c.destination);
      celesta(c, m, midi, .01, .32, 2.2);
      // A bell's low hum under the celesta.
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = mtof(midi - 12);
      g.gain.setValueAtTime(.0001, .01); g.gain.exponentialRampToValueAtTime(.08, .03); g.gain.exponentialRampToValueAtTime(.0001, 2.2);
      o.connect(g); g.connect(m); o.start(.01); o.stop(2.3);
      const b = await c.startRendering();
      return Array.from(b.getChannelData(0), (v) => Math.max(-1, Math.min(1, v)));
    };
  ` });
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
  for (let i = 0; i < NOTES.length; i++) {
    const s = await page.evaluate((n) => window.renderBell(n), NOTES[i]);
    const b = Buffer.alloc(44 + s.length * 2);
    b.write('RIFF', 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
    b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24);
    b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(s.length * 2, 40);
    s.forEach((v, k) => b.writeInt16LE(Math.round(v * 32767), 44 + k * 2));
    const wav = path.join(OUT, `sfx_bell_${i}.wav`);
    fs.writeFileSync(wav, b);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'aac', '-b:a', '96k', path.join(OUT, `sfx_bell_${i}.m4a`)]);
    fs.unlinkSync(wav);
    manifest.sfx[`bell_${i}`] = `sfx_bell_${i}.m4a`;
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await browser.close();
  console.log('rendered', NOTES.length, 'bells');
})();
