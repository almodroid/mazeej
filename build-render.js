// build-render.js - Custom build script for Render deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set production environment
process.env.NODE_ENV = 'production';

console.log('Starting build process for Render deployment...');

// Create necessary directories
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}
if (!fs.existsSync('dist/server')) {
  fs.mkdirSync('dist/server', { recursive: true });
}

// Function to run commands safely
function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error: ${errorMessage}`);
    console.error(error.message);
    return false;
  }
}

// Build frontend
console.log('\n=== Building Frontend ===');
// Copy client/index.html to the root temporarily if it doesn't exist there
if (!fs.existsSync('index.html') && fs.existsSync('client/index.html')) {
  console.log('Copying index.html from client directory...');
  fs.copyFileSync('client/index.html', 'index.html');
}

// Build the frontend using direct path to vite binary
if (!runCommand('./node_modules/.bin/vite build', 'Frontend build failed')) {
  process.exit(1);
}

// Clean up temporary index.html if we created it
if (fs.existsSync('index.html') && !fs.existsSync('client/index.html')) {
  fs.unlinkSync('index.html');
}

// Build backend
console.log('\n=== Building Backend ===');
if (!runCommand('./node_modules/.bin/esbuild server/index.ts server/migrate.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server', 'Backend build failed')) {
  process.exit(1);
}

console.log('\n=== Build Completed Successfully! ===');
