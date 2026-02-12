const express = require('express');
const router = express.Router();

// Mock data for monitoring metrics
const metrics = {
  cpu: [
    { timestamp: '2025-05-19T15:00:00Z', value: 35 },
    { timestamp: '2025-05-19T15:15:00Z', value: 42 },
    { timestamp: '2025-05-19T15:30:00Z', value: 64 },
    { timestamp: '2025-05-19T15:45:00Z', value: 52 },
    { timestamp: '2025-05-19T16:00:00Z', value: 38 },
    { timestamp: '2025-05-19T16:15:00Z', value: 45 },
    { timestamp: '2025-05-19T16:30:00Z', value: 50 },
    { timestamp: '2025-05-19T16:45:00Z', value: 48 },
    { timestamp: '2025-05-19T17:00:00Z', value: 42 },
  ],
  memory: [
    { timestamp: '2025-05-19T15:00:00Z', value: 45 },
    { timestamp: '2025-05-19T15:15:00Z', value: 47 },
    { timestamp: '2025-05-19T15:30:00Z', value: 58 },
    { timestamp: '2025-05-19T15:45:00Z', value: 61 },
    { timestamp: '2025-05-19T16:00:00Z', value: 62 },
    { timestamp: '2025-05-19T16:15:00Z', value: 60 },
    { timestamp: '2025-05-19T16:30:00Z', value: 64 },
    { timestamp: '2025-05-19T16:45:00Z', value: 67 },
    { timestamp: '2025-05-19T17:00:00Z', value: 65 },
  ],
  disk: [
    { timestamp: '2025-05-19T15:00:00Z', value: 68 },
    { timestamp: '2025-05-19T15:15:00Z', value: 68 },
    { timestamp: '2025-05-19T15:30:00Z', value: 69 },
    { timestamp: '2025-05-19T15:45:00Z', value: 70 },
    { timestamp: '2025-05-19T16:00:00Z', value: 71 },
    { timestamp: '2025-05-19T16:15:00Z', value: 73 },
    { timestamp: '2025-05-19T16:30:00Z', value: 75 },
    { timestamp: '2025-05-19T16:45:00Z', value: 75 },
    { timestamp: '2025-05-19T17:00:00Z', value: 76 },
  ],
  network: [
    { timestamp: '2025-05-19T15:00:00Z', inbound: 120, outbound: 85 },
    { timestamp: '2025-05-19T15:15:00Z', inbound: 145, outbound: 95 },
    { timestamp: '2025-05-19T15:30:00Z', inbound: 210, outbound: 180 },
    { timestamp: '2025-05-19T15:45:00Z', inbound: 190, outbound: 150 },
    { timestamp: '2025-05-19T16:00:00Z', inbound: 160, outbound: 110 },
    { timestamp: '2025-05-19T16:15:00Z', inbound: 175, outbound: 125 },
    { timestamp: '2025-05-19T16:30:00Z', inbound: 185, outbound: 155 },
    { timestamp: '2025-05-19T16:45:00Z', inbound: 165, outbound: 130 },
    { timestamp: '2025-05-19T17:00:00Z', inbound: 145, outbound: 95 },
  ]
};

// Mock data for services
const services = [
  {
    id: '1',
    name: 'API Gateway',
    status: 'healthy',
    uptime: '99.98%',
    responseTime: '120ms',
    lastCheck: '2025-05-19T17:00:00Z',
    metrics: {
      cpu: 42,
      memory: 65,
      disk: 76,
      requests: 1250,
      errors: 3
    }
  },
  {
    id: '2',
    name: 'Payment Processor',
    status: 'degraded',
    uptime: '99.5%',
    responseTime: '320ms',
    lastCheck: '2025-05-19T17:00:00Z',
    metrics: {
      cpu: 78,
      memory: 82,
      disk: 55,
      requests: 850,
      errors: 42
    }
  },
  {
    id: '3',
    name: 'User Service',
    status: 'healthy',
    uptime: '99.9%',
    responseTime: '85ms',
    lastCheck: '2025-05-19T17:00:00Z',
    metrics: {
      cpu: 35,
      memory: 60,
      disk: 45,
      requests: 950,
      errors: 5
    }
  },
  {
    id: '4',
    name: 'Auth Database',
    status: 'warning',
    uptime: '99.95%',
    responseTime: '45ms',
    lastCheck: '2025-05-19T17:00:00Z',
    metrics: {
      cpu: 65,
      memory: 75,
      disk: 80,
      connections: 125,
      queryLatency: '10ms'
    }
  },
  {
    id: '5',
    name: 'Search Service',
    status: 'warning',
    uptime: '99.8%',
    responseTime: '220ms',
    lastCheck: '2025-05-19T17:00:00Z',
    metrics: {
      cpu: 72,
      memory: 88,
      disk: 60,
      requests: 750,
      errors: 25
    }
  }
];

// Mock data for alerts
const alerts = [
  {
    id: '1',
    severity: 'critical',
    source: 'API Gateway',
    message: 'High CPU usage on API Gateway server',
    timestamp: '2025-05-19T16:25:00Z',
    acknowledged: false,
    details: {
      metric: 'CPU',
      threshold: '80%',
      value: '92%',
      duration: '5m'
    }
  },
  {
    id: '2',
    severity: 'warning',
    source: 'Auth Database',
    message: 'Database connection pool nearing capacity',
    timestamp: '2025-05-19T16:05:00Z',
    acknowledged: false,
    details: {
      metric: 'Connections',
      threshold: '100',
      value: '125',
      duration: '10m'
    }
  },
  {
    id: '3',
    severity: 'warning',
    source: 'Search Service',
    message: 'High memory usage on search service',
    timestamp: '2025-05-19T15:45:00Z',
    acknowledged: false,
    details: {
      metric: 'Memory',
      threshold: '80%',
      value: '88%',
      duration: '15m'
    }
  },
  {
    id: '4',
    severity: 'info',
    source: 'User Service',
    message: 'Increased latency in user authentication',
    timestamp: '2025-05-19T15:30:00Z',
    acknowledged: true,
    details: {
      metric: 'Response Time',
      threshold: '200ms',
      value: '230ms',
      duration: '5m'
    }
  },
  {
    id: '5',
    severity: 'critical',
    source: 'Payment Processor',
    message: 'Payment processor service experiencing high error rates',
    timestamp: '2025-05-19T15:10:00Z',
    acknowledged: true,
    details: {
      metric: 'Error Rate',
      threshold: '1%',
      value: '4.9%',
      duration: '10m'
    }
  }
];

// GET monitoring metrics
router.get('/metrics', (req, res) => {
  // Extract query parameters for time range
  const { timeRange, interval } = req.query;
  
  // In a real app, we would filter the metrics based on timeRange and interval
  // For this demo, we'll just return all metrics
  res.json({
    metrics,
    services: services.map(service => ({
      id: service.id,
      name: service.name,
      status: service.status,
      metrics: service.metrics
    })),
    summary: {
      avgCpu: Math.round(services.reduce((sum, service) => sum + service.metrics.cpu, 0) / services.length),
      avgMemory: Math.round(services.reduce((sum, service) => sum + service.metrics.memory, 0) / services.length),
      avgResponseTime: Math.round(services.reduce((sum, service) => {
        // Extract the number from response time (e.g., '120ms' -> 120)
        const responseTime = parseInt(service.responseTime);
        return sum + (isNaN(responseTime) ? 0 : responseTime);
      }, 0) / services.length) + 'ms',
      healthyServices: services.filter(service => service.status === 'healthy').length,
      degradedServices: services.filter(service => service.status === 'degraded').length,
      warningServices: services.filter(service => service.status === 'warning').length,
      criticalAlerts: alerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged).length,
      warningAlerts: alerts.filter(alert => alert.severity === 'warning' && !alert.acknowledged).length
    }
  });
});

// GET service metrics
router.get('/services', (req, res) => {
  res.json(services);
});

// GET specific service metrics
router.get('/services/:id', (req, res) => {
  const service = services.find(s => s.id === req.params.id);
  
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }
  
  res.json(service);
});

// GET alerts
router.get('/alerts', (req, res) => {
  // Extract query parameters for filtering
  const { acknowledged, severity, source } = req.query;
  
  let filteredAlerts = [...alerts];
  
  // Apply filters if provided
  if (acknowledged !== undefined) {
    const isAcknowledged = acknowledged === 'true';
    filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === isAcknowledged);
  }
  
  if (severity) {
    filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
  }
  
  if (source) {
    filteredAlerts = filteredAlerts.filter(alert => alert.source === source);
  }
  
  res.json(filteredAlerts);
});

// POST acknowledge alert
router.post('/alerts/:id/acknowledge', (req, res) => {
  const alertIndex = alerts.findIndex(a => a.id === req.params.id);
  
  if (alertIndex === -1) {
    return res.status(404).json({ message: 'Alert not found' });
  }
  
  // Acknowledge the alert
  alerts[alertIndex].acknowledged = true;
  
  res.json(alerts[alertIndex]);
});

// POST create a new alert (for testing)
router.post('/alerts', (req, res) => {
  const newAlert = {
    id: (alerts.length + 1).toString(),
    timestamp: new Date().toISOString(),
    acknowledged: false,
    ...req.body
  };
  
  alerts.push(newAlert);
  res.status(201).json(newAlert);
});

// GET health check
router.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: services.map(service => ({
      name: service.name,
      status: service.status,
      responseTime: service.responseTime
    })),
    activeAlerts: alerts.filter(alert => !alert.acknowledged).length
  };
  
  res.json(healthStatus);
});

module.exports = router;