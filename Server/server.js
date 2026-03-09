// ============================================================
// server.js — EClass-style Whiteboard Server
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
// Events ที่รองรับ (Socket.IO):
//  --- Phase 1-5 (การวาด) ---
//  - draw              → ส่งเส้นแบบ live (pen/eraser)
//  - stroke-complete   → เก็บ stroke ถาวร (เสร็จวาด 1 เส้น)
//  - undo / redo       → ย้อน/ทำซ้ำ stroke
//  - clear-page        → ลบ strokes ทั้งหน้า
//  - add-page          → เพิ่มหน้าใหม่
//  - delete-page       → ลบหน้า
//  - change-background → เปลี่ยนพื้นหลังหน้า
//
//  --- Phase 6 (ไฟล์) ---
//  - load-project      → โหลดโปรเจกต์จาก JSON
//
//  --- Phase 7 (Collaboration) ---
//  - set-user          → ตั้งชื่อผู้ใช้ → broadcast user-joined
//  - cursor-move       → อัปเดตตำแหน่ง cursor → broadcast
//  - laser             → ส่งตำแหน่ง laser pointer → broadcast
//  - page-change       → ผู้ใช้เปลี่ยนหน้า → broadcast user-page-change
//
// ============================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const os = require("os");

// ────────────────────────────────────────────────────────────
// สร้าง Express app + HTTP server + Socket.IO
// ────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // อนุญาตทุก origin (สำหรับ dev mode)
});

// ────────────────────────────────────────────────────────────
// State: เก็บในหน่วยความจำ (ไม่ persist — restart = ข้อมูลหาย)
// ────────────────────────────────────────────────────────────

// หน้ากระดานทั้งหมด
let pages = [
  { id: "page-1", background: "white", strokes: [] },
];

// ข้อมูลผู้ใช้ที่เชื่อมต่ออยู่
// Structure: { socketId: { name, color, pageIndex, role } }
// role: "host" | "contributor" | "viewer"
const users = {};

// ────────────────────────────────────────────────────────────
// Helper — ตรวจสอบสิทธิ์ตาม role
// ────────────────────────────────────────────────────────────
const ROLE_LEVELS = { host: 3, contributor: 2, viewer: 1 };
function hasPermission(socketId, minRole) {
  const user = users[socketId];
  if (!user) return false;
  return (ROLE_LEVELS[user.role] || 0) >= (ROLE_LEVELS[minRole] || 99);
}

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
// API Route: แสดงสถานะ Server
// ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ Whiteboard Server กำลังทำงาน",
    connectedUsers,
    totalPages: pages.length,
    uptime: `${Math.floor(process.uptime())} วินาที`,
  });
});

// ────────────────────────────────────────────────────────────
// Production Mode: serve ไฟล์ React build
// ────────────────────────────────────────────────────────────
// เมื่อ deploy จริง ให้ build React แล้ว set NODE_ENV=production
// Server จะ serve ไฟล์จาก Client/dist/ โดยตรง
if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "../Client/dist");
  app.use(express.static(dist));
  app.use((_, res) => res.sendFile(path.join(dist, "index.html")));
}

// ============================================================
// Socket.IO — จัดการการเชื่อมต่อ
// ============================================================
io.on("connection", (socket) => {
  connectedUsers++;
  const ip = getLocalIP();
  const PORT = process.env.PORT || 3000;

  console.log(`✅ ผู้ใช้เชื่อมต่อ: ${socket.id} (ทั้งหมด: ${connectedUsers})`);

  // ── ส่งข้อมูลเริ่มต้น ──────────────────────────────────
  // Dev mode → ชี้ไป Client (Vite port 5173) | Production → ใช้ port เดียวกับ server
  const CLIENT_PORT = process.env.NODE_ENV === "production" ? PORT : 5173;
  socket.emit("server-url", `http://${ip}:${CLIENT_PORT}`);  // URL สำหรับ QR Code
  socket.emit("init-state", { pages });                 // สถานะกระดาน
  io.emit("user-count", connectedUsers);                 // จำนวนผู้ใช้

  // ส่งรายชื่อผู้ใช้ที่ออนไลน์อยู่ให้ client ใหม่
  socket.emit("user-list", users);

  // ============================================================
  // [Phase 7] ตั้งชื่อผู้ใช้
  // ============================================================
  // รับชื่อจาก client → กำหนดสี → เก็บข้อมูล → broadcast ให้คนอื่น
  socket.on("set-user", ({ name, role }) => {
    const color = getNextColor();
    // Validate role — ถ้าไม่ถูกต้องให้เป็น viewer
    const validRoles = ["host", "contributor", "viewer"];
    const userRole = validRoles.includes(role) ? role : "viewer";
    users[socket.id] = { name, color, pageIndex: 0, role: userRole };

    // ส่งข้อมูลกลับให้ตัวผู้ใช้เอง (เพื่อรับ color + role ที่ได้)
    socket.emit("user-confirmed", { id: socket.id, name, color, role: userRole });

    // แจ้งคนอื่นว่ามีผู้ใช้ใหม่เข้ามา
    socket.broadcast.emit("user-joined", {
      id: socket.id, name, color, pageIndex: 0, role: userRole,
    });

    console.log(`👤 ตั้งชื่อ: ${name} (${color}) role=${userRole} — ${socket.id}`);
  });

  // ============================================================
  // [Phase 7] Cursor Move — อัปเดตตำแหน่ง cursor
  // ============================================================
  // รับตำแหน่ง cursor จาก client → broadcast ให้คนอื่นเห็น
  // ส่งบ่อย (ทุก pointermove) ดังนั้นไม่เก็บ state — broadcast อย่างเดียว
  socket.on("cursor-move", ({ x, y, pageIndex }) => {
    socket.broadcast.emit("cursor-move", {
      id: socket.id, x, y, pageIndex,
    });
  });

  // ============================================================
  // [Phase 7] Laser Pointer — ส่งตำแหน่ง laser
  // ============================================================
  // Laser pointer = จุดแดงเรืองแสงชั่วคราวที่คนอื่นเห็นได้
  socket.on("laser", ({ x, y, pageIndex }) => {
    socket.broadcast.emit("laser", {
      id: socket.id, x, y, pageIndex,
      name: users[socket.id]?.name || "?",
      color: users[socket.id]?.color || "#ef4444",
    });
  });

  // ============================================================
  // [Phase 7] Page Change — ผู้ใช้เปลี่ยนหน้า
  // ============================================================
  // อัปเดต pageIndex ใน users map → broadcast ให้คนอื่น
  // ใช้สำหรับ: User Panel (แสดง "หน้า X") + Follow Mode
  socket.on("page-change", ({ pageIndex }) => {
    if (users[socket.id]) {
      users[socket.id].pageIndex = pageIndex;
    }
    socket.broadcast.emit("user-page-change", {
      id: socket.id, pageIndex,
    });
  });

  // ============================================================
  // [Phase 1-5] การวาด + จัดการ strokes
  // ============================================================

  // Live drawing: ส่งเส้นระหว่างวาด (preview) ไปให้คนอื่น
  // ไม่เก็บใน state — ใช้แค่แสดง real-time
  // Guard: ต้องเป็น contributor ขึ้นไปถึงจะวาดได้
  socket.on("draw", (data) => {
    if (!hasPermission(socket.id, "contributor")) return;
    socket.broadcast.emit("draw", data);
  });

  // Stroke เสร็จสมบูรณ์: เก็บใน state + broadcast
  socket.on("stroke-complete", ({ pageId, stroke }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) page.strokes.push(stroke);
    socket.broadcast.emit("stroke-complete", { pageId, stroke });
  });

  // Undo: ลบ stroke ที่ระบุออกจาก state + broadcast
  socket.on("undo", ({ pageId, strokeId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      page.strokes = page.strokes.filter((s) => s.id !== strokeId);
    }
    socket.broadcast.emit("undo", { pageId, strokeId });
  });

  // Redo: เพิ่ม stroke กลับเข้า state + broadcast
  socket.on("redo", ({ pageId, stroke }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) page.strokes.push(stroke);
    socket.broadcast.emit("redo", { pageId, stroke });
  });

  // Clear: ลบ strokes ทั้งหน้า + broadcast
  socket.on("clear-page", ({ pageId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) page.strokes = [];
    socket.broadcast.emit("clear-page", { pageId });
  });

  // ============================================================
  // [Phase 6] โหลดโปรเจกต์จาก JSON
  // ============================================================
  // เมื่อ client โหลดไฟล์ JSON → แทนที่ pages ทั้งหมด + broadcast ให้คนอื่น
  // Guard: ต้องเป็น host เท่านั้นถึงจะ load project ได้
  socket.on("load-project", ({ pages: newPages }) => {
    if (!hasPermission(socket.id, "host")) return;
    if (newPages && Array.isArray(newPages) && newPages.length > 0) {
      pages = newPages;
      socket.broadcast.emit("init-state", { pages });
    }
  });

  // ============================================================
  // จัดการหน้ากระดาน
  // ============================================================

  // เพิ่มหน้าใหม่
  // Guard: ต้องเป็น host เท่านั้นถึงจะจัดการหน้าได้
  socket.on("add-page", ({ page }) => {
    if (!hasPermission(socket.id, "host")) return;
    pages.push(page);
    socket.broadcast.emit("add-page", { page });
  });

  // ลบหน้า (ต้องเหลืออย่างน้อย 1 หน้า)
  socket.on("delete-page", ({ pageId }) => {
    if (!hasPermission(socket.id, "host")) return;
    if (pages.length > 1) {
      pages = pages.filter((p) => p.id !== pageId);
      socket.broadcast.emit("delete-page", { pageId });
    }
  });

  // เปลี่ยนพื้นหลังหน้า
  socket.on("change-background", ({ pageId, background }) => {
    if (!hasPermission(socket.id, "host")) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) page.background = background;
    socket.broadcast.emit("change-background", { pageId, background });
  });

  // ============================================================
  // ผู้ใช้ disconnect
  // ============================================================
  socket.on("disconnect", () => {
    connectedUsers--;
    const userName = users[socket.id]?.name || "ไม่ทราบชื่อ";
    console.log(`❌ ผู้ใช้ออก: ${userName} (${socket.id}) — ทั้งหมด: ${connectedUsers}`);

    // ลบข้อมูลผู้ใช้ + แจ้งคนอื่น
    delete users[socket.id];
    socket.broadcast.emit("user-left", { id: socket.id });
    io.emit("user-count", connectedUsers);
  });
});

// ============================================================
// Helper — หา IPv4 address ของเครื่อง (สำหรับ QR Code)
// ============================================================
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
// เริ่ม Server
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server ทำงานที่: http://${getLocalIP()}:${PORT}`);
});