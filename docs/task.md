# Direct Permission Assignment Task Tracker

## Server
- [x] `Server/socket/permission.js` — เพิ่ม `socket.on("grant-permission")`

## Client
- [x] `Client/src/feature/permission/permissionService.js` — เพิ่ม `emitGrantPermission`
- [x] `Client/src/feature/permission/usePermission.js` — เพิ่ม `handleGrantPermission`
- [x] `Client/src/layouts/MainLayout.jsx` — ดึงรายชื่อ `viewers` และส่งเข้า `PermissionPanel`
- [x] `Client/src/components/PermissionPanel.jsx` — หน้าตา UI ส่วน Viewers + ปุ่ม `➕ ให้สิทธิ์`

## Verification
- [ ] ทดสอบเปลี่ยนสิทธิ์ให้ผู้ชมสำเร็จ
