# Whiteboard Professional UX/UI Redesign

## Problem
ปัจจุบัน UI ของ Whiteboard ยัดทุกอย่างลงใน Toolbar ด้านล่างเส้นเดียว — เมนู, ปากกา, สี, พื้นหลัง, undo/redo, shape, ผู้ใช้, บันทึก — ทำให้ดูรก ไม่เป็นมืออาชีพ และใช้งานยากโดยเฉพาะบนมือถือ

## Design Direction
จัดวาง UI ใหม่แบบ **Miro / Figma-style** — แยกเครื่องมือตามหน้าที่ ใส่ตำแหน่งที่เหมาะสม

> [!IMPORTANT]
> การเปลี่ยนนี้จะแก้ไข **Toolbar.jsx** ใหม่ทั้งหมดและปรับ CSS อย่างมาก แต่ **ไม่เปลี่ยนแปลง logic/state ใน App.jsx** — props ทั้งหมดยังคงเดิม

## Proposed Changes

### Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│  [≡ Menu]  [◀ 1/5 ▶]  │  Title  │  [👥 3] [QR] [🔐]  │  ← HeaderBar
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────┐            │
│  │  ✏️ 🧹 T 📐 👆 🖐️ │ ↩️ ↪️ 🗑️ │  🔴 ⏺️  │           │  ← ToolPalette (center-top float)
│  └─────────────────────────────────────────┘            │
│                                                    ●    │
│                                                    ●    │
│              [ Canvas Area ]                       ●    │  ← ColorSidebar (right)
│                                                    ●    │
│                                                    ●    │
│                                                    🎨   │
│                                                         │
│  ┌──────┐                                               │
│  │ BG   │                                               │  ← BackgroundPicker (bottom-left, host only)
│  └──────┘                                               │
└─────────────────────────────────────────────────────────┘
```

---

### Component Structure

#### [NEW] [HeaderBar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/HeaderBar.jsx)
- ตำแหน่ง: Fixed top, full width
- ซ้าย: Menu button (☰), Page navigation (◀ 1/5 ▶), Page panel toggle
- กลาง: ชื่อโปรเจกต์ / App title
- ขวา: User count badge, QR button, Permission button (host), Webcam toggle

#### [MODIFY] [Toolbar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Toolbar.jsx) → Rename to **ToolPalette.jsx**
- ตำแหน่ง: Fixed top-center, ด้านล่าง HeaderBar
- เฉพาะเครื่องมือวาดเท่านั้น: Pen (popup), Eraser, Text, Shape (popup), Select, Pan, Laser
- กลุ่ม Actions: Undo, Redo, Clear
- กลุ่ม Recording: Record, Insert Image
- ลดความยาวของ bar ลงอย่างมาก

#### [NEW] [ColorSidebar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/ColorSidebar.jsx)
- ตำแหน่ง: Fixed right, vertical, centered
- Quick colors 12 สี (วงกลมเล็ก)
- Color picker (เปิด modal)
- Background picker (4 ปุ่ม) — host only
- Pen size slider — โผล่เมื่อ hover/click

#### [MODIFY] [App.jsx](file:///c:/test_ai/Whiteboard/Client/src/App.jsx)
- เปลี่ยนจากการ render `<Toolbar>` เป็น `<HeaderBar>` + `<ToolPalette>` + `<ColorSidebar>`
- ย้าย UI elements (user-count, qr-toggle, permission-toggle-btn, focus-drawer-btn) เข้า HeaderBar
- Props ยังคงเดิม — แค่กระจายไปให้คนละ component

#### [MODIFY] [index.css](file:///c:/test_ai/Whiteboard/Client/src/index.css)
- เพิ่ม styles สำหรับ `.header-bar`, `.tool-palette`, `.color-sidebar`
- ลบหรือปรับ styles เดิมของ `.toolbar`
- ปรับ responsive breakpoints ให้รองรับ layout ใหม่
- เพิ่ม animations สำหรับ sidebar expand/collapse

#### [MODIFY] [NameDialog.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/NameDialog.jsx)
- ปรับ design ให้ดูเป็น modern card — เพิ่ม role indicator icon, gradient accent

---

## Verification Plan

### Browser Testing
1. Start dev server: `cd c:\test_ai\Whiteboard\Server && node server.js` then `cd c:\test_ai\Whiteboard\Client && npm run dev`
2. Open browser at `http://localhost:5173`
3. Verify:
   - HeaderBar แสดงถูกต้องด้านบน (menu, pages, users)
   - ToolPalette อยู่กลางด้านบน ใต้ HeaderBar
   - ColorSidebar อยู่ด้านขวา
   - Pen popup ยังทำงาน
   - Shape popup ยังทำงาน
   - สีเปลี่ยนได้
   - Undo/Redo/Clear ทำงาน
   - Page navigation ทำงาน
   - Name dialog แสดงสวยงาม
   - Viewer mode ซ่อน toolbar อย่างถูกต้อง
   - Mobile responsiveness (resize browser)

### Manual Verification (ผู้ใช้)
- ผู้ใช้ทดสอบรัน dev server และตรวจสอบ UI ใหม่ในเบราว์เซอร์
