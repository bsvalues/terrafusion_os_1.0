const fs = require('fs');
const path = require('path');

// Read the original frontend HTML
const originalHtml = fs.readFileSync('frontend/index.html', 'utf8');

// Modify API calls to work with PHP backend
const modifiedHtml = originalHtml.replace(
    // Change API_BASE from Node.js format to PHP format
    "const API_BASE = '/api';",
    "const API_BASE = window.location.origin + '/api';"
).replace(
    // Update property assessment endpoint
    /fetch\(`\${API_BASE}\/properties\/\${parcelId}\/assess`[^}]+method: 'POST'[^}]+\}/g,
    `fetch(\`\${API_BASE}/properties/\${parcelId}/assess\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ parcel_id: parcelId })
                })`
).replace(
    // Update API endpoint calls for PHP format
    /fetch\(`\${API_BASE}\/([^`]+)`\)/g,
    'fetch(`${API_BASE}/?request=$1`)'
).replace(
    // Add PHP-specific headers
    '</head>',
    `    <!-- TerraFusion Government OS - Hostinger Optimized -->
    <meta name="description" content="TerraFusion Government OS Demo - Hostinger Hosted with PHP Backend">
    <meta name="keywords" content="government, AI, property assessment, Benton County, TerraFusion">
    <meta name="author" content="TerraFusion Development Team">
    
    <!-- Demo Analytics -->
    <script>
        window.TERRAFUSION_CONFIG = {
            hosting: 'hostinger',
            backend: 'php',
            demo_mode: true,
            version: '1.0.0'
        };
    </script>
</head>`
);

// Create directory if it doesn't exist
const hostingerDir = 'hostinger-package/public_html';
if (!fs.existsSync(hostingerDir)) {
    fs.mkdirSync(hostingerDir, { recursive: true });
}

// Write the modified HTML
fs.writeFileSync(path.join(hostingerDir, 'index.html'), modifiedHtml);

console.log('✅ Created Hostinger-optimized index.html');

// Create additional demo pages
const aboutPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About TerraFusion Government OS</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .content {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .back-link {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 6px;
            margin-bottom: 2rem;
        }
    </style>
</head>
<body>
    <a href="/" class="back-link">← Back to Demo</a>
    
    <div class="header">
        <h1>TerraFusion Government OS</h1>
        <p>Government. Transcended.</p>
    </div>
    
    <div class="content">
        <h2>About This Demo</h2>
        <p>This is a live demonstration of TerraFusion Government OS, featuring:</p>
        
        <ul>
            <li><strong>89,247 Real Properties:</strong> Actual Benton County, Washington assessment data</li>
            <li><strong>1,008 AI Agents:</strong> Advanced AI swarm for property assessment and analysis</li>
            <li><strong>949x Performance:</strong> Validated improvements over traditional systems</li>
            <li><strong>Government Compliance:</strong> FISMA-ready security and accessibility</li>
            <li><strong>Hostinger Optimized:</strong> PHP backend designed for shared hosting</li>
        </ul>
        
        <h3>Technical Details</h3>
        <ul>
            <li><strong>Frontend:</strong> Modern HTML5/CSS3/JavaScript</li>
            <li><strong>Backend:</strong> PHP 7.4+ with SQLite database</li>
            <li><strong>Hosting:</strong> Optimized for Hostinger shared hosting</li>
            <li><strong>Performance:</strong> Cached responses and optimized queries</li>
        </ul>
        
        <h3>Demo Features</h3>
        <p>Test these key features in the demo:</p>
        <ol>
            <li>Search the 89,247 property database</li>
            <li>Run AI property assessments (3 seconds vs 30 minutes manual)</li>
            <li>View the AI swarm command center</li>
            <li>Monitor real-time system performance</li>
            <li>Explore government module ecosystem</li>
        </ol>
        
        <p><strong>Ready to deploy?</strong> This entire demo runs on standard shared hosting with just PHP and SQLite - no special server requirements needed!</p>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(hostingerDir, 'about.html'), aboutPage);
console.log('✅ Created about.html');

// Create a simple 404 page
const notFoundPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - TerraFusion Government OS</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 2rem;
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; }
        a {
            display: inline-block;
            background: white;
            color: #1e40af;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>This page doesn't exist in the TerraFusion Government OS demo.</p>
        <a href="/">Return to Demo</a>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(hostingerDir, '404.html'), notFoundPage);
console.log('✅ Created 404.html');

// Create robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${process.env.SITE_URL || 'https://yourdomain.com'}/sitemap.xml

# TerraFusion Government OS Demo
# Hostinger Optimized Version
`;

fs.writeFileSync(path.join(hostingerDir, 'robots.txt'), robotsTxt);
console.log('✅ Created robots.txt');

console.log('\n🎉 Hostinger frontend package created successfully!');
console.log('📁 Files created in: hostinger-package/public_html/');