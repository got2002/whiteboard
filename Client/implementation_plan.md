# Lock Screen — ฟีเจอร์ล็อคหน้าจอสำหรับ ToolBox

## สรุปฟีเจอร์
Lock Screen คือฟีเจอร์ที่ **Host** สามารถล็อคหน้าจอ Whiteboard ได้ เมื่อเปิดใช้งาน จะมี Overlay เต็มจอปิดบังเนื้อหาทั้งหมด พร้อมแสดงข้อความ "หน้าจอถูกล็อค" และมี **PIN 4 หลัก** สำหรับปลดล็อค

### Use Case
- ครู/Host ต้องการหยุดพักการสอน → ล็อคหน้าจอเพื่อไม่ให้นักเรียนเห็นเนื้อหาที่กำลังเตรียม
- ป้องกันไม่ให้ผู้เข้าร่วมเห็นคำตอบ/เนื้อหาที่ยังไม่พร้อมแสดง

---

## Open Questions

### Q1: Lock Screen ต้อง Sync ไปยัง Client (นักเรียน) ด้วยหรือไม่?
- **Option A**: Lock เฉพาะหน้าจอ Host เท่านั้น (เหมือน Curtain — ทำงานแค่ฝั่ง Host)
- **Option B**: Lock ทุกคน — เมื่อ Host ล็อค, Client ทุกคนจะเห็น Lock Screen ด้วย (ผ่าน Socket.io)

✅ **แนะนำ Option A** ก่อน เพราะทำง่ายกว่า สามารถเพิ่ม sync ทีหลังได้

### Q2: ต้องการ PIN หรือแค่ปุ่ม Unlock?
- **Option A**: มี PIN 4 หลัก ที่ Host ตั้งก่อนล็อค → ต้องกรอก PIN ถูกจึงปลดได้
- **Option B**: แค่กดปุ่ม "ปลดล็อค" โดยไม่มี PIN

✅ **แนะนำ Option A** เพราะป้องกันการปลดล็อคโดยไม่ตั้งใจ

---

## Proposed Changes

### Component: ToolBoxButton
**[MODIFY] ToolBoxButton.jsx**
- เพิ่มรายการ `lock_screen` ใน `TOOLBOX_ITEMS` ใต้ category `"gadgets"`
- ไอคอน: รูปแม่กุญแจ (padlock icon) ใน SVG
- Label: `"Lock Screen"`

---

### Component: LockScreenOverlay (ใหม่)
**[NEW] LockScreenOverlay.jsx**

สร้าง Component ใหม่ที่ทำงานคล้าย CurtainOverlay:

**States ภายใน Component:**
- `pin` — PIN 4 หลักที่ Host ตั้ง (default: `""`)
- `inputPin` — PIN ที่กำลังกรอกเพื่อปลดล็อค
- `phase` — `"setup"` (ตั้ง PIN) → `"locked"` (หน้าจอล็อคแล้ว) → `"unlock"` (กำลังกรอก PIN)
- `shake` — animation สั่นเมื่อกรอกผิด

**UI Flow:**
```
[เปิด Lock Screen]
    ↓
[Phase: setup] — Dialog ตั้ง PIN 4 หลัก
    ↓ (ยืนยัน)
[Phase: locked] — Overlay เต็มจอ สีเข้ม + ไอคอนแม่กุญแจ + ข้อความ
    ↓ (คลิกตรงไหนก็ได้ หรือกดปุ่ม "ปลดล็อค")
[Phase: unlock] — ช่องกรอก PIN 4 ช่อง
    ↓ (ถูกต้อง)
[ปิด Overlay] — onClose()
    ↓ (ผิด)
[Shake animation] — กลับไป "unlock" ให้กรอกใหม่
```

**Design:**
- Overlay: `position: fixed; inset: 0; z-index: 9999` (สูงกว่า Curtain)
- พื้นหลัง: gradient สีเข้ม + animated particles/blur
- ไอคอนแม่กุญแจขนาดใหญ่ตรงกลาง พร้อม pulse animation
- ข้อความ "🔒 หน้าจอถูกล็อค"
- เวลานาฬิกาแสดงเรียลไทม์
- PIN input ใช้ 4 ช่อง input แยก (auto-focus ไปช่องถัดไป)
- Shake animation เมื่อกรอก PIN ผิด

---

### Layout: MainLayout
**[MODIFY] MainLayout.jsx**

- เพิ่ม state: `showLockScreen`
- เพิ่มใน `activeTools` และ `onToolBoxSelect`
- Render `<LockScreenOverlay>`

---

### Styles
**[MODIFY] index.css**

เพิ่ม CSS ท้ายไฟล์สำหรับ lockscreen-* classes

---

## Verification Plan

1. เปิดแอป → กด ToolBox → เห็น "Lock Screen" ใน category Gadgets
2. กด Lock Screen → เห็น dialog ตั้ง PIN
3. ตั้ง PIN 4 หลัก → หน้าจอล็อค (Overlay เต็มจอ สวยงาม)
4. คลิกที่หน้าจอ → แสดงช่อง PIN
5. กรอก PIN ผิด → Shake animation
6. กรอก PIN ถูก → ปลดล็อค กลับสู่ Whiteboard
