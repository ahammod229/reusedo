const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git', '.turbo', 'dist', '.firebase'];
// We exclude .firebaserc to preserve project IDs, and rebrand.js
const excludeFiles = ['pnpm-lock.yaml', 'rebrand.js', '.firebaserc', 'lint_errors.txt']; 

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (excludeDirs.includes(file)) return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      if (!excludeFiles.includes(file)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walk('.');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace variations globally
  content = content.replace(/Binimoy/g, 'Reusedo');
  content = content.replace(/binimoy/g, 'reusedo');
  content = content.replace(/BINIMOY/g, 'REUSEDO');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Rebranding complete! ${changedCount} files updated.`);
