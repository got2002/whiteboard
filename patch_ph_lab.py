import re
import json

filepath = 'Client/src/components/CustomPHLab.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the manual lang toggling
if 'import { useI18n } from "../i18n/i18n";' not in content:
    content = content.replace("import React, { useState, useEffect } from \"react\";", "import React, { useState, useEffect } from \"react\";\nimport { useI18n } from \"../i18n/i18n\";")

content = content.replace("export default function CustomPHLab({ onClose }) {\n  const [lang, setLang] = useState('th');", "export default function CustomPHLab({ onClose }) {\n  const { t } = useI18n();")

# Remove internal t object
content = re.sub(r'\s*const t = \{[\s\S]*?\n  \};\n', '\n', content)

# Replace t.key[lang] with t('lab.ph.key')
content = re.sub(r't\.([a-zA-Z0-9_]+)\[lang\]', r"t('lab.ph.\1')", content)

# Remove toggle button
content = re.sub(r'<button[^>]*onClick=\{\(\) => setLang\([^)]+\)\}[^>]*>[\s\S]*?</button>', '', content)

# For SUBSTANCES and CHALLENGES we need to change `{ en: '...', th: '...' }` to use t() ?
# Wait, SUBSTANCES is declared outside the component.
# So we can change SUBSTANCES name to be just an id or translation key, and then inside the component we do `t('lab.ph.' + sub.id)`
content = re.sub(r"name: \{ en: '[^']+', th: '[^']+' \}", r"", content)
content = content.replace(",  },", " },") # cleanup trailing commas if any
# Wait, for SUBSTANCES it was: `{ id: 'water', ph: 7.0, name: { en: 'Water', th: 'น้ำเปล่า' } }`
# Now if we remove `name`, we just use `t('lab.ph.substances_' + item.id)` inside the component.
# Let's replace `item.name[lang]` with `t('lab.ph.substances_' + item.id)`
content = re.sub(r'([a-zA-Z0-9_]+)\.name\[lang\]', r"t('lab.ph.sub_' + \1.id)", content)

# For CHALLENGES:
content = re.sub(r'title: \{ en: \'([^\']+)\', th: \'([^\']+)\' \}', r"title: '\1'", content)
content = re.sub(r'desc: \{ en: \'([^\']+)\', th: \'([^\']+)\' \}', r"desc: '\1'", content)
# We will just replace c.title[lang] with t('lab.ph.challenge_' + c.id + '_title')
content = re.sub(r'([a-zA-Z0-9_]+)\.title\[lang\]', r"t('lab.ph.challenge_' + \1.id + '_title')", content)
content = re.sub(r'([a-zA-Z0-9_]+)\.desc\[lang\]', r"t('lab.ph.challenge_' + \1.id + '_desc')", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched CustomPHLab.jsx")
