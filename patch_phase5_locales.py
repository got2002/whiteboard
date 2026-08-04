import re
import codecs

th_append = """  },
  periodicTable: {
    title: '⚛ ตารางธาตุ',
    hideLegend: 'ซ่อนสัญลักษณ์',
    showLegend: 'แสดงสัญลักษณ์',
    lanthanides: 'กลุ่มแลนทาไนด์',
    actinides: 'กลุ่มแอกทิไนด์',
    category: 'หมวดหมู่',
    electronConfig: 'การจัดเรียงอิเล็กตรอน',
    stateRT: 'สถานะ (อุณหภูมิห้อง)',
    meltingPoint: 'จุดหลอมเหลว',
    boilingPoint: 'จุดเดือด',
    close: 'ปิด'
  },
  studentLab: {
    title: 'หน้าต่างห้องทดลองนักเรียน - ลากเพื่อย้ายตำแหน่ง'
  },
  webcam: {
    title: 'กล้องเว็บแคม',
    mute: 'ปิดไมค์',
    unmute: 'เปิดไมค์',
    close: 'ปิดกล้อง',
    mutedIndicator: 'ปิดไมค์อยู่'
  },
  videoWidget: {
    title: '🎬 วิดีโอ',
    captureTooltip: 'แคปหน้าจอวิดีโอแปะลงกระดาน',
    deleteTooltip: 'ลบวิดีโอ',
    autoplayBlocked: 'คลิกเพื่อเล่นวิดีโอ (รอการอนุญาตจากเบราว์เซอร์)'
  },
  physicsLab: {
    cat_motion: 'การเคลื่อนที่',
    cat_circuit: 'วงจรไฟฟ้า',
    cat_optics: 'แสง/เลนส์',
    cat_wave: 'คลื่น',
    cat_force: 'แรง/สมดุล',
    cat_instrument: 'เครื่องมือวัด',
    exp_freefall: 'ตกอิสระ',
    exp_projectile: 'โยนวัตถุ',
    exp_pendulum: 'ลูกตุ้ม',
    exp_spring: 'สปริง',
    exp_series: 'วงจรอนุกรม',
    exp_parallel: 'วงจรขนาน',
    exp_lens: 'เลนส์',
    exp_prism: 'ปริซึม',
    exp_snell: 'กฎสเนลล์',
    exp_transverse: 'คลื่นตามขวาง',
    exp_standing: 'คลื่นนิ่ง',
    exp_interference: 'การแทรกสอด',
    exp_inclined_plane: 'พื้นเอียง',
    exp_pulley: 'รอก (Atwood)',
    exp_seesaw: 'คานสมดุล',
    exp_vernier: 'เวอร์เนียร์คาลิปเปอร์',
    exp_micrometer: 'ไมโครมิเตอร์',
    slider_height: 'ความสูง',
    slider_gravity: 'แรงโน้มถ่วง (g)',
    slider_velocity: 'ความเร็วต้น (v₀)',
    slider_angle: 'มุม (θ)',
    slider_angleRelease: 'มุมปล่อย (θ₀)',
    slider_length: 'ความยาว (L)',
    slider_damping: 'แรงหน่วง',
    slider_k: 'ค่าสปริง (k)',
    slider_mass: 'มวล (m)',
    slider_displacement: 'การกระจัด (x₀)',
    slider_voltage: 'แรงดัน (V)',
    slider_r1: 'ตัวต้านทาน R₁',
    slider_r2: 'ตัวต้านทาน R₂',
    slider_focalLength: 'ความยาวโฟกัส',
    slider_objectDist: 'ระยะวัตถุ',
    slider_lensType: 'ชนิดเลนส์',
    slider_prismAngle: 'มุมปริซึม',
    slider_incidentAngle: 'มุมตกกระทบ',
    slider_refIndex: 'ดัชนีหักเห',
    slider_n1: 'ดัชนีหักเห n₁',
    slider_n2: 'ดัชนีหักเห n₂',
    slider_amplitude: 'แอมพลิจูด',
    slider_frequency: 'ความถี่',
    slider_wavelength: 'ความยาวคลื่น',
    slider_n: 'จำนวนลูป (n)',
    slider_separation: 'ระยะห่างแหล่งกำเนิด',
    slider_friction: 'สัมประสิทธิ์แรงเสียดทาน (μ)',
    slider_m1: 'มวล m₁',
    slider_m2: 'มวล m₂',
    slider_d1: 'ระยะ d₁',
    slider_d2: 'ระยะ d₂',
    param_lensType_convex: 'นูน',
    param_lensType_concave: 'เว้า',
    play: '▶ เล่น',
    pause: '⏸ พัก',
    reset: '🔄 เริ่มใหม่'
  }
};
"""

en_append = """  },
  periodicTable: {
    title: '⚛ Periodic Table',
    hideLegend: 'Hide Legend',
    showLegend: 'Show Legend',
    lanthanides: 'Lanthanides',
    actinides: 'Actinides',
    category: 'Category',
    electronConfig: 'Electron Config',
    stateRT: 'State (RT)',
    meltingPoint: 'Melting Point',
    boilingPoint: 'Boiling Point',
    close: 'Close'
  },
  studentLab: {
    title: 'Student Lab Window - Drag to move'
  },
  webcam: {
    title: 'Webcam',
    mute: 'Mute Microphone',
    unmute: 'Unmute Microphone',
    close: 'Close Camera',
    mutedIndicator: 'Muted'
  },
  videoWidget: {
    title: '🎬 Video',
    captureTooltip: 'Capture frame to whiteboard',
    deleteTooltip: 'Delete Video',
    autoplayBlocked: 'Click to play (waiting for browser permission)'
  },
  physicsLab: {
    cat_motion: 'Motion',
    cat_circuit: 'Circuit',
    cat_optics: 'Optics',
    cat_wave: 'Wave',
    cat_force: 'Force/Balance',
    cat_instrument: 'Instruments',
    exp_freefall: 'Free Fall',
    exp_projectile: 'Projectile',
    exp_pendulum: 'Pendulum',
    exp_spring: 'Spring',
    exp_series: 'Series',
    exp_parallel: 'Parallel',
    exp_lens: 'Lens',
    exp_prism: 'Prism',
    exp_snell: "Snell's Law",
    exp_transverse: 'Transverse Wave',
    exp_standing: 'Standing Wave',
    exp_interference: 'Interference',
    exp_inclined_plane: 'Inclined Plane',
    exp_pulley: 'Pulley (Atwood)',
    exp_seesaw: 'Seesaw',
    exp_vernier: 'Vernier Caliper',
    exp_micrometer: 'Micrometer',
    slider_height: 'Height',
    slider_gravity: 'Gravity (g)',
    slider_velocity: 'Velocity (v₀)',
    slider_angle: 'Angle (θ)',
    slider_angleRelease: 'Release Angle (θ₀)',
    slider_length: 'Length (L)',
    slider_damping: 'Damping',
    slider_k: 'Spring Const (k)',
    slider_mass: 'Mass (m)',
    slider_displacement: 'Displacement (x₀)',
    slider_voltage: 'Voltage (V)',
    slider_r1: 'Resistor R₁',
    slider_r2: 'Resistor R₂',
    slider_focalLength: 'Focal Length',
    slider_objectDist: 'Object Dist',
    slider_lensType: 'Lens Type',
    slider_prismAngle: 'Prism Angle',
    slider_incidentAngle: 'Incident Angle',
    slider_refIndex: 'Ref. Index',
    slider_n1: 'Ref. Index n₁',
    slider_n2: 'Ref. Index n₂',
    slider_amplitude: 'Amplitude',
    slider_frequency: 'Frequency',
    slider_wavelength: 'Wavelength',
    slider_n: 'Loops (n)',
    slider_separation: 'Separation',
    slider_friction: 'Friction (μ)',
    slider_m1: 'Mass m₁',
    slider_m2: 'Mass m₂',
    slider_d1: 'Dist d₁',
    slider_d2: 'Dist d₂',
    param_lensType_convex: 'Convex',
    param_lensType_concave: 'Concave',
    play: '▶ Play',
    pause: '⏸ Pause',
    reset: '🔄 Reset'
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
        # It's actually nested inside circuit
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
