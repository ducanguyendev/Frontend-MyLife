const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function harness() {
  const states = [];
  let index = 0;
  const hooks = {
    useState(initial) {
      const position = index++;
      if (!(position in states)) states[position] = initial;
      return [states[position], next => { states[position] = typeof next === 'function' ? next(states[position]) : next; }];
    },
    useEffect() {},
    useRef: () => ({ current: null }),
  };
  const jsx = (type, props) => ({ type, props });
  return { hooks, jsx, render(component, props) { index = 0; return component(props); } };
}

function loadTable() {
  const h = harness();
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/MemberTable.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  const exports = {};
  new vm.Script(outputText).runInNewContext({
    exports,
    require(name) {
      if (name === 'react') return { ...h.hooks, default: h.hooks };
      if (name === 'react/jsx-runtime') return { jsx: h.jsx, jsxs: h.jsx };
      if (name === 'react-dom') return { createPortal: children => children };
      if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => key });
      if (name === '@/shared/hooks/useLanguage') {
        const labels = {
        'admin.members_table_caption': 'Family member list', 'admin.col_member': 'Member', 'admin.col_generation': 'Generation',
        'admin.col_gender': 'Gender', 'admin.col_role': 'Role', 'admin.col_dob': 'Date of Birth', 'admin.col_phone': 'Phone',
        'admin.col_address': 'Address', 'admin.col_actions': 'Actions', 'admin.gender_nam': 'Male',
        'admin.view_detail': 'View details', 'admin.edit': 'Edit', 'admin.delete': 'Delete member',
        'admin.member_actions_for': 'Actions for {{name}}', 'admin.generation': 'Gen',
        };
        return { useLanguage: () => ({ t: key => labels[key] ?? key }) };
      }
      if (name === './types') return {
        getGenerationColors: () => ({ bg: 'bg-red', text: 'text-red', border: 'border-red' }),
        removeVietnameseTones: value => value,
      };
      if (name === './MemberAvatarImage') return { MemberAvatarImage: 'MemberAvatarImage' };
      throw new Error(`Unexpected import ${name}`);
    },
    document: { body: {} },
    window: { innerHeight: 800, innerWidth: 1200 },
  });
  return { ...h, MemberTable: exports.MemberTable };
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

const familyMember = {
  id: 1, fullName: 'Nguyễn Văn An', generation: 1, gender: 'Nam', role: 'Trưởng tộc',
  dateOfBirth: '1970-03-12', phoneNumber: '0901234567', address: 'A long family address',
  createdAt: '', updatedAt: '',
};

test('MemberTable renders semantic columns, family data, and shared avatar', () => {
  const h = loadTable();
  const tree = h.render(h.MemberTable, { members: [familyMember], onView() {}, onEdit() {}, onDelete() {} });
  const all = nodes(tree);
  assert.ok(all.some(node => node.type === 'table'));
  assert.ok(all.some(node => node.type === 'thead'));
  assert.ok(all.some(node => node.type === 'tbody'));
  assert.equal(all.filter(node => node.type === 'th').length, 8);
  assert.ok(all.some(node => node.type === 'MemberAvatarImage'));
  assert.ok(all.some(node => node.type === 'button' && node.props.children === familyMember.fullName));
  assert.ok(all.some(node => node.type === 'a' && node.props.href === `tel:${familyMember.phoneNumber}` && node.props.children === familyMember.phoneNumber));
  assert.ok(all.some(node => node.type === 'span' && node.props.title === familyMember.address));
});

test('MemberTable uses em dash for missing values and calls the existing detail handler', () => {
  const h = loadTable();
  let viewed;
  const member = { ...familyMember, gender: undefined, role: undefined, dateOfBirth: undefined, phoneNumber: undefined, address: undefined };
  const tree = h.render(h.MemberTable, { members: [member], onView(value) { viewed = value; }, onEdit() {}, onDelete() {} });
  const all = nodes(tree);
  assert.ok(all.filter(node => node.props.children === '—').length >= 4);
  all.find(node => node.type === 'button' && node.props.children === member.fullName).props.onClick({ stopPropagation() {} });
  assert.equal(viewed, member);
});
