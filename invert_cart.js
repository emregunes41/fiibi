const fs = require('fs');
let content = fs.readFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', 'utf8');

// Remove force-dark
content = content.replace(/className="force-dark"/g, '');

// Invert main background
content = content.replace(/background: "#0a0a0f"/g, 'background: "#ffffff"');

// Invert colors
content = content.replace(/rgba\(255, ?255, ?255,/g, 'rgba(0, 0, 0,');
content = content.replace(/color: "#FEFEFE"/g, 'color: "#000000"');
content = content.replace(/color: "#fff"/g, 'color: "#000000"');
content = content.replace(/color: "#010101"/g, 'color: "#ffffff"');
content = content.replace(/color: "#000"/g, 'color: "#ffffff"');

// Invert specific white backgrounds to black
content = content.replace(/background: "#FEFEFE"/g, 'background: "#000000"');
content = content.replace(/background: "#fff"/g, 'background: "#000000"');

// Remove --force-color completely to avoid interfering
content = content.replace(/, "--force-color": "[^"]+"/g, '');
content = content.replace(/\"--force-color\": \"[^"]+\", /g, '');

fs.writeFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', content);
console.log("Done");
