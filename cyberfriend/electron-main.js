const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  console.log('[electron-main] createWindow at', new Date().toISOString());
  const startUrlEnv = process.env.ELECTRON_START_URL;
  mainWindow = new BrowserWindow({
    width: 540,   // 9:16 aspect (width / height = 0.5625)
    height: 960,  // matches 540 / (9/16)
    frame: false, // remove native frame
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 12 }, // macOS only (ignored on Win/Linux)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    }
  });

  // --- Lock aspect ratio to 9:16 while still allowing resize ---
  const ASPECT = 9 / 16; // width / height
  // Optional: set an initial size closer to the aspect if current not matching
  const { width: curW, height: curH } = mainWindow.getBounds();
  const targetH = Math.round(curW / ASPECT);
  if (Math.abs(targetH - curH) > 5) {
    // Adjust to nearest aspect-preserving size keeping width
    mainWindow.setBounds({ width: curW, height: targetH });
  }
  // Native support
  try { mainWindow.setAspectRatio(ASPECT); } catch (_) { /* fallback handled below */ }

  // Fallback / enforcement (some Windows environments ignore setAspectRatio for frameless)
  let enforcing = false;
  mainWindow.on('resize', () => {
    if (enforcing) return; // prevent recursive adjustments
    const [w, h] = mainWindow.getSize();
    const idealH = Math.round(w / ASPECT);
    const idealW = Math.round(h * ASPECT);
    const diffH = Math.abs(idealH - h);
    const diffW = Math.abs(idealW - w);
    // Adjust the smaller delta dimension to preserve user's primary drag direction
    if (diffH > 2 && diffH < diffW) {
      enforcing = true; mainWindow.setSize(w, idealH); enforcing = false;
    } else if (diffW > 2 && diffW < diffH) {
      enforcing = true; mainWindow.setSize(idealW, h); enforcing = false;
    }
  });

  // Set reasonable minimum size respecting ratio
  const minW = 360; // arbitrary baseline
  const minH = Math.round(minW / ASPECT);
  mainWindow.setMinimumSize(minW, minH);

  const startUrl = startUrlEnv || (app.isPackaged
    ? `file://${path.join(__dirname, 'build', 'index.html')}`
    : 'http://localhost:3000');
  mainWindow.loadURL(startUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
