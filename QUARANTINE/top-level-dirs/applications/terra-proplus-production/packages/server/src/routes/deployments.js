const express = require('express');
const router = express.Router();

// Mock data for deployments
const deployments = [
  {
    id: '1',
    name: 'API Gateway Update',
    description: 'Update to API Gateway v1.2.3',
    status: 'completed',
    environment: 'production',
    initiatedBy: 'jenkins-ci',
    startTime: '2025-05-19T15:30:00Z',
    endTime: '2025-05-19T15:45:00Z',
    duration: '15m',
    version: 'v1.2.3',
    services: ['api-gateway'],
    configuration: {
      replicas: 3,
      resources: {
        cpu: '500m',
        memory: '1Gi'
      },
      autoscaling: {
        enabled: true,
        minReplicas: 2,
        maxReplicas: 5,
        targetCPUUtilization: 80
      }
    }
  },
  {
    id: '2',
    name: 'Payment Processor Update',
    description: 'Deployment of Payment Processor v2.1.0',
    status: 'failed',
    environment: 'staging',
    initiatedBy: 'maria.dev',
    startTime: '2025-05-19T14:00:00Z',
    endTime: '2025-05-19T14:15:00Z',
    duration: '15m',
    failureReason: 'Integration tests failed',
    version: 'v2.1.0',
    services: ['payment-processor'],
    configuration: {
      replicas: 2,
      resources: {
        cpu: '250m',
        memory: '512Mi'
      },
      autoscaling: {
        enabled: false
      }
    }
  },
  {
    id: '3',
    name: 'User Service Update',
    description: 'Deployment of User Service v3.0.1',
    status: 'in-progress',
    environment: 'development',
    initiatedBy: 'alex.ops',
    startTime: '2025-05-19T14:40:00Z',
    version: 'v3.0.1',
    services: ['user-service'],
    configuration: {
      replicas: 1,
      resources: {
        cpu: '250m',
        memory: '512Mi'
      },
      autoscaling: {
        enabled: false
      }
    }
  },
  {
    id: '4',
    name: 'Database Migration',
    description: 'Migration of user data to new schema',
    status: 'scheduled',
    environment: 'production',
    initiatedBy: 'john.dba',
    scheduledTime: '2025-05-20T02:00:00Z',
    version: 'v2.0.0',
    services: ['user-database'],
    configuration: {
      backup: true,
      rollbackPlan: 'Restore from snapshot if migration fails',
      downtime: '30m'
    }
  }
];

// GET all deployments
router.get('/', (req, res) => {
  // Extract query parameters for filtering
  const { status, environment, service } = req.query;
  
  let filteredDeployments = [...deployments];
  
  // Apply filters if provided
  if (status) {
    filteredDeployments = filteredDeployments.filter(d => d.status === status);
  }
  
  if (environment) {
    filteredDeployments = filteredDeployments.filter(d => d.environment === environment);
  }
  
  if (service) {
    filteredDeployments = filteredDeployments.filter(d => d.services.includes(service));
  }
  
  res.json(filteredDeployments);
});

// GET a specific deployment
router.get('/:id', (req, res) => {
  const deployment = deployments.find(d => d.id === req.params.id);
  
  if (!deployment) {
    return res.status(404).json({ message: 'Deployment not found' });
  }
  
  res.json(deployment);
});

// POST create a new deployment
router.post('/', (req, res) => {
  // In a real app, validate request body using schema validation
  const newDeployment = {
    id: (deployments.length + 1).toString(),
    ...req.body,
    startTime: new Date().toISOString(),
    status: 'pending'
  };
  
  deployments.push(newDeployment);
  res.status(201).json(newDeployment);
});

// PUT update an existing deployment
router.put('/:id', (req, res) => {
  const deploymentIndex = deployments.findIndex(d => d.id === req.params.id);
  
  if (deploymentIndex === -1) {
    return res.status(404).json({ message: 'Deployment not found' });
  }
  
  // Update the deployment
  deployments[deploymentIndex] = {
    ...deployments[deploymentIndex],
    ...req.body
  };
  
  res.json(deployments[deploymentIndex]);
});

// DELETE a deployment
router.delete('/:id', (req, res) => {
  const deploymentIndex = deployments.findIndex(d => d.id === req.params.id);
  
  if (deploymentIndex === -1) {
    return res.status(404).json({ message: 'Deployment not found' });
  }
  
  // Remove the deployment
  deployments.splice(deploymentIndex, 1);
  
  res.status(204).send();
});

// PUT update deployment configuration
router.put('/:id/config', (req, res) => {
  const deploymentIndex = deployments.findIndex(d => d.id === req.params.id);
  
  if (deploymentIndex === -1) {
    return res.status(404).json({ message: 'Deployment not found' });
  }
  
  // Update the configuration
  deployments[deploymentIndex].configuration = {
    ...deployments[deploymentIndex].configuration,
    ...req.body
  };
  
  res.json(deployments[deploymentIndex]);
});

// POST to trigger a rollback for a deployment
router.post('/:id/rollback', (req, res) => {
  const deployment = deployments.find(d => d.id === req.params.id);
  
  if (!deployment) {
    return res.status(404).json({ message: 'Deployment not found' });
  }
  
  // Create a new rollback deployment
  const rollbackDeployment = {
    id: (deployments.length + 1).toString(),
    name: `Rollback: ${deployment.name}`,
    description: `Rollback of ${deployment.name} to previous version`,
    status: 'in-progress',
    environment: deployment.environment,
    initiatedBy: req.body.initiatedBy || 'system',
    startTime: new Date().toISOString(),
    version: deployment.version, // Previous version
    services: deployment.services,
    configuration: deployment.configuration,
    rollbackOf: deployment.id
  };
  
  deployments.push(rollbackDeployment);
  res.status(201).json(rollbackDeployment);
});

module.exports = router;