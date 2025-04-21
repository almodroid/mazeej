// Script to fix imports in compiled JavaScript files
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively find all .js files in a directory
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace @shared imports with relative paths
  content = content.replace(/from ['"]@shared\/(.*?)['"]/g, (match, p1) => {
    // Calculate relative path from the file to the shared directory
    const relativePath = path.relative(path.dirname(filePath), path.resolve('./dist/shared')).replace(/\\/g, '/');
    return `from '${relativePath}/${p1}.js'`;
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed imports in ${filePath}`);
}

// Main function
function main() {
  console.log('Finding JS files in dist/server directory...');
  const distDir = path.resolve('./dist/server');
  
  if (!fs.existsSync(distDir)) {
    console.log('dist/server directory does not exist. Creating it...');
    fs.mkdirSync(distDir, { recursive: true });
    return;
  }
  
  const jsFiles = findJsFiles(distDir);
  console.log(`Found ${jsFiles.length} JS files.`);
  
  jsFiles.forEach(file => {
    fixImportsInFile(file);
  });
  
  console.log('All imports fixed successfully!');
}

main();
