import re
import os
import json

filepath = 'Client/src/components/CustomBalanceLab.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract LABELS dictionary
match = re.search(r'const LABELS = (\{.*?\n\});', content, re.DOTALL)
if match:
    labels_text = match.group(1)
    # This is JS object syntax, not JSON. It has unquoted keys.
    # We can use regex to parse it roughly or just manually convert it.
    
    # 1. Add import
    if 'import { useI18n } from "../i18n/i18n";' not in content:
        content = content.replace("import React, { useState, useEffect, useRef, useCallback } from 'react';", "import React, { useState, useEffect, useRef, useCallback } from 'react';\nimport { useI18n } from \"../i18n/i18n\";")

    # 2. Add useI18n hook
    content = content.replace("export default function CustomBalanceLab({ onClose }) {\n  const [lang, setLang] = useState('TH');", "export default function CustomBalanceLab({ onClose }) {\n  const { t } = useI18n();")

    # 3. Replace LABELS[lang].xxx with t('lab.balance.xxx')
    content = re.sub(r'LABELS\[lang\]\.([a-zA-Z0-9_]+)', r"t('lab.balance.\1')", content)

    # 4. Remove internal lang toggle button UI
    content = re.sub(r'<button[^>]*onClick=\{\(\) => setLang\([^)]+\)\}[^>]*>[\s\S]*?</button>', '', content)
    
    # 5. We don't remove LABELS yet so we can still use it for extraction if needed, but it's now unused in the file.
    # Actually we can just leave it there for now as unused, or delete it.
    content = content.replace(match.group(0), "")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched CustomBalanceLab.jsx")
