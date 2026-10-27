const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('src/App.tsx');
const header = read('src/shared/layouts/Header.tsx');
const workspaceHeader = read('src/shared/layouts/UserWorkspaceHeader.tsx');
const workspaceLayout = read('src/shared/layouts/MyLifeWorkspaceLayout.tsx');
const userMenu = read('src/features/auth/components/UserMenu.tsx');
const familyTreePage = read('src/features/family-tree/pages/FamilyTreePage.tsx');
const manager = read('src/features/admin/components/FamilyTreeManager.tsx');
const hub = read('src/features/my-life/pages/MyLifeHubPage.tsx');
const modules = read('src/features/my-life/config/myLifeModules.ts');
const card = read('src/features/my-life/components/MyLifeModuleCard.tsx');
const illustration = read('src/features/my-life/components/MyLifeIllustrations.tsx');
const illustrationSlots = read('src/features/my-life/config/illustrationSlots.ts');
const sharedIllustrationSlots = read('src/shared/components/illustration/illustrationSlots.tsx');
const slotComponent = read('src/shared/components/illustration/IllustrationSlot.tsx');
const slotCss = read('src/shared/components/illustration/IllustrationSlot.css');
const hubCss = read('src/features/my-life/pages/MyLifeHubPage.css');
const globalStyles = read('src/index.css');

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

test('hub renders five configured real modules with semantic route links', () => {
  assert.match(hub, /t\('myLife\.title'\)/);
  assert.match(hub, /myLifeModules\.map/);
  for (const [id, route] of [['familytree', '/familytree'], ['anniversaries', '/anniversaries'], ['library', '/library'], ['map', '/map'], ['timeline', '/timeline']]) {
    assert.match(modules, new RegExp(`id: '${id}'[\\s\\S]*?route: '${route.replaceAll('/', '\\/')}'`));
  }
  assert.equal((modules.match(/id: '/g) || []).length, 5);
  assert.match(card, /<Link[\s\S]*to=\{module\.route\}/);
  assert.match(globalStyles, /:where\(button, \[tabindex\], input, select, textarea\)[\s\S]*?:focus-visible/);
  assert.match(globalStyles, /box-shadow: inset 0 0 0 1px var\(--focus-border\)/);
  assert.match(card, /duration-\[240ms\]/);
  assert.doesNotMatch(modules, /Finance|Tasks|Goals/);
});

test('hub uses a responsive bento with a primary family card and five visual variants', () => {
  assert.match(hub, /cardPlacement\[module\.visualVariant\]/);
  assert.match(hub, /grid-cols-1[\s\S]*md:grid-cols-2[\s\S]*xl:grid-cols-12/);
  assert.match(hub, /family:[\s\S]*md:col-span-2[\s\S]*xl:col-span-6[\s\S]*xl:row-span-2/);
  assert.match(modules, /visualVariant: 'family'/);
  assert.match(modules, /visualVariant: 'calendar'/);
  assert.match(modules, /visualVariant: 'library'/);
  assert.match(modules, /visualVariant: 'map'/);
  assert.match(modules, /visualVariant: 'timeline'/);
  for (const variant of ['family', 'calendar', 'library', 'map', 'timeline']) {
    assert.ok(hubCss.includes(`my-life-module-card--${variant}`));
  }
  assert.match(card, /<IllustrationSlot definition=\{illustrationSlots\[module\.illustrationSlot\]\} \/>/);
  assert.match(hub, /<IllustrationSlot definition=\{illustrationSlots\.familyHero\} \/>/);
  assert.doesNotMatch(hubCss, /radial-gradient|filter:\s*blur|mask-image/);
  assert.match(hub, /overflow-hidden/);
  assert.match(hubCss, /@media \(max-width: 767px\)/);
  assert.match(hubCss, /\.dark \.my-life-hero/);
  assert.match(hubCss, /prefers-reduced-motion/);
});

test('semantic illustration slots map to local decorative artwork with a null fallback', () => {
  for (const [slot, artwork] of [
    ['familyHero', 'FamilyHeroArtwork'], ['familyTree', 'FamilyTreeArtwork'], ['anniversary', 'AnniversaryArtwork'], ['library', 'LibraryArtwork'],
    ['familyMap', 'FamilyMapArtwork'], ['timeline', 'TimelineArtwork'],
  ]) {
    assert.match(illustrationSlots, new RegExp(`${slot}:\\s*\\{\\s*Artwork:\\s*${artwork}`));
  }
  for (const [moduleId, slot] of [['familytree', 'familyTree'], ['anniversaries', 'anniversary'], ['library', 'library'], ['map', 'familyMap'], ['timeline', 'timeline']]) {
    assert.match(modules, new RegExp(`id: '${moduleId}'[\\s\\S]*?illustrationSlot: '${slot}'`));
  }
  assert.match(slotComponent, /if \(!Artwork\) return null/);
  assert.match(slotComponent, /aria-hidden=\{definition\.decorative \? true : undefined\}/);
  assert.match(slotComponent, /<Artwork \/>/);
  assert.match(illustrationSlots, /memberProfile:\s*\{\s*className:/);
  assert.match(illustrationSlots, /\.\.\.sharedIllustrationSlots/);
  assert.match(sharedIllustrationSlots, /memberCard:[\s\S]*?family-member-card__illustration/);
  assert.match(slotCss, /pointer-events:\s*none/);
  assert.doesNotMatch(illustration, /<img\b|https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(sharedIllustrationSlots, /<img\b|https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(slotComponent, /features\/my-life/);
});

test('hub stays personal and does not introduce fake summaries or API loading', () => {
  assert.doesNotMatch(hub, /Promise\.all|fetch\(|axios|totalMembers|eventCount|albumCount/);
  assert.doesNotMatch(card, /\b\d+\s*(members|events|albums|regions)\b/i);
  assert.match(hub, /myLifeModules\.map/);
  assert.match(hub, /backTo="\/Home"/);
  assert.doesNotMatch(hub, /showDock/);
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
  assert.match(workspaceLayout, /<UserWorkspaceHeader backTo=\{backTo\} showModuleNavigation=\{showDock\} \/>/);
  assert.match(hub, /<MyLifeWorkspaceLayout backTo="\/Home"/);
  assert.match(familyTreePage, /<MyLifeWorkspaceLayout backTo="\/mylife"/);
  for (const file of ['AnniversariesPage.tsx', 'LibraryPage.tsx']) {
    const page = read(`src/features/my-life/pages/${file}`);
    assert.match(page, /<MyLifeWorkspaceLayout backTo="\/mylife"/);
  }
  assert.match(read('src/features/my-life/pages/FamilyMapPage.tsx'), /backTo="\/mylife"[\s\S]*showDock/);
});

test('FamilyTreeManager retains member views and CRUD but has no cross-module tabs', () => {
  assert.match(manager, /MemberCard/);
  assert.match(manager, /MemberTable/);
  assert.match(manager, /FamilyMindmap/);
  assert.match(manager, /MemberFormModal/);
  assert.match(manager, /MemberDetailModal/);
  assert.doesNotMatch(manager, /FamilyTab|activeTab|AnniversaryTab|LibraryTab|FamilyMapTab|role="tablist"/);
  assert.match(read('src/features/my-life/pages/AnniversariesPage.tsx'), /<AnniversaryTab showToast=\{showToast\} \/>/);
  assert.match(read('src/features/my-life/pages/LibraryPage.tsx'), /<LibraryTab showToast=\{showToast\} \/>/);
  assert.match(read('src/features/my-life/pages/FamilyMapPage.tsx'), /<FamilyMapTab \/>/);
});

test('FamilyTree Back and breadcrumb use MyLife; feature API wrappers share one member hook', () => {
  assert.match(familyTreePage, /backTo="\/mylife"/);
  assert.match(familyTreePage, /FamilyTreeManager showToast/);
  assert.doesNotMatch(read('src/features/my-life/pages/AnniversariesPage.tsx'), /useFamilyMembers\(\)/);
  assert.match(manager, /useFamilyMembers\(\)/);
  assert.match(read('src/features/admin/components/family-tree/useFamilyMembers.ts'), /requestRaw\('\/api\/family-tree'/);
});

test('module and page translations exist in Vietnamese and English; shared controls remain reused', () => {
  for (const locale of ['vi', 'en']) {
    const messages = JSON.parse(read(`src/shared/locales/${locale}/myLife.json`));
    assert.ok(messages.title);
    assert.ok(messages.hubEyebrow);
    assert.ok(messages.hubSectionTitle);
    for (const module of ['familyTree', 'anniversaries', 'library', 'map', 'timeline']) {
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
