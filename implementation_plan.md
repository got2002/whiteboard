# Phase 7 — Real-time Collaboration Enhancements

## Overview

เพิ่มฟีเจอร์ Collaboration ขั้นสูงให้ Whiteboard เพื่อให้ผู้ใช้หลายคนทำงานร่วมกันได้ดีขึ้น

**ฟีเจอร์ที่จะเพิ่ม:**
1. **ตั้งชื่อผู้ใช้** — ป๊อปอัปตอนเข้าใช้ครั้งแรก ให้พิมพ์ชื่อ + ได้สีประจำตัวอัตโนมัติ
2. **Live Cursors** — แสดงเคอร์เซอร์ของผู้ใช้คนอื่นบน canvas ในเวลาจริง พร้อมชื่อ
3. **Laser Pointer** — เครื่องมือ "ชี้" สำหรับนำเสนอ (แสดงจุดสีแดงชั่วคราว)
4. **รายชื่อผู้ใช้ออนไลน์** — แผงแสดงผู้ใช้ที่เชื่อมต่ออยู่ พร้อมสีและหน้าที่กำลังดู
5. **Follow Mode** — กดตามคนอื่นเพื่อสลับหน้าตามเขาอัตโนมัติ

---

## Proposed Changes

### Server

#### [MODIFY] [server.js](file:///c:/test_ai/Whiteboard/Server/server.js)

- เพิ่มเก็บข้อมูลผู้ใช้: `users = { socketId: { name, color, pageIndex, cursorX, cursorY } }`
- เพิ่ม event ใหม่:
  - `set-user` — รับชื่อ → กำหนดสี → broadcast `user-joined`
  - `cursor-move` — รับตำแหน่ง cursor → broadcast ให้คนอื่น
  - `laser` — รับตำแหน่ง laser → broadcast ให้คนอื่น
  - `page-change` — รับ pageIndex → อัปเดตใน users → broadcast `user-page-change`
- แก้ `disconnect` → broadcast `user-left`
- แก้ `init-state` → ส่ง `users` map ไปด้วย

---

### Client — App Component

#### [MODIFY] [App.jsx](file:///c:/test_ai/Whiteboard/Client/src/App.jsx)

- เพิ่ม state: `username`, `userColor`, `remoteUsers`, `showUserPanel`, `followUserId`
- เพิ่ม `showNameDialog` state — แสดง dialog ให้ใส่ชื่อตอน mount
- ส่ง `set-user` event ตอนตั้งชื่อเสร็จ
- ฟัง event ใหม่: `user-joined`, `user-left`, `user-list`, `user-page-change`
- ส่ง `page-change` event เมื่อเปลี่ยนหน้า
- Follow Mode: เมื่อคนที่ follow เปลี่ยนหน้า → สลับหน้าตาม
- เพิ่ม `tool === "laser"` → ส่ง cursor pos ผ่าน `laser` event
- ส่ง `cursor-move` ทุก pointermove บน canvas

---

### Client — Canvas Component

#### [MODIFY] [Canvas.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Canvas.jsx)

- รับ props ใหม่: `remoteCursors`, `laserPointers`
- วาด remote cursors เป็น `<div>` ที่ลอยทับ canvas (ใช้ CSS transform) พร้อมชื่อ + สี
- วาด laser pointers เป็นวงกลมเรืองแสงชั่วคราว (fade out)
- ส่ง `onCursorMove(x, y)` callback กลับไป App เมื่อ pointermove

---

### Client — Toolbar

#### [MODIFY] [Toolbar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Toolbar.jsx)

- เพิ่มปุ่ม Laser Pointer 🔴 ในกลุ่มเครื่องมือวาด
- เพิ่มปุ่มเปิด/ปิด User Panel 👥

---

### New Component — UserPanel

#### [NEW] [UserPanel.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/UserPanel.jsx)

- แผงสไลด์จากขวา — แสดงรายชื่อผู้ใช้ออนไลน์
- แต่ละรายการมี: จุดสี + ชื่อ + "หน้า X" + ปุ่ม "ตามดู"
- ปุ่ม "ตามดู" → เปิด Follow Mode (สลับหน้าตามคนนั้น)

---

### New Component — NameDialog

#### [NEW] [NameDialog.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/NameDialog.jsx)

- Modal ป๊อปอัปเมื่อเข้าใช้ครั้งแรก
- ช่องใส่ชื่อ + ปุ่มเข้าร่วม
- ดีไซน์ glassmorphism ให้เข้ากับ UI เดิม
- ถ้าไม่ใส่ชื่อ → ใช้ชื่อ default "ผู้ใช้ XXXX"

---

### Styles

#### [MODIFY] [index.css](file:///c:/test_ai/Whiteboard/Client/src/index.css)

- สไตล์ NameDialog (modal glassmorphism)
- สไตล์ UserPanel (slide-in จากขวา)
- สไตล์ Remote Cursors (ทรง arrow + label ชื่อ)
- สไตล์ Laser Pointer (วงกลมเรืองแสง + animation fade)
- สไตล์ Follow Mode indicator

---

## Verification Plan

### Build Verification
```
cd c:\test_ai\Whiteboard\Client && npx vite build
```
ต้องผ่าน 0 errors

### Manual Browser Testing

1. เปิด `http://localhost:5173/`
2. **Name Dialog** — ป๊อปอัปขึ้นให้ใส่ชื่อ → พิมพ์ชื่อ → กด "เข้าร่วม" → ป๊อปอัปหายไป
3. **User Panel** — กดปุ่ม 👥 → แผงเลื่อนออกมาจากขวา → เห็นชื่อตัวเอง + หน้าที่กำลังดูอยู่
4. **Live Cursors** — เปิดเบราว์เซอร์ 2 แท็บ → เลื่อนเมาส์ในแท็บหนึ่ง → เห็น cursor ขึ้นในอีกแท็บพร้อมชื่อ
5. **Laser Pointer** — เลือก tool 🔴 → เลื่อนเมาส์บน canvas → เห็นจุดแดงเรืองแสง → คนอื่นเห็นด้วย
6. **Follow Mode** — กด "ตามดู" ข้างชื่อคนอื่นใน User Panel → เปลี่ยนหน้าในแท็บนั้น → หน้าของเราเปลี่ยนตาม
