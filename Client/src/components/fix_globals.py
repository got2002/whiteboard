import os

components_dir = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def inject_t(content, func_names):
    for fn in func_names:
        if f'function {fn}(' in content:
            # find function def
            parts = content.split(f'function {fn}(', 1)
            sig_and_body = parts[1].split('{', 1)
            new_body = sig_and_body[1]
            if 'const { t } = useI18n();' not in new_body:
                new_body = '\n    const { t } = useI18n();' + new_body
            content = parts[0] + f'function {fn}(' + sig_and_body[0] + '{' + new_body
    return content

# 1. BannerWidget.jsx
p1 = os.path.join(components_dir, "BannerWidget.jsx")
c1 = read_file(p1)
c1 = c1.replace("const COLOR_THEMES = [", "const getThemeOptions = (t) => [")
c1 = c1.replace("const SPEED_OPTIONS = [", "const getSpeedOptions = (t) => [")
c1 = c1.replace("COLOR_THEMES", "getThemeOptions(t)")
c1 = c1.replace("SPEED_OPTIONS", "getSpeedOptions(t)")
write_file(p1, c1)

# 2. PresentationMode.jsx
p2 = os.path.join(components_dir, "PresentationMode.jsx")
c2 = read_file(p2)
c2 = c2.replace("const TRANSITIONS = [", "const getTransitions = (t) => [")
c2 = c2.replace("export { TRANSITIONS };", "export { getTransitions };")
c2 = c2.replace("TRANSITIONS.find", "getTransitions(t).find")
c2 = c2.replace("TRANSITIONS.map", "getTransitions(t).map")
write_file(p2, c2)

# 3. PagePanel.jsx
p3 = os.path.join(components_dir, "PagePanel.jsx")
c3 = read_file(p3)
if 'import { getTransitions }' not in c3:
    c3 = c3.replace('import { TRANSITIONS }', 'import { getTransitions }')
    c3 = c3.replace('TRANSITIONS.find', 'getTransitions(t).find')
    c3 = c3.replace('TRANSITIONS[1]', 'getTransitions(t)[1]')
    c3 = c3.replace('TRANSITIONS.map', 'getTransitions(t).map')
    write_file(p3, c3)

# 4. ColorSidebar.jsx
p4 = os.path.join(components_dir, "ColorSidebar.jsx")
c4 = read_file(p4)
c4 = c4.replace("const BACKGROUNDS = [", "const getBackgrounds = (t) => [")
c4 = c4.replace("BACKGROUNDS.filter", "getBackgrounds(t).filter")
write_file(p4, c4)

# 5. TableWidget.jsx
p5 = os.path.join(components_dir, "TableWidget.jsx")
c5 = read_file(p5)
c5 = c5.replace("const TABLE_THEMES = [", "const getTableThemes = (t) => [")
c5 = c5.replace("TABLE_THEMES.map", "getTableThemes(t).map")
c5 = inject_t(c5, ["TableSizePicker", "CanvasTable", "TableManager"])
write_file(p5, c5)

# Ensure useI18n is injected properly for all other widgets that missed it
# e.g., VideoPlayerModal
p6 = os.path.join(components_dir, "VideoPlayerModal.jsx")
c6 = read_file(p6)
c6 = inject_t(c6, ["VideoPlayerModal"])
write_file(p6, c6)

p7 = os.path.join(components_dir, "CalculatorWidget.jsx")
c7 = read_file(p7)
c7 = inject_t(c7, ["CalculatorWidget"])
write_file(p7, c7)

p8 = os.path.join(components_dir, "MathToolWidget.jsx")
c8 = read_file(p8)
c8 = inject_t(c8, ["MathToolWidget"])
write_file(p8, c8)

p9 = os.path.join(components_dir, "ScreenshotOverlay.jsx")
c9 = read_file(p9)
c9 = inject_t(c9, ["ScreenshotOverlay"])
write_file(p9, c9)

p10 = os.path.join(components_dir, "LockScreenOverlay.jsx")
c10 = read_file(p10)
c10 = inject_t(c10, ["LockScreenOverlay"])
write_file(p10, c10)

p11 = os.path.join(components_dir, "SpotlightOverlay.jsx")
c11 = read_file(p11)
c11 = inject_t(c11, ["SpotlightOverlay"])
write_file(p11, c11)

print("Globals fixed and useI18n injected everywhere!")
