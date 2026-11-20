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

test('current public controls and shell icon buttons use shared accessible sizing', () => {
  const language = read('src/shared/components/LanguageSwitcher.tsx');
  const publicControls = read('src/shared/components/AppearanceControls.tsx');
  const foundations = read('src/design-system/foundations.css');
  assert.match(language, /isLoading \|\| isAuthenticated/);
  assert.match(language, /<LanguageButton\s*\/>/);
  assert.match(publicControls, /<ThemeModeButton\s*\/>/);
  assert.match(publicControls, /<LanguageButton\s*\/>/);
  assert.match(foundations, /ds-icon-button--md[^}]*width: 44px; height: 44px/);
  assert.match(foundations, /@media\(pointer:coarse\)[\s\S]*min-height:44px/);
  assert.match(read('src/features/family-tree/pages/FamilyTreePage.tsx'), /<MyLifeWorkspaceLayout/);
});

test('authenticated preferences and public controls share the same ThemeContext', () => {
  const preferences = read('src/shared/components/preferences/PreferenceControls.tsx');
  const menu = read('src/features/auth/components/UserMenu.tsx');
  const shell = read('src/shared/layouts/app-shell/AppShell.tsx');
  assert.match(menu, /<AppearanceLanguageModal isOpen=\{preferencesOpen\}/);
  assert.match(preferences, /const \{ preference, setPreference \} = useTheme\(\)/);
  assert.match(preferences, /onChange=\{setPreference\}/);
  assert.match(preferences, /<LanguageOptionList\s*\/>/);
  assert.match(shell, /<UserMenu appearance="shell"/);
  assert.doesNotMatch(shell, /localStorage|toggleTheme|<Sun\b|<Moon\b/);
});

test('theme persistence and document dark class remain owned by ThemeContext', () => {
  assert.match(themeContext, /localStorage\.getItem\('portfolio-theme'\)/);
  assert.match(themeContext, /localStorage\.setItem\('portfolio-theme', theme\)/);
  assert.match(themeContext, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
  assert.match(themeContext, /root\.classList\.(add|remove)\('dark'\)/);
});
