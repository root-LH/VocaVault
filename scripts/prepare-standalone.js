const fs = require('fs');
const path = require('path');

const sourceStatic = path.join(__dirname, '../.next/static');
const destStatic = path.join(__dirname, '../.next/standalone/.next/static');

const sourcePublic = path.join(__dirname, '../public');
const destPublic = path.join(__dirname, '../.next/standalone/public');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying .next/static to standalone...');
copyDir(sourceStatic, destStatic);

console.log('Copying public to standalone...');
copyDir(sourcePublic, destPublic);

console.log('Standalone preparation complete.');
