#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Setting up directory structure..."
mkdir -p dist/public
mkdir -p uploads

# Create a simple index.html file for testing
echo "Creating index.html..."
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

# Create a simple API test file
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

echo "Build completed successfully!"

# Done!
echo "Build completed successfully!"
