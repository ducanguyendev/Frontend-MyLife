const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks, globals = {}) {
  const source = readFileSync(join(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  const exports = {};
  new vm.Script(outputText, { filename: file }).runInNewContext({ exports, require: name => {
    assert.ok(name in mocks, 'Unexpected import ' + name); return mocks[name];
  }, ...globals });
  return exports;
}
function harness() {
  const states = []; let index = 0; const effects = [];
  const hooks = {
    useState(initial) { const position = index++; if (!(position in states)) states[position] = typeof initial === 'function' ? initial() : initial;
      return [states[position], next => { states[position] = typeof next === 'function' ? next(states[position]) : next; }]; },
    useRef: value => ({ current: value }), useEffect: effect => effects.push(effect), useCallback: callback => callback,
    createContext: () => ({ Provider: 'Provider' }), useContext() {},
  };
  const jsx = (type, props) => ({ type, props });
  return { hooks, jsx, effects, render(component, props = {}) { index = 0; return component(props); } };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return []; if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
const find = (tree, predicate) => { const found = nodes(tree).find(predicate); assert.ok(found); return found.props; };
const auth = roles => ({ user: { email: 'roles@example.com', role: roles.includes('ADMIN') ? 'ADMIN' : 'USER', roles },
  isAuthenticated: true, isAdmin: roles.includes('ADMIN'), isUser: roles.includes('USER'), isLoading: false, logout() {} });

for (const roles of [['ADMIN'], ['USER']]) {
  test(roles.join('+') + ': actual guard blocks before mounting and navigation exposes FamilyTree only with USER', () => {
    const h = harness(); const state = auth(roles); const navigations = [];
    const mocks = {
      react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx },
      'react-router-dom': { Navigate: 'Navigate', useNavigate: () => route => navigations.push(route) },
      '../context/AuthContext': { useAuth: () => state }, '@/features/auth/context/AuthContext': { useAuth: () => state },
      'lucide-react': new Proxy({}, { get: (_, key) => key }), 'framer-motion': { motion: new Proxy({}, { get: (_, key) => key }), AnimatePresence: 'Animation' },
      '@/shared/hooks/useLanguage': { useLanguage: () => ({ t: key => key }) }, '../hooks/useLanguage': { useLanguage: () => ({ t: key => key }) },
      '../services/authService': { authService: {} }, '../context/ThemeContext': { useTheme: () => ({ theme: 'light', toggleTheme() {} }) },
      '../components/LanguageSwitcher': { LanguageSwitcher: 'LanguageSwitcher' },
      '@/features/auth/components/LoginModal': { LoginModal: 'Login' }, '@/features/auth/components/UserMenu': { UserMenu: 'UserMenu' },
      '@/features/profile/components/UserProfileModal': { UserProfileModal: 'Profile' },
    };
    const Guard = load('src/features/auth/components/ProtectedRoute.tsx', mocks).ProtectedRoute;
    const tree = Guard({ requiredRole: 'USER', children: 'FamilyTreeChild' });
    if (state.isUser) assert.equal(tree.props.children, 'FamilyTreeChild');
    else { assert.equal(tree.type, 'Navigate'); assert.equal(tree.props.to, '/Home/Admin'); assert.equal(tree.props.children, undefined); }
    const Menu = load('src/features/auth/components/UserMenu.tsx', mocks).UserMenu;
    find(h.render(Menu), node => node.props?.['aria-label'] === 'User profile menu').onClick();
    const menu = h.render(Menu);
    const familyButtons = nodes(menu).filter(node => node.type === 'button' && nodes(node).some(child => child.props?.children === 'admin.family_tree'));
    assert.equal(familyButtons.length, state.isUser ? 1 : 0);
    if (state.isUser) { familyButtons[0].props.onClick(); assert.equal(navigations.at(-1), '/FamilyTree'); }
    const headerHarness = harness(); mocks.react = { ...headerHarness.hooks, default: headerHarness.hooks };
    const Header = load('src/shared/layouts/Header.tsx', mocks).Header;
    find(headerHarness.render(Header), node => node.props?.['aria-label'] === 'Toggle menu').onClick();
    const header = headerHarness.render(Header);
    assert.equal(nodes(header).filter(node => node.type === 'button' && nodes(node).some(child => child.props?.children === 'admin.family_tree')).length, state.isUser ? 1 : 0);
  });
}

test('guard preserves anonymous login and loading behavior', () => {
  for (const state of [{ isLoading: true }, { isLoading: false, isAuthenticated: false }]) {
    const h = harness(); let dispatched = 0;
    const Guard = load('src/features/auth/components/ProtectedRoute.tsx', {
      react: h.hooks, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx }, 'react-router-dom': { Navigate: 'Navigate' },
      '../context/AuthContext': { useAuth: () => state },
    }, { window: { dispatchEvent() { dispatched++; } }, CustomEvent: class {} }).ProtectedRoute;
    const tree = Guard({ requiredRole: 'USER', children: 'FamilyTreeChild' });
    assert.ok(!nodes(tree).some(node => node.props?.children === 'FamilyTreeChild'));
    assert.equal(dispatched, state.isLoading ? 0 : 1);
  }
});

test('AuthProvider uses exclusive server business role; ADMIN never implies USER', async () => {
  for (const response of [{ role: 'ADMIN' }, { role: 'USER' }, { role: 'ADMIN', roles: ['ADMIN'] }, { role: 'USER', roles: ['USER'] }]) {
    const h = harness(); const user = { id: 1, email: 'roles@example.com', ...response };
    const authService = { prepareSessionCheck() {}, getUserInfo: async () => user, getDisplayAvatarUrl: () => null };
    const { AuthProvider } = load('src/features/auth/context/AuthContext.tsx', {
      react: { ...h.hooks, default: h.hooks }, 'react/jsx-runtime': { jsx: h.jsx, jsxs: h.jsx }, '../services/authService': { authService },
    }, { window: { location: { search: '' }, addEventListener() {}, removeEventListener() {} } });
    h.render(AuthProvider); h.effects.splice(0).forEach(effect => effect()); await new Promise(resolve => setImmediate(resolve));
    const context = h.render(AuthProvider).props.value;
    assert.equal(context.isAdmin, response.role === 'ADMIN');
    assert.equal(context.isUser, response.role === 'USER');
    assert.equal(context.isLoading, false);
  }
});

test('all FamilyTree aliases use USER guard and admin dashboard has no FamilyTree mount', () => {
  const app = readFileSync(join(__dirname, '../src/App.tsx'), 'utf8');
  assert.equal((app.match(/<ProtectedRoute requiredRole="USER">/g) || []).length, 4);
  for (const route of ['/FamilyTree', '/family-tree', '/Home/FamilyTree', '/home/family-tree']) {
    const at = app.indexOf('path="' + route + '"'); assert.ok(at >= 0);
    assert.ok(app.slice(at, app.indexOf('</ProtectedRoute>', at)).includes('requiredRole="USER"'));
  }
  const dashboard = readFileSync(join(__dirname, '../src/features/admin/pages/AdminDashboard.tsx'), 'utf8');
  assert.ok(!/FamilyTreeManager|FamilyTree|LibraryTab/.test(dashboard));
});
