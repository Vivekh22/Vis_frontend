const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const registeredComponents = {};

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
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /ComponentRegistry\.register\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    registeredComponents[match[1]] = {
      filePath,
      className: match[2]
    };
  }
});

walkSync(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [tag, info] of Object.entries(registeredComponents)) {
    const tagRegex = new RegExp(`<${tag}[>\\s]`, 'g');
    if (tagRegex.test(content)) {
      if (filePath === info.filePath) continue;
      
      const basename = path.basename(info.filePath, '.ts');
      if (!content.includes(basename)) {
        let relPath = path.relative(path.dirname(filePath), info.filePath).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;
        // Strip .ts extension
        relPath = relPath.replace(/\.ts$/, '');
        
        const importStmt = `import '${relPath}';\n`;
        
        // Find last import
        const importRegex = /^import\s+.*$/gm;
        let lastMatch;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          lastMatch = match;
        }
        
        if (lastMatch) {
          content = content.slice(0, lastMatch.index + lastMatch[0].length) + '\n' + importStmt + content.slice(lastMatch.index + lastMatch[0].length);
        } else {
          content = importStmt + content;
        }
        changed = true;
        console.log(`Added import for ${tag} in ${filePath}`);
      }
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log("Done adding missing component imports.");
