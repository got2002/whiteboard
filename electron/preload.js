const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // ปิดโปรแกรม
  close: () => ipcRenderer.invoke('close-app'),

  // สลับ Fullscreen
  toggleFullscreen: (enable) => ipcRenderer.invoke('toggle-fullscreen', enable),

  // สลับ On-Screen mode (โปร่งใส + always on top)
  toggleOnScreen: (enable) => ipcRenderer.invoke('toggle-onscreen', enable),

  // ควบคุม mouse pass-through (สำหรับ on-screen mode)
  setIgnoreMouse: (ignore) => ipcRenderer.invoke('set-ignore-mouse', ignore),

  // ดึงข้อมูลหน้าจอสำหรับ Screen Share
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
});
