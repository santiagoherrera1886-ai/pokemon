import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUILD } from '../src/core/version.js';
import { isNewer } from '../src/core/update.js';

test('version: without a build the commit is "dev" and no update is ever offered', () => {
  assert.equal(BUILD.sha, 'dev');
  assert.match(BUILD.version, /^\d+(\.\d+)*$/);
  assert.equal(isNewer({ sha: 'abc1234' }), false);
});

test('update notice: only when the published commit differs from the loaded one', () => {
  const loaded = { version: '3.1', sha: 'abc1234' };
  assert.equal(isNewer({ sha: 'abc1234' }, loaded), false);
  assert.equal(isNewer({ sha: 'def5678' }, loaded), true);
  assert.equal(isNewer(null, loaded), false);
  assert.equal(isNewer({}, loaded), false);
});

test('the build stamps the commit in version.js and version.json', () => {
  const src = readFileSync(new URL('../scripts/build.cjs', import.meta.url), 'utf8');
  assert.match(src, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(src, /version\.json/);
  assert.match(readFileSync(new URL('../src/core/version.js', import.meta.url), 'utf8'), /sha: 'dev'/, 'el build busca este texto para reemplazarlo');
});
