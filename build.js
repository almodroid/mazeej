import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Ensure the dist/public directory exists for client files
if (!fs.existsSync('dist/public')) {
  fs.mkdirSync('dist/public', { recursive: true });
}

console.log('Building server...');
try {
  // Build the server
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit'
  });
  console.log('Server build successful!');
} catch (error) {
  console.error('Server build failed:', error);
  process.exit(1);
}

console.log('Copying client files...');
try {
  // Copy client files to dist/public
  // This is a simple alternative to building with Vite
  // Copy index.html
  fs.copyFileSync('client/index.html', 'dist/public/index.html');
  
  // Copy client/src to dist/public/src
  if (fs.existsSync('client/src')) {
    copyDir('client/src', 'dist/public/src');
  }
  
  // Copy client/public to dist/public
  if (fs.existsSync('client/public')) {
    copyDir('client/public', 'dist/public');
  }
  
  console.log('Client files copied successfully!');
} catch (error) {
  console.error('Failed to copy client files:', error);
  process.exit(1);
}

console.log('Build completed successfully!');

// Helper function to copy directories recursively
function copyDir(src, dest) {
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
