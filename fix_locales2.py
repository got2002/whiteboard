import re
import codecs

def fix_file(filepath):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()

    # Step 1: Remove the corrupted lab: { balance: { ... } } that was injected around line 450
    # It starts with `  lab: {\n    balance: {`
    # and ends right before `    shapeHexagon:` (in th.js) or `    shapeOctagon:` (in en.js)
    content = re.sub(r'  lab: \{\s*balance: \{\s*title: \'[^\']+\',\s*mode_free: [^}]+instruction: \'[^\']+\',\n', '', content)

    # Step 2: Now the file should be mostly correct, but the end of the file has duplicated stuff from my replacements.
    # Actually, the diff showed that it replaced `showCalc` all the way to the end with `shapeHexagon`... wait.
    # Let's just grab everything before `  lab: {` and everything after, and reconstruct the lab object cleanly.

    # It's better to just do a regex replace to clean up the exact mess.
    pass

fix_file('Client/src/i18n/locales/th.js')
fix_file('Client/src/i18n/locales/en.js')
