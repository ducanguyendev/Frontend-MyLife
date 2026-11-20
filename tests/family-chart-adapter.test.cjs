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
const { adaptMembersToFamilyChart, createFamilyChartCardHtml, escapeFamilyChartHtml, safeFamilyChartImageUrl } = moduleExports;
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

test('custom card safely handles real records, absent labels, synthetic and incomplete nodes', () => {
  const real = { data: { id: '1', data: { name: '<Family>', role: 'Parent', avatar: 'javascript:alert(1)', labels: { view: 'Details', edit: 'Change', delete: 'Remove', focus: 'Branch', generation: 'Generation 1' } } } };
  const withoutLabels = { data: { id: '2', data: { name: 'Member' } } };
  const synthetic = flag => ({ data: { id: 'placeholder', [flag]: true, data: { labels: null, hiddenCount: 4 } } });
  for (const datum of [real, withoutLabels, synthetic('unknown'), synthetic('to_add'), synthetic('_new_rel_data'), {}, { data: {} }, null]) {
    assert.doesNotThrow(() => createFamilyChartCardHtml(datum));
  }
  assert.match(createFamilyChartCardHtml(real), /&lt;Family&gt;/);
  assert.match(createFamilyChartCardHtml(withoutLabels), /View details/);
  for (const flag of ['unknown', 'to_add', '_new_rel_data']) {
    const html = createFamilyChartCardHtml(synthetic(flag));
    assert.match(html, /mylife-fc-card--placeholder/);
    assert.doesNotMatch(html, /data-family-chart-action/);
  }
});

test('single-parent records do not invent a second MyLife parent and filtered relations are removed', () => {
  const parent = person(1, { childIds: [2] });
  const child = person(2, { motherId: 1, fatherId: 99 });
  const adapted = adaptMembersToFamilyChart([parent, child]);
  assert.deepEqual(Array.from(adapted[1].rels.parents), ['1']);
  assert.deepEqual(Array.from(adapted[0].rels.children), ['2']);
  assert.doesNotMatch(JSON.stringify(adapted), /99|unknown|to_add/);
});

test('POC renderer is dev-only by default and keeps both renderers available', () => {
  const manager = readFileSync(join(__dirname, '../src/features/admin/components/FamilyTreeManager.tsx'), 'utf8');
  const rendererConfig = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeRendererConfig.ts'), 'utf8');
  const view = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/FamilyChartView.tsx'), 'utf8');
  assert.match(manager, /import\('\.\/family-tree\/FamilyChartView'\)/);
  assert.match(manager, /FamilyChartView = IS_FAMILY_CHART_DEV_POC \?/);
  assert.match(rendererConfig, /configuredRenderer === "family-chart"\) return isDevelopment \? "family-chart" : "family-view"/);
  assert.match(rendererConfig, /return "family-view"/);
  assert.match(manager, /FAMILY_TREE_RENDERER === "react-flow" \? <FamilyMindmap/);
  assert.match(manager, /: <FamilyTreeView/);
  assert.match(view, /setCardInnerHtmlCreator\(createFamilyChartCardHtml\)/);
  assert.match(view, /setSingleParentEmptyCard\(false\)/);
  assert.match(view, /try \{/);
  assert.match(view, /onRuntimeError/);
  assert.match(view, /setShowSiblingsOfMain\(true\)/);
  assert.match(view, /chart\.updateMainId\(focusId\)/);
  assert.match(view, /toPng\(host/);
});

test('renderer flag resolver defaults safely, enables only the explicit dev POC, and rejects invalid values', () => {
  const configSource = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/familyTreeRendererConfig.ts'), 'utf8');
  const { outputText: configOutput } = ts.transpileModule(configSource.replace(/const requestedRenderer = import\.meta\.env\.VITE_FAMILY_TREE_RENDERER;[\s\S]*$/, ''), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const configExports = {};
  new vm.Script(configOutput).runInNewContext({ exports: configExports });
  const resolve = configExports.resolveFamilyTreeRenderer;
  assert.equal(resolve(true, undefined), 'family-view');
  assert.equal(resolve(true, 'family-chart'), 'family-chart');
  assert.equal(resolve(false, 'family-chart'), 'family-view');
  assert.equal(resolve(true, 'typo'), 'family-view');
  assert.equal(resolve(false, 'react-flow'), 'react-flow');
});
