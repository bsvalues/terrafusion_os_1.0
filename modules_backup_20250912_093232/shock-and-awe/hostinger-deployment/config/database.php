<?php
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
?>