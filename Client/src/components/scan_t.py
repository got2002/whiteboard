import os, glob, re

d = r'c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\*.jsx'
d2 = r'c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\hooks\*.js'
files = glob.glob(d) + glob.glob(d2)

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
        # Check for translation usage t("...") or t('...')
        if re.search(r'\bt\([\'"]', content):
            # Check if t is destructured from useI18n
            if not re.search(r'const\s*\{\s*t\s*\}\s*=\s*useI18n\s*\(\s*\)', content):
                print(f'Missing t declaration in: {os.path.basename(f)}')
