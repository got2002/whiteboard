# เพิ่มระบบ Role-Based Authorization (Viewer / Contributor / Host)

ปัจจุบันทุก Client ที่เชื่อมต่อเข้ามามีสิทธิ์เท่ากันหมด ไม่แยกแยะระหว่าง Teacher, นักเรียนที่วาดได้ (Contributor) หรือผู้ดูอย่างเดียว (Viewer) ต้องเพิ่มระบบ Role เพื่อให้ตรงกับ Architecture Diagram ที่กำหนดไว้

## สิทธิ์ของแต่ละ Role

| ความสามารถ | Host (Teacher) | Contributor | Viewer |
|---|:---:|:---:|:---:|
| ดูกระดาน | ✅ | ✅ | ✅ |
| วาด/พิมพ์/ลบเส้น | ✅ | ✅ | ❌ |
| Undo/Redo/Clear | ✅ | ✅ | ❌ |
| เพิ่ม/ลบหน้า | ✅ | ❌ | ❌ |
| เปลี่ยนพื้นหลัง | ✅ | ❌ | ❌ |
| Load/Save Project | ✅ | ❌ | ❌ |
| เปลี่ยนโหมด (Math/Science) | ✅ | ❌ | ❌ |
| เห็น Toolbar | ✅ | ✅ (จำกัด) | ❌ |
| Laser Pointer | ✅ | ✅ | ❌ |

## Proposed Changes

### Server

#### [MODIFY] [server.js](file:///c:/test_ai/Whiteboard/Server/server.js)
- เพิ่ม `role` field ใน `users` map (`{ name, color, pageIndex, role }`)
- แก้ event `set-user` ให้รับ `role` จาก client: `{ name, role }`
- **เพิ่ม Guard** ที่ event ต่อไปนี้เพื่อป้องกัน Viewer:
  - `draw`, `stroke-complete`, `undo`, `redo`, `clear-page` → ต้องเป็น `host` หรือ `contributor`
  - `add-page`, `delete-page`, `change-background`, `load-project` → ต้องเป็น `host` เท่านั้น
- ส่ง `role` กลับไปใน `user-confirmed` event

#### [MODIFY] [server.js](file:///c:/test_ai/Whiteboard/WhiteboardApp/server/server.js)
- เปลี่ยนเหมือนกันกับ `Server/server.js` ข้างต้น (ไฟล์นี้คือ server สำหรับ Electron)

---

### Client (Browser — ใช้กับทุก Role)

#### [MODIFY] [NameDialog.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/NameDialog.jsx)
- เพิ่มปุ่มเลือก Role (3 ปุ่ม: 👨‍🏫 Teacher / ✏️ Contributor / 👁️ Viewer)
- ส่ง `{ name, role }` กลับผ่าน `onSubmit`

#### [MODIFY] [App.jsx](file:///c:/test_ai/Whiteboard/Client/src/App.jsx)
- เพิ่ม state `userRole` (default: `"viewer"`)
- ส่ง `role` ไปกับ `set-user` event
- รับ `role` กลับจาก `user-confirmed`
- **Viewer Mode**: ซ่อน `Toolbar`, `SideToolbar`, `FloatingPalette`, `ModePanel` เมื่อ `role === "viewer"`
- **Contributor Mode**: ซ่อนปุ่ม host-only ใน Toolbar (เพิ่ม/ลบหน้า, เปลี่ยนพื้นหลัง, Load/Save)
- ส่ง `userRole` ลงไปที่ Canvas เพื่อปิด pointer events สำหรับ Viewer

#### [MODIFY] [Canvas.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Canvas.jsx)
- รับ prop `userRole`
- ถ้า `userRole === "viewer"` → ไม่ประมวลผล pointer events (ปิดการวาด)

#### [MODIFY] [Toolbar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Toolbar.jsx)
- รับ prop `userRole`
- ซ่อนปุ่มที่ไม่มีสิทธิ์ตาม Role

#### [MODIFY] [index.css](file:///c:/test_ai/Whiteboard/Client/src/index.css)
- เพิ่ม CSS สำหรับ Role Selector ใน NameDialog
- เพิ่ม CSS สำหรับ "Viewer Mode" indicator (แถบแสดงสถานะ)

---

### WhiteboardApp (Electron — Teacher/Contributor)

#### [MODIFY] [NameDialog.jsx](file:///c:/test_ai/Whiteboard/WhiteboardApp/Client/src/components/NameDialog.jsx)
- เพิ่มปุ่มเลือก Role เหมือนกับ Client

#### [MODIFY] [App.jsx](file:///c:/test_ai/Whiteboard/WhiteboardApp/Client/src/App.jsx)
- เพิ่มระบบ Role เหมือนกับใน `Client/src/App.jsx`

#### [MODIFY] [Canvas.jsx](file:///c:/test_ai/Whiteboard/WhiteboardApp/Client/src/components/Canvas.jsx)
- เพิ่ม `userRole` prop เหมือนกับ Client

#### [MODIFY] [Toolbar.jsx](file:///c:/test_ai/Whiteboard/WhiteboardApp/Client/src/components/Toolbar.jsx)
- เพิ่ม `userRole` prop เหมือนกับ Client

---

## Verification Plan

### Browser Testing (หลักๆ)
ทดสอบผ่าน Browser โดยเปิด Server แล้วเชื่อมต่อจาก Client:

1. **เปิด Server**: `cd c:\test_ai\Whiteboard\Server && node server.js`
2. **เปิด Client**: `cd c:\test_ai\Whiteboard\Client && npm run dev`
3. **ทดสอบ Viewer**:
   - เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
   - กรอกชื่อและเลือก Role เป็น "Viewer"
   - ตรวจสอบว่า: **ไม่มี Toolbar**, **ไม่สามารถวาดบน Canvas ได้**, **เห็นเส้นที่คนอื่นวาดแบบ real-time**
4. **ทดสอบ Contributor**:
   - เปิดแท็บใหม่ เลือก Role เป็น "Contributor"
   - ตรวจสอบว่า: **วาดได้**, **ไม่มีปุ่มเพิ่ม/ลบหน้า**, **ไม่มีปุ่ม Load/Save**
5. **ทดสอบ Host**:
   - เปิดแท็บใหม่ เลือก Role เป็น "Host"
   - ตรวจสอบว่า: **วาดได้**, **มีปุ่มทุกอย่าง**, **เพิ่ม/ลบหน้าได้**

### Manual Testing
- ขอให้ user ทดสอบเปิด 2-3 แท็บพร้อมกันเพื่อยืนยันว่าการ sync ยังใช้ได้ปกติ และ role แต่ละคนต่างกันจริง
