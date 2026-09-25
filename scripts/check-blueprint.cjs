const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const blueprint = path.join(root, '.blueprint');
const backend = process.env.TEMAN_BULE_BACKEND_ROOT
  ? path.resolve(process.env.TEMAN_BULE_BACKEND_ROOT)
  : path.resolve(root, '../teman-bule');
const index = fs.readFileSync(path.join(blueprint, 'README.md'), 'utf8');
const documents = fs.readdirSync(blueprint).filter((name) => name.endsWith('.md'));
for (const name of documents) {
  if (name !== 'README.md') assert.ok(index.includes(`](${name})`), `Missing index entry: ${name}`);
}
const rulePaths = ['AGENTS.md', '.agents/rules/production.md'];
const historical = fs.readdirSync(path.join(root, 'docs/rules')).filter((name) => name.endsWith('.md'));
for (const name of historical) {
  const relative = `docs/rules/${name}`;
  assert.ok(fs.readFileSync(path.join(root, relative), 'utf8').startsWith('> HISTORICAL / SUPERSEDED:'), `Ambiguous legacy rules: ${relative}`);
  rulePaths.push(relative);
}
for (const relative of [...documents.map((name) => `.blueprint/${name}`), ...rulePaths]) {
  const file = path.join(root, relative);
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;
    const local = target.split('#')[0];
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), local)), `Broken link in ${relative}: ${target}`);
  }
}
assert.ok(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').includes('.blueprint/engineering-rules.md'));
assert.ok(fs.readFileSync(path.join(root, '.agents/rules/production.md'), 'utf8').includes('trigger: always_on'));

const evidence = JSON.parse(fs.readFileSync(path.join(blueprint, 'backend-contract-evidence.json'), 'utf8'));
assert.equal(evidence.schema_version, 1);
assert.ok(Array.isArray(evidence.sources) && evidence.sources.length > 0);
const seen = new Set();
for (const source of evidence.sources) {
  assert.ok(!seen.has(source.path), `Duplicate evidence: ${source.path}`);
  seen.add(source.path);
  assert.match(source.sha256, /^[a-f0-9]{64}$/);
  assert.ok(documents.includes(source.frontend), `Missing frontend mapping: ${source.frontend}`);
  const file = path.resolve(backend, source.path);
  assert.ok(file.startsWith(`${backend}${path.sep}`), 'Evidence path escapes backend root');
  assert.ok(fs.existsSync(file), `Backend source required: ${source.path}; configure TEMAN_BULE_BACKEND_ROOT`);
  const bytes = fs.readFileSync(file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, `Backend drift: ${source.path}; review semantics and update affected frontend contracts before repinning evidence`);
  assert.ok(bytes.toString('utf8').includes(source.excerpt), `Missing reviewed excerpt: ${source.path}`);
}
console.log(`Blueprint validation passed: ${documents.length} indexed documents, rules entrypoints and ${seen.size} pinned backend sources. Documentation checks only; production gates remain open.`);
