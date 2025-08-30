#!/usr/bin/env node
// Robust dist cleanup for Windows (handles EBUSY locks on app.asar / DLLs)
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(dist)) {
  console.log('[clean-dist] dist directory not present');
  process.exit(0);
}

const tempName = `dist._old_${Date.now()}`;
const tempPath = path.join(__dirname, '..', tempName);

try {
  fs.renameSync(dist, tempPath); // fast swap; build can proceed while old one is deleted
  console.log(`[clean-dist] Renamed dist -> ${tempName}`);
} catch (e) {
  console.warn('[clean-dist] Rename failed, will attempt direct removal', e.code || e.message);
}

function rimraf(target, attempt = 1) {
  if (!fs.existsSync(target)) return;
  try {
    fs.rmSync(target, { recursive: true, force: true });
    return console.log(`[clean-dist] Removed ${path.basename(target)}`);
  } catch (err) {
    if (['EBUSY','EPERM','ENOTEMPTY'].includes(err.code) && attempt <= 5) {
      const delay = attempt * 400;
      console.log(`[clean-dist] ${err.code} retry in ${delay}ms (attempt ${attempt})`);
      setTimeout(() => rimraf(target, attempt + 1), delay);
    } else {
      console.warn('[clean-dist] Give up removing after attempts, continuing. Residual files may remain.', err.code || err.message);
    }
  }
}

// Delete renamed folder asynchronously (non-blocking for build pipeline)
setTimeout(() => rimraf(tempPath), 10);

