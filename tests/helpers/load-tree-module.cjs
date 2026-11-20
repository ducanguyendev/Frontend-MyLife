const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const ts = require('typescript');
const cache = new Map();

function loadTreeModule(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', output)(
    name => name.startsWith('.') ? loadTreeModule(resolve(dirname(file), name + '.ts')) : require(name),
    module, module.exports,
  );
  return module.exports;
}
module.exports = { loadTreeModule };
