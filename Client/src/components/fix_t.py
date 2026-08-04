import os

def fix_file(filepath, functions_to_clean):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for fn in functions_to_clean:
        # replace `function X(...) { \n const { t } = useI18n();`
        import re
        content = re.sub(
            fr'(function {fn}\(.*?\)\s*\{{\s*)const {{ t }} = useI18n\(\);\n',
            r'\1',
            content
        )
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file(r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\PagePanel.jsx", [
    "drawStrokeOnThumb", "getBgColor", "drawBgPattern", "PageThumbnail"
])

fix_file(r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\ColorPickerModal.jsx", [
    "hslToRgb", "rgbToHex", "hexToRgb", "rgbToHsl"
])

print("Fixed hooks in non-components.")
