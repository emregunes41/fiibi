const fs = require('fs');

function dodgeColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace EXACT string matches that globals.css looks for
  content = content.replace(/color: "#fff"/g, 'color: "#FEFEFE"');
  content = content.replace(/color: "rgba\(255,255,255,/g, 'color: "rgba(255, 255, 255, ');
  content = content.replace(/background: "rgba\(255,255,255,/g, 'background: "rgba(255, 255, 255, ');
  content = content.replace(/background: "rgba\(0,0,0,/g, 'background: "rgba(0, 0, 0, ');
  content = content.replace(/border: "(.*?)rgba\(255,255,255,/g, 'border: "$1rgba(255, 255, 255, ');
  content = content.replace(/borderTop: "(.*?)rgba\(255,255,255,/g, 'borderTop: "$1rgba(255, 255, 255, ');
  content = content.replace(/borderBottom: "(.*?)rgba\(255,255,255,/g, 'borderBottom: "$1rgba(255, 255, 255, ');
  
  // globals.css also matches [style*="border"] { border-color: rgba(0,0,0,0.1) !important; }
  // That matches ANY border.
  // To dodge `[style*="border"]`, we can't easily, because it just looks for the word "border".
  // Wait, if it looks for "border", it will catch border-radius too!
  // Let's check globals.css: html[data-light] [style*="border"]
  // If we want to dodge it, we could use CSS classes for borders instead of inline styles!

  fs.writeFileSync(filePath, content);
}

dodgeColors('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js');
console.log("Done");
