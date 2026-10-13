const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const switchSource = read('src/shared/components/ThemeSwitch.tsx');
const switchCss = read('src/shared/components/ThemeSwitch.css');
const themeContext = read('src/shared/context/ThemeContext.tsx');

test('ThemeSwitch is controlled by the shared ThemeContext without local theme state', () => {
  assert.match(switchSource, /useTheme\(\)/);
  assert.match(switchSource, /checked=\{theme === 'dark'\}/);
  assert.match(switchSource, /onChange=\{toggleTheme\}/);
  assert.doesNotMatch(switchSource, /useState|localStorage|document\.documentElement/);
});

test('ThemeSwitch dimensions match 64x40 with a 32px thumb and calculated 24px travel', () => {
  assert.match(switchCss, /\.theme-switch \{[\s\S]*?width: 64px;[\s\S]*?height: 40px;/);
  assert.match(switchCss, /\.theme-switch__thumb \{[\s\S]*?top: 3px;[\s\S]*?left: 3px;[\s\S]*?width: 32px;[\s\S]*?height: 32px;/);
  assert.match(switchCss, /transform: translateX\(24px\);/);
  assert.equal(64 - 32 - 4 * 2, 24);
  assert.match(switchSource, /className="theme-switch__input"/);
  assert.match(switchCss, /\.theme-switch__input:focus-visible \+ \.theme-switch__slider/);
  assert.match(switchCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(switchCss, /animation: none;/);
  assert.doesNotMatch(switchCss, /#(?:input|moon-dot-\d|star-\d|cloud-\d)\b/);
  assert.doesNotMatch(switchCss, /display:\s*none/);
});

test('shared header controls, FamilyTree controls, and centered Home navigation use 40px sizing', () => {
  const header = read('src/shared/layouts/Header.tsx');
  const languageSwitcher = read('src/shared/components/LanguageSwitcher.tsx');
  const userMenu = read('src/features/auth/components/UserMenu.tsx');
  const familyTree = read('src/features/family-tree/pages/FamilyTreePage.tsx');
  const admin = read('src/features/admin/pages/AdminDashboard.tsx');

  assert.match(languageSwitcher, /h-10 w-10 items-center justify-center/);
  assert.doesNotMatch(languageSwitcher, /import \{[^}]*ChevronDown/);
  assert.match(languageSwitcher, /aria-label=\{languageLabel\}/);
  const desktopTrigger = languageSwitcher.split('return (\n    <div className="relative inline-block text-left"')[1].split('</button>')[0];
  assert.match(desktopTrigger, /currentLang\.flagIcon/);
  assert.doesNotMatch(desktopTrigger, /<span|ChevronDown|lang\.code/);
  assert.match(languageSwitcher, /lang\.label/);
  assert.match(languageSwitcher, /language === lang\.code && <Check/);
  assert.match(userMenu, /h-10 items-center/);
  assert.match(header, /justify-center gap-1 p-1 h-10/);
  assert.match(header, /px-4 h-10/);
  assert.match(familyTree, /w-10 h-10.*aria-label=/s);
  assert.match(admin, /w-10 h-10/);
});

test('Header, Admin, FamilyTree and mobile drawer share ThemeSwitch', () => {
  const header = read('src/shared/layouts/Header.tsx');
  const admin = read('src/features/admin/pages/AdminDashboard.tsx');
  const familyTree = read('src/features/family-tree/pages/FamilyTreePage.tsx');

  assert.equal((header.match(/<ThemeSwitch\s*\/>/g) || []).length, 2);
  assert.match(admin, /<ThemeSwitch\s*\/>/);
  assert.match(familyTree, /<ThemeSwitch\s*\/>/);
  assert.doesNotMatch(`${header}\n${admin}\n${familyTree}`, /toggleTheme|<Sun\b|<Moon\b|Toggle Theme/i);
});

test('theme persistence and document dark class remain owned by ThemeContext', () => {
  assert.match(themeContext, /localStorage\.getItem\('portfolio-theme'\)/);
  assert.match(themeContext, /localStorage\.setItem\('portfolio-theme', theme\)/);
  assert.match(themeContext, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
  assert.match(themeContext, /root\.classList\.(add|remove)\('dark'\)/);
});
