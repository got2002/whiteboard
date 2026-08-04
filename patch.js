const fs = require('fs');
let c = fs.readFileSync('Client/src/index.css', 'utf8');

c = c.replace(
  '  min-width: 190px;\r\n  box-shadow:',
  '  min-width: 190px;\r\n  max-height: calc(100vh - 60px);\r\n  overflow-y: auto;\r\n  overflow-x: hidden;\r\n  box-shadow:'
);

c = c.replace(
  '  min-width: 190px;\n  box-shadow:',
  '  min-width: 190px;\n  max-height: calc(100vh - 60px);\n  overflow-y: auto;\n  overflow-x: hidden;\n  box-shadow:'
);

fs.writeFileSync('Client/src/index.css', c);
console.log('CSS patched successfully!');
