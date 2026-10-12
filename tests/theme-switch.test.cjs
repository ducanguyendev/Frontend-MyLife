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

test('Uiverse dimensions retain their proportions at the 44px header control height', () => {
  assert.match(switchCss, /--toggle-size:\s*17\.6px;/);
  assert.match(switchCss, /--container-width:\s*5\.625em;/);
  assert.match(switchCss, /--container-height:\s*2\.5em;/);
  assert.match(switchCss, /--container-radius:\s*6\.25em;/);
  assert.match(switchCss, /--circle-container-diameter:\s*3\.375em;/);
  assert.match(switchCss, /--sun-moon-diameter:\s*2\.125em;/);
  assert.match(switchCss, /--transition:\s*\.5s cubic-bezier\(0, -0\.02, 0\.4, 1\.25\);/);
  assert.match(switchCss, /--circle-transition:\s*\.3s cubic-bezier\(0, -0\.02, 0\.35, 1\.17\);/);
  assert.match(switchCss, /\.theme-switch__checkbox \{\s*display: none;/);
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
