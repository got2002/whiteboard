const fs = require('fs');
let c = fs.readFileSync('Client/src/index.css', 'utf8');

// Replace the entire .header-dropdown block with fixed positioning + custom scrollbar
const oldBlock = `.header-dropdown {
  position: absolute;
  top: 42px;
  left: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 41, 59, 0.97));
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 190px;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  animation: headerDropIn 0.18s ease;
  z-index: 110;
}`;

const newBlock = `.header-dropdown {
  position: fixed;
  top: 44px;
  left: 20px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 41, 59, 0.97));
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 190px;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  animation: headerDropIn 0.18s ease;
  z-index: 110;
}

/* Slim custom scrollbar for header dropdown */
.header-dropdown::-webkit-scrollbar {
  width: 4px;
}
.header-dropdown::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
.header-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 4px;
}
.header-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}`;

// Try both \r\n and \n variants
let replaced = false;
if (c.includes(oldBlock.replace(/\n/g, '\r\n'))) {
  c = c.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));
  replaced = true;
} else if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  replaced = true;
}

if (replaced) {
  fs.writeFileSync('Client/src/index.css', c);
  console.log('SUCCESS: Dropdown changed to fixed + scrollbar added');
} else {
  console.log('WARN: Could not find exact match, trying line-by-line...');
  // Fallback: just replace key properties
  c = c.replace(/\.header-dropdown \{\r?\n\s+position: absolute;\r?\n\s+top: 42px;\r?\n\s+left: 0;/, 
    '.header-dropdown {\n  position: fixed;\n  top: 44px;\n  left: 20px;');
  
  // Add scrollbar styles at the end
  c += `
/* Slim custom scrollbar for header dropdown */
.header-dropdown::-webkit-scrollbar {
  width: 4px;
}
.header-dropdown::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}
.header-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 4px;
}
.header-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.35);
}
`;
  fs.writeFileSync('Client/src/index.css', c);
  console.log('FALLBACK: Applied line-by-line fix + scrollbar');
}
