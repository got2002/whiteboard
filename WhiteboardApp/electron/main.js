// ============================================================
// electron/main.js — Electron Main Process
// ============================================================
//
// หน้าที่:
//  1. Start Express+Socket.IO server ภายใน Electron process
//  2. รอ server พร้อม → เปิด BrowserWindow
//  3. Dev mode  → โหลดจาก http://localhost:5173 (Vite)
//  4. Production → โหลดจาก http://localhost:3000 (Express serves React build)
//
// ============================================================

const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");

// ────────────────────────────────────────────────────────────
// ตรวจสอบว่าเป็น dev mode หรือ production
// ────────────────────────────────────────────────────────────
// isDev = true เมื่อรัน npm run electron:dev (set ELECTRON_DEV=1)
// isDev = false เมื่อรัน npm start หรือ packaged app
const isDev = process.env.ELECTRON_DEV === "1";

// ────────────────────────────────────────────────────────────
// ตัวแปร global
// ────────────────────────────────────────────────────────────
let mainWindow = null;
const SERVER_PORT = 3000;

// ────────────────────────────────────────────────────────────
// สร้างหน้าต่าง Electron
// ────────────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: "Whiteboard",
        transparent: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // ── IPC Handlers สำหรับ หน้าต่าง ────────────────────
    ipcMain.on("window-minimize", () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.on("window-close", () => {
        if (mainWindow) mainWindow.close();
    });

    ipcMain.handle("toggle-onscreen", (event, isTransparent) => {
        if (mainWindow) {
            mainWindow.setAlwaysOnTop(isTransparent, "screen-saver");
            if (isTransparent) {
                mainWindow.maximize();
            }
        }
        return true;
    });

    // ── โหลด URL ──────────────────────────────────────────
    if (isDev) {
        // Dev mode: โหลดจาก Vite dev server
        mainWindow.loadURL("http://localhost:5173");
        // เปิด DevTools อัตโนมัติ (สำหรับ debug)
        mainWindow.webContents.openDevTools();
    } else {
        // Production: โหลดจาก Express server ที่ serve React build
        mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
    }

    // ── จัดการ event ──────────────────────────────────────
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // ── ตั้ง Menu ─────────────────────────────────────────
    const menuTemplate = [
        {
            label: "File",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { type: "separator" },
                { role: "quit" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}

// ────────────────────────────────────────────────────────────
// Start Server + App
// ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
    console.log("🚀 Electron กำลังเริ่มต้น...");
    console.log(`📂 Mode: ${isDev ? "Development" : "Production"}`);

    // ── เริ่ม Express+Socket.IO Server ──────────────────────
    try {
        const { startServer } = require("../server/server.js");

        // ใน production mode → set NODE_ENV เพื่อให้ server serve React build
        if (!isDev) {
            process.env.NODE_ENV = "production";
        }

        await startServer(SERVER_PORT);
        console.log(`✅ Server พร้อมที่ port ${SERVER_PORT}`);
    } catch (err) {
        console.error("❌ ไม่สามารถเริ่ม server ได้:", err);
    }

    // ── เปิดหน้าต่าง ────────────────────────────────────────
    createWindow();

    // macOS: เปิดหน้าต่างใหม่เมื่อคลิก icon ใน dock
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// ────────────────────────────────────────────────────────────
// ปิดแอปเมื่อทุกหน้าต่างถูกปิด (ยกเว้น macOS)
// ────────────────────────────────────────────────────────────
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
