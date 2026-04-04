// ============================================================
// socket/users.js — User Management Events
// ============================================================
// จัดการ: set-user, host-tool-changed, host-pen-style-changed,
//          change-page (ติดตามหน้าที่ user ดูอยู่)
// ============================================================

const store = require("../state/store");

const USER_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7",
  "#06b6d4", "#ec4899", "#eab308", "#6b7280", "#14b8a6",
];

module.exports = (io, socket) => {

  // ── ลงทะเบียนผู้ใช้ ──
  socket.on("set-user", ({ name, role }) => {
    const colorIndex = Object.keys(store.users).length % USER_COLORS.length;
    const color = USER_COLORS[colorIndex];

    // ถ้าเป็น host คนแรก → บันทึก hostSocketId
    if (role === "host" && !store.hostSocketId) {
      store.hostSocketId = socket.id;
    }
    // ถ้ามี host อยู่แล้ว แต่ขอเป็น host → บังคับเป็น viewer
    else if (role === "host" && store.hostSocketId && store.hostSocketId !== socket.id) {
      role = "viewer";
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

    // แจ้งคนอื่นว่ามีคนเข้ามา
    socket.broadcast.emit("user-joined", {
      id: socket.id,
      name,
      role,
      color,
    });
  });

  // ── ตรวจสอบว่ามี host หรือยัง ──
  socket.on("check-host", () => {
    socket.emit("host-exists", { exists: !!store.hostSocketId });
  });

  // ── Host เปลี่ยนเครื่องมือ → sync ไปทุกคน ──
  socket.on("host-tool-changed", ({ tool }) => {
    if (socket.id !== store.hostSocketId) return;
    store.hostTool = tool;
    socket.broadcast.emit("host-tool-changed", { tool });
  });

  // ── Host เปลี่ยน pen style → sync ไปทุกคน ──
  socket.on("host-pen-style-changed", ({ penStyle }) => {
    if (socket.id !== store.hostSocketId) return;
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

  // ── Host เปลี่ยนหน้าสำหรับทุกคน ──
  socket.on("host-change-page", ({ pageIndex }) => {
    if (socket.id !== store.hostSocketId) return;
    socket.broadcast.emit("host-change-page", { pageIndex });
  });

  // ── ถอนสิทธิ์ (host only) ──
  socket.on("revoke-permission", ({ studentId }) => {
    if (socket.id !== store.hostSocketId) return;
    const student = store.users[studentId];
    if (!student) return;
    student.role = "viewer";
    io.to(studentId).emit("role-changed", { role: "viewer" });
    io.emit("user-role-updated", { id: studentId, role: "viewer" });
  });

  // ── ปฏิเสธคำขอ (host only) ──
  socket.on("deny-request", ({ studentId }) => {
    if (socket.id !== store.hostSocketId) return;
    delete store.pendingRequests[studentId];
    io.to(studentId).emit("permission-denied");
  });

  // ── Stroke update (move/resize) ──
  socket.on("stroke-update", ({ pageId, strokeId, changes }) => {
    const page = store.pages.find(p => p.id === pageId);
    if (page) {
      const stroke = page.strokes.find(s => s.id === strokeId);
      if (stroke) Object.assign(stroke, changes);
    }
    socket.broadcast.emit("stroke-update", { pageId, strokeId, changes });
  });
};