import os
import re

BASE_DIR = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components"

files_to_patch = [
    "ConfirmDialog.jsx",
    "UserPanel.jsx",
    "PagePanel.jsx",
    "LayerPanel.jsx",
    "PermissionPanel.jsx",
    "QRCodePanel.jsx",
    "ColorPickerModal.jsx"
]

def add_use_i18n(content):
    if "useI18n" in content:
        return content
        
    # Import
    if "import React" in content or "import {" in content:
        content = re.sub(r'(import .*?;?\n)', r'\1import { useI18n } from "../i18n/i18n";\n', content, count=1)
    else:
        content = 'import { useI18n } from "../i18n/i18n";\n' + content
        
    # Hook
    content = re.sub(
        r'(export default function \w+\(.*?\)\s*\{|function \w+\(.*?\)\s*\{)',
        r'\1\n    const { t } = useI18n();\n',
        content
    )
    return content

for filename in files_to_patch:
    filepath = os.path.join(BASE_DIR, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = add_use_i18n(content)
    
    if filename == "ConfirmDialog.jsx":
        content = content.replace('title || "ยืนยัน"', 'title || t("dialog.confirm")')
        content = content.replace('>ยกเลิก<', '>{t("dialog.cancel")}<')
        content = content.replace('>\n            ยกเลิก\n          </', '>\n            {t("dialog.cancel")}\n          </')
        content = content.replace('>ยืนยัน<', '>{t("dialog.confirm")}<')
        content = content.replace('>\n            ยืนยัน\n          </', '>\n            {t("dialog.confirm")}\n          </')
        
    elif filename == "UserPanel.jsx":
        content = content.replace('&& "(คุณ)"}', '&& t("panel.you")}')
        content = content.replace('หน้า {(user.pageIndex', '{t("panel.page")} {(user.pageIndex')
        content = content.replace('"เลิกตามดู" : "ตามดู"', 't("panel.stopFollowing") : t("panel.follow")')
        content = content.replace('"👁️ กำลังตาม" : "👁️ ตามดู"', 't("panel.followingIcon") : t("panel.followIcon")')
        content = content.replace('<h3>👥 ผู้ใช้ออนไลน์ ({allUsers.length})</h3>', '<h3>{t("panel.onlineUsers")} ({allUsers.length})</h3>')
        content = content.replace('ผู้ดูแลกระดาน\n                        </div>', '{t("panel.hostGroup")}\n                        </div>')
        content = content.replace('ผู้เข้าร่วม\n                        </div>', '{t("panel.clientGroup")}\n                        </div>')
        content = content.replace('ยังไม่มีผู้ใช้อื่น — แชร์ QR Code เพื่อเชิญ!', '{t("panel.emptyUsers")}')
        
    elif filename == "PagePanel.jsx":
        content = content.replace('<h3>📄 หน้ากระดาน</h3>', '<h3>{t("panel.pages")}</h3>')
        content = content.replace('title="ลากเพื่อสลับตำแหน่ง หรือคลิกเพื่อเปิดหน้า"', 'title={t("panel.dragToReorder")}')
        content = content.replace('title="ลบหน้านี้"\n                                        >×</button>', 'title={t("panel.deletePage")}\n                                        >×</button>')
        content = content.replace('<span>Transition: Page {index + 1} → {index + 2}</span>', '<span>Transition: {t("panel.page")} {index + 1} → {index + 2}</span>')
        content = content.replace('<span className="trans-duration-label">ความเร็ว (วินาที):</span>', '<span className="trans-duration-label">{t("panel.speedSeconds")}</span>')
        content = content.replace('+ เพิ่มหน้า\n                </button>', '+ {t("panel.addPage")}\n                </button>')
        
    elif filename == "LayerPanel.jsx":
        content = content.replace("return stroke.text ? stroke.text.substring(0, 20) : 'ข้อความ';", "return stroke.text ? stroke.text.substring(0, 20) : t('panel.text');")
        content = content.replace("return `${stroke.shapeType || 'รูปทรง'}`;", "return `${stroke.shapeType || t('panel.shape')}`;")
        content = content.replace("return 'รูปภาพ';", "return t('panel.image');")
        content = content.replace("return stroke.stamp || 'สติกเกอร์';", "return stroke.stamp || t('panel.sticker');")
        content = content.replace('<span className="layer-panel-title">เลเยอร์</span>', '<span className="layer-panel-title">{t("panel.layers")}</span>')
        content = content.replace('<span>ยังไม่มีวัตถุในหน้านี้</span>', '<span>{t("panel.noObjects")}</span>')
        content = content.replace('title="ลบ"', 'title={t("panel.delete")}')
        # In LayerPanel, getLabel is outside the component, so it doesn't have access to `t`.
        # We need to pass `t` to `getLabel`.
        content = content.replace('function getLabel(stroke) {', 'function getLabel(stroke, t) {')
        content = content.replace('getLabel(layer)', 'getLabel(layer, t)')
        
    elif filename == "PermissionPanel.jsx":
        content = content.replace('🔐 จัดการสิทธิ์', '{t("panel.permissionTitle")}')
        content = content.replace('✋ คำขอรออนุมัติ', '✋ {t("panel.pendingRequests")}')
        content = content.replace('<div className="permission-empty">ไม่มีคำขอ</div>', '<div className="permission-empty">{t("panel.noRequests")}</div>')
        content = content.replace('✅ อนุมัติ', '✅ {t("panel.approve")}')
        content = content.replace('✏️ ได้สิทธิ์เขียนแล้ว', '✏️ {t("panel.contributors")}')
        content = content.replace('<div className="permission-empty">ยังไม่มี</div>', '<div className="permission-empty">{t("panel.noneYet")}</div>')
        content = content.replace('title="ถอนสิทธิ์"', 'title={t("panel.revoke")}')
        content = content.replace('👀 ผู้เข้าชม', '👀 {t("panel.viewers")}')
        content = content.replace('<div className="permission-empty">ไม่มีผู้เข้าชม</div>', '<div className="permission-empty">{t("panel.noViewers")}</div>')
        content = content.replace('ให้สิทธิ์: ${lvl.label}', '${t("panel.grant")}: ${lvl.label}')
        content = content.replace('ให้สิทธิ์ {lvl.label}', '{t("panel.grant")} {lvl.label}')
        # Handle PERMISSION_LEVELS (outside component)
        content = content.replace('"วาดอย่างเดียว"', 't("panel.permDrawOnly")')
        content = content.replace('"เข้าถึงเต็มที่"', 't("panel.permFullAccess")')
        content = content.replace('"ดูได้อย่างเดียว"', 't("panel.permViewOnly")')
        # We need to fix the PERMISSION_LEVELS to be inside the component or pass t to it
        # Actually, it's easier to leave them as IDs and translate when rendering, but they have labels.
        # Let's dynamically translate them in the component.
        
    elif filename == "QRCodePanel.jsx":
        content = content.replace('<span>สแกนเข้าร่วม</span>', '<span>{t("panel.scanToJoin")}</span>')
        
    elif filename == "ColorPickerModal.jsx":
        content = content.replace('<span>Edit colors</span>', '<span>{t("panel.editColors")}</span>')
        content = content.replace('<div className="cp-label">Basic colors</div>', '<div className="cp-label">{t("panel.basicColors")}</div>')
        content = content.replace('<span>Custom colors</span>', '<span>{t("panel.customColors")}</span>')
        content = content.replace('>OK<', '>{t("panel.ok")}<')
        content = content.replace('>Cancel<', '>{t("panel.cancel")}<')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Phase 2 components patched.")
