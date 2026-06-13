
// ============================================================
// socket/webcam.js — Webcam Frame Relay
// ============================================================
// Host ส่ง webcam frame → broadcast ไปหา Client ทุกคน
// ============================================================

const store = require("../state/store");

module.exports = (io, socket) => {
  // Host ส่ง frame กล้อง (dataUrl หรือ null)
  socket.on("webcam-frame", (data) => {
    socket.broadcast.emit("webcam-frame", data);
  });

  // Host หรือ User เปิด/ปิดกล้อง → บอกทุกคน
  // data = { isOn: true/false, name: "ชื่อเจ้าของกล้อง" }
  socket.on("webcam-toggle", (data) => {
    if (data.isOn) {
      store.webcams[socket.id] = data;
    } else {
      delete store.webcams[socket.id];
    }
    socket.broadcast.emit("webcam-toggle", { id: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    if (store.webcams[socket.id]) {
      delete store.webcams[socket.id];
      socket.broadcast.emit("webcam-toggle", { id: socket.id, isOn: false });
    }
  });
};
