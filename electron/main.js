const { app, BrowserWindow, screen, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');

process.on('uncaughtException', (err) => {
  fs.appendFileSync(path.join(__dirname, '..', 'crash.log'), 'Uncaught Exception in Main: ' + err.stack + '\n');
});
process.on('unhandledRejection', (err) => {
  fs.appendFileSync(path.join(__dirname, '..', 'crash.log'), 'Unhandled Rejection in Main: ' + err.stack + '\n');
});

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

  // ลบ event listeners ตัวเก่าที่มีปัญหาออก
  // (transparent + frameless window บน Windows มีปัญหากับ maximize event)
}

// ── IPC Handlers ──

// ปิดโปรแกรม
ipcMain.handle('close-app', () => {
  app.quit();
});

// ย่อหน้าต่าง
ipcMain.handle('minimize-app', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('restore-app', () => {
  if (mainWindow) {
    mainWindow.restore();
    mainWindow.show();
  }
});

ipcMain.handle('hide-app', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('show-app', () => {
  if (mainWindow) mainWindow.show();
});

// ขยาย/คืนค่าหน้าต่างแบบ Manual (แก้ปัญหาตายตัวสำหรับ Transparent Window)
let isWindowMaximized = false;
let normalBounds = { x: 0, y: 0, width: 800, height: 600 };

ipcMain.handle('maximize-app', () => {
  if (!mainWindow) return false;
  
  if (isWindowMaximized) {
    // คืนค่าหน้าต่างเดิม
    mainWindow.setBounds(normalBounds);
    isWindowMaximized = false;
  } else {
    // เก็บค่าหน้าต่างก่อนขยาย
    normalBounds = mainWindow.getBounds();
    // คำนวณหาหน้าจอที่หน้าต่างอยู่ปัจจุบัน
    const currentDisplay = screen.getDisplayNearestPoint({ x: normalBounds.x, y: normalBounds.y });
    // ขยายให้เต็มพื้นที่ทำงานของหน้าจอนั้น (ไม่ทับ Taskbar)
    mainWindow.setBounds(currentDisplay.workArea);
    isWindowMaximized = true;
  }
  
  // แจ้งให้หน้าเว็บรู้ด้วยว่าเปลี่ยนสถานะแล้ว
  mainWindow.webContents.send('window-maximized', isWindowMaximized);
  
  return isWindowMaximized;
});

// Fullscreen toggle — ใช้ maximize/unmaximize แบบ manual
ipcMain.handle('toggle-fullscreen', (event, enable) => {
  if (!mainWindow) return false;
  if (enable && !isWindowMaximized) {
    normalBounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayNearestPoint({ x: normalBounds.x, y: normalBounds.y });
    mainWindow.setBounds(currentDisplay.workArea);
    isWindowMaximized = true;
  } else if (!enable && isWindowMaximized) {
    mainWindow.setBounds(normalBounds);
    isWindowMaximized = false;
  }
  mainWindow.webContents.send('window-maximized', isWindowMaximized);
  return isWindowMaximized;
});

// True Fullscreen (Covers taskbar) for Screenshot Overlay
ipcMain.handle('set-true-fullscreen', (event, enable) => {
  if (!mainWindow) return;
  if (enable) {
    mainWindow.setResizable(false);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setFullScreen(true);
  } else {
    mainWindow.setFullScreen(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
  }
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

// ดึง source ของหน้าต่างแอปเราเอง (สำหรับ Recording)
ipcMain.handle('get-app-window-source', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 0, height: 0 }
  });
  // หาหน้าต่างของแอปเราจาก webContents id
  const appTitle = mainWindow ? mainWindow.getTitle() : '';
  const appSource = sources.find(s =>
    s.name === appTitle || s.name.includes('ProEdu1') || s.name.includes('localhost')
  );
  // ถ้าหาไม่เจอ ใช้ตัวแรกที่ตรงกับ window id
  if (appSource) {
    return { id: appSource.id, name: appSource.name };
  }
  // Fallback: ใช้ media source id จาก BrowserWindow
  if (mainWindow) {
    const mediaSourceId = mainWindow.getMediaSourceId();
    return { id: mediaSourceId, name: 'ProEdu1Whiteboard' };
  }
  return null;
});

// ── Screenshot Endpoints ──

// ดึงภาพหน้าจอทั้งหมด (สำหรับ Screenshot Desktop/Fullscreen)
ipcMain.handle('capture-screen', async () => {
  const display = screen.getPrimaryDisplay();
  const width = Math.round(display.size.width * display.scaleFactor);
  const height = Math.round(display.size.height * display.scaleFactor);
  const sources = await desktopCapturer.getSources({ 
    types: ['screen'], 
    thumbnailSize: { width: Math.max(width, 3840), height: Math.max(height, 2160) } 
  });
  if (sources.length > 0) {
    return sources[0].thumbnail.toDataURL();
  }
  return null;
});

// ดึงภาพแอปพลิเคชันของเรา (สำหรับ Screenshot App)
ipcMain.handle('capture-app-window', async () => {
  if (!mainWindow) return null;
  try {
    const image = await mainWindow.webContents.capturePage();
    return image.toDataURL(); // Returns NativeImage as Data URL
  } catch (err) {
    console.error("Failed to capture app window:", err);
    return null;
  }
});

// ดึงรายการหน้าต่างพร้อมภาพตัวอย่าง (สำหรับ Screenshot Window Selection)
ipcMain.handle('get-windows-with-thumbnails', async () => {
  const sources = await desktopCapturer.getSources({ 
    types: ['window'], 
    thumbnailSize: { width: 600, height: 400 } 
  });
  return sources.map(s => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL()
  }));
});

// ดึงภาพหน้าต่างที่เลือก
ipcMain.handle('capture-window', async (event, windowId) => {
  const display = screen.getPrimaryDisplay();
  const width = Math.round(display.size.width * display.scaleFactor);
  const height = Math.round(display.size.height * display.scaleFactor);
  const sources = await desktopCapturer.getSources({ 
    types: ['window'], 
    thumbnailSize: { width: Math.max(width, 3840), height: Math.max(height, 2160) } 
  });
  const source = sources.find(s => s.id === windowId);
  if (source) {
    return source.thumbnail.toDataURL();
  }
  return null;
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
