import re

filepath = 'Client/src/components/CustomSolarSystemLab.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'const LABELS = (\{.*?\n\});', content, re.DOTALL)
if match:
    if 'import { useI18n } from "../i18n/i18n";' not in content:
        content = content.replace("import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';", "import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';\nimport { useI18n } from \"../i18n/i18n\";")
        # In case the import matches differently
        content = content.replace("import React, { useState, useEffect, useRef, useCallback } from 'react';", "import React, { useState, useEffect, useRef, useCallback } from 'react';\nimport { useI18n } from \"../i18n/i18n\";")

    content = content.replace("export default function CustomSolarSystemLab({ onClose }) {\n  const [lang, setLang] = useState('TH');", "export default function CustomSolarSystemLab({ onClose }) {\n  const { t } = useI18n();")

    content = re.sub(r'LABELS\[lang\]\.([a-zA-Z0-9_]+)', r"t('lab.solar.\1')", content)

    content = re.sub(r'<button[^>]*onClick=\{\(\) => setLang\([^)]+\)\}[^>]*>[\s\S]*?</button>', '', content)
    
    content = content.replace(match.group(0), "")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched CustomSolarSystemLab.jsx")
