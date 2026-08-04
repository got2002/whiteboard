import re
import os

filepath = r"c:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\Client\src\components\Toolbar.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make them functions that take t
# 1. BACKGROUNDS
content = content.replace("const BACKGROUNDS = [", "const getBackgrounds = (t) => [")
content = re.sub(r'title:\s*"พื้นขาว"', 'title: t("toolbar.bgWhite")', content)
content = re.sub(r'title:\s*"พื้นดำ"', 'title: t("toolbar.bgBlack")', content)
content = re.sub(r'title:\s*"ตาราง"', 'title: t("toolbar.bgGrid")', content)
content = re.sub(r'title:\s*"เส้นบรรทัด"', 'title: t("toolbar.bgLined")', content)

# 2. MODES
content = content.replace("const MODES = [", "const getModes = (t) => [")

# 3. PEN_STYLES
content = content.replace("const PEN_STYLES = [", "const getPenStyles = (t) => [")
# Labels
content = re.sub(r'label:\s*"Pen"', 'label: t("toolbar.pen")', content)
content = re.sub(r'label:\s*"Highlighter"', 'label: t("toolbar.penHighlighter")', content)
content = re.sub(r'label:\s*"Pencil"', 'label: t("toolbar.penPencil")', content)
content = re.sub(r'label:\s*"Fountain"', 'label: t("toolbar.penFountain")', content)
content = re.sub(r'label:\s*"Neon"', 'label: t("toolbar.penNeon")', content)
content = re.sub(r'label:\s*"Dashed"', 'label: t("toolbar.penDashed")', content)
content = re.sub(r'label:\s*"Dotted"', 'label: t("toolbar.penDotted")', content)
content = re.sub(r'label:\s*"Brush"', 'label: t("toolbar.penBrush")', content)
content = re.sub(r'label:\s*"Crayon"', 'label: t("toolbar.penCrayon")', content)
content = re.sub(r'label:\s*"Marker"', 'label: t("toolbar.penMarker")', content)
content = re.sub(r'label:\s*"Chalk"', 'label: t("toolbar.penChalk")', content)
content = re.sub(r'label:\s*"(\d+) Slots"', r'label: t("toolbar.splitSlots").replace("{count}", "\1")', content)

# Descs
content = re.sub(r'desc:\s*"ปากกาปกติ"', 'desc: t("toolbar.penNormal")', content)
content = re.sub(r'desc:\s*"ปากกาไฮไลต์"', 'desc: t("toolbar.penHighlighter")', content)
content = re.sub(r'desc:\s*"ปากกาหัวเล็ก"', 'desc: t("toolbar.penPencil")', content)
content = re.sub(r'desc:\s*"ปากกาหมึกซึม"', 'desc: t("toolbar.penFountain")', content)
content = re.sub(r'desc:\s*"เรืองแสง"', 'desc: t("toolbar.penNeon")', content)
content = re.sub(r'desc:\s*"เส้นประ"', 'desc: t("toolbar.penDashed")', content)
content = re.sub(r'desc:\s*"เส้นจุด"', 'desc: t("toolbar.penDotted")', content)
content = re.sub(r'desc:\s*"แบ่ง (\d+) ช่อง"', r'desc: t("toolbar.splitSlots").replace("{count}", "\1")', content)


# 4. SHAPES
content = content.replace("const SHAPES = [", "const getShapes = (t) => [")
content = re.sub(r'desc:\s*"แกนพิกัด"', 'desc: t("toolbar.shapeAxes")', content)
content = re.sub(r'desc:\s*"เส้นตรง"', 'desc: t("toolbar.shapeLine")', content)
content = re.sub(r'desc:\s*"ลูกศร"', 'desc: t("toolbar.shapeArrow")', content)
content = re.sub(r'desc:\s*"สี่เหลี่ยม"', 'desc: t("toolbar.shapeRect")', content)
content = re.sub(r'desc:\s*"สี่เหลี่ยมมุมมน"', 'desc: t("toolbar.shapeRoundedRect")', content)
content = re.sub(r'desc:\s*"สี่เหลี่ยมด้านขนาน"', 'desc: t("toolbar.shapeParallelogram")', content)
content = re.sub(r'desc:\s*"สี่เหลี่ยมคางหมู"', 'desc: t("toolbar.shapeTrapezoid")', content)
content = re.sub(r'desc:\s*"ข้าวหลามตัด"', 'desc: t("toolbar.shapeDiamond")', content)
content = re.sub(r'desc:\s*"สามเหลี่ยม"', 'desc: t("toolbar.shapeTriangle")', content)
content = re.sub(r'desc:\s*"สามเหลี่ยมมุมฉาก"', 'desc: t("toolbar.shapeRightTriangle")', content)
content = re.sub(r'desc:\s*"ห้าเหลี่ยม"', 'desc: t("toolbar.shapePentagon")', content)
content = re.sub(r'desc:\s*"หกเหลี่ยม"', 'desc: t("toolbar.shapeHexagon")', content)
content = re.sub(r'desc:\s*"เจ็ดเหลี่ยม"', 'desc: t("toolbar.shapeHeptagon")', content)
content = re.sub(r'desc:\s*"แปดเหลี่ยม"', 'desc: t("toolbar.shapeOctagon")', content)
content = re.sub(r'desc:\s*"ดาว"', 'desc: t("toolbar.shapeStar")', content)
content = re.sub(r'desc:\s*"กากบาท"', 'desc: t("toolbar.shapeCross")', content)
content = re.sub(r'desc:\s*"วงกลม"', 'desc: t("toolbar.shapeCircle")', content)
content = re.sub(r'desc:\s*"วงรี"', 'desc: t("toolbar.shapeEllipse")', content)
content = re.sub(r'desc:\s*"ทรงกระบอก"', 'desc: t("toolbar.shapeCylinder")', content)
content = re.sub(r'desc:\s*"กรวย"', 'desc: t("toolbar.shapeCone")', content)
content = re.sub(r'desc:\s*"ทรงกลม"', 'desc: t("toolbar.shapeSphere")', content)
content = re.sub(r'desc:\s*"ลูกบาศก์"', 'desc: t("toolbar.shapeCube")', content)
content = re.sub(r'desc:\s*"ปริซึมสามเหลี่ยม"', 'desc: t("toolbar.shapePrism")', content)
content = re.sub(r'desc:\s*"พีระมิด"', 'desc: t("toolbar.shapePyramid")', content)

# 5. Fix Usages
content = content.replace("MODES.map", "getModes(t).map")
content = content.replace("PEN_STYLES.", "getPenStyles(t).")
content = content.replace("PEN_STYLES[0]", "getPenStyles(t)[0]")
content = content.replace("SHAPES.", "getShapes(t).")
content = content.replace("BACKGROUNDS.", "getBackgrounds(t).")
content = content.replace("BACKGROUNDS[0]", "getBackgrounds(t)[0]")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied for constants in Toolbar.jsx")
