import os
import re

files = [
    "AiSolutionWidget.jsx", "BannerWidget.jsx", "CalculatorWidget.jsx",
    "GraphWidget.jsx", "MathFunctionWidget.jsx", "MathToolWidget.jsx",
    "TableWidget.jsx", "VideoPlayerModal.jsx", "SketchpadWidget.jsx",
    "ScreenshotOverlay.jsx", "ScreenshotMenu.jsx", "PresentationMode.jsx",
    "LockScreenOverlay.jsx", "CurtainOverlay.jsx", "SpotlightOverlay.jsx",
    "ColorSidebar.jsx", "CameraGalleryWidget.jsx"
]
src_dir = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components"
hooks_dir = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\hooks"

thai_pattern = re.compile(r'[\u0E00-\u0E7F]+')

out = []

def scan_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines):
        if thai_pattern.search(line):
            out.append(f"{os.path.basename(filepath)}:{i+1} -> {line.strip()}")

for f in files:
    scan_file(os.path.join(src_dir, f))

scan_file(os.path.join(hooks_dir, "useFileOps.js"))

with open('extracted_strings.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
