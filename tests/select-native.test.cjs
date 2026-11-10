// Legacy filename retained; W4 adopted Radix Select. W10 tests its current contract.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const source = read('src/shared/components/ui/Select.tsx');
const form = read('src/features/admin/components/family-tree/MemberFormModal.tsx');
function setup() {
  const states = []; let index = 0;
  const react = { useId: () => 'select-id', forwardRef: fn => fn, useState(initial) { const at = index++; if (!(at in states)) states[at] = initial; return [states[at], next => { states[at] = next; }]; } };
  react.default = react;
  const jsx = (type, props) => ({ type, props });
  const mocks = { react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '@radix-ui/react-select': new Proxy({}, { get: (_, key) => 'Radix.' + key }),
    'lucide-react': { Check: 'Check', ChevronDown: 'ChevronDown', ChevronUp: 'ChevronUp' },
    './FormFieldShell': { FormFieldShell: 'FormFieldShell', getFormFieldFeedbackId: id => id + '-feedback' },
    './FloatingField': { FloatingField: 'FloatingField' },
    '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: key => key }) } };
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new vm.Script(code).runInNewContext({ exports, require: name => { assert.ok(name in mocks, name); return mocks[name]; } });
  return { render(props, ref) { index = 0; return exports.Select(props, ref); } };
}
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }
const find = (tree, type) => { const node = nodes(tree).find(node => node.type === type); assert.ok(node, type); return node.props; };
test('Radix Select forwards ref, label, disabled, required and form name', () => {
  const ref = {}; const h = setup(); const tree = h.render({ id: 'gender', name: 'gender', label: 'Gender', disabled: true, required: true, 'aria-label': 'Choose gender' }, ref);
  const trigger = find(tree, 'Radix.Trigger'); const root = find(tree, 'Radix.Root');
  assert.equal(trigger.ref, ref); assert.equal(trigger.id, 'gender'); assert.equal(trigger['aria-label'], 'Choose gender');
  assert.equal(root.disabled, true); assert.equal(root.required, true); assert.equal(root.name, 'gender');
  assert.equal(find(tree, 'FloatingField').label, 'Gender');
});
test('Radix Select preserves controlled and uncontrolled values and calls onValueChange', () => {
  const h = setup(); const values = []; const props = { defaultValue: 'Nam', onValueChange: value => values.push(value) };
  assert.equal(find(h.render(props), 'Radix.Root').value, 'Nam');
  find(h.render(props), 'Radix.Root').onValueChange('N\u1eef');
  assert.equal(find(h.render(props), 'Radix.Root').value, 'N\u1eef');
  const controlled = { value: 'Nam', onValueChange: props.onValueChange };
  find(h.render(controlled), 'Radix.Root').onValueChange('Kh\u00e1c');
  assert.equal(find(h.render(controlled), 'Radix.Root').value, 'Nam');
  assert.deepEqual(values, ['N\u1eef', 'Kh\u00e1c']);
});
test('Radix Select renders options, children, empty value and placeholder', () => {
  const h = setup(); const children = { type: 'custom-option', props: { value: 'x' } };
  assert.equal(find(h.render({ children, placeholder: 'Choose' }), 'Radix.Viewport').children, children);
  assert.equal(find(h.render({ value: null, placeholder: 'Choose' }), 'Radix.Root').value, '');
  assert.equal(find(h.render({ placeholder: 'Choose' }), 'Radix.Value').placeholder, 'Choose');
  const tree = h.render({ options: [{ value: 'a', label: 'A', disabled: true }] });
  const option = find(tree, 'Radix.Viewport').children[0];
  assert.equal(option.props.value, 'a'); assert.equal(option.props.disabled, true); assert.equal(option.props.children, 'A');
});
test('Radix Select delegates focus/error presentation to the shared field shell', () => {
  const h = setup(); const tree = h.render({ label: 'Gender', error: 'Required', helperText: 'Choose a value' });
  assert.equal(find(tree, 'Radix.Trigger')['aria-invalid'], true);
  assert.equal(find(tree, 'Radix.Trigger')['aria-describedby'], 'select-id-feedback');
  assert.equal(find(tree, 'FloatingField').error, 'Required');
  find(tree, 'Radix.Trigger').onFocus({});
  assert.equal(find(h.render({ label: 'Gender' }), 'FloatingField').active, true);
  assert.equal(find(h.render({ label: 'Gender', value: 'a' }), 'FloatingField').hasValue, true);
});
test('Select uses Radix portal positioning and keeps keyboard semantics with the primitive', () => {
  const tree = setup().render({});
  assert.ok(find(tree, 'Radix.Portal'));
  assert.equal(find(tree, 'Radix.Content').position, 'popper');
  assert.equal(find(tree, 'Radix.Content').collisionPadding, 8);
  assert.doesNotMatch(source, /createPortal|role="listbox"|role="option"/);
});
test('FamilyTree uses SelectItem for gender and distinct relationship pickers', () => {
  assert.match(form, /label=\{t\("admin\.field_gender"[\s\S]*?<SelectItem value="Nam">[\s\S]*?<SelectItem value="N\u1eef">[\s\S]*?<SelectItem value="Kh\u00e1c">/);
  for (const key of ['field_father', 'field_mother', 'field_spouse', 'select_sibling']) assert.ok(form.includes('admin.' + key));
  assert.match(form, /<FamilyRelationSelect/);
  assert.match(form, /<FamilyMemberPicker/);
});
