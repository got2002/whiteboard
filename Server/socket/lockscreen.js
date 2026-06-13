
// ============================================================
// socket/lockscreen.js — Lock Screen Relay
// ============================================================
// Host ส่งสถานะ lock/unlock → broadcast ไปหา Client ทุกคน
// ============================================================

const store = require("../state/store");

function hasFullAccess(socketId) {
  const user = store.users[socketId];
  if (!user) return false;
  if (user.role === 'host') return true;
  return user.role === 'contributor' && user.permissionLevel === 'full_access';
}

module.exports = (io, socket) => {
  // Host or Full Access เปิด/ปิด Lock Screen → บอก Client ทุกคน
  // data = { isLocked: true/false }
  socket.on("lockscreen-toggle", (data) => {
    if (!hasFullAccess(socket.id)) return;
    store.isLocked = !!data.isLocked;
    socket.broadcast.emit("lockscreen-toggle", data);
  });
};
