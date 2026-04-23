const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require("./socket");
const store = require("./state/store");
const { getLocalIP } = require("./utils/network");
const path = require("path");

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

// Serve static files from the React frontend (Client/dist)
app.use(express.static(path.join(__dirname, "../Client/dist")));

// Fallback to index.html for React Router (if used)
app.get("/{*splat}", (req, res) => {
  if (!req.path.startsWith('/socket.io') && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, "../Client/dist/index.html"));
  }
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

  // --- Screen Share ---
  socket.on("screen-frame", (data) => {
    socket.broadcast.emit("screen-frame", data);
  });

  socketHandler(io, socket);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 http://${getLocalIP()}:${PORT}`);
});