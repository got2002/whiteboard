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

def patch_screenshot():
    f = 'Client/src/components/ScreenshotOverlay.jsx'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    content = insert_use_i18n(content, 'ScreenshotOverlay')
    content = content.replace('เลือกใหม่', '{t("deepCleanup.screenshotRetake")}')
    content = content.replace('บันทึกลงเครื่อง', '{t("deepCleanup.screenshotSave")}')
    content = content.replace('✕ ยกเลิก', '{t("deepCleanup.screenshotCancel")}')
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_permission_btn():
    f = 'Client/src/components/PermissionButton.jsx'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    content = insert_use_i18n(content, 'PermissionButton')
    content = content.replace('ขอสิทธิ์เขียน', '{t("deepCleanup.permissionReqWrite")}')
    content = content.replace('กำลังรอครูอนุมัติ...', '{t("deepCleanup.permissionWaiting")}')
    content = content.replace('❌ คำขอถูกปฏิเสธ', '{t("deepCleanup.permissionDenied")}')
    content = content.replace('🔄 ขอใหม่อีกครั้ง', '{t("deepCleanup.permissionRetry")}')
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_user_panel():
    f = 'Client/src/components/UserPanel.jsx'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    content = insert_use_i18n(content, 'UserPanel')
    # If there is hardcoded "ผู้ใช้", wait, that is actually in useCollaboration.js
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_use_collab():
    f = 'Client/src/feature/collaboration/useCollaboration.js'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../../i18n/i18n";\nimport { useState')
    pattern = re.compile(r'export function useCollaboration\(\s*\{[^}]*\}\s*\)\s*\{')
    match = pattern.search(content)
    if match and 'useI18n' not in content:
        content = content[:match.end()] + '\n  const { t } = useI18n();' + content[match.end():]
    content = content.replace('"ผู้ใช้"', 't("deepCleanup.userDefaultName")')
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_use_drawing():
    f = 'Client/src/feature/drawing/useDrawing.js'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../../i18n/i18n";\nimport { useState')
    pattern = re.compile(r'export function useDrawing\(\s*\{[^}]*\}\s*\)\s*\{')
    match = pattern.search(content)
    if match and 'const { t } = useI18n();' not in content:
        content = content[:match.end()] + '\n  const { t } = useI18n();' + content[match.end():]
    content = content.replace('prompt("ข้อความ:")', 'prompt(t("deepCleanup.aiPromptText"))')
    content = content.replace('prompt("ขนาดตัวอักษร (px):", "20")', 'prompt(t("deepCleanup.aiPromptSize"), "20")')
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

def patch_use_recording():
    f = 'Client/src/hooks/useRecording.js'
    with codecs.open(f, 'r', 'utf-8') as file: content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../i18n/i18n";\nimport { useState')
    pattern = re.compile(r'export function useRecording\(\s*[^)]*\s*\)\s*\{')
    match = pattern.search(content)
    if match and 'const { t } = useI18n();' not in content:
        content = content[:match.end()] + '\n  const { t } = useI18n();' + content[match.end():]
        
    content = content.replace('alert("การบันทึกถูกปฏิเสธ — กรุณาอนุญาตการเข้าถึงหน้าจอและไมโครโฟน");', 'alert(t("deepCleanup.recordDenied"));')
    content = content.replace('alert("ไม่สามารถเริ่มบันทึกได้: " + err.message);', 'alert(t("deepCleanup.recordError") + err.message);')
    with codecs.open(f, 'w', 'utf-8') as file: file.write(content)

patch_screenshot()
patch_permission_btn()
patch_user_panel()
patch_use_collab()
patch_use_drawing()
patch_use_recording()
print("Patched Phase 6 Part 2")
