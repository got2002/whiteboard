import codecs

def patch_file(filepath, replacements):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()
    
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(content)

patch_file('Client/src/components/PhysicsLabWidget.jsx', {
    '<span>อยู่ระหว่างพัฒนา — เร็วๆ นี้</span>': '<span>{t("phys.comingSoon") || "อยู่ระหว่างพัฒนา — เร็วๆ นี้"}</span>',
    '⏸ หยุด': '⏸ {t("phys.pause") || "หยุด"}',
    '▶ เริ่มจำลอง': '▶ {t("phys.startSim") || "เริ่มจำลอง"}',
    '🔄 รีเซ็ต': '🔄 {t("phys.reset") || "รีเซ็ต"}'
})

print("Patched playback controls")
