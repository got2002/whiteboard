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

app.get("/", (req, res) => {
  res.send("✅ Whiteboard Server Running");
});

io.on("connection", (socket) => {
  store.connectedUsers++;

  socket.emit("init-state", {
    pages: store.pages,
    hostTool: store.hostTool,
    hostPenStyle: store.hostPenStyle,
  });

  io.emit("user-count", store.connectedUsers);

  socketHandler(io, socket);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 http://${getLocalIP()}:${PORT}`);
});