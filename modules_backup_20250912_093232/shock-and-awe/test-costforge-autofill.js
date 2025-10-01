/**
 * Test CostForge Auto-Fill Functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        fs.readFile('./404.html', (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

console.log('🧪 TESTING COSTFORGE AUTO-FILL');
console.log('==============================');
console.log('');
console.log('✅ Starting test server on port \${{TF_ADMIN_PORT:-8080}}...');
console.log('🌐 Navigate to: http://localhost:\${{TF_ADMIN_PORT:-8080}}');
console.log('');
console.log('TEST INSTRUCTIONS:');
console.log('1. Click on any feature card to launch');
console.log('2. Launch CostForge AI wizard');
console.log('3. Select a property type (Residential, Commercial, etc.)');
console.log('4. Look for auto-fill notification');
console.log('5. Navigate through steps to verify fields are populated');
console.log('');
console.log('EXPECTED RESULTS:');
console.log('- ✅ Notification appears when property type is selected');
console.log('- ✅ Step 2 fields auto-populate with sample data');
console.log('- ✅ Step 3 quality and features are pre-selected');
console.log('- ✅ Different property types have different sample data');
console.log('');

server.listen(8080, () => {
  console.log('🚀 Test server running at http://localhost:\${{TF_ADMIN_PORT:-8080}}');
  console.log('Press Ctrl+C to stop server');
});
