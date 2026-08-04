import re
import os

filepath = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\Toolbar.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import useI18n
if 'import { useI18n } from "../i18n/i18n";' not in content:
    content = content.replace('import { useState, useRef, useEffect } from "react";', 
                              'import { useState, useRef, useEffect } from "react";\nimport { useI18n } from "../i18n/i18n";')

# 2. Add t inside Toolbar component
if "const { t } = useI18n();" not in content:
    content = content.replace('function Toolbar({', 
                              'function Toolbar({\n    tool, color, penSize, penStyle, background, mode,')
    content = re.sub(r'const isHost = userRole === "host";',
                     r'const { t } = useI18n();\n    const isHost = userRole === "host";',
                     content)

# 3. Replace Collapsed tooltips
content = content.replace('title="คลิกเพื่อขยายแถบเครื่องมือ"', 'title={t("toolbar.expandToolbar")}')

# 4. Replace Main Menu strings
content = content.replace('title="เมนูหลัก"', 'title={t("header.mainMenu")}')
content = content.replace('<span className="main-menu-text">New</span>', '<span className="main-menu-text">{t("header.newBoard")}</span>')
content = content.replace('<span className="main-menu-text">Open</span>', '<span className="main-menu-text">{t("header.open")}</span>')
content = content.replace('<span className="main-menu-text">Save</span>', '<span className="main-menu-text">{t("header.save")}</span>')
content = content.replace('<span className="main-menu-text">Export</span>', '<span className="main-menu-text">{t("header.screenshot")}</span>')
content = content.replace('<span className="main-menu-text">Export All</span>', '<span className="main-menu-text">{t("header.screenshotAll")}</span>')
content = content.replace('<span className="main-menu-text">Auto Save {autoSave ? "✓" : ""}</span>', '<span className="main-menu-text">{t("header.autoSave")} {autoSave ? "✓" : ""}</span>')
content = content.replace('<div className="main-menu-section-label">Mode</div>', '<div className="main-menu-section-label">{t("header.mode")}</div>')

# 5. Page navigation
content = content.replace('title="จัดการหน้า"', 'title={t("header.managePages")}')
content = content.replace('title="หน้าก่อนหน้า"', 'title={t("header.prevPage")}')
content = content.replace('title="หน้าถัดไป"', 'title={t("header.nextPage")}')

# 6. Insert Image / Video
content = content.replace('title="แทรกรูปภาพ..."', 'title={t("toolbar.insertImageLabel")}')
content = content.replace('title="แทรกวิดีโอ (.mp4)..."', 'title={t("toolbar.insertVideoLabel")}')

# 7. Pen popup title
content = content.replace('<span className="pen-popup-title">Pen</span>', '<span className="pen-popup-title">{t("toolbar.pen")}</span>')

# 8. Pen sub-labels
content = content.replace('ปากกา</div>', '{t("toolbar.pen")}</div>')
content = content.replace('แบ่งหน้าจอ</div>', '{t("toolbar.splitScreen")}</div>')

# 9. Split direction
content = content.replace('ทิศทาง:</span>', '{t("toolbar.direction")}</span>')
content = content.replace('title="แบ่งแนวตั้ง"', 'title={t("toolbar.vertical")}')
content = content.replace('│ แนวตั้ง', '│ {t("toolbar.vertical")}')
content = content.replace('title="แบ่งแนวนอน"', 'title={t("toolbar.horizontal")}')
content = content.replace('─ แนวนอน', '─ {t("toolbar.horizontal")}')
content = content.replace('❌ ยกเลิกการแบ่งหน้าจอ', '❌ {t("toolbar.cancelSplit")}')

# 10. Slider
content = content.replace('<span className="pen-slider-label">Size</span>', '<span className="pen-slider-label">{t("toolbar.size")}</span>')

# 11. Eraser, AI Pen, Text
content = content.replace('title="ยางลบ (E)"', 'title={`${t("toolbar.eraser")} (E)`}')
content = content.replace('title="AI Pen (แปลงลายเส้นเป็นข้อความ)"', 'title={t("toolbar.aiPen")}')
content = content.replace('title="ข้อความ (T)"', 'title={t("toolbar.text")}')

# 12. Mode dynamic translation
# For MODES.map
content = content.replace('<span className="main-menu-text">{m.title}</span>', '<span className="main-menu-text">{t(`toolbar.${m.id}Mode`)}</span>')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied to Toolbar.jsx")
