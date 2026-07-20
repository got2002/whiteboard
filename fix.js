const fs = require('fs'); 
let c = fs.readFileSync('Client/src/components/Canvas.jsx', 'utf8'); 
c = c.replace(/else if \(effectiveToolForCursor === "eraser"\) \{[\s\S]*?cursorStyle = `url\("data:image\/svg\+xml,\$\{encoded\}"\) \$\{hs\} \$\{hs\}, auto`;\n  \}/g, 'else if (effectiveToolForCursor === "eraser") {\n    cursorStyle = `url("/eraser-cursor.png") 16 16, auto`;\n  }'); 
fs.writeFileSync('Client/src/components/Canvas.jsx', c);
