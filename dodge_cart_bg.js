const fs = require('fs');
let content = fs.readFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', 'utf8');
content = content.replace(/background: "#fff"/g, 'background: "#FEFEFE"');
fs.writeFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', content);
console.log("Done");
