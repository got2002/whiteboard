
// ============================================================
// socket/lockscreen.js — Lock Screen Relay
// ============================================================
// Host ส่งสถานะ lock/unlock → broadcast ไปหา Client ทุกคน
// ============================================================

const store = require("../state/store");

module.exports = (io, socket) => {
  // Host เปิด/ปิด Lock Screen → บอก Client ทุกคน
  // data = { isLocked: true/false }
  socket.on("lockscreen-toggle", (data) => {
    if (socket.id !== store.hostSocketId) return;
    store.isLocked = !!data.isLocked;
    socket.broadcast.emit("lockscreen-toggle", data);
  });
};
