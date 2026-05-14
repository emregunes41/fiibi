const fs = require('fs');
let content = fs.readFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', 'utf8');
content = content.replace(/color: "#000"/g, 'color: "#010101", "--force-color": "#010101"');
fs.writeFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', content);
console.log("Done");
