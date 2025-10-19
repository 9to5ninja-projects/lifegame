#!/usr/bin/env node
/**
 * Simple HTTP Server for UI Testing
 * Run: node test_ui_server.js
 * Then open: http://localhost:8000/standalone_html_game.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.csv': 'text/csv'
};

const server = http.createServer((req, res) => {
  // Parse URL without query params
  const urlPath = req.url.split('?')[0];
  console.log(`${new Date().toISOString()} - ${req.method} ${urlPath}`);

  let filePath = urlPath === '/' ? '/standalone_html_game.html' : urlPath;
  filePath = path.join(__dirname, filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`File not found: ${req.url}`);
    console.log(`  ❌ 404 - File not found`);
    return;
  }

  // Check if it's a directory (serve index if directory)
  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'standalone_html_game.html');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
  }

  // Get MIME type
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server error: ${err.message}`);
      console.log(`  ❌ 500 - ${err.message}`);
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
      console.log(`  ✓ 200 - ${mimeType}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🎮 MORTALITY LOTTERY TEST SERVER`);
  console.log(`=====================================`);
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Game URL: http://localhost:${PORT}/standalone_html_game.html`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  } else {
    console.error(`❌ Server error:`, err);
  }
  process.exit(1);
});
