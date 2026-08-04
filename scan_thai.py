import os
import re

def scan_dir(path):
    results = []
    thai_pattern = re.compile(r'[\u0E00-\u0E7F]')
    comment_pattern = re.compile(r'^\s*//|^\s*/\*|^\s*\*')
    
    for root, dirs, files in os.walk(path):
        if 'locales' in root or 'node_modules' in root or 'dist' in root:
            continue
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if thai_pattern.search(line) and not comment_pattern.match(line):
                                # Also exclude lines that are just console.log with Thai
                                if 'console.log' not in line:
                                    results.append(f"{file}:{i+1}: {line.strip()}")
                except Exception as e:
                    pass
    return results

res = scan_dir('Client/src')
with open('scan_result.txt', 'w', encoding='utf-8') as f:
    for r in res:
        f.write(r + '\n')
