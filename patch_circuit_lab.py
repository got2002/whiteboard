import re

filepath = 'Client/src/components/CustomCircuitLab.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useI18n import
if 'import { useI18n } from "../i18n/i18n";' not in content:
    content = content.replace("import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';", "import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';\nimport { useI18n } from \"../i18n/i18n\";")

content = content.replace("export default function CustomCircuitLab({ onClose }) {\n    const [lang, setLang] = useState('TH');", "export default function CustomCircuitLab({ onClose }) {\n    const { t } = useI18n();")
content = content.replace("export default function CustomCircuitLab({ onClose }) {\n  const [lang, setLang] = useState('TH');", "export default function CustomCircuitLab({ onClose }) {\n  const { t } = useI18n();")

# Remove LABELS object
match = re.search(r'const LABELS = (\{.*?\n\});', content, re.DOTALL)
if match:
    content = content.replace(match.group(0), "")

# Replace LABELS[lang].xxx with t('lab.circuit.xxx')
content = re.sub(r'LABELS\[lang\]\.([a-zA-Z0-9_]+)', r"t('lab.circuit.\1')", content)

# Remove toggle button
content = re.sub(r'<button[^>]*onClick=\{\(\) => setLang\([^)]+\)\}[^>]*>[\s\S]*?</button>', '', content)

# Remove { th: '...', en: '...' } inside ITEMS and CHALLENGES
content = re.sub(r"name: \{ th: '[^']+', en: '[^']+' \},", "", content)
content = re.sub(r"title: \{ th: '[^']+', en: '[^']+' \}", "", content)
content = re.sub(r"desc: \{ th: '[^']+', en: '[^']+' \}", "", content)

# Inside the component: replace item.name[lang.toLowerCase()] or item.name[lang]
content = re.sub(r'([a-zA-Z0-9_]+)\.name\[lang(?:\.toLowerCase\(\))?\]', r"t('lab.circuit.item_' + \1.type)", content)
content = re.sub(r'([a-zA-Z0-9_]+)\.title\[lang(?:\.toLowerCase\(\))?\]', r"t('lab.circuit.challenge_' + \1.id + '_title')", content)
content = re.sub(r'([a-zA-Z0-9_]+)\.desc\[lang(?:\.toLowerCase\(\))?\]', r"t('lab.circuit.challenge_' + \1.id + '_desc')", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched CustomCircuitLab.jsx")
