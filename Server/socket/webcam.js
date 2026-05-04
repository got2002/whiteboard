
// ============================================================
// socket/webcam.js — Webcam Frame Relay
// ============================================================
// Host ส่ง webcam frame → broadcast ไปหา Client ทุกคน
// ============================================================

module.exports = (io, socket) => {
  // Host ส่ง frame กล้อง (dataUrl หรือ null)
  socket.on("webcam-frame", (data) => {
    socket.broadcast.emit("webcam-frame", data);
  });

  // Host เปิด/ปิดกล้อง → บอก Client ทุกคน
  // data = { isOn: true/false, name: "ชื่อเจ้าของกล้อง" }
  socket.on("webcam-toggle", (data) => {
    socket.broadcast.emit("webcam-toggle", data);
  });
};
