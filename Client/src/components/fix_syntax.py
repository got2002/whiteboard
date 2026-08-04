import os
import re

components_dir = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_syntax(file_path):
    if not os.path.exists(file_path): return
    c = read_file(file_path)
    
    # Remove the wrongly injected line
    c = c.replace('\n    const { t } = useI18n();', '')
    
    func_names = ["TableSizePicker", "CanvasTable", "TableManager", "VideoPlayerModal", "CalculatorWidget", "MathToolWidget", "ScreenshotOverlay", "LockScreenOverlay", "SpotlightOverlay"]
    
    for fn in func_names:
        # Matches `function Name(...) {` or `export default function Name(...) {`
        pattern = re.compile(r'(function\s+' + fn + r'\s*\([^)]*\)\s*\{)', re.DOTALL)
        c = pattern.sub(r'\1\n    const { t } = useI18n();', c)
        
    write_file(file_path, c)

files = [
    "TableWidget.jsx", "VideoPlayerModal.jsx", "CalculatorWidget.jsx", 
    "MathToolWidget.jsx", "ScreenshotOverlay.jsx", "LockScreenOverlay.jsx", 
    "SpotlightOverlay.jsx"
]

for f in files:
    fix_syntax(os.path.join(components_dir, f))

print("Syntax fixed!")
