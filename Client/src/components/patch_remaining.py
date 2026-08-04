import re
import os

# 1. Fix ModePanel.jsx
filepath_mode = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\ModePanel.jsx"
with open(filepath_mode, "r", encoding="utf-8") as f:
    content_mode = f.read()

# Import useI18n
if 'import { useI18n }' not in content_mode:
    content_mode = content_mode.replace('import { useState, useRef, useCallback } from "react";',
                                        'import { useState, useRef, useCallback } from "react";\nimport { useI18n } from "../i18n/i18n";')

# Add t to RulerOverlay
content_mode = content_mode.replace('function RulerOverlay() {', 'function RulerOverlay() {\n    const { t } = useI18n();')
content_mode = content_mode.replace('title="{t("modePanel.dragToMoveScrollToRotate")}"', 'title={t("modePanel.dragToMoveScrollToRotate")}')

# Add t to ProtractorOverlay
content_mode = content_mode.replace('function ProtractorOverlay() {', 'function ProtractorOverlay() {\n    const { t } = useI18n();')
content_mode = content_mode.replace('title="{t("modePanel.dragToMove")}"', 'title={t("modePanel.dragToMove")}')

# Add t to ModePanel
if 'const { t } = useI18n();' not in content_mode.split('function ModePanel')[1]:
    content_mode = content_mode.replace('function ModePanel({ mode, activeStamp, onStampSelect, onInsertImage }) {',
                                        'function ModePanel({ mode, activeStamp, onStampSelect, onInsertImage }) {\n    const { t } = useI18n();')

with open(filepath_mode, "w", encoding="utf-8") as f:
    f.write(content_mode)


# 2. Fix ToolPalette.jsx
filepath_palette = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\ToolPalette.jsx"
with open(filepath_palette, "r", encoding="utf-8") as f:
    content_palette = f.read()

# PEN_STYLES and SHAPES functions
content_palette = content_palette.replace('const PEN_STYLES = [', 'const getPenStyles = (t) => [')
content_palette = re.sub(r'label:\s*"Pen"', 'label: t("toolbar.pen")', content_palette)
content_palette = re.sub(r'label:\s*"Highlight"', 'label: t("toolbar.penHighlighter")', content_palette)
content_palette = re.sub(r'label:\s*"Pencil"', 'label: t("toolbar.penPencil")', content_palette)
content_palette = re.sub(r'label:\s*"Fountain"', 'label: t("toolbar.penFountain")', content_palette)
content_palette = re.sub(r'label:\s*"Neon"', 'label: t("toolbar.penNeon")', content_palette)
content_palette = re.sub(r'label:\s*"Dashed"', 'label: t("toolbar.penDashed")', content_palette)
content_palette = re.sub(r'label:\s*"Dotted"', 'label: t("toolbar.penDotted")', content_palette)
content_palette = re.sub(r'label:\s*"Brush"', 'label: t("toolbar.penBrush")', content_palette)
content_palette = re.sub(r'label:\s*"Crayon"', 'label: t("toolbar.penCrayon")', content_palette)
content_palette = re.sub(r'label:\s*"Marker"', 'label: t("toolbar.penMarker")', content_palette)
content_palette = re.sub(r'label:\s*"Chalk"', 'label: t("toolbar.penChalk")', content_palette)
content_palette = re.sub(r'label:\s*"(\d+) Slots"', r'label: t("toolbar.splitSlots").replace("{count}", "\1")', content_palette)

content_palette = re.sub(r'desc:\s*"ปากกาปกติ"', 'desc: t("toolbar.penNormal")', content_palette)
content_palette = re.sub(r'desc:\s*"ปากกาเน้นข้อความ"', 'desc: t("toolbar.penHighlighter")', content_palette)
content_palette = re.sub(r'desc:\s*"ปากกาหัวเล็ก"', 'desc: t("toolbar.penPencil")', content_palette)
content_palette = re.sub(r'desc:\s*"ปากกาหมึกซึม"', 'desc: t("toolbar.penFountain")', content_palette)
content_palette = re.sub(r'desc:\s*"เรืองแสง"', 'desc: t("toolbar.penNeon")', content_palette)
content_palette = re.sub(r'desc:\s*"เส้นประ"', 'desc: t("toolbar.penDashed")', content_palette)
content_palette = re.sub(r'desc:\s*"เส้นจุด"', 'desc: t("toolbar.penDotted")', content_palette)
content_palette = re.sub(r'desc:\s*"แบ่ง (\d+) ช่อง"', r'desc: t("toolbar.splitSlots").replace("{count}", "\1")', content_palette)
content_palette = re.sub(r'desc:\s*"ดินสอ"', 'desc: t("toolbar.penPencil")', content_palette)
content_palette = re.sub(r'desc:\s*"ชอล์ก"', 'desc: t("toolbar.penChalk")', content_palette)
content_palette = re.sub(r'desc:\s*"ปากกามาร์กเกอร์"', 'desc: t("toolbar.penMarker")', content_palette)
content_palette = re.sub(r'desc:\s*"พู่กัน"', 'desc: t("toolbar.penBrush")', content_palette)
content_palette = re.sub(r'desc:\s*"สีเทียน"', 'desc: t("toolbar.penCrayon")', content_palette)

content_palette = content_palette.replace('const SHAPES = [', 'const getShapes = (t) => [')
content_palette = re.sub(r'desc:\s*"แกนพิกัด"', 'desc: t("toolbar.shapeAxes")', content_palette)
content_palette = re.sub(r'desc:\s*"เส้นตรง"', 'desc: t("toolbar.shapeLine")', content_palette)
content_palette = re.sub(r'desc:\s*"ลูกศร"', 'desc: t("toolbar.shapeArrow")', content_palette)
content_palette = re.sub(r'desc:\s*"สี่เหลี่ยม"', 'desc: t("toolbar.shapeRect")', content_palette)
content_palette = re.sub(r'desc:\s*"สี่เหลี่ยมมุมมน"', 'desc: t("toolbar.shapeRoundedRect")', content_palette)
content_palette = re.sub(r'desc:\s*"สี่เหลี่ยมด้านขนาน"', 'desc: t("toolbar.shapeParallelogram")', content_palette)
content_palette = re.sub(r'desc:\s*"สี่เหลี่ยมคางหมู"', 'desc: t("toolbar.shapeTrapezoid")', content_palette)
content_palette = re.sub(r'desc:\s*"ข้าวหลามตัด"', 'desc: t("toolbar.shapeDiamond")', content_palette)
content_palette = re.sub(r'desc:\s*"สามเหลี่ยม"', 'desc: t("toolbar.shapeTriangle")', content_palette)
content_palette = re.sub(r'desc:\s*"สามเหลี่ยมมุมฉาก"', 'desc: t("toolbar.shapeRightTriangle")', content_palette)
content_palette = re.sub(r'desc:\s*"ห้าเหลี่ยม"', 'desc: t("toolbar.shapePentagon")', content_palette)
content_palette = re.sub(r'desc:\s*"หกเหลี่ยม"', 'desc: t("toolbar.shapeHexagon")', content_palette)
content_palette = re.sub(r'desc:\s*"เจ็ดเหลี่ยม"', 'desc: t("toolbar.shapeHeptagon")', content_palette)
content_palette = re.sub(r'desc:\s*"แปดเหลี่ยม"', 'desc: t("toolbar.shapeOctagon")', content_palette)
content_palette = re.sub(r'desc:\s*"ดาว"', 'desc: t("toolbar.shapeStar")', content_palette)
content_palette = re.sub(r'desc:\s*"กากบาท"', 'desc: t("toolbar.shapeCross")', content_palette)
content_palette = re.sub(r'desc:\s*"วงกลม"', 'desc: t("toolbar.shapeCircle")', content_palette)
content_palette = re.sub(r'desc:\s*"วงรี"', 'desc: t("toolbar.shapeEllipse")', content_palette)
content_palette = re.sub(r'desc:\s*"ทรงกระบอก"', 'desc: t("toolbar.shapeCylinder")', content_palette)
content_palette = re.sub(r'desc:\s*"กรวย"', 'desc: t("toolbar.shapeCone")', content_palette)
content_palette = re.sub(r'desc:\s*"ทรงกลม"', 'desc: t("toolbar.shapeSphere")', content_palette)
content_palette = re.sub(r'desc:\s*"ลูกบาศก์"', 'desc: t("toolbar.shapeCube")', content_palette)
content_palette = re.sub(r'desc:\s*"ปริซึมสามเหลี่ยม"', 'desc: t("toolbar.shapePrism")', content_palette)
content_palette = re.sub(r'desc:\s*"พีระมิด"', 'desc: t("toolbar.shapePyramid")', content_palette)

content_palette = content_palette.replace('PEN_STYLES.', 'getPenStyles(t).')
content_palette = content_palette.replace('PEN_STYLES[0]', 'getPenStyles(t)[0]')
content_palette = content_palette.replace('SHAPES.', 'getShapes(t).')

if 'const { t } = useI18n();' not in content_palette.split('function ToolPalette')[1]:
    content_palette = content_palette.replace('function ToolPalette({', 'function ToolPalette({\n    const { t } = useI18n();')
    # wait, it's inside parameter list! We need to place it inside function body.
    content_palette = content_palette.replace('}) {', '}) {\n    const { t } = useI18n();')
    content_palette = content_palette.replace('function ToolPalette({\n    const { t } = useI18n();', 'function ToolPalette({') # revert mistake if happened

# Tooltip replacements
content_palette = content_palette.replace('title="ลากเพื่อย้ายตำแหน่ง (ดับเบิลคลิกเพื่อรีเซ็ต)"', 'title={t("toolbar.dragToMove")}')
content_palette = content_palette.replace('title="ปากกา"', 'title={t("toolbar.pen")}')
content_palette = content_palette.replace('<span className="pen-popup-title">Pen Style</span>', '<span className="pen-popup-title">{t("toolbar.pen")}</span>')
content_palette = content_palette.replace('ปากกา</div>', '{t("toolbar.pen")}</div>')
content_palette = content_palette.replace('แบ่งหน้าจอ</div>', '{t("toolbar.splitScreen")}</div>')
content_palette = content_palette.replace('ทิศทาง:</span>', '{t("toolbar.direction")}</span>')
content_palette = content_palette.replace('title="แบ่งแนวตั้ง"', 'title={t("toolbar.vertical")}')
content_palette = content_palette.replace('│ แนวตั้ง', '│ {t("toolbar.vertical")}')
content_palette = content_palette.replace('title="แบ่งแนวนอน"', 'title={t("toolbar.horizontal")}')
content_palette = content_palette.replace('─ แนวนอน', '─ {t("toolbar.horizontal")}')
content_palette = content_palette.replace('❌ รีเซ็ตการแบ่งหน้าจอ', '❌ {t("toolbar.cancelSplit")}')
content_palette = content_palette.replace('ขนาด</span>', '{t("toolbar.size")}</span>')
content_palette = content_palette.replace('title={`ขนาดเส้น: ${penSize}`}', 'title={`${t("toolbar.size")}: ${penSize}`}')
content_palette = content_palette.replace('title={`ขนาด: ${eraserSize}`}', 'title={`${t("toolbar.size")}: ${eraserSize}`}')
content_palette = content_palette.replace('title="ยางลบ (E)"', 'title={`${t("toolbar.eraser")} (E)`}')
content_palette = content_palette.replace('<span className="pen-popup-title">ยางลบ</span>', '<span className="pen-popup-title">{t("toolbar.eraser")}</span>')
content_palette = content_palette.replace('title="AI Pen (แปลงลายเส้นเป็นข้อความ)"', 'title={t("toolbar.aiPen")}')
content_palette = content_palette.replace('title="Magic Pen"', 'title={t("toolbar.magicPen")}')
content_palette = content_palette.replace('title="ข้อความ (T)"', 'title={`${t("toolbar.text")} (T)`}')
content_palette = content_palette.replace('title="แทรกรูปภาพ"', 'title={t("toolbar.insertImageLabel")}')
content_palette = content_palette.replace('title="แทรกวิดีโอ (.mp4)"', 'title={t("toolbar.insertVideoLabel")}')
content_palette = content_palette.replace('title="พิมพ์ด้วยเสียง (Voice to Text)"', 'title={t("toolbar.voiceToText")}')
content_palette = content_palette.replace('title="รูปทรง"', 'title={t("toolbar.shapes")}')
content_palette = content_palette.replace('title="เลือก/ย้าย (V)"', 'title={`${t("toolbar.selectMove")} (V)`}')
content_palette = content_palette.replace('title="บ่วงเชือก (Lasso)"', 'title={t("toolbar.lasso")}')
content_palette = content_palette.replace('title="เลื่อนกระดาน"', 'title={t("toolbar.pan")}')
content_palette = content_palette.replace('title="เลเซอร์ชี้"', 'title={t("toolbar.laser")}')
content_palette = content_palette.replace('title="เลิกทำ (Ctrl+Z)"', 'title={`${t("toolbar.undo")} (Ctrl+Z)`}')
content_palette = content_palette.replace('title="ทำซ้ำ (Ctrl+Y)"', 'title={`${t("toolbar.redo")} (Ctrl+Y)`}')
content_palette = content_palette.replace('title="ลบทั้งหมด"', 'title={t("toolbar.clearAll")}')
content_palette = content_palette.replace('title="เลเยอร์ (Layers)"', 'title={t("toolbar.layers")}')

with open(filepath_palette, "w", encoding="utf-8") as f:
    f.write(content_palette)

print("Patch applied for ModePanel.jsx and ToolPalette.jsx")
