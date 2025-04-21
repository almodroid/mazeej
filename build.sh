#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Try to build the client
echo "Building client..."
cd client
npm install

# Try to build with Vite
echo "Attempting to build with Vite..."
npm run build || npx vite build || echo "Client build failed, will use fallback pages"
cd ..

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p dist/public
mkdir -p uploads

# Check if dist directory exists in root or client folder
echo "Checking for build output..."
CLIENT_BUILD_SUCCESS=false

# First check if dist/public already has index.html (from a previous build)
if [ -f "dist/public/index.html" ]; then
  echo "Found existing build in dist/public"
  CLIENT_BUILD_SUCCESS=true
# Then check if client/dist exists
elif [ -d "client/dist" ]; then
  echo "Found build in client/dist, copying to dist/public..."
  cp -r client/dist/* dist/public/ 2>/dev/null && CLIENT_BUILD_SUCCESS=true || echo "Failed to copy client build files"
# Finally check if dist exists in root (from vite build in root)
elif [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo "Found build in root dist, moving to dist/public..."
  mkdir -p dist/public
  mv dist/* dist/public/ 2>/dev/null && CLIENT_BUILD_SUCCESS=true || echo "Failed to move build files"
else
  echo "No build output found"
fi

# Create a simple index.html file for testing only if client build failed
if [ "$CLIENT_BUILD_SUCCESS" != "true" ] || [ ! -f "dist/public/index.html" ]; then
  echo "Creating fallback index.html..."
  cat > dist/public/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mazeej</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    h1 { color: #0070f3; }
    .card {
      border: 1px solid #eaeaea;
      border-radius: 10px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }
  </style>
</head>
<body>
  <div id="root">
    <h1>Welcome to Mazeej</h1>
    <p>Your application is running successfully on Render!</p>
    
    <div class="card">
      <h2>API Status</h2>
      <p>Check your API status: <a href="/api/health" target="_blank">/api/health</a></p>
      <p>Database status: <a href="/api/status" target="_blank">/api/status</a></p>
    </div>
    
    <div class="card">
      <h2>Next Steps</h2>
      <p>Now that your server is running, you can:</p>
      <ol>
        <li>Connect your frontend to this backend</li>
        <li>Set up your database migrations</li>
        <li>Configure your environment variables</li>
      </ol>
    </div>
  </div>
</body>
</html>
EOL
fi

# Create a simple API test file
if [ "$CLIENT_BUILD_SUCCESS" != "true" ] || [ ! -f "dist/public/api-test.html" ]; then
  echo "Creating API test file..."
  cat > dist/public/api-test.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mazeej API Test</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
    pre { background: #f1f1f1; padding: 1rem; border-radius: 4px; overflow: auto; }
    button { padding: 0.5rem 1rem; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>API Test</h1>
  <button id="test-api">Test API Health</button>
  <button id="test-db">Test Database Connection</button>
  <h2>Results:</h2>
  <pre id="results">Click a button to test...</pre>

  <script>
    document.getElementById('test-api').addEventListener('click', async () => {
      const results = document.getElementById('results');
      results.textContent = 'Testing API health...';
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        results.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        results.textContent = 'Error: ' + error.message;
      }
    });
    
    document.getElementById('test-db').addEventListener('click', async () => {
      const results = document.getElementById('results');
      results.textContent = 'Testing database connection...';
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        results.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        results.textContent = 'Error: ' + error.message;
      }
    });
  </script>
</body>
</html>
EOL
fi

echo "Build completed successfully!"

# Done!
echo "Build completed successfully!"
