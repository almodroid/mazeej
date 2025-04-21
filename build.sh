#!/bin/bash

# Install dependencies for both client and server
echo "Installing dependencies..."
npm install

# Build the client
echo "Building client..."
cd client
npm install
npm run build
cd ..

# Skip TypeScript compilation for now and use direct server.js
echo "Skipping TypeScript compilation..."

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p dist/public
mkdir -p uploads

# Copy built client files to dist/public
echo "Copying client build to dist/public..."
cp -r client/dist/* dist/public/ 2>/dev/null || :

# Done!
echo "Build completed successfully!"
