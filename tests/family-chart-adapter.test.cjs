const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyChartAdapter.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const moduleExports = {};
new vm.Script(outputText).runInNewContext({ exports: moduleExports });
const { adaptMembersToFamilyChart, escapeFamilyChartHtml, safeFamilyChartImageUrl } = moduleExports;
const person = (id, props = {}) => ({ id, fullName: `Member ${id}`, generation: 1, createdAt: '', updatedAt: '', ...props });

test('family-chart adapter maps parent, child and spouse relations reciprocally and without duplicates', () => {
  const people = [
    person(1, { gender: 'Nam', spouseId: 2, childIds: [3, 3, 99, 1] }),
    person(2, { gender: 'Nữ', spouseId: 1 }),
    person(3, { gender: 'Nữ', fatherId: 1, motherId: 2, dateOfBirth: '2001-04-05' }),
    person(4, { gender: 'other', fatherId: 99, motherId: 4, spouseId: 88 }),
  ];
  const adapted = adaptMembersToFamilyChart(people);
  const first = adapted.find(item => item.id === '1');
  const second = adapted.find(item => item.id === '2');
  const child = adapted.find(item => item.id === '3');
  const invalid = adapted.find(item => item.id === '4');
  assert.deepEqual(Array.from(first.rels.spouses), ['2']);
  assert.deepEqual(Array.from(second.rels.spouses), ['1']);
  assert.deepEqual(Array.from(first.rels.children), ['3']);
  assert.deepEqual(Array.from(second.rels.children), ['3']);
  assert.deepEqual(Array.from(child.rels.parents), ['1', '2']);
  assert.deepEqual(Array.from(invalid.rels.parents), []);
  assert.deepEqual(Array.from(invalid.rels.spouses), []);
  assert.equal(adapted[0].data.gender, 'M');
  assert.equal(adapted[1].data.gender, 'F');
  assert.equal(child.data.birthYear, '2001');
});

test('custom card values are escaped and unsafe avatar schemes are removed', () => {
  assert.equal(escapeFamilyChartHtml(`<img src="x" onerror='x'>&`), '&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt;&amp;');
  assert.equal(safeFamilyChartImageUrl('javascript:alert(1)'), '');
  assert.equal(safeFamilyChartImageUrl('data:image/svg+xml;base64,PHN2Zz4='), '');
  assert.equal(safeFamilyChartImageUrl('/media/avatar.png'), '/media/avatar.png');
  assert.equal(safeFamilyChartImageUrl('https://example.test/avatar.png'), 'https://example.test/avatar.png');
});

test('POC renderer is dev-only by default and keeps both renderers available', () => {
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const rendererConfig = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeRendererConfig.ts'), 'utf8');
  const view = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyChartView.tsx'), 'utf8');
  assert.match(manager, /import\('\.\/family-tree\/FamilyChartView'\)/);
  assert.match(manager, /FamilyChartView = IS_FAMILY_CHART_DEV_POC \?/);
  assert.match(rendererConfig, /IS_FAMILY_CHART_DEV_POC \? "family-chart" : "family-view"/);
  assert.match(manager, /FAMILY_TREE_RENDERER === "react-flow" \? <FamilyMindmap/);
  assert.match(manager, /: <FamilyTreeView/);
  assert.match(view, /setCardInnerHtmlCreator\(customCard\)/);
  assert.match(view, /setShowSiblingsOfMain\(true\)/);
  assert.match(view, /updateMainId\(String\(focusedMemberId\)\)/);
  assert.match(view, /toPng\(host/);
});
