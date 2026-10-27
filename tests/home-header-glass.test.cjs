const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const header = fs.readFileSync('src/shared/layouts/Header.tsx', 'utf8');
const css = fs.readFileSync('src/index.css', 'utf8');

test('home navigation uses dedicated transparent glass when unscrolled', () => {
  assert.match(header, /isScrolled\s*\?\s*'bg-gray-50\/50 dark:bg-primary-bg\/50 border-gray-200 dark:border-custom-border'\s*:\s*'hero-nav-glass'/);
  assert.match(css, /\.hero-nav-glass\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.1\)[^}]*backdrop-filter:\s*blur\(12px\)[^}]*border-color:\s*rgba\(255, 255, 255, 0\.2\)/s);
  assert.match(css, /\.dark \.hero-nav-glass\s*\{[^}]*background:\s*rgba\(17, 17, 17, 0\.18\)/s);
  assert.match(header, /text-white\/70 dark:text-gray-400 hover:text-white/);
});

test('shared glass-pill keeps its existing surface style for other consumers', () => {
  assert.match(css, /\.glass-pill\s*\{\s*background:\s*color-mix\(in srgb, var\(--secondary-bg\) 88%, transparent\)/);
});
