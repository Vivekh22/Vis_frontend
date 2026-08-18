const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Gather all registered components: tag -> { file, className }
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
  // ComponentRegistry.register('tag-name', ClassName);
  const regex = /ComponentRegistry\.register\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_]+)\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    registeredComponents[match[1]] = {
      filePath,
      className: match[2]
    };
  }
});

// 2. Scan all files for tags and check if the import is missing
const errors = [];
walkSync(srcDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  
  for (const [tag, info] of Object.entries(registeredComponents)) {
    // If the tag is used in this file's html`...<tag...`
    const tagRegex = new RegExp(`<${tag}[>\\s]`, 'g');
    if (tagRegex.test(content)) {
      // Check if it's imported (or if it's the file itself)
      if (filePath === info.filePath) continue;
      
      const basename = path.basename(info.filePath, '.ts');
      if (!content.includes(basename)) {
        errors.push({
          file: filePath,
          missingTag: tag,
          missingComponent: basename
        });
      }
    }
  }
});

console.log(JSON.stringify(errors, null, 2));
