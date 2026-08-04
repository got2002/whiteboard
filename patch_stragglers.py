import codecs

def patch_file(filepath, replacements):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()
    
    # insert useI18n if needed
    if 'useI18n' not in content:
        if 'import React' in content:
            content = content.replace('import React', 'import { useI18n } from "../i18n/i18n";\nimport React', 1)
        else:
            content = content.replace('import {', 'import { useI18n } from "../i18n/i18n";\nimport {', 1)
            
    if 'const { t } = useI18n();' not in content and 'const { t, language }' not in content:
        import re
        component_name = filepath.split('/')[-1].split('.')[0]
        pattern = re.compile(rf'(function {component_name}\([^)]*\)\s*{{|const {component_name} = \([^)]*\)\s*=>\s*{{)')
        match = pattern.search(content)
        if match:
            content = content[:match.end()] + '\n  const { t } = useI18n();' + content[match.end():]
            
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(content)

# Canvas.jsx
patch_file('Client/src/components/Canvas.jsx', {
    '"จงอ่านคำถามหรือสมการคณิตศาสตร์ที่เขียนด้วยลายมือในรูปภาพนี้ และให้คำตอบพร้อมคำอธิบายที่สั้น กระชับ ชัดเจน ตอบเป็นภาษาเดียวกับคำถาม (ส่วนใหญ่เป็นภาษาไทย) ห้ามมีคำพูดเกริ่นนำ"': 't("ai.systemPrompt") || "จงอ่านคำถามหรือสมการคณิตศาสตร์ที่เขียนด้วยลายมือในรูปภาพนี้ และให้คำตอบพร้อมคำอธิบายที่สั้น กระชับ ชัดเจน ตอบเป็นภาษาเดียวกับคำถาม ห้ามมีคำพูดเกริ่นนำ"',
    '`สีช่องที่ ${i+1}`': '`${t("canvas.colorSlot")} ${i+1}`',
    '`ชื่อช่อง ${i+1}`': '`${t("canvas.slotName")} ${i+1}`'
})

# BannerWidget.jsx
patch_file('Client/src/components/BannerWidget.jsx', {
    '>ข้อความ<': '>{t("banner.text") || "ข้อความ"}<'
})

# CustomBalanceLab.jsx
patch_file('Client/src/components/CustomBalanceLab.jsx', {
    '🗑️ ปล่อยเพื่อลบทิ้ง': '🗑️ {t("lab.releaseToDelete") || "ปล่อยเพื่อลบทิ้ง"}'
})

# LockScreenOverlay.jsx
patch_file('Client/src/components/LockScreenOverlay.jsx', {
    'ปลดล็อค': '{t("lock.unlock") || "ปลดล็อค"}'
})

# ScreenshotOverlay.jsx
patch_file('Client/src/components/ScreenshotOverlay.jsx', {
    'confirmText = "ยืนยัน"': 'confirmText = "Confirm"'
})

# SideToolbar.jsx
patch_file('Client/src/components/SideToolbar.jsx', {
    '<span>📌 คีย์ลัด</span>': '<span>📌 {t("deepCleanup.shortcuts") || "คีย์ลัด"}</span>'
})

# Toolbar.jsx
patch_file('Client/src/components/Toolbar.jsx', {
    'title={`ปากกา: ${getPenStyles(t).find(p => p.id === penStyle)?.label || "Pen"}`}': 'title={`${t("deepCleanup.tooltipPen")}: ${getPenStyles(t).find(p => p.id === penStyle)?.label || "Pen"}`}',
    'title={`รูปทรง: ${currentShapeObj?.label}`}': 'title={`${t("toolbar.shape") || "รูปทรง"}: ${currentShapeObj?.label}`}'
})

# ToolBoxButton.jsx
patch_file('Client/src/components/ToolBoxButton.jsx', {
    'label: "Banner อักษรวิ่ง"': 'label: t("widget.banner") || "Banner อักษรวิ่ง"'
})

print("Patched Stragglers")
