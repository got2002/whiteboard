import os

th_path = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\i18n\locales\th.js"
en_path = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\i18n\locales\en.js"

with open(th_path, 'r', encoding='utf-8') as f:
    th = f.read()

with open(en_path, 'r', encoding='utf-8') as f:
    en = f.read()

th_addition = """  dialog: {
    confirm: "ยืนยัน",
    cancel: "ยกเลิก"
  },
  panel: {
    you: "(คุณ)",
    page: "หน้า",
    stopFollowing: "เลิกตามดู",
    follow: "ตามดู",
    followingIcon: "👁️ กำลังตาม",
    followIcon: "👁️ ตามดู",
    onlineUsers: "👥 ผู้ใช้ออนไลน์",
    hostGroup: "ผู้ดูแลกระดาน",
    clientGroup: "ผู้เข้าร่วม",
    emptyUsers: "ยังไม่มีผู้ใช้อื่น — แชร์ QR Code เพื่อเชิญ!",
    pages: "📄 หน้ากระดาน",
    dragToReorder: "ลากเพื่อสลับตำแหน่ง หรือคลิกเพื่อเปิดหน้า",
    deletePage: "ลบหน้านี้",
    speedSeconds: "ความเร็ว (วินาที):",
    addPage: "เพิ่มหน้า",
    text: "ข้อความ",
    shape: "รูปทรง",
    image: "รูปภาพ",
    sticker: "สติกเกอร์",
    layers: "เลเยอร์",
    noObjects: "ยังไม่มีวัตถุในหน้านี้",
    delete: "ลบ",
    permissionTitle: "🔐 จัดการสิทธิ์",
    pendingRequests: "คำขอรออนุมัติ",
    noRequests: "ไม่มีคำขอ",
    approve: "อนุมัติ",
    contributors: "ได้สิทธิ์เขียนแล้ว",
    noneYet: "ยังไม่มี",
    revoke: "ถอนสิทธิ์",
    viewers: "ผู้เข้าชม",
    noViewers: "ไม่มีผู้เข้าชม",
    grant: "ให้สิทธิ์",
    permDrawOnly: "วาดอย่างเดียว",
    permFullAccess: "เข้าถึงเต็มที่",
    permViewOnly: "ดูได้อย่างเดียว",
    scanToJoin: "สแกนเข้าร่วม",
    editColors: "แก้ไขสี (Edit colors)",
    basicColors: "สีพื้นฐาน (Basic colors)",
    customColors: "สีที่กำหนดเอง (Custom colors)",
    ok: "ตกลง (OK)",
    cancel: "ยกเลิก (Cancel)",
    close: "ปิด",
    colors: "สี"
  },
"""

en_addition = """  dialog: {
    confirm: "Confirm",
    cancel: "Cancel"
  },
  panel: {
    you: "(You)",
    page: "Page",
    stopFollowing: "Stop Following",
    follow: "Follow",
    followingIcon: "👁️ Following",
    followIcon: "👁️ Follow",
    onlineUsers: "👥 Online Users",
    hostGroup: "Hosts",
    clientGroup: "Participants",
    emptyUsers: "No other users yet — Share QR Code to invite!",
    pages: "📄 Pages",
    dragToReorder: "Drag to reorder or click to open",
    deletePage: "Delete this page",
    speedSeconds: "Speed (Seconds):",
    addPage: "Add Page",
    text: "Text",
    shape: "Shape",
    image: "Image",
    sticker: "Sticker",
    layers: "Layers",
    noObjects: "No objects on this page yet",
    delete: "Delete",
    permissionTitle: "🔐 Manage Permissions",
    pendingRequests: "Pending Requests",
    noRequests: "No requests",
    approve: "Approve",
    contributors: "Contributors",
    noneYet: "None yet",
    revoke: "Revoke",
    viewers: "Viewers",
    noViewers: "No viewers",
    grant: "Grant",
    permDrawOnly: "Draw Only",
    permFullAccess: "Full Access",
    permViewOnly: "View Only",
    scanToJoin: "Scan to Join",
    editColors: "Edit colors",
    basicColors: "Basic colors",
    customColors: "Custom colors",
    ok: "OK",
    cancel: "Cancel",
    close: "Close",
    colors: "Colors"
  },
"""

if 'panel: {' not in th:
    th = th.replace('  toolbox: {', th_addition + '  toolbox: {')
    en = en.replace('  toolbox: {', en_addition + '  toolbox: {')
    with open(th_path, 'w', encoding='utf-8') as f:
        f.write(th)
    with open(en_path, 'w', encoding='utf-8') as f:
        f.write(en)
    print("Dictionaries added.")
else:
    print("Dictionaries already present.")
