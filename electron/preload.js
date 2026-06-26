const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ปิดโปรแกรม
  close: () => ipcRenderer.invoke('close-app'),

  // ย่อหน้าต่าง
  minimize: () => ipcRenderer.invoke('minimize-app'),
  restore: () => ipcRenderer.invoke('restore-app'),
  hide: () => ipcRenderer.invoke('hide-app'),
  show: () => ipcRenderer.invoke('show-app'),

  // ขยาย/คืนค่าหน้าต่าง
  maximize: () => ipcRenderer.invoke('maximize-app'),

  // สลับ Fullscreen
  toggleFullscreen: (enable) => ipcRenderer.invoke('toggle-fullscreen', enable),
  setTrueFullscreen: (enable) => ipcRenderer.invoke('set-true-fullscreen', enable),

  // สลับ On-Screen mode (โปร่งใส + always on top)
  toggleOnScreen: (enable) => ipcRenderer.invoke('toggle-onscreen', enable),

  // ควบคุม mouse pass-through (สำหรับ on-screen mode)
  setIgnoreMouse: (ignore) => ipcRenderer.invoke('set-ignore-mouse', ignore),

  // ดึงข้อมูลหน้าจอสำหรับ Screen Share
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),

  // ดึง source ของหน้าต่างแอปเอง (สำหรับ Recording)
  getAppWindowSource: () => ipcRenderer.invoke('get-app-window-source'),

  // รับ Event ว่าหน้าต่างถูก Maximize หรือ Unmaximize จาก OS
  onWindowMaximized: (callback) => {
    const handler = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximized', handler);
    return () => ipcRenderer.removeListener('window-maximized', handler);
  },

  // Screenshot endpoints
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  captureAppWindow: () => ipcRenderer.invoke('capture-app-window'),
  getWindowsWithThumbnails: () => ipcRenderer.invoke('get-windows-with-thumbnails'),
  captureWindow: (windowId) => ipcRenderer.invoke('capture-window', windowId)
});
