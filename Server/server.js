require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require("express");
const path = require("path");
const fs = require("fs");

process.on('uncaughtException', (err) => {
  fs.appendFileSync(path.join(__dirname, '..', 'crash.log'), 'Uncaught Exception in Server: ' + err.stack + '\n');
});
process.on('unhandledRejection', (err) => {
  fs.appendFileSync(path.join(__dirname, '..', 'crash.log'), 'Unhandled Rejection in Server: ' + err.stack + '\n');
});

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

// Setup PeerJS Server
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  path: "/app",
  allow_discovery: true,
});
app.use("/peerjs", peerServer);

// AI Solution routes
app.use('/api/ai', aiRoutes);



// Serve uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// ============================================================
// Auto-Cleanup: Delete old files in uploads/ to prevent storage leak
// ============================================================
function cleanupUploads() {
  if (!fs.existsSync(UPLOADS_DIR)) return;
  const now = Date.now();
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) return console.error("Error reading uploads dir for cleanup:", err);
    files.forEach(file => {
      const filePath = path.join(UPLOADS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > MAX_AGE) {
          fs.unlink(filePath, err => {
            if (!err) console.log(`🧹 Cleaned up old file: ${file}`);
          });
        }
      });
    });
  });
}
// Run cleanup every 1 hour
setInterval(cleanupUploads, 60 * 60 * 1000);
// Run once on startup
setTimeout(cleanupUploads, 5000);

// Upload endpoint
app.post('/api/upload', express.raw({ type: '*/*', limit: '500mb' }), (req, res) => {
  try {
    let ext = req.query.ext || 'mp4';
    // Security: Sanitize extension to alphanumeric only
    ext = ext.replace(/[^a-zA-Z0-9]/g, '');
    if (!ext) ext = 'bin';

    const filename = `media-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.body);
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
    slotTitles: store.slotTitles,
  });

  io.emit("user-count", store.connectedUsers);

  socketHandler(io, socket);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 http://${getLocalIP()}:${PORT}`);
});