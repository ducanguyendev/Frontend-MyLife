const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(root, 'dist/.vite/manifest.json'))) {
  console.error('Run npm run build first: regression includes production import-closure checks.');
  process.exit(1);
}
const files = fs.readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.test.cjs')).sort().map(file => `tests/${file}`);
const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: root, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
