const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkSync(fullPath, callback);
    } else if (fullPath.endsWith('.ts')) {
      callback(fullPath);
    }
  }
}

walkSync(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // replace import {  } from '.../Something' with import { Something } from '.../Something'
  const regex = /import\s*\{\s*\}\s*from\s*['"]([^'"]+)['"]/g;
  
  content = content.replace(regex, (match, importPath) => {
    // The class/symbol name is usually the last part of the path
    const parts = importPath.split('/');
    const basename = parts[parts.length - 1];
    
    // We can extract the name. If it's a file like 'LoginPageElement', the class is 'LoginPageElement'.
    // If it's 'AuthService', the class is 'AuthService'.
    console.log(`Fixing empty import in ${filePath}: ${basename}`);
    changed = true;
    return `import { ${basename} } from '${importPath}'`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log("Done fixing empty imports.");
