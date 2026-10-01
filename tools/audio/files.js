// Writes app/src/audio/files.ts from assets/audio/manifest.json (every rendered sound, by key).
//   node tools/audio/files.js
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/assets/audio/manifest.json'), 'utf8'));
const line = ([k, f]) => `  ${JSON.stringify(k)}: require("../../assets/audio/${f}"),`;
const out = `// Generated from assets/audio/manifest.json (tools/audio/files.js). Do not edit.

export const SFX_FILES: Record<string, number> = {
${Object.entries(m.sfx).map(line).join('\n')}
};
export const AMBIENCE_FILES: Record<string, number> = {
${Object.entries(m.ambiences).map(line).join('\n')}
};
export const AMBIENCE_LOOP_SECONDS = ${m.ambienceSeconds};
export const AMBIENCE_OVERLAP_SECONDS = ${m.crossfadeSeconds};
`;
fs.writeFileSync(path.join(ROOT, 'app/src/audio/files.ts'), out);
console.log('files.ts:', Object.keys(m.sfx).length, 'effects,', Object.keys(m.ambiences).length, 'ambiences');
