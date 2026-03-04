// ============================================================
// server/server.js — EClass-style Whiteboard Server
// ============================================================
//
// หน้าที่ของ Server:
//  1. รับ-ส่งข้อมูลการวาดแบบ real-time ผ่าน Socket.IO
//  2. เก็บสถานะหน้ากระดาน (pages[]) ไว้ในหน่วยความจำ
//  3. เก็บข้อมูลผู้ใช้ (users{}) — ชื่อ, สี, หน้าที่ดู, ตำแหน่ง cursor
//  4. ส่งสถานะเริ่มต้นให้ client ที่เข้ามาใหม่ (init-state)
//  5. นับจำนวนผู้ใช้ที่เชื่อมต่ออยู่ (user-count)
//  6. ใน Production mode → serve ไฟล์ React build
//
// การใช้งาน:
//  - Electron mode: require แล้วเรียก startServer(port)
//  - Standalone mode: node server.js → auto-listen ที่ port 3000
//
// ============================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const os = require("os");

// ────────────────────────────────────────────────────────────
// State: เก็บในหน่วยความจำ (ไม่ persist — restart = ข้อมูลหาย)
// ────────────────────────────────────────────────────────────

// หน้ากระดานทั้งหมด
let pages = [
    { id: "page-1", background: "white", strokes: [] },
];

// ข้อมูลผู้ใช้ที่เชื่อมต่ออยู่
// Structure: { socketId: { name, color, pageIndex } }
const users = {};

// จำนวนผู้ใช้ที่เชื่อมต่อ
let connectedUsers = 0;

// ────────────────────────────────────────────────────────────
// สีสำหรับกำหนดให้ผู้ใช้แต่ละคนอัตโนมัติ (วนรอบ)
// ────────────────────────────────────────────────────────────
const USER_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
    "#a855f7", "#14b8a6", "#f43f5e", "#84cc16",
];
let colorIndex = 0;

/**
 * เลือกสีถัดไปจาก palette (วนรอบ)
 * @returns {string} hex color
 */
function getNextColor() {
    const c = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;
    return c;
}

// ────────────────────────────────────────────────────────────
// Helper — หา IPv4 address ของเครื่อง (สำหรับ QR Code)
// ────────────────────────────────────────────────────────────
function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // เอาเฉพาะ IPv4 ที่ไม่ใช่ loopback
            if (net.family === "IPv4" && !net.internal) return net.address;
        }
    }
    return "localhost";
}

// ============================================================
// startServer — เริ่ม Express + Socket.IO
// ============================================================
/**
 * เริ่ม server ที่ port ที่กำหนด
 * @param {number} port - port ที่จะ listen (default: 3000)
 * @returns {Promise<{server, io, app}>} - server objects
 */
function startServer(port = 3000) {
    return new Promise((resolve, reject) => {
        // ── สร้าง Express app + HTTP server + Socket.IO ──────
        const app = express();
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: { origin: "*" }, // อนุญาตทุก origin (สำหรับ LAN access)
        });

        // ── API Route: แสดงสถานะ Server ────────────────────────
        app.get("/api/status", (req, res) => {
            res.json({
                status: "✅ Whiteboard Server กำลังทำงาน",
                connectedUsers,
                totalPages: pages.length,
                uptime: `${Math.floor(process.uptime())} วินาที`,
            });
        });

        // ── Production Mode: serve ไฟล์ React build ──────────────
        if (process.env.NODE_ENV === "production") {
            const dist = path.join(__dirname, "../Client/dist");
            app.use(express.static(dist));
            // SPA fallback: ถ้าไม่เจอ route → ส่ง index.html (Express v5 ไม่รองรับ '*')
            app.use((req, res) => {
                res.sendFile(path.join(dist, "index.html"));
            });
        }

        // ============================================================
        // Socket.IO — จัดการการเชื่อมต่อ
        // ============================================================
        io.on("connection", (socket) => {
            connectedUsers++;
            const ip = getLocalIP();

            console.log(`✅ ผู้ใช้เชื่อมต่อ: ${socket.id} (ทั้งหมด: ${connectedUsers})`);

            // ── ส่งข้อมูลเริ่มต้น ──────────────────────────────
            const CLIENT_PORT = process.env.NODE_ENV === "production" ? port : 5173;
            socket.emit("server-url", `http://${ip}:${CLIENT_PORT}`);
            socket.emit("init-state", { pages });
            io.emit("user-count", connectedUsers);

            // ส่งรายชื่อผู้ใช้ที่ออนไลน์อยู่ให้ client ใหม่
            socket.emit("user-list", users);

            // ── [Phase 7] ตั้งชื่อผู้ใช้ ───────────────────────────
            socket.on("set-user", ({ name }) => {
                const color = getNextColor();
                users[socket.id] = { name, color, pageIndex: 0 };
                socket.emit("user-confirmed", { id: socket.id, name, color });
                socket.broadcast.emit("user-joined", {
                    id: socket.id, name, color, pageIndex: 0,
                });
                console.log(`👤 ตั้งชื่อ: ${name} (${color}) — ${socket.id}`);
            });

            // ── [Phase 7] Cursor Move ─────────────────────────────
            socket.on("cursor-move", ({ x, y, pageIndex }) => {
                socket.broadcast.emit("cursor-move", {
                    id: socket.id, x, y, pageIndex,
                });
            });

            // ── [Phase 7] Laser Pointer ───────────────────────────
            socket.on("laser", ({ x, y, pageIndex }) => {
                socket.broadcast.emit("laser", {
                    id: socket.id, x, y, pageIndex,
                    name: users[socket.id]?.name || "?",
                    color: users[socket.id]?.color || "#ef4444",
                });
            });

            // ── [Phase 7] Page Change ─────────────────────────────
            socket.on("page-change", ({ pageIndex }) => {
                if (users[socket.id]) {
                    users[socket.id].pageIndex = pageIndex;
                }
                socket.broadcast.emit("user-page-change", {
                    id: socket.id, pageIndex,
                });
            });

            // ── [Phase 1-5] การวาด + จัดการ strokes ───────────────
            socket.on("draw", (data) => {
                socket.broadcast.emit("draw", data);
            });

            socket.on("stroke-complete", ({ pageId, stroke }) => {
                const page = pages.find((p) => p.id === pageId);
                if (page) page.strokes.push(stroke);
                socket.broadcast.emit("stroke-complete", { pageId, stroke });
            });

            socket.on("undo", ({ pageId, strokeId }) => {
                const page = pages.find((p) => p.id === pageId);
                if (page) {
                    page.strokes = page.strokes.filter((s) => s.id !== strokeId);
                }
                socket.broadcast.emit("undo", { pageId, strokeId });
            });

            socket.on("redo", ({ pageId, stroke }) => {
                const page = pages.find((p) => p.id === pageId);
                if (page) page.strokes.push(stroke);
                socket.broadcast.emit("redo", { pageId, stroke });
            });

            socket.on("clear-page", ({ pageId }) => {
                const page = pages.find((p) => p.id === pageId);
                if (page) page.strokes = [];
                socket.broadcast.emit("clear-page", { pageId });
            });

            // ── [Phase 6] โหลดโปรเจกต์จาก JSON ────────────────────
            socket.on("load-project", ({ pages: newPages }) => {
                if (newPages && Array.isArray(newPages) && newPages.length > 0) {
                    pages = newPages;
                    socket.broadcast.emit("init-state", { pages });
                }
            });

            // ── จัดการหน้ากระดาน ────────────────────────────────────
            socket.on("add-page", ({ page }) => {
                pages.push(page);
                socket.broadcast.emit("add-page", { page });
            });

            socket.on("delete-page", ({ pageId }) => {
                if (pages.length > 1) {
                    pages = pages.filter((p) => p.id !== pageId);
                    socket.broadcast.emit("delete-page", { pageId });
                }
            });

            socket.on("change-background", ({ pageId, background }) => {
                const page = pages.find((p) => p.id === pageId);
                if (page) page.background = background;
                socket.broadcast.emit("change-background", { pageId, background });
            });

            // ── ผู้ใช้ disconnect ──────────────────────────────────
            socket.on("disconnect", () => {
                connectedUsers--;
                const userName = users[socket.id]?.name || "ไม่ทราบชื่อ";
                console.log(`❌ ผู้ใช้ออก: ${userName} (${socket.id}) — ทั้งหมด: ${connectedUsers}`);

                delete users[socket.id];
                socket.broadcast.emit("user-left", { id: socket.id });
                io.emit("user-count", connectedUsers);
            });
        });

        // ── Listen ──────────────────────────────────────────────
        server.listen(port, () => {
            console.log(`🚀 Server ทำงานที่: http://${getLocalIP()}:${port}`);
            resolve({ server, io, app });
        });

        server.on("error", (err) => {
            reject(err);
        });
    });
}

// ============================================================
// Standalone mode: ถ้ารัน node server.js โดยตรง
// ============================================================
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    startServer(PORT)
        .then(() => console.log("✅ Server เริ่มทำงานแบบ standalone"))
        .catch((err) => console.error("❌ Error:", err));
}

// Export สำหรับ Electron
module.exports = { startServer };
