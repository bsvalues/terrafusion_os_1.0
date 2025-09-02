/**
 * Real Browser Test - Actually diagnose what's happening
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
        '.css': 'text/css'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('File not found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server error: '+error.code+'\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

console.log('🔍 REAL BROWSER DIAGNOSTIC TEST');
console.log('================================');
console.log('');
console.log('🌐 Starting diagnostic server on port 8080');
console.log('📍 URL: http://localhost:8080');
console.log('');
console.log('DIAGNOSTIC INSTRUCTIONS:');
console.log('1. Open browser and navigate to URL');
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Click on ANY feature card');
console.log('5. Look for JavaScript errors in console');
console.log('');
console.log('WHAT TO CHECK:');
console.log('- ❌ JavaScript errors when clicking cards');
console.log('- ❌ "function not defined" errors');
console.log('- ❌ Missing file/404 errors'); 
console.log('- ❌ CSS blocking interactions');
console.log('- ❌ Event binding failures');
console.log('');
console.log('Copy any errors you see and we can fix them!');
console.log('');

server.listen(8081, () => {
    console.log('🚀 Diagnostic server ready on port 8081 - check browser console for real errors!');
    console.log('🌐 URL: http://localhost:8081');
});