const fs = require('fs');
let c = fs.readFileSync('Client/src/index.css', 'utf8');

if (!c.includes('.header-dropdown::-webkit-scrollbar {')) {
  c += `
/* Custom Scrollbar for header-dropdown */
.header-dropdown::-webkit-scrollbar {
  width: 5px;
}
.header-dropdown::-webkit-scrollbar-track {
  background: transparent;
}
.header-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
.header-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
`;
  fs.writeFileSync('Client/src/index.css', c);
}
console.log('Scrollbar patched!');
