import re
import codecs

def patch_periodic():
    f = 'Client/src/components/PeriodicTableWidget.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    
    # Add import
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../i18n/i18n";\nimport { useState')
    
    # Add t
    if 'const { t } = useI18n();' not in content:
        content = content.replace('export default function PeriodicTableWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {',
                                  'export default function PeriodicTableWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {\n  const { t } = useI18n();')
    
    # Replacements
    reps = {
        '⚛ Periodic Table of Elements': "{t('periodicTable.title')}",
        'Hide" : "Show"} Legend': 't("periodicTable.hideLegend") : t("periodicTable.showLegend")}',
        'Lanthanides': "{t('periodicTable.lanthanides')}",
        'Actinides': "{t('periodicTable.actinides')}",
        '>Category<': '>{t("periodicTable.category")}<',
        '>Electron Config<': '>{t("periodicTable.electronConfig")}<',
        '>State (RT)<': '>{t("periodicTable.stateRT")}<',
        '>Melting Point<': '>{t("periodicTable.meltingPoint")}<',
        '>Boiling Point<': '>{t("periodicTable.boilingPoint")}<',
        '>Close<': '>{t("periodicTable.close")}<'
    }
    
    for k, v in reps.items():
        content = content.replace(k, v)
        
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_student():
    f = 'Client/src/components/StudentLabWidget.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../i18n/i18n";\nimport { useState')
    if 'const { t } = useI18n();' not in content:
        content = content.replace('export default function StudentLabWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {',
                                  'export default function StudentLabWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {\n  const { t } = useI18n();')
    content = content.replace('Student Lab Window - Drag to move', "{t('studentLab.title')}")
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_webcam():
    f = 'Client/src/components/WebcamWidget.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import React', 'import { useI18n } from "../i18n/i18n";\nimport React')
    if 'const { t } = useI18n();' not in content:
        content = content.replace('function WebcamWidget({ isLocal, stream, ownerName, ownerId, onClose }) {',
                                  'function WebcamWidget({ isLocal, stream, ownerName, ownerId, onClose }) {\n  const { t } = useI18n();')
    
    content = content.replace('ownerName || "Webcam"', 'ownerName || t("webcam.title")')
    content = content.replace('isMicOn ? "Mute Microphone" : "Unmute Microphone"', 'isMicOn ? t("webcam.mute") : t("webcam.unmute")')
    content = content.replace('"Close Camera"', 't("webcam.close")')
    content = content.replace('"Muted"', 't("webcam.mutedIndicator")')
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_video():
    f = 'Client/src/components/VideoWidget.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../i18n/i18n";\nimport { useState')
    if 'const { t } = useI18n();' not in content:
        content = content.replace('export default function VideoWidget({ video: incomingVideo, onUpdate, onDelete, onCaptureFrame, tool, zoom = 1, panOffset = { x: 0, y: 0 }, userRole, layerIndex = 0 }) {',
                                  'export default function VideoWidget({ video: incomingVideo, onUpdate, onDelete, onCaptureFrame, tool, zoom = 1, panOffset = { x: 0, y: 0 }, userRole, layerIndex = 0 }) {\n  const { t } = useI18n();')
    
    content = content.replace('🎬 Video', "{t('videoWidget.title')}")
    content = content.replace('"แคปหน้าจอวิดีโอแปะลงกระดาน"', 't("videoWidget.captureTooltip")')
    content = content.replace('"ลบวิดีโอ"', 't("videoWidget.deleteTooltip")')
    content = content.replace('คลิกเพื่อเล่นวิดีโอ (รอการอนุญาตจากเบราว์เซอร์)', "{t('videoWidget.autoplayBlocked')}")
    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

def patch_physics():
    f = 'Client/src/components/PhysicsLabWidget.jsx'
    with codecs.open(f, 'r', 'utf-8') as file:
        content = file.read()
    if 'useI18n' not in content:
        content = content.replace('import { useState', 'import { useI18n } from "../i18n/i18n";\nimport { useState')
    if 'const { t } = useI18n();' not in content:
        content = content.replace('export default function PhysicsLabWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {',
                                  'export default function PhysicsLabWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {\n  const { t } = useI18n();')
    
    # We will replace usages of CATEGORIES, EXPERIMENTS, SLIDER_CONFIG labels with t(...)
    # Since CATEGORIES is an array: { id: "motion", icon: "...", label: "..." }
    # In render: cat.label -> t(`physicsLab.cat_${cat.id}`)
    content = content.replace('{cat.label}', '{t(`physicsLab.cat_${cat.id}`)}')
    # EXPERIMENTS: exp.label -> t(`physicsLab.exp_${exp.id}`)
    content = content.replace('{exp.label}', '{t(`physicsLab.exp_${exp.id}`)}')
    # SLIDER_CONFIG: slider.label -> t(`physicsLab.slider_${slider.key}`)
    content = content.replace('{slider.label}', '{t(`physicsLab.slider_${slider.key}`)}')
    
    # Hardcoded strings in render:
    content = content.replace('▶ เล่น', "{t('physicsLab.play')}")
    content = content.replace('⏸ พัก', "{t('physicsLab.pause')}")
    content = content.replace('🔄 เริ่มใหม่', "{t('physicsLab.reset')}")
    content = content.replace('เลนส์นูน', "{t('physicsLab.param_lensType_convex')}")
    content = content.replace('เลนส์เว้า', "{t('physicsLab.param_lensType_concave')}")

    with codecs.open(f, 'w', 'utf-8') as file:
        file.write(content)

patch_periodic()
patch_student()
patch_webcam()
patch_video()
patch_physics()
print("Patched all phase 5 components")
