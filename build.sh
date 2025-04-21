#!/bin/bash

# Install dependencies for both client and server
echo "Installing dependencies..."
npm install
npm install --save-dev @types/express-session tsconfig-paths

# Build the client
echo "Building client..."
cd client
npm install
npm run build
cd ..

# Compile server TypeScript files (without JSX)
echo "Compiling server TypeScript files..."
npx tsc --project tsconfig.server.json

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p dist/server/routes
mkdir -p dist/shared

# Ensure server directories exist
mkdir -p server/routes

# Copy non-TypeScript files and ensure all required directories exist
echo "Copying additional files..."
cp -r shared/* dist/shared/ 2>/dev/null || :

# Fix imports in compiled files
echo "Fixing imports in compiled files..."
node fix-imports.js

# Done!
echo "Build completed successfully!"
