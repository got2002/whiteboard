# การพัฒนาระบบกำหนดสิทธิ์ผู้ใช้งาน (Direct Permission Assignment)

จากภาพและคำแนะนำของลูกค้า มีการให้แก้ไข 2 ส่วน:
1. **ไม่ต้อง popup ให้แสดงเป็นปุ่ม alert ก่อน:** ระบบปัจจุบันได้ลบการ Alert แบบ Popup ทิ้งไปแล้ว โดยการขอสิทธิ์จะส่งเป็นตัวเลข (Badge) แจ้งเตือนสีแดง (Alert Button) ไปยังครูผู้สอนแทน เพื่อไม่ให้รบกวนหน้าจอของครูขณะสอน กรณีนี้ระบบปัจจุบันทำได้ตามที่ลูกค้าต้องการแล้ว
2. **คนสอน assign สิทธิ์ได้โดยไม่ต้องขอ:** ลูกค้าต้องการให้ครูเห็นรายชื่อนักเรียนที่เป็นผู้เข้าชม (Viewers) ทั้งหมด และสามารถกด **ให้สิทธิ์เขียน** (Grant Permission) ให้แก่นักเรียนรายบุคคลได้เลย ทันทีโดยไม่ต้องรอนักเรียนกดขอสิทธิ์มาก่อน

## กำหนดการส่วนที่แก้ (Proposed Changes)

### Server (Socket.io)

#### [MODIFY] [permission.js](file:///c:/test_ai/Whiteboard/Server/socket/permission.js)
- เพิ่ม event `grant-permission` สำหรับให้ Host ยิงคำสั่งเปลี่ยนสถานะของนักเรียนจาก `viewer` เป็น `contributor` ได้โดยตรง (รูปแบบคล้ายกับ `approve-request` แต่ไม่ต้องตรวจสอบและลบสถานะจาก `pendingRequests` ก่อน)

---

### Client (React)

#### [MODIFY] [permissionService.js](file:///c:/test_ai/Whiteboard/Client/src/feature/permission/permissionService.js)
- เพิ่มฟังก์ชัน `emitGrantPermission(studentId)` รองรับการยิง Socket ส่งให้ Server

#### [MODIFY] [usePermission.js](file:///c:/test_ai/Whiteboard/Client/src/feature/permission/usePermission.js)
- เพิ่ม `handleGrantPermission(studentId)` เพื่อเรียกใช้ `permissionService.emitGrantPermission`

#### [MODIFY] [MainLayout.jsx](file:///c:/test_ai/Whiteboard/Client/src/layouts/MainLayout.jsx)
- ดึงรายชื่อ `viewers` ออกจาก `collabHook.remoteUsers` เพื่อส่งต่อเข้าไปใน Panel 
- ส่งผ่าน props `viewers` และฟังก์ชัน `onGrant` เข้าสู่ `PermissionPanel`

#### [MODIFY] [PermissionPanel.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/PermissionPanel.jsx)
- เพิ่มส่วนแสดงผลใหม่ **"👀 ผู้เข้าชม (Viewers)"** เพื่อให้แสดงนักเรียนที่ดูอยู่แต่ยังไม่ได้สิทธิ์เขียน
- เพิ่มปุ่มกดชื่องาน **"➕ ให้สิทธิ์"** ให้ครูสามารถ Grant สิทธิ์ให้ผู้เข้าชมเหล่านั้นได้ทันที

## Open Questions

เนื่องจากระบบปัจจุบันไม่ได้ขึ้นเป็น Popup อยู่แล้ว (ขึ้นเป็น Alert Badge แจ้งเตือน) ผมจึงจะโฟกัสการพัฒนาไปที่ข้อ (2) เพื่อให้ครูสามารถให้สิทธิ์นักเรียนได้ทันทีโดยที่นักเรียนไม่ต้องกดขอก่อนครับ 

## Verification Plan

### Manual Verification
1. เปิดหน้าเว็บ 2 หน้าต่าง หน้าต่างแรก Log in เป็น **"ครู (Host)"** และอีกหน้าต่างเป็น **"นักเรียน (Viewer)"**
2. ครูสามารถกดแท็บการอนุญาตสิทธิ์ และจะเห็นชื่อของนักเรียนในแท็บผู้เข้าชม
3. ครูสามารถเพิ่มสิทธิ์เขียนให้นักเรียนเองได้ (โดยนักเรียนไม่ต้องกดขอ) 
4. นักเรียนจะมีสิทธิ์การเขียนกระดานทันที
