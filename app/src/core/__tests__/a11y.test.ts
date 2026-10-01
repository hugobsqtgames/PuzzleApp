// VoiceOver: every touchable of the app says what it is.
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== '__tests__') tsxFiles(p, out); } else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

test('every Pressable has an accessibility role (or is hidden from VoiceOver on purpose)', () => {
  const missing: string[] = [];
  for (const file of tsxFiles(path.resolve(__dirname, '../..'))) {
    const src = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (n: ts.Node) => {
      if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText() === 'Pressable') {
        const names = n.attributes.properties.map((a) => (ts.isJsxAttribute(a) ? a.name.getText() : '...'));
        if (!names.includes('accessibilityRole') && !names.includes('...')) {
          const { line } = src.getLineAndCharacterOfPosition(n.getStart());
          missing.push(`${path.relative(path.resolve(__dirname, '../..'), file)}:${line + 1}`);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
  }
  expect(missing).toEqual([]);
});
