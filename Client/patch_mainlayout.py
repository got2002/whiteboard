import os

th_path = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\i18n\locales\th.js"
en_path = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\i18n\locales\en.js"

with open(th_path, 'r', encoding='utf-8') as f:
    th = f.read()

with open(en_path, 'r', encoding='utf-8') as f:
    en = f.read()

th_new = """    followingUser: "กำลังตามดู",
    stop: "หยุด",
    goToWritingPoint: "ไปที่จุดที่มีคนกำลังเขียน",
    focus: "โฟกัส",
    viewOnlyMode: "โหมดดูอย่างเดียว (View Only)",
    hideToolbar: "ซ่อนเครื่องมือ",
    showToolbar: "แสดงเครื่องมือ",
    sendToAI: "ส่งให้ AI วิเคราะห์",
"""

en_new = """    followingUser: "Following",
    stop: "Stop",
    goToWritingPoint: "Go to active drawing point",
    focus: "Focus",
    viewOnlyMode: "View Only Mode",
    hideToolbar: "Hide Toolbar",
    showToolbar: "Show Toolbar",
    sendToAI: "Send to AI",
"""

if 'followingUser:' not in th:
    th = th.replace('colors: "สี"', 'colors: "สี",\n' + th_new)
    en = en.replace('colors: "Colors"', 'colors: "Colors",\n' + en_new)

    th = th.replace('cancel: "ยกเลิก"', 'cancel: "ยกเลิก",\n    newBoardTitle: "สร้างกระดานใหม่",\n    newBoardMsg: "กระดานปัจจุบันจะถูกลบทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?"')
    en = en.replace('cancel: "Cancel"', 'cancel: "Cancel",\n    newBoardTitle: "New Board",\n    newBoardMsg: "The current board will be cleared. Do you want to continue?"')

    with open(th_path, 'w', encoding='utf-8') as f:
        f.write(th)

    with open(en_path, 'w', encoding='utf-8') as f:
        f.write(en)

layout_path = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\layouts\MainLayout.jsx"
with open(layout_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "useI18n" not in content:
    content = content.replace('import { socket } from "../core/socket";', 'import { socket } from "../core/socket";\nimport { useI18n } from "../i18n/i18n";')
    content = content.replace('export default function MainLayout() {', 'export default function MainLayout() {\n  const { t } = useI18n();')

content = content.replace('👁️ กำลังตามดู: ', '👁️ {t("panel.followingUser")}: ')
content = content.replace('✕ หยุด', '✕ {t("panel.stop")}')
content = content.replace('title="ไปที่จุดที่มีคนกำลังเขียน"', 'title={t("panel.goToWritingPoint")}')
content = content.replace('🎯 โฟกัส', '🎯 {t("panel.focus")}')
content = content.replace('👁️ โหมดดูอย่างเดียว (View Only)', '👁️ {t("panel.viewOnlyMode")}')
content = content.replace('title={showToolbars ? "ซ่อนเครื่องมือ" : "แสดงเครื่องมือ"}', 'title={showToolbars ? t("panel.hideToolbar") : t("panel.showToolbar")}')
content = content.replace('ซ่อนเครื่องมือ\n            </>', '{t("panel.hideToolbar")}\n            </>')
content = content.replace('แสดงเครื่องมือ\n            </>', '{t("panel.showToolbar")}\n            </>')
content = content.replace('title="สร้างกระดานใหม่"', 'title={t("dialog.newBoardTitle")}')
content = content.replace('message="กระดานปัจจุบันจะถูกลบทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?"', 'message={t("dialog.newBoardMsg")}')
content = content.replace('confirmText="ส่งให้ AI วิเคราะห์"', 'confirmText={t("panel.sendToAI")}')

with open(layout_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("MainLayout patched.")
