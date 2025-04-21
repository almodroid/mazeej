// build.js - A simple build script for Render deployment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we're in production mode
process.env.NODE_ENV = 'production';

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Create server directory inside dist if it doesn't exist
if (!fs.existsSync('dist/server')) {
  fs.mkdirSync('dist/server', { recursive: true });
}

console.log('Building frontend...');
try {
  // Build the frontend using Vite directly
  execSync('npx vite build --outDir dist --emptyOutDir', { stdio: 'inherit' });
  console.log('Frontend build completed successfully');
} catch (error) {
  console.error('Frontend build failed:', error);
  process.exit(1);
}

console.log('Building backend...');
try {
  // Build the backend using esbuild directly
  execSync('npx esbuild server/index.ts server/migrate.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server', 
    { stdio: 'inherit' });
  console.log('Backend build completed successfully');
} catch (error) {
  console.error('Backend build failed:', error);
  process.exit(1);
}

console.log('Build completed successfully!');
