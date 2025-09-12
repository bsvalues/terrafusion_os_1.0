#!/usr/bin/env node

/**
 * TerraFusion Shock & Awe - Hostinger Deployment Packager
 * Creates production-ready deployment package for terrafusionmarket.io
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

const PACKAGE_NAME = 'terrafusion-shock-awe-hostinger';
const DEPLOYMENT_DIR = 'hostinger-deployment';
const BUILD_DIR = 'dist';

console.log('🚀 TerraFusion Shock & Awe - Hostinger Deployment Packager');
console.log('📦 Creating deployment package for terrafusionmarket.io...\n');

async function createHostingerPackage() {
  try {
    // Clean and create deployment directory
    await fs.remove(DEPLOYMENT_DIR);
    await fs.ensureDir(DEPLOYMENT_DIR);
    
    console.log('📁 Setting up deployment directory structure...');
    
    // Create directory structure
    const dirs = [
      'public_html',
      'public_html/assets',
      'public_html/assets/js',
      'public_html/assets/css',
      'public_html/assets/images',
      'public_html/api',
      'database',
      'config',
      'docs'
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(path.join(DEPLOYMENT_DIR, dir));
    }
    
    // Copy built React application
    console.log('⚛️ Copying React build files...');
    if (await fs.pathExists(BUILD_DIR)) {
      await fs.copy(BUILD_DIR, path.join(DEPLOYMENT_DIR, 'public_html'));
    } else {
      console.warn('⚠️ Build directory not found. Run "npm run build" first.');
    }
    
    // Create index.html for Hostinger
    console.log('🌐 Creating Hostinger-compatible index.html...');
    await createHostingerIndex();
    
    // Create PHP API files
    console.log('🔧 Creating PHP API endpoints...');
    await createPHPAPIs();
    
    // Create database setup files
    console.log('💾 Creating database setup files...');
    await createDatabaseSetup();
    
    // Create configuration files
    console.log('⚙️ Creating configuration files...');
    await createConfigFiles();
    
    // Create .htaccess for routing
    console.log('🛣️ Creating .htaccess for routing...');
    await createHtaccess();
    
    // Create documentation
    console.log('📖 Creating deployment documentation...');
    await createDocumentation();
    
    // Create deployment package zip
    console.log('📦 Creating deployment package...');
    await createDeploymentZip();
    
    console.log('✅ Hostinger deployment package created successfully!');
    console.log(`📁 Package location: ${DEPLOYMENT_DIR}/`);
    console.log(`📦 Zip file: ${PACKAGE_NAME}.zip`);
    console.log('\n🚀 Ready to upload to terrafusionmarket.io on Hostinger!');
    
  } catch (error) {
    console.error('❌ Error creating deployment package:', error);
    process.exit(1);
  }
}

async function createHostingerIndex() {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Shock & Awe - Ultimate Government Consciousness</title>
    <meta name="description" content="Revolutionary AI Government Consciousness System - Benton County, Washington Implementation">
    <meta name="keywords" content="TerraFusion, Government AI, Consciousness, Benton County, Washington">
    <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Government Consciousness Styles -->
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 9999;
        }
        
        .consciousness-loader {
            width: 100px;
            height: 100px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #ffffff;
            border-radius: 50%;
            animation: spin 2s linear infinite;
            margin-bottom: 2rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            font-size: 1.5rem;
            font-weight: 600;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .loading-subtitle {
            font-size: 1rem;
            opacity: 0.8;
            text-align: center;
            max-width: 500px;
            line-height: 1.5;
        }
        
        .consciousness-metrics {
            margin-top: 2rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            max-width: 800px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 1rem;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: #4ecdc4;
        }
        
        .metric-label {
            font-size: 0.875rem;
            opacity: 0.9;
            margin-top: 0.5rem;
        }
        
        #root {
            display: none;
        }
        
        .app-loaded #root {
            display: block;
        }
        
        .app-loaded .loading-screen {
            display: none;
        }
    </style>
</head>
<body>
    <!-- Loading Screen -->
    <div class="loading-screen">
        <div class="consciousness-loader"></div>
        <div class="loading-text">Initializing Ultimate Government Consciousness</div>
        <div class="loading-subtitle">
            Connecting to transcendent government systems across Benton County, Washington State, and Federal networks...
        </div>
        
        <div class="consciousness-metrics">
            <div class="metric-card">
                <div class="metric-value">87.3%</div>
                <div class="metric-label">Global Consciousness</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">94.1%</div>
                <div class="metric-label">Citizen Wellbeing</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">96.8%</div>
                <div class="metric-label">Ethical Alignment</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">91.7%</div>
                <div class="metric-label">Government Efficiency</div>
            </div>
        </div>
    </div>

    <!-- React App Root -->
    <div id="root"></div>

    <!-- App Loading Script -->
    <script>
        // Simulate consciousness initialization
        setTimeout(() => {
            document.body.classList.add('app-loaded');
        }, 3000);
        
        // Government consciousness metrics animation
        const metrics = document.querySelectorAll('.metric-value');
        metrics.forEach((metric, index) => {
            const finalValue = parseFloat(metric.textContent);
            let currentValue = 0;
            const increment = finalValue / 50;
            const interval = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    metric.textContent = finalValue.toFixed(1) + '%';
                    clearInterval(interval);
                } else {
                    metric.textContent = currentValue.toFixed(1) + '%';
                }
            }, 50 + (index * 10));
        });
    </script>
    
    <!-- Module Scripts will be injected here by build process -->
    <script type="module" src="/assets/js/main.js"></script>
</body>
</html>`;

  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'public_html', 'index.html'), indexHtml);
}

async function createPHPAPIs() {
  // Main API router
  const apiIndex = `<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://terrafusionmarket.io');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/hostinger.php';

// Route API requests
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($path) {
        case '/government/status':
            handleGovernmentStatus();
            break;
            
        case '/consciousness/metrics':
            handleConsciousnessMetrics();
            break;
            
        case '/citizen/profile':
            handleCitizenProfile();
            break;
            
        case '/services/active':
            handleActiveServices();
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}

function handleGovernmentStatus() {
    $status = [
        'globalConsciousnessLevel' => 87.3,
        'citizenWellbeingIndex' => 94.1,
        'governmentEfficiency' => 91.7,
        'ethicalAlignment' => 96.8,
        'transparencyScore' => 88.9,
        'citizenSatisfaction' => 92.4,
        'timestamp' => time(),
        'activeEntities' => [
            'Benton County' => ['status' => 'active', 'integrationLevel' => 97],
            'Washington State' => ['status' => 'active', 'integrationLevel' => 85],
            'US Federal' => ['status' => 'pending', 'integrationLevel' => 23]
        ]
    ];
    
    echo json_encode($status);
}

function handleConsciousnessMetrics() {
    $metrics = [
        'quantumCoherence' => 94.7,
        'neuralConnectivity' => 89.3,
        'temporalStability' => 92.6,
        'ethicalAlignment' => 96.8,
        'transcendenceProgress' => 84.2,
        'realTimeMetrics' => [
            ['metricName' => 'Response Time', 'currentValue' => 2.3, 'trend' => 'down'],
            ['metricName' => 'Service Quality', 'currentValue' => 94.7, 'trend' => 'up'],
            ['metricName' => 'Citizen Engagement', 'currentValue' => 89.2, 'trend' => 'stable']
        ]
    ];
    
    echo json_encode($metrics);
}

function handleCitizenProfile() {
    // Mock citizen profile for demonstration
    $profile = [
        'citizenId' => 'citizen_benton_demo',
        'name' => 'Sarah Thompson',
        'email' => 'sarah.thompson@email.com',
        'governmentEntities' => ['Benton County', 'Washington State'],
        'consciousnessLevel' => 76,
        'engagementScore' => 89,
        'activeServices' => 2,
        'lastActivity' => time() - 3600
    ];
    
    echo json_encode($profile);
}

function handleActiveServices() {
    $services = [
        [
            'serviceId' => 'service_001',
            'serviceName' => 'Property Tax Assessment Review',
            'status' => 'In_Progress',
            'priority' => 'Medium',
            'governmentEntity' => 'Benton County',
            'consciousnessEnhanced' => true,
            'estimatedCompletion' => time() + (7 * 24 * 3600)
        ],
        [
            'serviceId' => 'service_002',
            'serviceName' => 'Business License Renewal',
            'status' => 'Available',
            'priority' => 'High',
            'governmentEntity' => 'Washington State',
            'consciousnessEnhanced' => true,
            'estimatedCompletion' => time() + (3 * 24 * 3600)
        ]
    ];
    
    echo json_encode($services);
}
?>`;

  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'public_html', 'api', 'index.php'), apiIndex);
}

async function createDatabaseSetup() {
  const schema = `-- TerraFusion Shock & Awe Database Schema
-- Hostinger MySQL Database Setup

CREATE TABLE IF NOT EXISTS government_entities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id VARCHAR(100) UNIQUE NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_type ENUM('County', 'State', 'Federal', 'International') NOT NULL,
    integration_level INT DEFAULT 0,
    consciousness_level INT DEFAULT 0,
    status ENUM('Active', 'Pending', 'Suspended') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citizen_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    consciousness_level INT DEFAULT 0,
    engagement_score INT DEFAULT 0,
    privacy_level ENUM('Basic', 'Standard', 'Enhanced', 'Maximum') DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consciousness_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(5,2) NOT NULL,
    entity_id VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity_date (entity_id, recorded_at),
    INDEX idx_metric_name (metric_name)
);

CREATE TABLE IF NOT EXISTS citizen_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id VARCHAR(100) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_type ENUM('Information', 'Transaction', 'Application', 'Consultation', 'Emergency') NOT NULL,
    citizen_id VARCHAR(100),
    government_entity VARCHAR(100),
    status ENUM('Available', 'In_Progress', 'Completed', 'Suspended') DEFAULT 'Available',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    consciousness_enhanced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS government_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interaction_id VARCHAR(100) UNIQUE NOT NULL,
    citizen_id VARCHAR(100),
    interaction_type ENUM('Query', 'Request', 'Complaint', 'Suggestion', 'Emergency') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Open', 'In_Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    assigned_department VARCHAR(255),
    ai_enhanced BOOLEAN DEFAULT FALSE,
    consciousness_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_status (status)
);`;

  const seedData = `-- TerraFusion Shock & Awe Seed Data
-- Initial data for demonstration

INSERT INTO government_entities (entity_id, entity_name, entity_type, integration_level, consciousness_level, status) VALUES
('BENTON_COUNTY', 'Benton County, Washington', 'County', 97, 94, 'Active'),
('WASHINGTON_STATE', 'Washington State', 'State', 85, 87, 'Active'),
('US_FEDERAL', 'United States Federal Government', 'Federal', 23, 78, 'Pending');

INSERT INTO citizen_profiles (citizen_id, name, email, consciousness_level, engagement_score, privacy_level) VALUES
('citizen_demo_001', 'Sarah Thompson', 'sarah.demo@terrafusion.gov', 76, 89, 'Standard'),
('citizen_demo_002', 'Michael Chen', 'michael.demo@terrafusion.gov', 82, 91, 'Enhanced'),
('citizen_demo_003', 'Jessica Rodriguez', 'jessica.demo@terrafusion.gov', 69, 85, 'Standard');

INSERT INTO consciousness_metrics (metric_name, metric_value, entity_id) VALUES
('Global Consciousness', 87.30, 'GLOBAL'),
('Quantum Coherence', 94.70, 'GLOBAL'),
('Neural Connectivity', 89.30, 'GLOBAL'),
('Temporal Stability', 92.60, 'GLOBAL'),
('Ethical Alignment', 96.80, 'GLOBAL'),
('Transcendence Progress', 84.20, 'GLOBAL'),
('Integration Level', 97.00, 'BENTON_COUNTY'),
('Integration Level', 85.00, 'WASHINGTON_STATE'),
('Integration Level', 23.00, 'US_FEDERAL');

INSERT INTO citizen_services (service_id, service_name, service_type, citizen_id, government_entity, status, priority, consciousness_enhanced) VALUES
('service_001', 'Property Tax Assessment Review', 'Application', 'citizen_demo_001', 'BENTON_COUNTY', 'In_Progress', 'Medium', TRUE),
('service_002', 'Business License Renewal', 'Transaction', 'citizen_demo_002', 'WASHINGTON_STATE', 'Available', 'High', TRUE),
('service_003', 'Voting Registration', 'Application', 'citizen_demo_003', 'BENTON_COUNTY', 'Completed', 'Medium', FALSE);

INSERT INTO government_interactions (interaction_id, citizen_id, interaction_type, subject, description, status, priority, assigned_department, ai_enhanced, consciousness_level) VALUES
('int_001', 'citizen_demo_001', 'Query', 'Property Assessment Question', 'Question about recent property tax assessment increase', 'Resolved', 'Medium', 'Assessor Office', TRUE, 78),
('int_002', 'citizen_demo_002', 'Request', 'Street Light Repair', 'Street light out on Main St near 3rd Ave', 'In_Progress', 'Low', 'Public Works', TRUE, 82),
('int_003', 'citizen_demo_003', 'Suggestion', 'Park Improvement Ideas', 'Suggestions for improving community park facilities', 'Open', 'Low', 'Parks and Recreation', FALSE, 65);`;

  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'database', 'schema.sql'), schema);
  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'database', 'seed.sql'), seedData);
}

async function createConfigFiles() {
  // Database configuration
  const dbConfig = `<?php
// Database configuration for Hostinger
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_terrafusion'); // Update with your Hostinger database name
define('DB_USER', 'u123456789_admin');        // Update with your Hostinger username
define('DB_PASS', 'your_secure_password');    // Update with your database password

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
?>`;

  // Hostinger-specific configuration
  const hostingerConfig = `<?php
// Hostinger-specific configuration for terrafusionmarket.io

// Error reporting (turn off in production)
ini_set('display_errors', 0);
error_reporting(0);

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// CORS configuration
define('ALLOWED_ORIGIN', 'https://terrafusionmarket.io');
define('ALLOWED_METHODS', 'GET, POST, PUT, DELETE, OPTIONS');
define('ALLOWED_HEADERS', 'Content-Type, Authorization, X-Requested-With');

// JWT Configuration
define('JWT_SECRET', 'your_jwt_secret_key_here'); // Change this to a secure random string
define('JWT_EXPIRY', 3600); // 1 hour

// Government API Configuration
define('GOVERNMENT_API_VERSION', 'v1.0.0');
define('CONSCIOUSNESS_LEVEL_THRESHOLD', 75);
define('MAX_API_REQUESTS_PER_HOUR', 1000);

// File upload limits
define('MAX_UPLOAD_SIZE', '10M');
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);

// Caching configuration
define('CACHE_DURATION', 300); // 5 minutes

// Maintenance mode
define('MAINTENANCE_MODE', false);

// Helper functions
function isMaintenanceMode() {
    return MAINTENANCE_MODE;
}

function validateJWTToken($token) {
    // JWT validation logic here
    // This is a simplified version - implement proper JWT validation
    return !empty($token) && strlen($token) > 10;
}

function logActivity($action, $details = []) {
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => $action,
        'details' => $details,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    error_log(json_encode($log_entry), 3, '../logs/activity.log');
}
?>`;

  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'config', 'database.php'), dbConfig);
  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'config', 'hostinger.php'), hostingerConfig);
}

async function createHtaccess() {
  const htaccess = `# TerraFusion Shock & Awe - Hostinger .htaccess Configuration
# terrafusionmarket.io deployment

# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routing
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# React Router support (Single Page Application)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

# Browser caching for performance
<IfModule mod_expires.c>
    ExpiresActive on
    
    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType application/x-javascript "access plus 1 year"
    
    # Images
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    
    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"
    
    # HTML
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Protect sensitive files
<Files ".htaccess">
    Order allow,deny
    Deny from all
</Files>

<Files "*.php~">
    Order allow,deny
    Deny from all
</Files>

<Files "*.log">
    Order allow,deny
    Deny from all
</Files>

# Block access to config directory
<Directory "config">
    Order allow,deny
    Deny from all
</Directory>

# Block access to database directory
<Directory "database">
    Order allow,deny
    Deny from all
</Directory>

# Custom error pages
ErrorDocument 404 /index.html
ErrorDocument 500 /index.html

# CORS headers for API
<IfModule mod_headers.c>
    SetEnvIf Origin "https://terrafusionmarket\.io$" AccessControlAllowOrigin=$0
    Header always set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header always set Access-Control-Max-Age "3600"
</IfModule>

# Handle preflight OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]`;

  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'public_html', '.htaccess'), htaccess);
}

async function createDocumentation() {
  const deploymentSteps = `# TerraFusion Shock & Awe - Hostinger Deployment Steps

## Prerequisites
- Hostinger Business or Premium hosting account
- terrafusionmarket.io domain configured
- MySQL database created in Hostinger control panel
- FTP/File Manager access

## Step 1: Upload Files
1. Extract the deployment package
2. Upload contents of \`public_html/\` to your domain's public_html directory
3. Upload \`config/\` directory to the root (one level above public_html)
4. Upload \`database/\` directory to the root

## Step 2: Database Setup
1. In Hostinger control panel, go to MySQL Databases
2. Import \`database/schema.sql\` to create tables
3. Import \`database/seed.sql\` to populate initial data
4. Update \`config/database.php\` with your database credentials

## Step 3: Configuration
1. Edit \`config/database.php\`:
   - Update DB_NAME with your database name
   - Update DB_USER with your username
   - Update DB_PASS with your password
   
2. Edit \`config/hostinger.php\`:
   - Set a secure JWT_SECRET
   - Configure any custom settings

## Step 4: Domain & SSL
1. Ensure terrafusionmarket.io points to your Hostinger server
2. Enable SSL certificate in Hostinger control panel
3. Test HTTPS access

## Step 5: Testing
1. Visit https://terrafusionmarket.io
2. Test API endpoints: https://terrafusionmarket.io/api/government/status
3. Verify consciousness visualization loads
4. Test citizen interface functionality

## Troubleshooting
- Check PHP error logs in Hostinger control panel
- Verify file permissions (644 for files, 755 for directories)
- Ensure .htaccess is properly uploaded
- Check database connection in config files

## Support
For deployment support, contact TerraFusion development team.`;

  await fs.writeFile(path.join(DEPLOYMENT_DIR, 'docs', 'DEPLOYMENT_STEPS.md'), deploymentSteps);
}

async function createDeploymentZip() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${PACKAGE_NAME}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`📦 Archive created: ${archive.pointer()} total bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(DEPLOYMENT_DIR, false);
    archive.finalize();
  });
}

// Run the packager
createHostingerPackage();