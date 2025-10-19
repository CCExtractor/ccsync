#!/usr/bin/env node
const { spawnSync } = require('child_process');

function hasGofmt() {
  try {
    const r = spawnSync('gofmt', ['-h'], { stdio: 'ignore' });
    return r.error === undefined;
  } catch (e) {
    return false;
  }
}

function run() {
  const files = process.argv.slice(2).filter((f) => f.endsWith('.go'));
  if (files.length === 0) process.exit(0);

  if (!hasGofmt()) {
    console.log('gofmt not found; skipping Go formatting for:', files.length, 'file(s)');
    process.exit(0);
  }

  for (const f of files) {
    const res = spawnSync('gofmt', ['-w', f], { stdio: 'inherit' });
    if (res.status !== 0) {
      console.error('gofmt failed on', f);
      process.exit(res.status || 1);
    }
  }
}

run();
