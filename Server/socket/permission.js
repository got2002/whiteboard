// ============================================================
// socket/permission.js — ระบบสิทธิ์การเขียน (Permission Levels)
// ============================================================
// Permission Levels:
//   "draw_only"    — วาดได้อย่างเดียว (ลบได้เฉพาะเส้นตัวเอง)
//   "full_access"  — เข้าถึงเต็มที่ (เหมือน contributor เดิม)
//   "viewer"       — ดูอย่างเดียว
// ============================================================

const store = require("../state/store");

module.exports = (io, socket) => {

  // ── นักเรียนขอสิทธิ์เขียน ──
  socket.on("request-write", () => {
    const user = store.users[socket.id];
    if (!user || user.role !== "viewer") return;

    store.pendingRequests[socket.id] = { name: user.name };

    if (store.hostSocketId) {
      io.to(store.hostSocketId).emit("permission-request", {
        id: socket.id,
        name: user.name,
      });
    }
  });

  // ── Host อนุมัติคำขอ (พร้อมระบุระดับสิทธิ์) ──
  socket.on("approve-request", ({ studentId, level }) => {
    if (socket.id !== store.hostSocketId) return;

    const student = store.users[studentId];
    if (!student) return;

    // level = "draw_only" | "full_access" (default: "draw_only")
    const permLevel = level || "draw_only";

    student.role = "contributor";
    student.permissionLevel = permLevel;
    delete store.pendingRequests[studentId];

    io.to(studentId).emit("role-changed", { role: "contributor", permissionLevel: permLevel });
    io.emit("user-role-updated", { id: studentId, role: "contributor", permissionLevel: permLevel });
  });

  // ── Host ให้สิทธิ์ตรง (จากรายชื่อ viewer) ──
  socket.on("grant-permission", ({ studentId, level }) => {
    if (socket.id !== store.hostSocketId) return;

    const student = store.users[studentId];
    if (!student || student.role !== "viewer") return;

    const permLevel = level || "draw_only";

    student.role = "contributor";
    student.permissionLevel = permLevel;
    if (store.pendingRequests[studentId]) {
      delete store.pendingRequests[studentId];
    }

    io.to(studentId).emit("role-changed", { role: "contributor", permissionLevel: permLevel });
    io.emit("user-role-updated", { id: studentId, role: "contributor", permissionLevel: permLevel });
  });

  // ── Host เปลี่ยนระดับสิทธิ์ของนักเรียนที่ได้สิทธิ์แล้ว ──
  socket.on("change-permission-level", ({ studentId, level }) => {
    if (socket.id !== store.hostSocketId) return;

    const student = store.users[studentId];
    if (!student || student.role !== "contributor") return;

    student.permissionLevel = level;

    io.to(studentId).emit("role-changed", { role: "contributor", permissionLevel: level });
    io.emit("user-role-updated", { id: studentId, role: "contributor", permissionLevel: level });
  });
};