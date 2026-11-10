// Dedicated PostgreSQL cluster + real Kestrel HTTP. Never reads the application DB connection.
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const backend = path.resolve(root, '../Backend-MyLife');
const workspace = path.dirname(root);
const output = path.join(root, 'docs/review-w10/test-results');
const windows = process.platform === 'win32';
const results = [];
function command(exe, args, env, name, cwd = backend) {
  console.log(`Integration: ${name}`);
  const log = fs.openSync(path.join(output, `${name}.log`), 'w');
  const result = spawnSync(exe, args, { cwd, env, windowsHide: true, stdio: ['ignore', log, log] });
  fs.closeSync(log);
  results.push({ name, exitCode: result.status ?? 1 });
  if (result.error || result.status !== 0) throw new Error(`${name} failed; see its log (exit ${result.status ?? 1})`);
}
async function freePort() {
  return new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)); }); });
}
async function start(exe, args, env, name, url, cwd) {
  const child = spawn(exe, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const log = fs.createWriteStream(path.join(output, `${name}.log`));
  child.stdout.pipe(log); child.stderr.pipe(log);
  let error; child.on('error', e => { error = e; });
  const deadline = Date.now() + 45000;
  while (true) {
    if (error || child.exitCode !== null) throw new Error(`${name} exited; see its log`);
    try { if ((await fetch(url)).ok) return child; } catch { /* Wait for startup. */ }
    if (Date.now() > deadline) { child.kill(); throw new Error(`${name} startup timed out`); }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill();
  await exited;
}
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const lookup = spawnSync(windows ? 'where.exe' : 'which', [windows ? 'initdb.exe' : 'initdb'], { encoding: 'utf8', windowsHide: true });
  const pgBin = process.env.PG_BIN || (lookup.status === 0 ? path.dirname(lookup.stdout.trim().split(/\r?\n/)[0]) : null);
  if (!pgBin) throw new Error('Set PG_BIN to the PostgreSQL bin directory containing initdb/pg_ctl/createdb/dropdb.');
  const pg = name => path.join(pgBin, name + (windows ? '.exe' : ''));
  const temporaryRoot = path.join(workspace, '.tmp');
  fs.mkdirSync(temporaryRoot, { recursive: true });
  const cluster = fs.mkdtempSync(path.join(temporaryRoot, 'w10-integration-'));
  const data = path.join(cluster, 'data');
  const database = `mylife_w10_${crypto.randomBytes(6).toString('hex')}`;
  const pgPort = await freePort(); const apiPort = await freePort(); const uiPort = await freePort();
  const api = `http://127.0.0.1:${apiPort}`; const ui = `http://127.0.0.1:${uiPort}`;
  const connection = `Host=127.0.0.1;Port=${pgPort};Database=${database};Username=mylife_w10;Include Error Detail=false`;
  const env = { ...process.env, DOTNET_CLI_HOME: path.join(workspace, '_codex_build/dotnet-home'), Logging__EventLog__LogLevel__Default: 'None', MYLIFE_TEST_DATABASE: connection };
  let postgresStarted = false; let databaseCreated = false; let apiServer; let uiServer;
  const metadata = { database, host: '127.0.0.1', pgPort, cluster: path.relative(workspace, cluster), databaseDropped: false, postgresStopped: false };
  try {
    command(pg('initdb'), ['-D', data, '-U', 'mylife_w10', '--auth-local=trust', '--auth-host=trust', '--encoding=UTF8', '--locale=C'], env, 'isolated-initdb');
    command(pg('pg_ctl'), ['-D', data, '-l', path.join(cluster, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${pgPort}`, '-w', 'start'], env, 'isolated-postgres-start');
    postgresStarted = true;
    command(pg('createdb'), ['-h', '127.0.0.1', '-p', String(pgPort), '-U', 'mylife_w10', database], env, 'isolated-createdb');
    databaseCreated = true;
    command('dotnet', ['test', 'Tests/Backend-MyLife.Tests.csproj', '-c', 'Release', '--no-restore', '--logger', 'trx;LogFileName=isolated-backend.trx', '--results-directory', output], env, 'isolated-backend-tests');
    const runtimeEnv = { ...env, ASPNETCORE_ENVIRONMENT: 'Development', ASPNETCORE_URLS: api,
      ConnectionStrings__DefaultConnection: connection, Database__AutoMigrate: 'true', Database__AllowLegacyBaseline: 'false',
      JwtSettings__SecretKey: crypto.randomBytes(48).toString('hex'), JwtSettings__Issuer: 'MyLife.W10', JwtSettings__Audience: 'MyLife.W10.Browser',
      JwtSettings__AccessTokenSeconds: '5', JwtSettings__RefreshTokenMinutes: '10',
      SeedAdmin__Email: 'w10.admin@gmail.com', SeedAdmin__Password: 'W10_Admin!' + crypto.randomBytes(12).toString('hex'),
      Cors__AllowedOrigins__0: ui, Cors__AllowedOrigins__1: 'http://localhost:7000',
      GoogleDrive__WebAppUrl: '', Authentication__Google__ClientId: '', Authentication__Google__ClientSecret: '',
      Geocoding__Enabled: 'false', Geocoding__VietMapEnabled: 'false', VietMap__ApiKey: '', VIETMAP_API_KEY: '',
      RateLimits__Auth__PermitLimit: '1000', RateLimits__Refresh__PermitLimit: '1000',
      Logging__LogLevel__Default: 'Warning', Logging__LogLevel__Microsoft: 'Warning',
    };
    apiServer = await start('dotnet', ['bin/Release/net10.0/MyLife.dll'], runtimeEnv, 'isolated-kestrel', `${api}/health/ready`, backend);
    uiServer = await start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(uiPort), '--strictPort'], {
      ...env, VITE_API_URL: api, VITE_VIETMAP_TILE_KEY: '', VITE_GOOGLE_CLIENT_ID: '',
    }, 'isolated-vite', ui, root);
    command(process.execPath, ['tests/real-backend.integration.cjs'], { ...env, MYLIFE_W10_ISOLATED: database,
      MYLIFE_REAL_API_URL: api, MYLIFE_REAL_UI_URL: ui, MYLIFE_W10_ADMIN_PASSWORD: runtimeEnv.SeedAdmin__Password }, 'isolated-http-browser', root);
  } finally {
    await stop(uiServer); await stop(apiServer);
    if (databaseCreated) {
      // The target was created by this process in its own loopback cluster.
      if (!/^mylife_w10_[a-f0-9]{12}$/.test(database)) throw new Error('Unsafe database cleanup target');
      try { command(pg('dropdb'), ['-h', '127.0.0.1', '-p', String(pgPort), '-U', 'mylife_w10', '--force', database], env, 'isolated-dropdb'); metadata.databaseDropped = true; }
      catch (error) { console.error(error.message); process.exitCode = 1; }
    }
    if (postgresStarted) {
      try { command(pg('pg_ctl'), ['-D', data, '-m', 'fast', '-w', 'stop'], env, 'isolated-postgres-stop'); metadata.postgresStopped = true; }
      catch (error) { console.error(error.message); process.exitCode = 1; }
    }
    fs.writeFileSync(path.join(output, 'isolated-lifecycle.json'), JSON.stringify({ ...metadata, results }, null, 2));
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
