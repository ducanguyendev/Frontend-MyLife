const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/lunarYearUtils.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const utilityExports = {};
vm.runInNewContext(compiled, { exports: utilityExports });
const { formatLunarYearLabel, getLunarYearCanChi, isSupportedLunarYear } = utilityExports;

test('derives Vietnamese Can Chi from the supplied lunar year', () => {
  assert.equal(getLunarYearCanChi(2010), 'Canh Dần');
  assert.equal(getLunarYearCanChi(2011), 'Tân Mão');
  assert.equal(getLunarYearCanChi(2012), 'Nhâm Thìn');
  assert.equal(getLunarYearCanChi(2013), 'Quý Tỵ');
  assert.equal(getLunarYearCanChi(2024), 'Giáp Thìn');
  assert.equal(formatLunarYearLabel(2011), '2011 – Tân Mão');
});

test('Can Chi repeats on the 60-year cycle', () => {
  assert.equal(getLunarYearCanChi(2011), getLunarYearCanChi(2071));
});

test('does not display Can Chi for partial, fractional, or unsupported years', () => {
  assert.equal(isSupportedLunarYear(20), false);
  assert.equal(getLunarYearCanChi(20), null);
  assert.equal(getLunarYearCanChi(2011.5), null);
  assert.equal(formatLunarYearLabel(2201), null);
});

test('the anniversary UI derives the label from lunarYear and never guesses from solar year', () => {
  const modal = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx'), 'utf8');
  assert.match(modal, /formatLunarYearLabel\(year\)/);
  assert.doesNotMatch(modal, /originalSolarDate\.getFullYear\(\)|new Date\([^)]*\)\.getFullYear\(\)/);
});
