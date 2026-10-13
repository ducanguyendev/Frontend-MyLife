const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.tsx');
const header = read('src/shared/layouts/Header.tsx');
const workspaceHeader = read('src/shared/layouts/UserWorkspaceHeader.tsx');
const userMenu = read('src/features/auth/components/UserMenu.tsx');
const familyTreePage = read('src/features/family-tree/pages/FamilyTreePage.tsx');
const manager = read('src/features/admin/components/FamilyTreeManager.tsx');
const hub = read('src/features/my-life/pages/MyLifeHubPage.tsx');
const modules = read('src/features/my-life/config/myLifeModules.ts');
const card = read('src/features/my-life/components/MyLifeModuleCard.tsx');

test('five canonical workspace routes reuse the USER guard', () => {
  for (const [route, page] of [
    ['/mylife', 'MyLifeHubPage'], ['/familytree', 'FamilyTreePage'],
    ['/anniversaries', 'AnniversariesPage'], ['/library', 'LibraryPage'], ['/map', 'FamilyMapPage'],
  ]) {
    const routePattern = new RegExp(`caseSensitive path="${route}" element=\\{<ProtectedRoute requiredRole="USER"><${page} \\/><\\/ProtectedRoute>\\}`);
    assert.match(app, routePattern, `Expected protected route ${route}`);
  }
});

test('legacy FamilyTree and MyLife aliases replace-navigate to canonical routes', () => {
  for (const route of ['/FamilyTree', '/family-tree', '/Home/FamilyTree', '/home/family-tree']) {
    assert.ok(app.includes(`path="${route}" element={<Navigate replace to="/familytree" />}`));
  }
  for (const route of ['/MyLife', '/Mylife']) {
    assert.ok(app.includes(`path="${route}" element={<Navigate replace to="/mylife" />}`));
  }
});

test('hub renders four configured real modules with semantic route links', () => {
  assert.match(hub, /t\('myLife\.title'\)/);
  assert.match(hub, /myLifeModules\.map/);
  for (const [id, route] of [['familytree', '/familytree'], ['anniversaries', '/anniversaries'], ['library', '/library'], ['map', '/map']]) {
    assert.match(modules, new RegExp(`id: '${id}'[\\s\\S]*?route: '${route.replaceAll('/', '\\/')}'`));
  }
  assert.equal((modules.match(/id: '/g) || []).length, 4);
  assert.match(card, /<Link[\s\S]*to=\{module\.route\}/);
  assert.doesNotMatch(modules, /Finance|Tasks|Goals/);
});

test('Home launcher and mobile drawer expose MyLife only to USER', () => {
  assert.match(header, /\{isUser && \([\s\S]*?navigate\('\/mylife'\)[\s\S]*?LayoutGrid size=\{17\}/);
  assert.match(header, /aria-label=\{t\('myLife\.title'\)\}/);
  assert.match(header, /navigate\('\/mylife'\)[\s\S]*?LayoutGrid size=\{18\}/);
  assert.doesNotMatch(header, /navigate\('\/FamilyTree'\)/);
});

test('UserMenu contains account actions but no personal module links', () => {
  assert.match(userMenu, /handleProfileClick/);
  assert.match(userMenu, /handleSwitchClick/);
  assert.match(userMenu, /handleLogoutClick/);
  assert.doesNotMatch(userMenu, /FamilyTree|family_tree|Network|isUser/);
});

test('all workspace pages share a single ArrowLeft-only header with explicit parents', () => {
  assert.match(workspaceHeader, /ArrowLeft/);
  assert.doesNotMatch(workspaceHeader, /\bHome\b|<Home/);
  assert.match(hub, /<UserWorkspaceHeader backTo="\/Home" \/>/);
  assert.match(familyTreePage, /<UserWorkspaceHeader backTo="\/mylife" \/>/);
  for (const file of ['AnniversariesPage.tsx', 'LibraryPage.tsx', 'FamilyMapPage.tsx']) {
    const page = read(`src/features/my-life/pages/${file}`);
    assert.match(page, /<UserWorkspaceHeader backTo="\/mylife" \/>/);
  }
});

test('FamilyTreeManager retains member views and CRUD but has no cross-module tabs', () => {
  assert.match(manager, /MemberCard/);
  assert.match(manager, /MemberTable/);
  assert.match(manager, /FamilyMindmap/);
  assert.match(manager, /MemberFormModal/);
  assert.match(manager, /MemberDetailModal/);
  assert.doesNotMatch(manager, /FamilyTab|activeTab|AnniversaryTab|LibraryTab|FamilyMapTab|role="tablist"/);
  assert.match(read('src/features/my-life/pages/AnniversariesPage.tsx'), /<AnniversaryTab showToast=\{showToast\} members=\{members\}/);
  assert.match(read('src/features/my-life/pages/LibraryPage.tsx'), /<LibraryTab showToast=\{showToast\} \/>/);
  assert.match(read('src/features/my-life/pages/FamilyMapPage.tsx'), /<FamilyMapTab \/>/);
});

test('FamilyTree Back and breadcrumb use MyLife; feature API wrappers share one member hook', () => {
  assert.match(familyTreePage, /backTo="\/mylife"/);
  assert.match(familyTreePage, /FamilyTreeManager showToast/);
  assert.match(read('src/features/my-life/pages/AnniversariesPage.tsx'), /useFamilyMembers\(\)/);
  assert.match(manager, /useFamilyMembers\(\)/);
  assert.match(read('src/features/admin/components/family-tree/useFamilyMembers.ts'), /requestRaw\('\/api\/family-tree'/);
});

test('module and page translations exist in Vietnamese and English; shared controls remain reused', () => {
  for (const locale of ['vi', 'en']) {
    const messages = JSON.parse(read(`src/shared/locales/${locale}/myLife.json`));
    assert.ok(messages.title);
    for (const module of ['familyTree', 'anniversaries', 'library', 'map']) {
      assert.ok(messages.modules[module].title);
      assert.ok(messages.modules[module].description);
      assert.ok(messages.modules[module].open);
    }
  }
  assert.match(workspaceHeader, /<ThemeSwitch \/>/);
  assert.match(workspaceHeader, /<LanguageSwitcher \/>/);
  assert.match(workspaceHeader, /<UserMenu/);
  assert.match(read('src/shared/components/ThemeSwitch.css'), /width: 64px;[\s\S]*?height: 40px;/);
  assert.match(read('src/shared/components/LanguageSwitcher.tsx'), /h-10 w-10 items-center justify-center/);
});
