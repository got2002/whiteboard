const fs = require('fs');
let c = fs.readFileSync('Client/src/index.css', 'utf8');

c = c.replace(
  '  white-space: nowrap;\r\n  font-family: \'Inter\', sans-serif;\r\n}',
  '  white-space: nowrap;\r\n  font-family: \'Inter\', sans-serif;\r\n  flex-shrink: 0;\r\n}'
);
c = c.replace(
  '  white-space: nowrap;\n  font-family: \'Inter\', sans-serif;\n}',
  '  white-space: nowrap;\n  font-family: \'Inter\', sans-serif;\n  flex-shrink: 0;\n}'
);

c = c.replace(
  '  background: rgba(255, 255, 255, 0.08);\r\n  margin: 4px 8px;\r\n}',
  '  background: rgba(255, 255, 255, 0.08);\r\n  margin: 4px 8px;\r\n  flex-shrink: 0;\r\n}'
);
c = c.replace(
  '  background: rgba(255, 255, 255, 0.08);\n  margin: 4px 8px;\n}',
  '  background: rgba(255, 255, 255, 0.08);\n  margin: 4px 8px;\n  flex-shrink: 0;\n}'
);

fs.writeFileSync('Client/src/index.css', c);
console.log('Flex shrink patched successfully!');
