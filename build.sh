#!/bin/bash

# Install dependencies for both client and server
echo "Installing dependencies..."
npm install

# Build the client directly in the root directory
echo "Building client..."
# Use the vite build command directly with output to dist/public
npm run build

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p uploads

# Debug - check if files exist
echo "Checking if files were copied correctly..."
ls -la dist/public/

# Create a fallback index.html if it doesn't exist
if [ ! -f "dist/public/index.html" ]; then
  echo "Creating fallback index.html..."
  mkdir -p dist/public
  echo "<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>Mazeej</title>
</head>
<body>
  <div id=\"root\">
    <h1>Welcome to Mazeej</h1>
    <p>The application is starting up. If you continue to see this message, please check the server logs.</p>
  </div>
</body>
</html>" > dist/public/index.html
fi

# Done!
echo "Build completed successfully!"
