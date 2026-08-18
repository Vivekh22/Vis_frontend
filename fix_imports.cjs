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

const rootDirs = fs.readdirSync(srcDir).filter(f => fs.statSync(path.join(srcDir, f)).isDirectory());

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Regex to match imports and vi.mock
  const regex = /(import\s+[^'"]*from\s+['"])([^'"]+)(['"])|(import\(['"])([^'"]+)(['"]\))|(vi\.mock\(['"])([^'"]+)(['"])/g;

  content = content.replace(regex, (match, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
    const prefix = p1 || p4 || p7;
    const importPath = p2 || p5 || p8;
    const suffix = p3 || p6 || p9;

    if (!importPath.startsWith('.')) return match;

    const absoluteImportPath = path.resolve(path.dirname(filePath), importPath);
    
    // Check if path exists (adding .ts or index.ts if necessary)
    if (fs.existsSync(absoluteImportPath) || 
        fs.existsSync(absoluteImportPath + '.ts') || 
        fs.existsSync(path.join(absoluteImportPath, 'index.ts'))) {
      return match;
    }

    // Path doesn't exist. Let's try to fix it.
    // We look for a valid root directory in the import path (e.g., 'services', 'platform')
    const parts = importPath.split('/');
    const realParts = parts.filter(p => p !== '.' && p !== '..');
    
    if (realParts.length > 0) {
      const rootFolder = realParts[0];
      if (rootDirs.includes(rootFolder)) {
        // Compute correct relative path
        const correctAbsolute = path.join(srcDir, ...realParts);
        let newRelative = path.relative(path.dirname(filePath), correctAbsolute).replace(/\\/g, '/');
        if (!newRelative.startsWith('.')) {
          newRelative = './' + newRelative;
        }
        console.log(`Fixing ${importPath} -> ${newRelative} in ${filePath}`);
        changed = true;
        return `${prefix}${newRelative}${suffix}`;
      }
    }
    
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

walkSync(srcDir, fixFile);
console.log("Done fixing imports.");
