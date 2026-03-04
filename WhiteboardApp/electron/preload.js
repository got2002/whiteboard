// ============================================================
// electron/preload.js — Preload Script
// ============================================================
//
// ใช้สำหรับ expose API ที่ปลอดภัยจาก Node.js ให้ renderer process
// ตอนนี้ยังไม่มี API พิเศษที่ต้อง expose
// แต่เตรียมไว้สำหรับ OnScreen Mode และฟีเจอร์ในอนาคต
//
// ============================================================

const { contextBridge, ipcRenderer } = require("electron");

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld("electronAPI", {
    // ตรวจสอบว่ารันใน Electron หรือไม่
    isElectron: true,

    minimize: () => ipcRenderer.send("window-minimize"),
    close: () => ipcRenderer.send("window-close"),
    toggleOnScreen: (isTransparent) => ipcRenderer.invoke("toggle-onscreen", isTransparent),
});
