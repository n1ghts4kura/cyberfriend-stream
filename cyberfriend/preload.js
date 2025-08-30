// Preload script: expose a minimal, secure API
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('cyberfriend', {
  version: '0.1.0'
});
