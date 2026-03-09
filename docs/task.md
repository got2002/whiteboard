# Role-Based Authorization System

## Server
- [ ] แก้ไข `Server/server.js` — เพิ่ม role ใน users map + guard events
- [ ] แก้ไข `WhiteboardApp/server/server.js` — เพิ่ม role เหมือนกัน

## Client (Browser)
- [ ] แก้ไข `Client/src/components/NameDialog.jsx` — เพิ่ม Role Selector
- [ ] แก้ไข `Client/src/App.jsx` — เพิ่ม userRole state + ซ่อน UI ตาม role
- [ ] แก้ไข `Client/src/components/Canvas.jsx` — ปิดวาดสำหรับ Viewer
- [ ] แก้ไข `Client/src/components/Toolbar.jsx` — ซ่อนปุ่มตาม role
- [ ] แก้ไข `Client/src/index.css` — เพิ่ม CSS สำหรับ Role Selector + Viewer indicator

## WhiteboardApp (Electron)
- [ ] แก้ไข `WhiteboardApp/Client/src/components/NameDialog.jsx`
- [ ] แก้ไข `WhiteboardApp/Client/src/App.jsx`
- [ ] แก้ไข `WhiteboardApp/Client/src/components/Canvas.jsx`
- [ ] แก้ไข `WhiteboardApp/Client/src/components/Toolbar.jsx`

## Verification
- [ ] ทดสอบ Server + Client ผ่าน Browser
