const fs = require('fs');
let content = fs.readFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', 'utf8');

// The buttons look like:
// <button
//   ...
//   style={{
//     ...
//     background: "#000000", color: "#ffffff",

content = content.replace(/<button([^>]+style={{[^}]*background: "#000000", color: "#ffffff")/g, '<button className="force-dark"$1');

fs.writeFileSync('/Users/pinowed/.gemini/antigravity/scratch/fiibi/src/components/CartDrawer.js', content);
console.log("Done");
