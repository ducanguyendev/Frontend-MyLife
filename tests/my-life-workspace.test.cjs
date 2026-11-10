const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const layout = read('src/shared/layouts/MyLifeWorkspaceLayout.tsx');
const dock = read('src/features/my-life/components/MyLifeDock.tsx');
const dockCss = read('src/features/my-life/components/MyLifeDock.css');
const moduleNav = read('src/features/my-life/components/MyLifeModuleNav.tsx');
const moduleNavCss = read('src/features/my-life/components/MyLifeModuleNav.css');
const anniversariesPage = read('src/features/my-life/pages/AnniversariesPage.tsx');
const libraryPage = read('src/features/my-life/pages/LibraryPage.tsx');
const modules = read('src/features/my-life/config/myLifeModules.ts');
const header = read('src/shared/layouts/UserWorkspaceHeader.tsx');
const userMenu = read('src/features/auth/components/UserMenu.tsx');

test('workspace delegates scrolling and content to the adopted AppShell', () => {
  assert.match(layout, /<AppShell breadcrumbName=\{breadcrumbName\} contentScroll=\{contentScroll\} contentClassName=\{contentClassName\}>\{children\}/);
  assert.doesNotMatch(layout, /<UserWorkspaceHeader|<MyLifeDock/);
  const shell = read('src/shared/layouts/app-shell/AppShell.tsx');
  const css = read('src/shared/layouts/app-shell/AppShell.css');
  assert.match(shell, /id="app-content" tabIndex=\{-1\}/);
  assert.match(shell, /contentScroll === 'hidden'/);
  assert.match(css, /\.app-shell__content[^}]*overflow-y: auto/);
  assert.match(css, /\.app-shell__content--hidden[^}]*overflow: hidden/);
});

test('Hub and all four module pages share the shell with the dock only on module pages', () => {
  const hub = read('src/features/my-life/pages/MyLifeHubPage.tsx');
  assert.match(hub, /<MyLifeWorkspaceLayout backTo="\/Home"/);
  assert.doesNotMatch(hub, /showDock/);
  for (const file of [
    'src/features/family-tree/pages/FamilyTreePage.tsx',
    'src/features/my-life/pages/AnniversariesPage.tsx',
    'src/features/my-life/pages/LibraryPage.tsx',
    'src/features/my-life/pages/FamilyMapPage.tsx',
  ]) {
    assert.match(read(file), /<MyLifeWorkspaceLayout[\s\S]*?backTo="\/mylife"[\s\S]*?showDock/);
  }
  assert.match(read('src/features/my-life/pages/FamilyMapPage.tsx'), /contentScroll="hidden"/);
});

test('dock renders NavLinks directly from the centralized module config', () => {
  assert.match(dock, /<MyLifeModuleNav variant="bottom" \/>/);
  assert.match(moduleNav, /import \{ myLifeModules \} from '\.\.\/config\/myLifeModules'/);
  assert.match(moduleNav, /myLifeModules\.map/);
  assert.match(moduleNav, /<NavLink[\s\S]*to=\{module\.route\}/);
  assert.match(moduleNav, /const Icon = module\.icon/);
  for (const [id, route] of [['familytree', '/familytree'], ['anniversaries', '/anniversaries'], ['library', '/library'], ['map', '/map']]) {
    assert.match(modules, new RegExp(`id: '${id}'[\\s\\S]*?route: '${route.replaceAll('/', '\\/')}'`));
  }
});

test('shared module nav exposes active, localized, keyboard, tooltip, focus, and reduced-motion states', () => {
  assert.match(moduleNav, /isActive \? 'mylife-module-nav__link--active'/);
  assert.match(moduleNav, /aria-label=\{label\}/);
  assert.match(moduleNav, /aria-label=\{t\('myLife\.dock\.label'/);
  assert.match(moduleNav, /title=\{label\}/);
  assert.match(moduleNav, /event\.key === ' '/);
  assert.match(moduleNav, /mylife-module-nav__tooltip/);
  assert.match(moduleNavCss, /:focus-visible/);
  assert.match(moduleNavCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(dockCss, /env\(safe-area-inset-bottom/);
  assert.match(moduleNav, /<NavLink/); // NavLink supplies aria-current="page" for its active route.
  assert.match(moduleNavCss, /background: color-mix\(in srgb, var\(--secondary-bg\)/);
  assert.match(moduleNavCss, /border: 1px solid var\(--custom-border\)/);
  assert.match(moduleNavCss, /box-shadow: 0 8px 24px/);
  assert.match(moduleNavCss, /backdrop-filter: blur/);
  assert.match(moduleNavCss, /transition: color 320ms ease/);
  assert.match(moduleNavCss, /translateY\(-1px\) scale\(1\.03\)/);
  assert.match(moduleNavCss, /transition: opacity 260ms ease/);
  assert.match(moduleNavCss, /transform 290ms ease/);
});

test('AppShell switches sidebar to drawer at the mobile breakpoint', () => {
  const shell = read('src/shared/layouts/app-shell/AppShell.tsx');
  const css = read('src/shared/layouts/app-shell/AppShell.css');
  assert.match(shell, /<aside className="app-shell__sidebar">/);
  assert.match(shell, /placement="drawer"/);
  assert.match(shell, /onClick=\{\(\) => setDrawerOpen\(true\)\}/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.app-shell__sidebar[^}]*display: none/);
  assert.match(css, /\.app-shell__menu-toggle[^}]*display: inline-flex !important/);
  assert.match(shell, /isUser &&/);
  assert.match(shell, /isAdmin &&/);
  assert.match(shell, /<UserMenu appearance="shell"/);
});

test('back navigation remains separate and UserMenu has no module links', () => {
  assert.match(header, /ArrowLeft/);
  assert.match(header, /<Link[\s\S]*to=\{backTo\}/);
  assert.doesNotMatch(header, /<Home\b|Home icon/i);
  assert.doesNotMatch(userMenu, /familytree|anniversaries|library|map/i);
});

test('modules preserve shell scrolling and real API contracts', () => {
  const manager = read('src/features/admin/components/FamilyTreeManager.tsx');
  const anniversary = read('src/features/admin/components/family-tree/AnniversaryTab.tsx');
  const library = read('src/features/admin/components/family-tree/LibraryTab.tsx');
  assert.match(manager, /family-manager__viewport min-h-0 flex-1[\s\S]*viewMode === "mindmap" \? "overflow-hidden" : "overflow-y-auto"/);
  assert.match(anniversary, /memory-page memory-page--calendar/);
  assert.match(library, /library-workspace memory-page memory-page--library/);
  assert.match(anniversariesPage, /contentScroll="auto"/);
  assert.match(libraryPage, /contentScroll="auto"/);
  assert.match(libraryPage, /<LibraryTab showToast=\{showToast\} \/>/);
  for (const [file, route] of [
    ['familyMapService.ts', '/api/family-tree/map'],
    ['anniversaryService.ts', '/api/family-tree/anniversaries'],
    ['libraryService.ts', '/api/library'],
  ]) assert.ok(read('src/features/admin/services/' + file).includes(route));
  assert.match(read('src/features/admin/components/family-tree/useFamilyMembers.ts'), /\/api\/family-tree/);
});

test('workspace routes stay canonical and no source outside the frontend repo is referenced for edits', () => {
  const app = read('src/App.tsx');
  const hub = read('src/features/my-life/pages/MyLifeHubPage.tsx');
  const mapPage = read('src/features/my-life/pages/FamilyMapPage.tsx');
  for (const route of ['/mylife', '/familytree', '/anniversaries', '/library', '/map']) assert.ok(app.includes(`path="${route}"`));
  assert.doesNotMatch(hub, /showDock|contentScroll=/);
  assert.match(mapPage, /contentScroll="hidden"/);
  assert.doesNotMatch(layout + dock, /window\.location\.href/);
});
