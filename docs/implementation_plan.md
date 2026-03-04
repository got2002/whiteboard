# Whiteboard → Electron App Conversion

ครูลง Electron App บนคอมพิวเตอร์ → เปิดสอน → นักเรียนสแกน QR Code เข้าร่วมผ่านมือถือ

## Concept

```
┌─────────────────────────────────┐
│  Electron App (ครู)              │
│  ┌───────────┐  ┌─────────────┐ │
│  │  Server   │  │  React UI   │ │
│  │  (3000)   │  │  (Renderer) │ │
│  └───────────┘  └─────────────┘ │
└─────────────────────────────────┘
         ↕ Socket.IO (LAN)
   ┌──────────┐  ┌──────────┐
   │ 📱Student │  │ 📱Student │
   │ (Browser) │  │ (Browser) │
   └──────────┘  └──────────┘
```

- **Electron** เปิดหน้าต่าง Whiteboard + รัน Server อยู่ภายในตัว
- **นักเรียน** สแกน QR Code → เปิด Browser เข้าถึงผ่าน LAN (ไม่ต้องลง app)
- **Server ฝังอยู่ใน Electron** → เปิดแอปตัวเดียวได้เลย ไม่ต้องรัน command แยก

## Proposed Changes

### Root Level — Electron Setup

#### [NEW] package.json (root)
- รวม `Client` + `Server` ภายใต้ root เดียว
- เพิ่ม `electron`, `electron-builder` เป็น devDependencies
- Scripts: `electron:dev` (dev mode), `build` (production), `dist` (สร้างไฟล์ .exe)

#### [NEW] electron/main.js
- **Electron main process** ที่ทำงานดังนี้:
  1. Start Express+Socket.IO server (จาก `Server/server.js`)
  2. รอ server พร้อม → เปิด `BrowserWindow` โหลด React UI
  3. Dev mode → โหลดจาก `http://localhost:5173`
  4. Production → serve ไฟล์ React build ผ่าน Express แล้วโหลดจาก `http://localhost:3000`

---

### Server Changes

#### [MODIFY] Server/server.js
- เปลี่ยนให้ export `startServer()` function แทนที่จะ auto-listen
- Electron main process จะเรียก `startServer()` เอง
- Production mode: serve React build จาก `Client/dist/`

---

### Client Changes

#### [MODIFY] Client/src/App.jsx
- ปรับ `SOCKET_URL` ให้รองรับทั้ง Electron + Browser ของนักเรียน

#### [MODIFY] Client/vite.config.js
- เพิ่ม `base: './'` เพื่อให้ Electron โหลดไฟล์ static ได้ถูก path

---

## Verification Plan

### Manual Verification
1. **Dev mode**: รัน `npm run electron:dev` → Electron เปิดหน้าต่าง Whiteboard
2. **QR Code**: ตรวจสอบ QR Code แสดง URL ที่ถูกต้อง
3. **มือถือสแกน**: สแกน QR Code จากมือถือ → เปิดหน้า Whiteboard ใน Browser ได้
4. **วาดรูป**: ครูวาดบนคอม → นักเรียนเห็น real-time บนมือถือ
