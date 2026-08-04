import re
import codecs

th_append = """  },
  deepCleanup: {
    tooltipPen: 'ปากกา',
    tooltipHighlighter: 'ปากกาเน้นข้อความ',
    tooltipEraser: 'ยางลบ',
    tooltipText: 'ข้อความ',
    tooltipSelect: 'เลือก/ย้าย (V)',
    tooltipPan: 'เลื่อนกระดาน (M/2 นิ้ว)',
    tooltipLine: 'เส้นตรง',
    tooltipRect: 'สี่เหลี่ยม',
    tooltipCircle: 'วงกลม',
    tooltipLaser: 'เลเซอร์ชี้',
    tooltipUndo: 'เลิกทำ (Ctrl+Z)',
    tooltipRedo: 'ทำซ้ำ (Ctrl+Y)',
    tooltipClear: 'ลบทั้งหมด',
    tooltipSave: 'บันทึก',
    tooltipOpen: 'เปิดไฟล์',
    tooltipColorMore: 'เลือกสีเพิ่มเติม',
    tooltipColorMoreFull: 'เลือกสีเพิ่มเติม (16 ล้านสี)',
    tooltipBold: 'ตัวหนา',
    tooltipItalic: 'ตัวเอียง',
    tooltipUnderline: 'ขีดเส้นใต้',
    tooltipWebcam: 'เปิด/ปิดกล้อง (Webcam)',
    tooltipRecordStart: 'บันทึกหน้าจอ (Record)',
    tooltipRecordStop: 'หยุดบันทึก (Stop Record)',
    tooltipUsers: 'ผู้ใช้ออนไลน์',
    tooltipHelp: 'ช่วยเหลือ',
    
    placeholderText: 'พิมพ์ข้อความ...',
    btnOk: '✓ ตกลง',
    aiListening: 'กำลังฟังเสียง...',
    aiTranscribing: 'กำลังแปลงเสียงเป็นข้อความ...',
    aiConverting: 'กำลังแปลงเป็นข้อความ...',
    aiMicConnecting: 'กำลังเชื่อมต่อไมโครโฟน...',
    aiNoVoice: 'ไม่ได้ยินเสียง หรือไม่มีข้อความ',
    aiRecording: 'กำลังบันทึกเสียง... (คลิกอีกครั้งเพื่อหยุด)',
    aiMicError: 'ไม่สามารถเข้าถึงไมโครโฟนได้: ',
    aiPromptText: 'ข้อความ:',
    aiPromptSize: 'ขนาดตัวอักษร (px):',
    recordDenied: 'การบันทึกถูกปฏิเสธ — กรุณาอนุญาตการเข้าถึงหน้าจอและไมโครโฟน',
    recordError: 'ไม่สามารถเริ่มบันทึกได้: ',

    permissionReqWrite: 'ขอสิทธิ์เขียน',
    permissionWaiting: 'กำลังรอครูอนุมัติ...',
    permissionDenied: '❌ คำขอถูกปฏิเสธ',
    permissionRetry: '🔄 ขอใหม่อีกครั้ง',
    screenshotRetake: 'เลือกใหม่',
    screenshotSave: 'บันทึกรูปลงเครื่อง',
    screenshotCancel: '✕ ยกเลิก',
    userDefaultName: 'ผู้ใช้',
    
    physEquilibrium: 'สมดุล',
    physRealImage: 'ภาพจริง',
    physVirtualImage: 'ภาพเสมือน',
    physWhiteLight: 'แสงขาว',
    physNormalLine: 'เส้นปกติ (Normal)',
    physTotalReflection: '⚠ สะท้อนกลับหมด (Total Internal Reflection)',
    physObject: 'วัตถุ',
    physZoom: '🔍 แว่นขยาย (Zoom)',
    
    btnCreate: 'สร้าง',
    btnConfirm: 'ตกลง',
    
    modeTestTube: 'หลอดทดลอง',
    modeFlask: 'ขวดกลั่น',
    modeMicroscope: 'กล้องจุลทรรศน์',
    modeMagnet: 'แม่เหล็ก',
    modeAtom: 'อะตอม',
    modeThermometer: 'เทอร์โมมิเตอร์',
    modeBulb: 'หลอดไฟ',
    modeBattery: 'แบตเตอรี่',
    modeElectricity: 'ไฟฟ้า',
    modeEarth: 'โลก',
    modeSun: 'ดวงอาทิตย์',
    modeSaturnRing: 'วงแหวนดาวเสาร์',
    modePerson: 'หุ่นคน (Person)',
    modeHeart: 'หัวใจ (Heart)',
    modeStar: 'ดาว (Star)',
    modeCorrect: 'ถูกต้อง (Correct)',
    modeWrong: 'ผิด (Wrong)',
    modeIdea: 'ไอเดีย (Idea)',
    mode100: 'เต็มร้อย (100)',
    modeTrophy: 'ถ้วยรางวัล (Trophy)',
    modeMoon: 'ดวงจันทร์',
    modeDrop: 'หยดน้ำ',
    modeFire: 'ไฟ',
    modePetri: 'จานเพาะเชื้อ'
  }
};
"""

en_append = """  },
  deepCleanup: {
    tooltipPen: 'Pen',
    tooltipHighlighter: 'Highlighter',
    tooltipEraser: 'Eraser',
    tooltipText: 'Text',
    tooltipSelect: 'Select/Move (V)',
    tooltipPan: 'Pan Board (M/2 Fingers)',
    tooltipLine: 'Line',
    tooltipRect: 'Rectangle',
    tooltipCircle: 'Circle',
    tooltipLaser: 'Laser Pointer',
    tooltipUndo: 'Undo (Ctrl+Z)',
    tooltipRedo: 'Redo (Ctrl+Y)',
    tooltipClear: 'Clear All',
    tooltipSave: 'Save',
    tooltipOpen: 'Open File',
    tooltipColorMore: 'More Colors',
    tooltipColorMoreFull: 'More Colors (16 Million)',
    tooltipBold: 'Bold',
    tooltipItalic: 'Italic',
    tooltipUnderline: 'Underline',
    tooltipWebcam: 'Toggle Webcam',
    tooltipRecordStart: 'Start Record',
    tooltipRecordStop: 'Stop Record',
    tooltipUsers: 'Online Users',
    tooltipHelp: 'Help',
    
    placeholderText: 'Type message...',
    btnOk: '✓ OK',
    aiListening: 'Listening...',
    aiTranscribing: 'Transcribing voice...',
    aiConverting: 'Converting to text...',
    aiMicConnecting: 'Connecting to microphone...',
    aiNoVoice: 'No voice detected or no message',
    aiRecording: 'Recording... (Click again to stop)',
    aiMicError: 'Microphone access denied: ',
    aiPromptText: 'Text:',
    aiPromptSize: 'Font size (px):',
    recordDenied: 'Recording denied — Please allow screen and microphone access',
    recordError: 'Failed to start recording: ',

    permissionReqWrite: 'Request Edit',
    permissionWaiting: 'Waiting for teacher...',
    permissionDenied: '❌ Request Denied',
    permissionRetry: '🔄 Try Again',
    screenshotRetake: 'Retake',
    screenshotSave: 'Save to Device',
    screenshotCancel: '✕ Cancel',
    userDefaultName: 'User',
    
    physEquilibrium: 'Equilibrium',
    physRealImage: 'Real Image',
    physVirtualImage: 'Virtual Image',
    physWhiteLight: 'White Light',
    physNormalLine: 'Normal Line',
    physTotalReflection: '⚠ Total Internal Reflection',
    physObject: 'Object',
    physZoom: '🔍 Zoom',
    
    btnCreate: 'Create',
    btnConfirm: 'OK',
    
    modeTestTube: 'Test Tube',
    modeFlask: 'Flask',
    modeMicroscope: 'Microscope',
    modeMagnet: 'Magnet',
    modeAtom: 'Atom',
    modeThermometer: 'Thermometer',
    modeBulb: 'Bulb',
    modeBattery: 'Battery',
    modeElectricity: 'Electricity',
    modeEarth: 'Earth',
    modeSun: 'Sun',
    modeSaturnRing: 'Saturn Ring',
    modePerson: 'Person',
    modeHeart: 'Heart',
    modeStar: 'Star',
    modeCorrect: 'Correct',
    modeWrong: 'Wrong',
    modeIdea: 'Idea',
    mode100: '100 Score',
    modeTrophy: 'Trophy',
    modeMoon: 'Moon',
    modeDrop: 'Water Drop',
    modeFire: 'Fire',
    modePetri: 'Petri Dish'
  }
};
"""

def append_to_file(filepath, append_str):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()

    # Find the last `  }\n};` and replace it
    if content.endswith('  }\n};\n'):
        content = content[:-7] + append_str
    elif content.endswith('  }\n};'):
        content = content[:-6] + append_str
    elif '    }\n  }\n};\n' in content:
        # nested
        content = content.replace('    }\n  }\n};\n', '    }\n' + append_str)
    elif '    }\n  }\n};' in content:
        content = content.replace('    }\n  }\n};', '    }\n' + append_str)
    else:
        # Regex to find the last `  }\n};` or similar
        content = re.sub(r'    \}\n  \}\n\};\s*$', '    }\n' + append_str, content)

    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(content)

append_to_file('Client/src/i18n/locales/th.js', th_append)
append_to_file('Client/src/i18n/locales/en.js', en_append)
print("Done")
