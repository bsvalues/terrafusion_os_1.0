<?php
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
?>