const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./socket");
const store = require("./state/store");
const { getLocalIP } = require("./utils/network");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    users: store.connectedUsers,
    pages: store.pages.length,
  });
});

const path = require("path");

// เสิร์ฟไฟล์ Static จากโฟลเดอร์ Client/dist (ไฟล์ที่ได้จาก npm run build)
app.use(express.static(path.join(__dirname, '../Client/dist')));

// สำหรับเส้นทางอื่นๆ ให้โยนไปหา index.html ของ React เสมอ (รองรับ React Router)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

io.on("connection", (socket) => {
  store.connectedUsers++;

  console.log(`✅ ผู้ใช้เชื่อมต่อ: ${socket.id} (ทั้งหมด: ${store.connectedUsers})`);

  socket.emit("init-state", {
    pages: store.pages,
    hostTool: store.hostTool,
    hostPenStyle: store.hostPenStyle,
    serverIp: getLocalIP(),
  });

  io.emit("user-count", store.connectedUsers);

  socketHandler(io, socket);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 http://${getLocalIP()}:${PORT}`);
});