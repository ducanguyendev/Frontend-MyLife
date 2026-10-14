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

test('shared workspace layout owns the viewport and routes optional module navigation to header and dock', () => {
  assert.match(layout, /h-dvh min-h-0 flex-col overflow-hidden/);
  assert.match(layout, /<UserWorkspaceHeader backTo=\{backTo\} showModuleNavigation=\{showDock\} \/>/);
  assert.match(layout, /flex-1 flex-col/);
  assert.match(layout, /overflow-y-auto overscroll-contain/);
  assert.match(layout, /contentScroll === 'auto'/);
  assert.match(layout, /showDock && <MyLifeDock \/>/);
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

test('desktop header navigation and mobile dock are mutually exclusive at the xl breakpoint', () => {
  assert.match(header, /showModuleNavigation\?: boolean/);
  assert.match(header, /showModuleNavigation && <MyLifeModuleNav variant="header" \/>/);
  assert.match(moduleNavCss, /@media \(min-width: 80rem\)[\s\S]*?mylife-module-nav--header\s*\{\s*display: flex/);
  assert.match(dockCss, /@media \(min-width: 80rem\)[\s\S]*?mylife-dock-row\s*\{\s*display: none/);
  assert.match(header, /xl:grid-cols-\[minmax\(0,1fr\)_auto_minmax\(0,1fr\)\]/);
  assert.match(header, /xl:col-start-3/);
  assert.match(userMenu, /max-w-\[180px\] truncate hidden lg:inline/);
  assert.match(layout, /showDock && <MyLifeDock \/>/);
  assert.match(read('src/features/my-life/pages/MyLifeHubPage.tsx'), /<MyLifeWorkspaceLayout backTo="\/Home"/);
  assert.doesNotMatch(read('src/features/my-life/pages/MyLifeHubPage.tsx'), /showDock/);
});

test('back navigation remains separate and UserMenu has no module links', () => {
  assert.match(header, /ArrowLeft/);
  assert.match(header, /<Link[\s\S]*to=\{backTo\}/);
  assert.doesNotMatch(header, /<Home\b|Home icon/i);
  assert.doesNotMatch(userMenu, /familytree|anniversaries|library|map/i);
});

test('module content has internal scroll sizing and existing API contracts remain present', () => {
  const manager = read('src/features/admin/components/FamilyTreeManager.tsx');
  const anniversary = read('src/features/admin/components/family-tree/AnniversaryTab.tsx');
  const library = read('src/features/admin/components/family-tree/LibraryTab.tsx');
  const map = read('src/features/admin/components/family-tree/FamilyMapTab.tsx');
  const memberHook = read('src/features/admin/components/family-tree/useFamilyMembers.ts');

  assert.match(manager, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(anniversary, /flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain/);
  assert.match(anniversary, /overflow-y-auto overscroll-contain p-3[\s\S]*?xl:overflow-hidden/);
  assert.match(anniversary, /flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar/);
  assert.match(library, /library-workspace flex min-h-0 flex-1 flex-col overflow-hidden/);
  assert.match(library, /library-gallery[\s\S]*?min-h-0 flex-1 overflow-y-auto/);
  assert.doesNotMatch(library, /flex min-h-0 flex-1 flex-col overflow-y-auto/);
  assert.match(anniversariesPage, /contentScroll="hidden"/);
  assert.match(anniversariesPage, /h-full min-h-0 flex-1 flex-col/);
  assert.match(libraryPage, /contentScroll="hidden"/);
  assert.doesNotMatch(libraryPage, /myLife\.modules\.library\.(title|description)/);
  assert.match(libraryPage, /<LibraryTab showToast=\{showToast\} \/>/);
  assert.match(read('src/features/admin/services/familyMapService.ts'), /\/api\/family-tree\/map/);
  assert.match(memberHook, /\/api\/family-tree/);
  assert.match(read('src/features/admin/services/anniversaryService.ts'), /\/api\/family-tree\/anniversaries/);
  assert.match(read('src/features/admin/services/libraryService.ts'), /\/api\/library/);
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
