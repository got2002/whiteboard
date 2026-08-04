import os
import re

components_dir = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components"
hooks_dir = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\hooks"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def patch_file(path, replacements, func_name=None):
    if not os.path.exists(path): return
    content = read_file(path)
    
    if func_name and "useI18n" not in content:
        if func_name == "useFileOps":
            import_stmt = 'import { useI18n } from "../i18n/i18n";\n'
        else:
            import_stmt = 'import { useI18n } from "../i18n/i18n";\n'
            
        content = import_stmt + content
        
        pattern = re.compile(r'(export\s+function\s+' + func_name + r'\s*\([^)]*\)\s*\{|function\s+' + func_name + r'\s*\([^)]*\)\s*\{)', re.MULTILINE | re.DOTALL)
        content = pattern.sub(r'\1\n    const { t } = useI18n();', content)
        
        pattern2 = re.compile(r'(const\s+' + func_name + r'\s*=\s*\([^)]*\)\s*=>\s*\{)', re.MULTILINE | re.DOTALL)
        content = pattern2.sub(r'\1\n    const { t } = useI18n();', content)

    for old, new in replacements:
        content = content.replace(old, new)
        
    write_file(path, content)


# --- AiSolutionWidget.jsx ---
ai_reps = [
    ('label: "อธิบาย", prompt: "อธิบายเนื้อหาในภาพนี้อย่างละเอียด", promptNoImage: "อธิบายเรื่อง: "', 'label: t("widget.explain"), prompt: t("widget.explainPrompt"), promptNoImage: t("widget.explainPrompt")'),
    ('label: "สรุป", prompt: "สรุปเนื้อหาในภาพนี้ให้กระชับ", promptNoImage: "สรุปเรื่อง: "', 'label: t("widget.summarize"), prompt: t("widget.summarizePrompt"), promptNoImage: t("widget.summarizePrompt")'),
    ('label: "สร้างคำถาม", prompt: "สร้างคำถาม 5 ข้อจากเนื้อหาในภาพนี้ พร้อมเฉลย", promptNoImage: "สร้างคำถาม 5 ข้อเกี่ยวกับ: "', 'label: t("widget.quiz"), prompt: t("widget.quizPrompt"), promptNoImage: t("widget.quizPrompt")'),
    ('label: "แนะนำ", prompt: "แนะนำแนวทางการสอนเนื้อหาในภาพนี้", promptNoImage: "แนะนำแนวทางสอนเรื่อง: "', 'label: t("widget.suggest"), prompt: t("widget.suggestPrompt"), promptNoImage: t("widget.suggestPrompt")'),
    ('label: "วิเคราะห์", prompt: "วิเคราะห์เนื้อหาในภาพนี้", promptNoImage: "วิเคราะห์เรื่อง: "', 'label: t("widget.analyze"), prompt: t("widget.analyzePrompt"), promptNoImage: t("widget.analyzePrompt")'),
    ('label: "ตรวจ", prompt: "ตรวจสอบความถูกต้องของเนื้อหาในภาพนี้", promptNoImage: "ตรวจสอบ: "', 'label: t("widget.check"), prompt: t("widget.checkPrompt"), promptNoImage: t("widget.checkPrompt")'),
    ('message: "AI กำลังยุ่งหรือเซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ครับ"', 'message: t("widget.aiBusyErr")'),
    ('message: "AI กำลังยุ่งหรือเซิร์ฟเวอร์แปลภาษามีปัญหา กรุณาลองใหม่ครับ"', 'message: t("widget.translateErr")'),
    ('title={isMinimized ? "ขยาย" : "ย่อ"}', 'title={isMinimized ? t("widget.expand") : t("widget.collapse")}'),
    ('title="ปิด AI Solution"', 'title={t("widget.closeAi")}'),
    ('<span>สร้างเนื้อหา</span>', '<span>{t("widget.generateContent")}</span>'),
    ('<span>แปลภาษา</span>', '<span>{t("widget.translateContent")}</span>'),
    ('title="จับภาพจากกระดาน"', 'title={t("widget.captureBoardTooltip")}'),
    ('<span>จับภาพกระดาน</span>', '<span>{t("widget.captureBoard")}</span>'),
    ('title="อัปโหลดรูปภาพ"', 'title={t("widget.uploadImgTooltip")}'),
    ('<span>อัปโหลดรูป</span>', '<span>{t("widget.uploadImg")}</span>'),
    ('title="ลบภาพ"', 'title={t("widget.deleteImg")}'),
    ('? "พิมพ์คำสั่ง... เช่น อธิบายเรื่องนี้, สร้างแบบฝึกหัด"', '? t("widget.promptPlaceholder")'),
    (': "พิมพ์ข้อความที่ต้องการแปล..."', ': t("widget.translatePlaceholder")'),
    ('<span>กำลังประมวลผล...</span>', '<span>{t("widget.processing")}</span>'),
    ('<span>{activeTab === "generate" ? "ส่งคำสั่ง" : "แปลภาษา"}</span>', '<span>{activeTab === "generate" ? t("widget.sendCmd") : t("widget.translate")}</span>'),
    ('<span>กำลังประมวลผล... กรุณารอสักครู่</span>', '<span>{t("widget.processingWait")}</span>'),
    ('<span>ผลลัพธ์</span>', '<span>{t("widget.result")}</span>'),
    ('title="คัดลอกผลลัพธ์"', 'title={t("widget.copyResult")}'),
    ('<span>คัดลอกแล้ว!</span>', '<span>{t("widget.copied")}</span>'),
    ('<span>คัดลอก</span>', '<span>{t("widget.copy")}</span>'),
    ('title="วางผลลัพธ์ลงบอร์ด"', 'title={t("widget.pasteBoardTooltip")}'),
    ('<span>วางลงบอร์ด</span>', '<span>{t("widget.pasteBoard")}</span>')
]
patch_file(os.path.join(components_dir, "AiSolutionWidget.jsx"), ai_reps, "AiSolutionWidget")

# --- BannerWidget.jsx ---
bn_reps = [
    ('{ id: "classic", label: "คลาสสิก",', '{ id: "classic", label: t("widget.classic"),'),
    ('{ id: "neon_red", label: "นีออนแดง",', '{ id: "neon_red", label: t("widget.neonRed"),'),
    ('{ id: "neon_blue", label: "นีออนฟ้า",', '{ id: "neon_blue", label: t("widget.neonBlue"),'),
    ('{ id: "neon_green", label: "นีออนเขียว",', '{ id: "neon_green", label: t("widget.neonGreen"),'),
    ('{ id: "sunset", label: "พระอาทิตย์",', '{ id: "sunset", label: t("widget.sunset"),'),
    ('{ id: "alert", label: "แจ้งเตือน",', '{ id: "alert", label: t("widget.alert"),'),
    ('{ id: "white", label: "สว่าง",', '{ id: "white", label: t("widget.bright"),'),
    ('{ id: "slow", label: "ช้า",', '{ id: "slow", label: t("widget.slow"),'),
    ('{ id: "normal", label: "ปกติ",', '{ id: "normal", label: t("widget.normal"),'),
    ('{ id: "fast", label: "เร็ว",', '{ id: "fast", label: t("widget.fast"),'),
    ('{ id: "very_fast", label: "เร็วมาก",', '{ id: "very_fast", label: t("widget.veryFast"),'),
    ('text || "ยินดีต้อนรับสู่ห้องเรียน 🎓"', 'text || t("widget.welcome")'),
    ('Banner อักษรวิ่ง', '{t("widget.bannerTitle")}'),
    ('title="ย่อแผงตั้งค่า (Banner ยังแสดงอยู่)"', 'title={t("widget.minimizeConfig")}'),
    ('title="ปิดทั้งหมด"', 'title={t("widget.closeAll")}'),
    ('ข้อความ</label>', '{t("widget.textLabel")}</label>'),
    ('placeholder="พิมพ์ข้อความที่ต้องการให้วิ่ง..."', 'placeholder={t("widget.textPlaceholder")}'),
    ('🎨 ธีมสี', '{t("widget.themeColor")}'),
    ('⚡ ความเร็ว', '{t("widget.speed")}'),
    ('🔤 ขนาดตัวอักษร', '{t("widget.fontSize")}'),
    ('📍 ตำแหน่ง', '{t("widget.position")}'),
    ('label: "▲ ด้านบน"', 'label: t("widget.posTop")'),
    ('label: "▼ ด้านล่าง"', 'label: t("widget.posBottom")'),
    ('{text || "พิมพ์ข้อความ..."}', '{text || t("widget.exampleText")}'),
    ('ตัวอย่าง</div>', '{t("widget.exampleLabel")}</div>'),
    ('{isShowing ? "⏹ ปิด Banner" : "▶ แสดง Banner"}', '{isShowing ? t("widget.stopBanner") : t("widget.playBanner")}')
]
patch_file(os.path.join(components_dir, "BannerWidget.jsx"), bn_reps, "BannerWidget")

# --- CalculatorWidget.jsx ---
cal_reps = [
    ('title="ปิดเครื่องคิดเลข"', 'title={t("widget.closeCalc")}'),
    ('title="ล้างประวัติ"', 'title={t("widget.clearHistory")}')
]
patch_file(os.path.join(components_dir, "CalculatorWidget.jsx"), cal_reps, "CalculatorWidget")

# --- MathToolWidget.jsx ---
mt_reps = [
    ('title="หมุน +15°"', 'title={t("widget.rotatePlus15")}'),
    ('title="หมุน -15°"', 'title={t("widget.rotateMinus15")}'),
    ('title="วาดวงกลมเต็มวง"', 'title={t("widget.drawFullCircle")}'),
    ('title="วาดส่วนโค้ง"', 'title={t("widget.drawArc")}'),
    ('title="ลดรัศมี"', 'title={t("widget.decreaseRadius")}'),
    ('title="เพิ่มรัศมี"', 'title={t("widget.increaseRadius")}'),
    ('title="เปลี่ยนรูปทรง 3 มิติ"', 'title={t("widget.change3DShape")}'),
    ('title="แก้ไขชื่อ"', 'title={t("widget.editName")}'),
    ('title="ลดจำนวนช่อง"', 'title={t("widget.decreaseSlot")}'),
    ('title="เพิ่มจำนวนช่อง"', 'title={t("widget.increaseSlot")}'),
    ('title="หมุนวงล้อ"', 'title={t("widget.spinWheel")}'),
    ('title="+1 ชม."', 'title={t("widget.add1Hour")}'),
    ('title="+5 นาที"', 'title={t("widget.add5Min")}'),
    ('title="เพิ่ม 1 นาที"', 'title={t("widget.add1Min")}'),
    ('title="ลด 1 นาที"', 'title={t("widget.sub1Min")}'),
    ('title="เพิ่ม 10 วินาที"', 'title={t("widget.add10Sec")}'),
    ('title="ลด 10 วินาที"', 'title={t("widget.sub10Sec")}'),
    ('title="ปิด"', 'title={t("widget.closeTool")}'),
    ('แก้ไขชื่อ (1 บรรทัดต่อ 1 ช่อง)', '{t("widget.editNameDesc")}'),
    ('ตกลง</button>', '{t("widget.ok")}</button>'),
    ('title="หมุนเครื่องมือ"', 'title={t("widget.rotateTool")}')
]
patch_file(os.path.join(components_dir, "MathToolWidget.jsx"), mt_reps, "MathToolWidget")

# --- TableWidget.jsx ---
tw_reps = [
    ('name: "ไม่มี"', 'name: t("widget.none")'),
    ('name: "ฟ้าคลาสสิก"', 'name: t("widget.blueClassic")'),
    ('name: "มืดโปร"', 'name: t("widget.darkPro")'),
    ('name: "เขียวมรกต"', 'name: t("widget.emeraldGreen")'),
    ('name: "ส้มอุ่น"', 'name: t("widget.warmOrange")'),
    ('name: "ม่วงสง่า"', 'name: t("widget.elegantPurple")'),
    ('name: "มินิมอล"', 'name: t("widget.minimal")'),
    ('สร้างตาราง</div>', '{t("widget.createTable")}</div>'),
    ('กำหนดเอง</div>', '{t("widget.customLabel")}</div>'),
    ('placeholder="แถว"', 'placeholder={t("widget.rows")}'),
    ('placeholder="คอลัมน์"', 'placeholder={t("widget.cols")}'),
    ('สร้าง</button>', '{t("widget.create")}</button>'),
    ('title="ตัวหนา"', 'title={t("widget.bold")}'),
    ('title="ตัวเอียง"', 'title={t("widget.italic")}'),
    ('title="ขีดเส้นใต้"', 'title={t("widget.underline")}'),
    ('title="ชิดซ้าย"', 'title={t("widget.alignLeft")}'),
    ('title="กึ่งกลาง"', 'title={t("widget.alignCenter")}'),
    ('title="ชิดขวา"', 'title={t("widget.alignRight")}'),
    ('title="ขนาดตัวอักษร"', 'title={t("widget.fontSizeBtn")}'),
    ('title="สีพื้นหลัง"', 'title={t("widget.bgColor")}'),
    ('ทั้งแถว</button>', '{t("widget.wholeRow")}</button>'),
    ('title="สีตัวอักษร"', 'title={t("widget.textColor")}'),
    ('title="แทรกรูปในเซล"', 'title={t("widget.insertImg")}'),
    ('title="ลบรูปจากเซล"', 'title={t("widget.removeImg")}'),
    ('title="หัวตาราง"', 'title={t("widget.tableHeader")}'),
    ('title="แถวสลับสี"', 'title={t("widget.altRowColor")}'),
    ('title="ธีมตาราง"', 'title={t("widget.tableTheme")}'),
    ('title="เพิ่มแถวบน"', 'title={t("widget.addRowTop")}'),
    ('title="เพิ่มแถวล่าง"', 'title={t("widget.addRowBottom")}'),
    ('title="ลบแถว"', 'title={t("widget.delRow")}'),
    ('title="เพิ่มคอลัมน์ซ้าย"', 'title={t("widget.addColLeft")}'),
    ('title="เพิ่มคอลัมน์ขวา"', 'title={t("widget.addColRight")}'),
    ('title="ลบคอลัมน์"', 'title={t("widget.delCol")}'),
    ('title="ลบตาราง"', 'title={t("widget.delTable")}')
]
patch_file(os.path.join(components_dir, "TableWidget.jsx"), tw_reps, "TableWidget")

# --- VideoPlayerModal.jsx ---
vid_reps = [
    ('วิดีโอที่บันทึกไว้ (Recorded Video)', '{t("widget.recordedVideo")}'),
    ('ปิด (Close)', '{t("widget.closeVideo")}'),
    ('⬇️ ดาวน์โหลด (Download)', '{t("widget.downloadVideo")}')
]
patch_file(os.path.join(components_dir, "VideoPlayerModal.jsx"), vid_reps, "VideoPlayerModal")

# --- ScreenshotOverlay.jsx ---
so_reps = [
    ('เลือกใหม่</button>', '{t("overlay.selectNew")}</button>'),
    ('บันทึกลงเครื่อง</button>', '{t("overlay.saveToLocal")}</button>'),
    ('{onConfirm ? confirmText : "เพิ่มลงกระดาน"}', '{onConfirm ? confirmText : t("overlay.addToBoard")}'),
    ('<span>ลากเพื่อเลือกพื้นที่ที่ต้องการ Screenshot</span>', '<span>{t("overlay.dragToSelect")}</span>'),
    ('<span className="screenshot-instruction-sub">กด ESC เพื่อยกเลิก</span>', '<span className="screenshot-instruction-sub">{t("overlay.pressEscToCancel")}</span>'),
    ('✕ ยกเลิก</button>', '{t("overlay.cancel")}</button>')
]
patch_file(os.path.join(components_dir, "ScreenshotOverlay.jsx"), so_reps, "ScreenshotOverlay")

# --- PresentationMode.jsx ---
pm_reps = [
    ('label: "ไม่มี",', 'label: t("overlay.none"),')
]
patch_file(os.path.join(components_dir, "PresentationMode.jsx"), pm_reps, "PresentationMode")

# --- LockScreenOverlay.jsx ---
ls_reps = [
    ('alert("รหัสผ่านไม่ถูกต้อง!");', 'alert(t("overlay.wrongPin"));'),
    ('หน้าจอถูกล็อค</div>', '{t("overlay.screenLocked")}</div>'),
    ('? "กดปุ่มด้านล่างเพื่อปลดล็อค"', '? t("overlay.pressToUnlock")'),
    (': "กรุณารอผู้สอนปลดล็อค"}', ': t("overlay.waitToUnlock")}'),
    ('placeholder="ใส่รหัสผ่าน..."', 'placeholder={t("overlay.enterPin")}'),
    ('ยืนยัน</button>', '{t("overlay.confirm")}</button>'),
    ('ยกเลิก</button>', '{t("overlay.cancelLock")}</button>'),
    ('placeholder="ตั้งรหัสผ่าน..."', 'placeholder={t("overlay.setPin")}'),
    ('บันทึกรหัส</button>', '{t("overlay.savePin")}</button>'),
    ('ปลดล็อค</button>', '{t("overlay.unlock")}</button>'),
    ('{pin ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}', '{pin ? t("overlay.changePin") : t("overlay.createPin")}'),
    ('กด <kbd>ESC</kbd> เพื่อปลดล็อค', '<span dangerouslySetInnerHTML={{__html: t("overlay.escToUnlock")}}></span>')
]
patch_file(os.path.join(components_dir, "LockScreenOverlay.jsx"), ls_reps, "LockScreenOverlay")

# --- SpotlightOverlay.jsx ---
sp_reps = [
    ('title="วงกลม"', 'title={t("overlay.circle")}'),
    ('title="สี่เหลี่ยม"', 'title={t("overlay.square")}'),
    ('title={`ขนาด: ${r}px`}', 'title={`${t("overlay.sizePrefix")} ${r}px`}'),
    ('title={`ความมืด: ${Math.round(op * 100)}%`}', 'title={`${t("overlay.darknessPrefix")} ${Math.round(op * 100)}%`}'),
    ('title="ปิด Spotlight (ESC)"', 'title={t("overlay.closeSpotlight")}')
]
patch_file(os.path.join(components_dir, "SpotlightOverlay.jsx"), sp_reps, "SpotlightOverlay")

# --- ColorSidebar.jsx ---
cb_reps = [
    ('title: "พื้นขาว", group: "basic"', 'title: t("overlay.whiteBg"), group: "basic"'),
    ('title: "พื้นดำ", group: "basic"', 'title: t("overlay.blackBg"), group: "basic"'),
    ('title: "ตาราง", group: "basic"', 'title: t("overlay.grid"), group: "basic"'),
    ('title: "เส้นบรรทัด", group: "basic"', 'title: t("overlay.lined"), group: "basic"'),
    ('title: "จุด", group: "basic"', 'title: t("overlay.dotted"), group: "basic"'),
    ('title: "กราฟ", group: "basic"', 'title: t("overlay.graph"), group: "basic"'),
    ('title: "ไอโซเมตริก", group: "basic"', 'title: t("overlay.isometric"), group: "basic"'),
    ('title: "แกนพิกัด XY", group: "math"', 'title: t("overlay.coordinate"), group: "math"'),
    ('title: "กริดโพลาร์", group: "math"', 'title: t("overlay.polar"), group: "math"'),
    ('title: "ตารางสามเหลี่ยม", group: "math"', 'title: t("overlay.trigrid"), group: "math"'),
    ('title: "ตารางหมากรุก", group: "math"', 'title: t("overlay.checkerboard"), group: "math"'),
    ('title: "โมเลกุล / รังผึ้ง", group: "science"', 'title: t("overlay.hexagonal"), group: "science"'),
    ('title: "สมุดแล็บ", group: "science"', 'title: t("overlay.labnotebook"), group: "science"'),
    ('title: "กริดกากบาท", group: "science"', 'title: t("overlay.crossGrid"), group: "science"'),
    ('title: "บรรทัด 5 เส้น", group: "music"', 'title: t("overlay.musicLines"), group: "music"'),
    ('title: "คัดลายมือ", group: "writing"', 'title: t("overlay.calligraphy"), group: "writing"'),
    ('title: "ข้าวหลามตัด", group: "special"', 'title: t("overlay.diamond"), group: "special"'),
    ('title: "สนามบาส", group: "special"', 'title: t("overlay.basketball"), group: "special"'),
    ('title="ลากเพื่อย้ายตำแหน่ง (ดับเบิลคลิกเพื่อรีเซ็ต)"', 'title={t("overlay.dragToMove")}'),
    ('title="เลือกสีเพิ่มเติม"', 'title={t("overlay.moreColors")}'),
    ('title={`ขนาด: ${penSize}`}', 'title={`${t("overlay.sizePrefixSidebar")} ${penSize}`}'),
    ('title="เปลี่ยนพื้นหลัง"', 'title={t("overlay.changeBg")}'),
    ('label: "พื้นฐาน" }', 'label: t("overlay.groupBasic") }'),
    ('label: "🧮 คณิตศาสตร์" }', 'label: t("overlay.groupMath") }'),
    ('label: "🔬 วิทยาศาสตร์" }', 'label: t("overlay.groupScience") }'),
    ('label: "🎵 ดนตรี" }', 'label: t("overlay.groupMusic") }'),
    ('label: "✏️ เขียน / สอน" }', 'label: t("overlay.groupWriting") }'),
    ('label: "✨ พิเศษ" }', 'label: t("overlay.groupSpecial") }'),
    ('🎨 พื้นสี</div>', '{t("overlay.bgColorPalette")}</div>'),
    ('title={`พื้นสี ${c}`}', 'title={`${t("overlay.bgColorPrefix")} ${c}`}'),
    ('title="เลือกสีพื้นหลังเอง"', 'title={t("overlay.customBgColor")}')
]
patch_file(os.path.join(components_dir, "ColorSidebar.jsx"), cb_reps, "ColorSidebar")

# --- useFileOps.js ---
ufo_reps = [
    ('throw new Error("ไฟล์เสียหาย");', 'throw new Error(t("overlay.fileDamaged"));'),
    ('alert("ไฟล์ PD1 ไม่มีข้อมูลหน้ากระดาน");', 'alert(t("overlay.noBoardDataPD1"));'),
    ('alert("ไม่สามารถอ่านไฟล์ PD1 ได้: " + err.message);', 'alert(t("overlay.cannotReadPD1") + err.message);'),
    ('alert("ไฟล์ไม่มีข้อมูลหน้ากระดาน");', 'alert(t("overlay.noBoardDataGeneric"));'),
    ('alert("ไม่สามารถอ่านไฟล์ได้");', 'alert(t("overlay.cannotReadGeneric"));'),
    ('alert("ไฟล์ IWB ไม่มีข้อมูลหน้ากระดาน");', 'alert(t("overlay.noBoardDataIWB"));'),
    ('alert("ไม่สามารถอ่านไฟล์ IWB ได้");', 'alert(t("overlay.cannotReadIWB"));'),
    ('alert("ไฟล์วิดีโอมีขนาดใหญ่เกินไป (จำกัด 500MB) กรุณาใช้ไฟล์ที่เล็กกว่านี้เพื่อป้องกันแอปพลิเคชันค้างเวลาซิงค์ข้อมูลครับ");', 'alert(t("overlay.videoTooLarge"));'),
    ('alert("อัปโหลดวิดีโอไม่สำเร็จ");', 'alert(t("overlay.uploadVidFailed"));'),
    ('alert("เกิดข้อผิดพลาดในการอัปโหลดวิดีโอ");', 'alert(t("overlay.uploadVidError"));')
]
patch_file(os.path.join(hooks_dir, "useFileOps.js"), ufo_reps, "useFileOps")

print("Widgets patched!")
