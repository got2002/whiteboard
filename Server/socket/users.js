
// ============================================================
// socket/users.js — User Management Events
// ============================================================
// จัดการ: set-user, host-tool-changed, host-pen-style-changed,
//          change-page (ติดตามหน้าที่ user ดูอยู่)
// ============================================================

const store = require("../state/store");
const { getLocalIP } = require("../utils/network");

const USER_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7",
  "#06b6d4", "#ec4899", "#eab308", "#6b7280", "#14b8a6",
];

const ROLE_LEVELS = { host: 3, contributor: 2, viewer: 1 };
function hasPermission(socketId, minRole) {
  const user = store.users[socketId];
  if (!user) return false;
  return (ROLE_LEVELS[user.role] || 0) >= (ROLE_LEVELS[minRole] || 99);
}

function canSyncHostTools(socketId) {
  const user = store.users[socketId];
  if (!user) return false;
  return user.role === 'host' || (user.role === 'contributor' && user.permissionLevel === 'full_access');
}

module.exports = (io, socket) => {

  // ── ลงทะเบียนผู้ใช้ ──
  socket.on("set-user", ({ name, role }) => {
    const colorIndex = Object.keys(store.users).length % USER_COLORS.length;
    const color = USER_COLORS[colorIndex];

    // Anti-Spam: Truncate name to 50 characters
    if (typeof name === 'string' && name.length > 50) {
      name = name.substring(0, 50);
    }

    const clientIp = socket.handshake.address;
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';

    if (isLocalhost) {
      // Localhost ALWAYS gets Host. Override whatever they asked for.
      role = "host";
      store.hostSocketId = socket.id;
    } else {
      // External IP NEVER gets Host.
      if (role === "host") {
        role = "viewer"; 
      }
    }

    store.users[socket.id] = { name, role, color, pageIndex: 0 };

    // ส่งข้อมูลกลับให้ตัวเอง
    socket.emit("set-user-ack", {
      id: socket.id,
      name,
      role,
      color,
      hostExists: !!store.hostSocketId,
    });


    // ส่ง init-state อีกรอบให้มั่นใจว่าได้รับข้อมูลครบถ้วนหลังจากตั้งชื่อ
    socket.emit("init-state", {
      pages: store.pages,
      hostTool: store.hostTool,
      hostPenStyle: store.hostPenStyle,
      serverIp: getLocalIP(),
      isLocked: store.isLocked,
      widgets: store.widgets,
      webcams: store.webcams,
      isMultiDrawMode: store.isMultiDrawMode,
      slotTitles: store.slotTitles,
      users: store.users,
    });

    // แจ้งคนอื่นว่ามีคนเข้ามา
    socket.broadcast.emit("user-joined", {
      id: socket.id,
      name,
      role,
      color,
      permissionLevel: store.users[socket.id].permissionLevel || null,
    });
  });

  // ── ตรวจสอบว่ามี host หรือยัง ──
  socket.on("check-host", () => {

    socket.emit("host-exists", { 
      exists: !!store.hostSocketId,
      serverIp: getLocalIP()
    });
  });

  // ── Host เปลี่ยนเครื่องมือหลัก + sync ไปให้ทุกคน ──
  socket.on("host-tool-changed", ({ tool }) => {
    if (!canSyncHostTools(socket.id)) return;
    store.hostTool = tool;
    socket.broadcast.emit("host-tool-changed", { tool });
  });

  // ── Host เปลี่ยน pen style + sync ไปให้ทุกคน ──
  socket.on("host-pen-style-changed", ({ penStyle }) => {
    if (!canSyncHostTools(socket.id)) return;
    store.hostPenStyle = penStyle;
    socket.broadcast.emit("host-pen-style-changed", { penStyle });
  });

  // ── User เปลี่ยนหน้า ──
  socket.on("change-page", ({ pageIndex }) => {
    if (store.users[socket.id]) {
      store.users[socket.id].pageIndex = pageIndex;
    }
    socket.broadcast.emit("user-page-changed", {
      id: socket.id,
      pageIndex,
    });
  });

  // ── Host เปลี่ยนหน้าและบังคับทุกคน ──
  socket.on("host-change-page", ({ pageIndex }) => {
    if (!canSyncHostTools(socket.id)) return;
    socket.broadcast.emit("host-change-page", { pageIndex });
  });

  // ── ถอนสิทธิ์ (host only) ──
  socket.on("revoke-permission", ({ studentId }) => {
    if (socket.id !== store.hostSocketId) return;
    const student = store.users[studentId];
    if (!student) return;
    student.role = "viewer";
    student.permissionLevel = null;
    io.to(studentId).emit("role-changed", { role: "viewer", permissionLevel: null });
    io.emit("user-role-updated", { id: studentId, role: "viewer", permissionLevel: null });
  });

  // ── ปฏิเสธคำขอ (host only) ──
  socket.on("deny-request", ({ studentId }) => {
    if (socket.id !== store.hostSocketId) return;
    delete store.pendingRequests[studentId];
    io.to(studentId).emit("permission-denied");
  });

  // ── Stroke update (move/resize) ──
  socket.on("stroke-update", ({ pageId, strokeId, changes }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find(p => p.id === pageId);
    if (page) {
      const stroke = page.strokes.find(s => s.id === strokeId);
      if (stroke) Object.assign(stroke, changes);
    }
    socket.broadcast.emit("stroke-update", { pageId, strokeId, changes });

  });
};