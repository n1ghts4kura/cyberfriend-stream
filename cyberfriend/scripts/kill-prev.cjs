#!/usr/bin/env node
// Kill stale electron/electronmon instances AND any process occupying dev port (default 3000).
const { execSync } = require('child_process');

function tryExec(cmd) {
  try { return execSync(cmd, { stdio: 'pipe', encoding: 'utf8' }); } catch (_) { return ''; }
}

// 1. Kill known Electron related processes
['electron.exe','electronmon.exe','CyberFriend.exe'].forEach(name => {
  tryExec(`taskkill /F /IM ${name}`);
});

// 2. Free port 3000 (CRA default)
const PORT = process.env.PORT || 3000;
let killedPids = [];
// Use netstat to find listening connections on the port
const out = tryExec('netstat -ano -p tcp');
if (out) {
  const lines = out.split(/\r?\n/).filter(l => l.includes(`:${PORT}`));
  lines.forEach(line => {
    // Typical format:  TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   12345
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid) && !killedPids.includes(pid)) {
      const res = tryExec(`taskkill /F /PID ${pid}`);
      if (res !== '') killedPids.push(pid);
    }
  });
}

console.log(`[kill-prev] Electron processes cleaned. Freed port ${PORT}${killedPids.length? ' (killed PIDs: '+killedPids.join(', ')+')':''}.`);
