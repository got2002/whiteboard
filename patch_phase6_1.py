import codecs
import re

def insert_use_i18n(content, component_name):
    if 'useI18n' not in content:
        if 'import React' in content:
            content = content.replace('import React', 'import { useI18n } from "../i18n/i18n";\nimport React', 1)
        else:
            content = content.replace('import {', 'import { useI18n } from "../i18n/i18n";\nimport {', 1)
    
    if 'const { t } = useI18n();' not in content and f'const {{ t, language' not in content:
        # find the function definition
        pattern = re.compile(rf'(function {component_name}\([^)]*\)\s*{{|const {component_name} = \([^)]*\)\s*=>\s*{{)')
        match = pattern.search(content)
        if match:
            content = content[:match.end()] + '\n  const { t } = useI18n();' + content[match.end():]
    return content

def patch_toolbar():
    f = 'Client/src/components/Toolbar.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    
    content = insert_use_i18n(content, 'Toolbar')
    
    reps = {
        'title="ปากกา: ${getPenStyles(t).find(p => p.id === penStyle)?.label || "Pen"}"': 'title={`${t("deepCleanup.tooltipPen")}: ${getPenStyles(t).find(p => p.id === penStyle)?.label || "Pen"}`}',
        'title="เลเซอร์ชี้"': 'title={t("deepCleanup.tooltipLaser")}',
        'title="เลือก/ย้าย (V)"': 'title={t("deepCleanup.tooltipSelect")}',
        'title="เลื่อนกระดาน (M/2 นิ้ว)"': 'title={t("deepCleanup.tooltipPan")}',
        'title="เลือกสีเพิ่มเติม (16 ล้านสี)"': 'title={t("deepCleanup.tooltipColorMoreFull")}',
        'title="เลิกทำ (Ctrl+Z)"': 'title={t("deepCleanup.tooltipUndo")}',
        'title="ทำซ้ำ (Ctrl+Y)"': 'title={t("deepCleanup.tooltipRedo")}',
        'title="ลบทั้งหมด"': 'title={t("deepCleanup.tooltipClear")}',
        'title="เปิด/ปิดกล้อง (Webcam)"': 'title={t("deepCleanup.tooltipWebcam")}',
        'title={isRecording ? "หยุดบันทึก (Stop Record)" : "บันทึกหน้าจอ (Record)"}': 'title={isRecording ? t("deepCleanup.tooltipRecordStop") : t("deepCleanup.tooltipRecordStart")}',
        'title="ผู้ใช้ออนไลน์"': 'title={t("deepCleanup.tooltipUsers")}'
    }
    for k, v in reps.items():
        content = content.replace(k, v)
        
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_sidetoolbar():
    f = 'Client/src/components/SideToolbar.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    
    content = insert_use_i18n(content, 'SideToolbar')
    
    reps = {
        'title="ช่วยเหลือ"': 'title={t("deepCleanup.tooltipHelp")}',
        'title="บันทึกหน้าจอ"': 'title={t("deepCleanup.tooltipRecordStart")}',
        '<li><kbd>B</kbd> ปากกา</li>': '<li><kbd>B</kbd> {t("deepCleanup.tooltipPen")}</li>',
        '<li><kbd>H</kbd> ปากกาเน้น</li>': '<li><kbd>H</kbd> {t("deepCleanup.tooltipHighlighter")}</li>',
        '<li><kbd>E</kbd> ยางลบ</li>': '<li><kbd>E</kbd> {t("deepCleanup.tooltipEraser")}</li>',
        '<li><kbd>T</kbd> ข้อความ</li>': '<li><kbd>T</kbd> {t("deepCleanup.tooltipText")}</li>',
        '<li><kbd>V</kbd> เลือก/ย้าย</li>': '<li><kbd>V</kbd> {t("deepCleanup.tooltipSelect")}</li>',
        '<li><kbd>L</kbd> เส้นตรง</li>': '<li><kbd>L</kbd> {t("deepCleanup.tooltipLine")}</li>',
        '<li><kbd>R</kbd> สี่เหลี่ยม</li>': '<li><kbd>R</kbd> {t("deepCleanup.tooltipRect")}</li>',
        '<li><kbd>C</kbd> วงกลม</li>': '<li><kbd>C</kbd> {t("deepCleanup.tooltipCircle")}</li>',
        '<li><kbd>P</kbd> เลเซอร์</li>': '<li><kbd>P</kbd> {t("deepCleanup.tooltipLaser")}</li>',
        '<li><kbd>Ctrl+Z</kbd> เลิกทำ</li>': '<li><kbd>Ctrl+Z</kbd> {t("deepCleanup.tooltipUndo")}</li>',
        '<li><kbd>Ctrl+Y</kbd> ทำซ้ำ</li>': '<li><kbd>Ctrl+Y</kbd> {t("deepCleanup.tooltipRedo")}</li>',
        '<li><kbd>Ctrl+S</kbd> บันทึก</li>': '<li><kbd>Ctrl+S</kbd> {t("deepCleanup.tooltipSave")}</li>',
        '<li><kbd>Ctrl+O</kbd> เปิดไฟล์</li>': '<li><kbd>Ctrl+O</kbd> {t("deepCleanup.tooltipOpen")}</li>'
    }
    for k, v in reps.items():
        content = content.replace(k, v)
        
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_floating():
    f = 'Client/src/components/FloatingPalette.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    
    # We can't easily inject t() inside TOOLS constant if it's outside component.
    # Let's replace the hardcoded array to use t() directly by passing t into the component or redefining TOOLS inside.
    # Since TOOLS is outside, we will map it inside the render loop:
    # <button title={tool.title}> -> <button title={t(`deepCleanup.tooltip${tool.id.charAt(0).toUpperCase() + tool.id.slice(1)}`)}>
    
    content = insert_use_i18n(content, 'FloatingPalette')
    
    # Instead of renaming the titles in the array, let's just translate title={tool.title} -> title={t('deepCleanup.tooltip' + tool.id.charAt(0).toUpperCase() + tool.id.slice(1))}
    # Or simpler: mapping id to translation key
    content = content.replace('title={tool.title}', 'title={tool.id === "pen" ? t("deepCleanup.tooltipPen") : tool.id === "highlighter" ? t("deepCleanup.tooltipHighlighter") : tool.id === "eraser" ? t("deepCleanup.tooltipEraser") : tool.id === "text" ? t("deepCleanup.tooltipText") : tool.id === "select" ? t("deepCleanup.tooltipSelect") : tool.id === "pan" ? t("deepCleanup.tooltipPan") : tool.title}')
    content = content.replace('title="เครื่องมือด่วน"', 'title={t("deepCleanup.tooltipColorMore")}')
    
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_modepanel():
    f = 'Client/src/components/ModePanel.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    
    content = insert_use_i18n(content, 'ModePanel')
    
    reps = {
        'label: "หลอดทดลอง"': 'label: "modeTestTube"',
        'label: "ขวดกลั่น"': 'label: "modeFlask"',
        'label: "กล้องจุลทรรศน์"': 'label: "modeMicroscope"',
        'label: "แม่เหล็ก"': 'label: "modeMagnet"',
        'label: "อะตอม"': 'label: "modeAtom"',
        'label: "เทอร์โมมิเตอร์"': 'label: "modeThermometer"',
        'label: "หลอดไฟ"': 'label: "modeBulb"',
        'label: "แบตเตอรี่"': 'label: "modeBattery"',
        'label: "ไฟฟ้า"': 'label: "modeElectricity"',
        'label: "โลก"': 'label: "modeEarth"',
        'label: "ดวงอาทิตย์"': 'label: "modeSun"',
        'label: "วงแหวนดาวเสาร์"': 'label: "modeSaturnRing"',
        'label: "ดวงจันทร์"': 'label: "modeMoon"',
        'label: "หยดน้ำ"': 'label: "modeDrop"',
        'label: "ไฟ"': 'label: "modeFire"',
        'label: "จานเพาะเชื้อ"': 'label: "modePetri"',
        'label: "หุ่นคน (Person)"': 'label: "modePerson"',
        'label: "หัวใจ (Heart)"': 'label: "modeHeart"',
        'label: "ดาว (Star)"': 'label: "modeStar"',
        'label: "ถูกต้อง (Correct)"': 'label: "modeCorrect"',
        'label: "ผิด (Wrong)"': 'label: "modeWrong"',
        'label: "ไอเดีย (Idea)"': 'label: "modeIdea"',
        'label: "เต็มร้อย (100)"': 'label: "mode100"',
        'label: "ถ้วยรางวัล (Trophy)"': 'label: "modeTrophy"',
    }
    for k, v in reps.items():
        content = content.replace(k, v)
        
    # In render: title={stamp.label} -> title={t(`deepCleanup.${stamp.label}`)}
    content = content.replace('title={stamp.label}', 'title={t(`deepCleanup.${stamp.label}`)}')
    
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

patch_toolbar()
patch_sidetoolbar()
patch_floating()
patch_modepanel()
print("Patched Phase 6 Part 1")
