import re
import codecs

def clean_file(filepath):
    with codecs.open(filepath, 'r', 'utf-8') as f:
        content = f.read()

    # The file has a duplicate block starting with `    shapeOctagon: "Octagon",` (EN) or `    shapeHexagon: "หกเหลี่ยม",` (TH)
    # inside the `lab.balance` object.
    # And it goes all the way down to `toolbox: { ... }`
    # Then it continues with `    projectile: {`
    
    # Let's find the start of `lab: {`
    lab_idx = content.find('  lab: {')
    if lab_idx == -1:
        return

    before_lab = content[:lab_idx]
    lab_content = content[lab_idx:]

    # In lab_content, we want to extract balance, projectile, solar, ph, circuit
    # Since it's corrupted, we can use regex to extract each block.
    
    balance_match = re.search(r'    balance: \{(.*?)(?=    shape(?:Hex|Oct)agon:)', lab_content, re.DOTALL)
    if not balance_match:
        print("Could not find balance match in", filepath)
        # fallback if shapeHexagon is not there (maybe it was deleted)
        pass
    else:
        balance_str = balance_match.group(1)
        # we need to add the missing properties that got overwritten:
        if 'th.js' in filepath:
            balance_str += "      showCalc: 'แสดงการคำนวณ',\n      hideCalc: 'ซ่อนการคำนวณ',\n      calcTitle: '🧮 การคำนวณโมเมนต์',\n      leftSide: 'ฝั่งซ้าย (ทวนเข็ม)',\n      rightSide: 'ฝั่งขวา (ตามเข็ม)',\n      formula: 'โมเมนต์ = มวล × ระยะทาง',\n      balanced_msg: 'สมดุล',\n      tiltLeft: 'เอียงซ้าย',\n      tiltRight: 'เอียงขวา',\n"
        else:
            balance_str += "      showCalc: 'Show Calculation',\n      hideCalc: 'Hide Calculation',\n      calcTitle: '🧮 Moment Calculation',\n      leftSide: 'Left Side (CCW)',\n      rightSide: 'Right Side (CW)',\n      formula: 'Moment = Mass × Distance',\n      balanced_msg: 'Balanced',\n      tiltLeft: 'Tilts Left',\n      tiltRight: 'Tilts Right',\n"

    # extract projectile
    proj_match = re.search(r'    projectile: \{(.*?)\n    \},', lab_content, re.DOTALL)
    proj_str = proj_match.group(1) if proj_match else ""

    # extract solar
    solar_match = re.search(r'    solar: \{(.*?)\n    \},', lab_content, re.DOTALL)
    solar_str = solar_match.group(1) if solar_match else ""

    # extract ph
    ph_match = re.search(r'    ph: \{(.*?)\n    \},', lab_content, re.DOTALL)
    ph_str = ph_match.group(1) if ph_match else ""

    # extract circuit
    circuit_match = re.search(r'    circuit: \{(.*?)\n    \}\n  \}\n\};', lab_content, re.DOTALL)
    circuit_str = circuit_match.group(1) if circuit_match else ""

    # Now reconstruct lab
    new_lab = "  lab: {\n    balance: {" + balance_str + "    },\n"
    if proj_str: new_lab += "    projectile: {" + proj_str + "\n    },\n"
    if solar_str: new_lab += "    solar: {" + solar_str + "\n    },\n"
    if ph_str: new_lab += "    ph: {" + ph_str + "\n    },\n"
    if circuit_str: new_lab += "    circuit: {" + circuit_str + "\n    }\n  }\n};\n"
    else: new_lab += "  }\n};\n"

    # Write back
    with codecs.open(filepath, 'w', 'utf-8') as f:
        f.write(before_lab + new_lab)
    print("Fixed", filepath)

clean_file('Client/src/i18n/locales/th.js')
clean_file('Client/src/i18n/locales/en.js')
