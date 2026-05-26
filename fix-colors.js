const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedCount = 0;

walkDir('./src', function(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace RGBA
  content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,/g, 'rgba(0,0,0,');

  // Replace Backgrounds
  content = content.replace(/background:\s*["']#(111|111111)["']/g, 'background: "#ffffff"');
  content = content.replace(/background:\s*["']#(0a0a0a)["']/g, 'background: "#f8f8f8"');
  content = content.replace(/background:\s*["']#(000|000000)["']/g, 'background: "#ffffff"');
  content = content.replace(/background:\s*["']#(fff|ffffff)["']/ig, 'background: "#1a1a1a"');

  // Replace Colors
  content = content.replace(/color:\s*["']#(fff|ffffff)["']/ig, 'color: "#1a1a1a"');
  content = content.replace(/color:\s*["']#(000|000000)["']/ig, 'color: "#ffffff"');

  // Replace Borders
  content = content.replace(/border:\s*["']([^"']*)#(fff|ffffff)([^"']*)["']/ig, 'border: "$1#000000$3"');
  content = content.replace(/borderBottom:\s*["']([^"']*)#(fff|ffffff)([^"']*)["']/ig, 'borderBottom: "$1#000000$3"');
  content = content.replace(/borderTop:\s*["']([^"']*)#(fff|ffffff)([^"']*)["']/ig, 'borderTop: "$1#000000$3"');
  content = content.replace(/borderRight:\s*["']([^"']*)#(fff|ffffff)([^"']*)["']/ig, 'borderRight: "$1#000000$3"');
  content = content.replace(/borderLeft:\s*["']([^"']*)#(fff|ffffff)([^"']*)["']/ig, 'borderLeft: "$1#000000$3"');
  
  // Replace Fills
  content = content.replace(/fill:\s*["']#(fff|ffffff)["']/ig, 'fill: "#1a1a1a"');
  content = content.replace(/fill:\s*["']#(000|000000)["']/ig, 'fill: "#ffffff"');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
});
console.log(`Modified ${modifiedCount} files`);
