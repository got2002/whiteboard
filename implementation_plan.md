# Enhanced EClass Modes + OnScreen Mode

## ภาพรวม

เสริมฟีเจอร์ 3 โหมดพิเศษ (คณิตศาสตร์/วิทยาศาสตร์/ภาษา) ให้เทียบเท่า EClass และเพิ่ม OnScreen Mode ใหม่ โค้ดจะเขียนให้สะอาด อ่านง่าย มี comment ทุกส่วน

## สิ่งที่แต่ละโหมดมีอยู่ vs จะเพิ่ม

### 🧮 Math Mode (คณิตศาสตร์)
| มีแล้ว | จะเพิ่มใหม่ |
|---|---|
| ไม้บรรทัด (ลาก+หมุน) | วงเวียน (Compass) — วาดวงกลมตามรัศมี |
| โปรแทรกเตอร์ (ครึ่งวงกลม) | สามเหลี่ยมมุมฉาก (Set Square) — วัดมุม 45°/60° |
| Grid background | เครื่องคิดเลข popup (Calculator) |
| | กราฟพิกัด X-Y (Coordinate Grid overlay) |

### 🔬 Science Mode (วิทยาศาสตร์)
| มีแล้ว | จะเพิ่มใหม่ |
|---|---|
| 16 lab stamps (emoji) | Timer/Stopwatch — จับเวลาทดลอง |
| ตารางธาตุ (1-20) | ตารางธาตุเต็ม (118 ธาตุ) — จัดตาม Period/Group |
| | แม่เหล็กไฟฟ้า diagram stamps (วงจรไฟฟ้า) |
| | หลอดทดลองแบบ interactive (เปลี่ยนสี/ระดับ) |

### 📖 Language Mode (ภาษา)
| มีแล้ว | จะเพิ่มใหม่ |
|---|---|
| แถบแนะนำ (banner) | เส้นคัดลายมือ 4 เส้น (Handwriting guide lines) |
| Lined background | Font size quick presets (หัวข้อ/ข้อความ/หมายเหตุ) |
| Text tool | ตัวอักษรตัวด้น (Bold), ขีดเส้นใต้ (Underline) |
| | Sticker คำศัพท์ (vocabulary stamps) |
| | เส้นประสำหรับลากหัดเขียน (dotted guide) |

### 🖥️ OnScreen Mode (ใหม่!)
| ฟีเจอร์ |
|---|
| ทำ canvas โปร่งใส — วาดทับหน้าจอ Desktop ได้ |
| แสดง Toolbar ลอยเล็กๆ มุมจอ |
| ปิด OnScreen → กลับกระดานปกติ |

> **OnScreen Mode ทำได้ในเว็บ** โดยการทำ canvas background เป็น transparent + window ขยายเต็มจอ ผู้ใช้จะเห็นเว็บพื้นหลังทะลุผ่านได้ แต่จะวาดทับ Desktop จริงได้ต้องเป็น Desktop App (Electron) ซึ่งสามารถทำเพิ่มทีหลังได้

---

## Proposed Changes

### Component: ModePanel

#### [MODIFY] [ModePanel.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/ModePanel.jsx)

**Math Mode เพิ่ม:**
- `CompassOverlay` — วงเวียน SVG ลาก+หมุน+ปรับรัศมี
- `SetSquareOverlay` — สามเหลี่ยมมุมฉาก SVG ลากได้
- `CalculatorPopup` — เครื่องคิดเลขลอย (+-×÷ พื้นฐาน)
- `CoordinateGridOverlay` — กราฟแกน X-Y ทับ canvas

**Science Mode เพิ่ม:**
- `TimerWidget` — จับเวลา start/stop/reset
- ขยายตารางธาตุเป็น 118 ธาตุ พร้อม color coding
- เพิ่ม circuit diagram stamps (วงจรไฟฟ้า)

**Language Mode เพิ่ม:**
- `HandwritingGuide` — เส้นคัดลายมือ 4 เส้น overlay
- `FontSizePresets` — ปุ่มเลือกขนาด (หัวข้อ/ข้อความ)
- `VocabStamps` — sticker คำศัพท์พื้นฐาน

---

### Component: Toolbar

#### [MODIFY] [Toolbar.jsx](file:///c:/test_ai/Whiteboard/Client/src/components/Toolbar.jsx)

- เพิ่มปุ่ม OnScreen Mode 🖥️ ในกลุ่ม Mode
- เพิ่มปุ่ม Highlighter 🖍️ ในกลุ่ม Drawing Tools

---

### Component: App

#### [MODIFY] [App.jsx](file:///c:/test_ai/Whiteboard/Client/src/App.jsx)

- เพิ่ม state: `isOnScreen` (boolean) สำหรับ OnScreen mode
- เพิ่ม state: `fontSize` สำหรับ Language mode presets
- เพิ่ม mode `"onscreen"` ใน mode selector
- เมื่อ `isOnScreen=true` → canvas background โปร่งใส + Toolbar เล็กลง

---

### Styles

#### [MODIFY] [index.css](file:///c:/test_ai/Whiteboard/Client/src/index.css)

- สไตล์ CompassOverlay, SetSquareOverlay
- สไตล์ CalculatorPopup, TimerWidget
- สไตล์ HandwritingGuide, VocabStamps
- สไตล์ OnScreen mode (transparent bg, mini toolbar)
- สไตล์ Highlighter strokes (semi-transparent)

---

## Verification

```bash
cd c:\test_ai\Whiteboard\Client && npx vite build
```

Build ผ่าน 0 errors + ทดสอบ:
1. **Math** — เปิดวงเวียน/สามเหลี่ยม/เครื่องคิดเลข/กราฟ
2. **Science** — ใช้ตารางธาตุเต็ม + Timer
3. **Language** — เห็นเส้นคัดลายมือ + เลือก font size
4. **OnScreen** — canvas โปร่งใส + วาดทับได้
