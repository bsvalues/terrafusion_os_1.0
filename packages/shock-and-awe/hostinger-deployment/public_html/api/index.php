<?php
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
?>