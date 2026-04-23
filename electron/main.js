const { app, BrowserWindow, screen, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

// เริ่มการทำงานของ Server (Express + Socket.io) ทันทีที่เปิดแอป
require('../Server/server.js');

let mainWindow;
let isOnScreenMode = false;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.8),
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // รอให้เซิร์ฟเวอร์พร้อม แล้วค่อยโหลดหน้าเว็บ
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 1500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ──

// ปิดโปรแกรม
ipcMain.handle('close-app', () => {
  app.quit();
});

// Fullscreen toggle — ใช้ maximize/unmaximize
ipcMain.handle('toggle-fullscreen', (event, enable) => {
  if (!mainWindow) return false;
  if (enable) {
    mainWindow.maximize();
  } else {
    mainWindow.unmaximize();
  }
  return mainWindow.isMaximized();
});

// On-Screen mode (transparent + always on top) — ทำงานแยกจาก Fullscreen
ipcMain.handle('toggle-onscreen', (event, enable) => {
  if (!mainWindow) return;
  isOnScreenMode = enable;
  if (enable) {
    mainWindow.setAlwaysOnTop(true, 'floating');
  } else {
    mainWindow.setAlwaysOnTop(false);
  }
});

// สำหรับ On-Screen mode: เมื่อ mouse อยู่บน UI elements ให้รับ mouse events
// เมื่อ mouse อยู่บนพื้นที่โปร่งใส ให้ปล่อยผ่าน
ipcMain.handle('set-ignore-mouse', (event, ignore) => {
  if (!mainWindow || !isOnScreenMode) return;
  if (ignore) {
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }
});

// ดึงข้อมูลหน้าจอสำหรับ Screen Sharing
ipcMain.handle('get-desktop-sources', async () => {
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.map(s => ({
    id: s.id,
    name: s.name
  }));
});

// ── App Lifecycle ──

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
