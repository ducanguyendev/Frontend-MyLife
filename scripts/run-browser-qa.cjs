const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, process.env.MYLIFE_QA_DIR || 'docs/review-w10');
const smoke = process.argv.includes('--smoke');
const port = Number(process.env.MYLIFE_QA_PORT || 7009);
const base = process.env.MYLIFE_UI_URL || `http://127.0.0.1:${port}`;
const suites = smoke ? ['global-polish-touch.browser.cjs'] : [
  'global-polish.browser.cjs', 'global-polish-interactions.browser.cjs', 'global-polish-touch.browser.cjs',
  'admin-console.browser.cjs', 'admin-actions-access.browser.cjs', 'admin-visual-states.browser.cjs', 'profile-layout.browser.cjs',
];
async function main() {
  fs.mkdirSync(path.join(output, 'test-results'), { recursive: true });
  let server;
  const results = [];
  try {
    if (!process.env.MYLIFE_UI_URL) {
      server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      let startupError;
      server.on('error', error => { startupError = error; });
      const serverLog = fs.createWriteStream(path.join(output, `test-results/browser-server${smoke ? '-smoke' : ''}.log`));
      server.stdout.pipe(serverLog); server.stderr.pipe(serverLog);
      const deadline = Date.now() + 30000;
      while (true) {
        if (startupError) throw startupError;
        if (server.exitCode !== null) throw new Error('Vite exited during startup; see browser-server.log');
        try { const response = await fetch(base); if (response.ok) break; } catch { /* Server not listening yet. */ }
        if (Date.now() > deadline) throw new Error('Vite startup timed out');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    for (const suite of suites) {
      const name = suite.replace('.browser.cjs', '');
      console.log(`Browser QA: ${name}`);
      const log = fs.createWriteStream(path.join(output, `test-results/${name}.log`));
      const started = Date.now();
      const child = spawn(process.execPath, [`tests/${suite}`], {
        cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, MYLIFE_UI_URL: base, MYLIFE_REVIEW_DIR: path.join(output, 'screenshots', name) },
      });
      child.stdout.on('data', data => { process.stdout.write(data); log.write(data); });
      child.stderr.on('data', data => { process.stderr.write(data); log.write(data); });
      const exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
      await new Promise(resolve => log.end(resolve));
      results.push({ suite, exitCode, durationMs: Date.now() - started, api: 'intercepted fixtures' });
      fs.writeFileSync(path.join(output, `test-results/browser${smoke ? '-smoke' : ''}-results.json`), JSON.stringify(results, null, 2));
    }
    if (results.some(result => result.exitCode !== 0)) process.exitCode = 1;
  } finally {
    server?.kill();
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
