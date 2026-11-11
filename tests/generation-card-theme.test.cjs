const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/features/admin/components/family-tree/generationCardThemes.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleShim = { exports: {} };
new Function('exports', 'module', compiled)(moduleShim.exports, moduleShim);
const { getGenerationCardTheme } = moduleShim.exports;

test('the first four generations each have their own semantic theme and motif', () => {
  const themes = [1, 2, 3, 4].map(getGenerationCardTheme);
  assert.deepEqual(themes.map(theme => theme.key), ['origin', 'branch', 'leaf', 'blossom']);
  assert.equal(new Set(themes.map(theme => theme.className)).size, 4);
  assert.equal(new Set(themes.map(theme => theme.motif)).size, 4);
});

test('later generations use a deterministic extended palette and invalid generations are neutral', () => {
  assert.equal(getGenerationCardTheme(5).key, 'sun');
  assert.equal(getGenerationCardTheme(5).key, getGenerationCardTheme(11).key);
  assert.equal(getGenerationCardTheme(undefined).key, 'neutral');
  assert.equal(getGenerationCardTheme(0).key, 'neutral');
});
