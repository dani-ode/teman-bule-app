const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/config/env.config.ts'), 'utf8');
const template = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const entries = template.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
  const separator = line.indexOf('=');
  assert.ok(separator > 0, 'Invalid environment template entry');
  return [line.slice(0, separator), line.slice(separator + 1)];
});
const baseline = Object.fromEntries(entries);
assert.equal(entries.length, Object.keys(baseline).length, 'Duplicate template key');
const references = [...source.matchAll(/process\.env\.(EXPO_PUBLIC_[A-Z_]+)/g)].map((match) => match[1]);
assert.deepEqual([...new Set(references)].sort(), Object.keys(baseline).sort(), 'Template/loader key drift');
assert.ok(!source.includes('process.env['), 'Expo requires static environment access');

const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const load = (env) => {
  const exports = {};
  vm.runInNewContext(code, { exports, process: { env }, URL });
  return exports.envConfig;
};
const reject = (env, variable) => assert.throws(
  () => load(env),
  (error) => error.code === 'ERR_ENV_CONFIG' && error.variable === variable &&
    error.message === `Missing or invalid environment variable: ${variable}`,
);

const config = load(baseline);
assert.equal(config.environment, 'development');
assert.equal(config.useMockData, baseline.EXPO_PUBLIC_USE_MOCK_DATA === 'true');
assert.ok(Object.isFrozen(config));
// Loader behaviour must hold regardless of the template's mock default.
const mockBaseline = { ...baseline, EXPO_PUBLIC_USE_MOCK_DATA: 'true' };
assert.equal(load(mockBaseline).useMockData, true);
for (const key of Object.keys(baseline)) {
  const missing = { ...baseline };
  delete missing[key];
  reject(missing, key);
  reject({ ...baseline, [key]: '' }, key);
}
for (const environment of ['staging', 'production']) {
  reject({ ...mockBaseline, EXPO_PUBLIC_APP_ENV: environment }, 'EXPO_PUBLIC_USE_MOCK_DATA');
  const real = { ...baseline, EXPO_PUBLIC_APP_ENV: environment, EXPO_PUBLIC_USE_MOCK_DATA: 'false' };
  reject(real, 'EXPO_PUBLIC_API_BASE_URL');
  assert.equal(load({ ...real, EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test/v1' }).useMockData, false);
}
for (const value of ['prod', ' development']) {
  reject({ ...baseline, EXPO_PUBLIC_APP_ENV: value }, 'EXPO_PUBLIC_APP_ENV');
}
for (const value of ['TRUE', '1', 'false ']) {
  reject({ ...baseline, EXPO_PUBLIC_USE_MOCK_DATA: value }, 'EXPO_PUBLIC_USE_MOCK_DATA');
}
for (const key of ['EXPO_PUBLIC_MOCK_LATENCY_MS', 'EXPO_PUBLIC_API_TIMEOUT_MS']) {
  for (const value of ['-1', '1.5', '15ms', 'NaN', '9007199254740992', ' 1']) {
    reject({ ...baseline, [key]: value }, key);
  }
}
reject({ ...baseline, EXPO_PUBLIC_API_TIMEOUT_MS: '0' }, 'EXPO_PUBLIC_API_TIMEOUT_MS');
assert.equal(load({ ...baseline, EXPO_PUBLIC_MOCK_LATENCY_MS: '0' }).mockLatencyMs, 0);
for (const value of [
  'not-a-url', 'ws://example.test/v1', 'https://example.test', 'https://example.test/v1/',
  'https://user:password@example.test/v1', 'https://example.test/v1?secret=value',
  'https://example.test/v1#fragment', 'https://example.test/v1?', 'https://example.test/v1#',
  'https://example.test/\nv1', 'https://example.test\\v1',
]) {
  reject({ ...baseline, EXPO_PUBLIC_API_BASE_URL: value }, 'EXPO_PUBLIC_API_BASE_URL');
}
for (const key of ['EXPO_PUBLIC_APP_NAME', 'EXPO_PUBLIC_APP_VERSION']) {
  reject({ ...baseline, [key]: '   ' }, key);
}
console.log('Environment template parity and configuration validation checks passed (isolated fixtures).');
