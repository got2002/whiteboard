import codecs
import re

def insert_use_i18n(content, component_name):
    if 'useI18n' not in content:
        if 'import React' in content:
            content = content.replace('import React', 'import { useI18n } from "../i18n/i18n";\nimport React', 1)
        else:
            content = content.replace('import {', 'import { useI18n } from "../i18n/i18n";\nimport {', 1)
    
    if 'const { t } = useI18n();' not in content and f'const {{ t, language' not in content:
        pattern = re.compile(rf'(function {component_name}\([^)]*\)\s*{{|const {component_name} = \([^)]*\)\s*=>\s*{{)')
        match = pattern.search(content)
        if match:
            content = content[:match.end()] + '\n  const { t } = useI18n();' + content[match.end():]
    return content

def patch_canvas():
    f = 'Client/src/components/Canvas.jsx'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    content = insert_use_i18n(content, 'Canvas')
    
    reps = {
        'setInterimVoiceText("กำลังเชื่อมต่อไมโครโฟน...")': 'setInterimVoiceText(t("deepCleanup.aiMicConnecting"))',
        'setAiError("ไม่ได้ยินเสียง หรือไม่มีข้อความ")': 'setAiError(t("deepCleanup.aiNoVoice"))',
        'setInterimVoiceText("กำลังบันทึกเสียง... (คลิกอีกครั้งเพื่อหยุด)")': 'setInterimVoiceText(t("deepCleanup.aiRecording"))',
        'setAiError("ไม่สามารถเข้าถึงไมโครโฟนได้: " + err.message)': 'setAiError(t("deepCleanup.aiMicError") + err.message)',
        'title="เลือกสีเพิ่มเติม"': 'title={t("deepCleanup.tooltipColorMore")}',
        'title="ตัวหนา"': 'title={t("deepCleanup.tooltipBold")}',
        'title="ตัวเอียง"': 'title={t("deepCleanup.tooltipItalic")}',
        'title="ขีดเส้นใต้"': 'title={t("deepCleanup.tooltipUnderline")}',
        '✓ ตกลง': '{t("deepCleanup.btnOk")}',
        'placeholder="พิมพ์ข้อความ..."': 'placeholder={t("deepCleanup.placeholderText")}',
        '{interimVoiceText ? interimVoiceText : "กำลังฟังเสียง..."}': '{interimVoiceText ? interimVoiceText : t("deepCleanup.aiListening")}',
        'กำลังแปลงเสียงเป็นข้อความ...': '{t("deepCleanup.aiTranscribing")}',
        'กำลังแปลงเป็นข้อความ...': '{t("deepCleanup.aiConverting")}',
    }
    for k, v in reps.items(): content = content.replace(k, v)
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_physics():
    f = 'Client/src/components/PhysicsLabWidget.jsx'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    # It already has t, language
    
    reps = {
        'ctx.fillText("สมดุล (x=0)",': 'ctx.fillText(t("deepCleanup.physEquilibrium") + " (x=0)",',
        'ctx.fillText("วัตถุ", objX - 12,': 'ctx.fillText(t("deepCleanup.physObject"), objX - 12,',
        'ctx.fillText(v > 0 ? "ภาพจริง" : "ภาพเสมือน"': 'ctx.fillText(v > 0 ? t("deepCleanup.physRealImage") : t("deepCleanup.physVirtualImage")',
        'imgType: v > 0 ? "จริง" : "เสมือน"': 'imgType: v > 0 ? t("deepCleanup.physRealImage") : t("deepCleanup.physVirtualImage")',
        'ctx.fillText("แสงขาว"': 'ctx.fillText(t("deepCleanup.physWhiteLight")',
        'ctx.fillText("เส้นปกติ (Normal)"': 'ctx.fillText(t("deepCleanup.physNormalLine")',
        'ctx.fillText("⚠ สะท้อนกลับหมด (Total Internal Reflection)"': 'ctx.fillText(t("deepCleanup.physTotalReflection")',
        'ctx.fillText("🔍 แว่นขยาย (Zoom)"': 'ctx.fillText(t("deepCleanup.physZoom")',
        'imgType === "จริง"': 'imgType === t("deepCleanup.physRealImage")',
        'info.tir ? "สะท้อนกลับหมด" : "หักเหปกติ"': 'info.tir ? t("deepCleanup.physTotalReflection") : (language === "th" ? "หักเหปกติ" : "Refraction")',
        'netTorque === 0 ? "สมดุล" : "ไม่สมดุล"': 'info.netTorque === 0 ? t("deepCleanup.physEquilibrium") : (language === "th" ? "ไม่สมดุล" : "Not Equilibrium")',
    }
    for k, v in reps.items(): content = content.replace(k, v)
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_math_table():
    for f in ['Client/src/components/MathToolWidget.jsx', 'Client/src/components/TableWidget.jsx']:
        with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
        content = insert_use_i18n(content, f.split('/')[-1].split('.')[0])
        content = content.replace('ตกลง', '{t("deepCleanup.btnConfirm")}')
        content = content.replace('สร้าง', '{t("deepCleanup.btnCreate")}')
        with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

patch_canvas()
patch_physics()
patch_math_table()
print("Patched Phase 6 Part 3")
