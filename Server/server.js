require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const socketHandler = require("./socket");
const store = require("./state/store");
const { getLocalIP } = require("./utils/network");
const aiRoutes = require("./routes/ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '500mb' }));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 5e8 });

// AI Solution routes
app.use('/api/ai', aiRoutes);

const fs = require('fs');
const path = require('path');

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint
app.post('/api/upload', express.raw({ type: '*/*', limit: '500mb' }), (req, res) => {
  try {
    const ext = req.query.ext || 'mp4';
    const filename = `video-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, filename), req.body);
    res.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Delete endpoint
app.post('/api/delete-video', (req, res) => {
  try {
    const { url } = req.body;
    if (url && url.startsWith('/uploads/')) {
      const filename = url.replace('/uploads/', '');
      const filepath = path.join(__dirname, 'uploads', filename);
      // Basic security check to prevent directory traversal
      if (filepath.startsWith(path.join(__dirname, 'uploads')) && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return res.json({ success: true });
      }
    }
    res.status(400).json({ error: "Invalid URL or file not found" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    users: Object.keys(store.users).length,
    pages: store.pages.length,
  });
});

app.get("/api/debug", (req, res) => {
  res.json(store);
});

// path is now required earlier

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
    isLocked: store.isLocked,
    widgets: store.widgets,
    webcams: store.webcams,
    isMultiDrawMode: store.isMultiDrawMode,
  });

  io.emit("user-count", store.connectedUsers);

  socketHandler(io, socket);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 http://${getLocalIP()}:${PORT}`);
});