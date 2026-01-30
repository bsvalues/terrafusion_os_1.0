/**
 * MCP Circuit Breaker Router
 * 
 * This router provides endpoints for managing and interacting with the MCP circuit breaker service.
 */

import { Router } from 'express';
import { mcpCircuitBreakerService } from '../services/mcpCircuitBreakerService';
import { log } from '../vite';
import {
  CreateCircuitBreakerSchema,
  ExecuteCircuitRequestSchema,
  ForceCircuitStateSchema,
  HealthCheckRequestSchema
} from '@shared/mcp/schemas';
import { ZodError } from 'zod';

const router = Router();

// Helper function to handle errors
const handleError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

/**
 * Get a list of all circuit breakers
 */
router.get('/', (req, res) => {
  try {
    const circuits = mcpCircuitBreakerService.getAllCircuitStates();
    res.json(circuits);
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error getting circuit breakers: ${errorMessage}`, 'circuit-breaker');
    res.status(500).json({ error: `Failed to get circuit breakers: ${errorMessage}` });
  }
});

/**
 * Create a new circuit breaker
 */
router.post('/', (req, res) => {
  try {
    const data = CreateCircuitBreakerSchema.parse(req.body);
    const circuit = mcpCircuitBreakerService.createCircuitBreaker(data);
    res.status(201).json(circuit);
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error creating circuit breaker: ${errorMessage}`, 'circuit-breaker');
    res.status(400).json({ error: `Failed to create circuit breaker: ${errorMessage}` });
  }
});

/**
 * Get a specific circuit breaker by service name
 */
router.get('/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;
    const circuit = mcpCircuitBreakerService.getCircuitState(serviceName);
    res.json(circuit);
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error getting circuit breaker for ${req.params.serviceName}: ${errorMessage}`, 'circuit-breaker');
    res.status(404).json({ error: `Circuit breaker not found: ${errorMessage}` });
  }
});

/**
 * Execute a request through a circuit breaker
 */
router.post('/execute', async (req, res) => {
  try {
    const data = ExecuteCircuitRequestSchema.parse(req.body);
    const result = await mcpCircuitBreakerService.executeWithCircuitBreaker(data);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error executing request through circuit breaker: ${errorMessage}`, 'circuit-breaker');
    res.status(500).json({ 
      error: `Failed to execute request: ${errorMessage}`,
      success: false,
      isFallback: false
    });
  }
});

/**
 * Force a circuit breaker into a specific state
 */
router.post('/state', (req, res) => {
  try {
    const data = ForceCircuitStateSchema.parse(req.body);
    const circuit = mcpCircuitBreakerService.forceCircuitState(data);
    res.json(circuit);
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error forcing circuit state: ${errorMessage}`, 'circuit-breaker');
    res.status(400).json({ error: `Failed to force circuit state: ${errorMessage}` });
  }
});

/**
 * Perform a health check on a service
 */
router.post('/health-check', async (req, res) => {
  try {
    const data = HealthCheckRequestSchema.parse(req.body);
    const result = await mcpCircuitBreakerService.performHealthCheck(data);
    res.json(result);
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error performing health check: ${errorMessage}`, 'circuit-breaker');
    res.status(500).json({ 
      error: `Failed to perform health check: ${errorMessage}`,
      isHealthy: false
    });
  }
});

/**
 * Reset all circuit breakers
 */
router.post('/reset', (req, res) => {
  try {
    mcpCircuitBreakerService.reset();
    res.json({ message: 'All circuit breakers reset successfully' });
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error resetting circuit breakers: ${errorMessage}`, 'circuit-breaker');
    res.status(500).json({ error: `Failed to reset circuit breakers: ${errorMessage}` });
  }
});

/**
 * Reset a specific circuit breaker
 */
router.post('/reset/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;
    mcpCircuitBreakerService.resetService(serviceName);
    res.json({ message: `Circuit breaker for ${serviceName} reset successfully` });
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error resetting circuit breaker for ${req.params.serviceName}: ${errorMessage}`, 'circuit-breaker');
    res.status(500).json({ error: `Failed to reset circuit breaker: ${errorMessage}` });
  }
});

/**
 * Delete a specific circuit breaker
 */
router.delete('/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params;
    mcpCircuitBreakerService.deleteCircuitBreaker(serviceName);
    res.json({ message: `Circuit breaker for ${serviceName} deleted successfully` });
  } catch (error) {
    const errorMessage = handleError(error);
    log(`Error deleting circuit breaker for ${req.params.serviceName}: ${errorMessage}`, 'circuit-breaker');
    res.status(500).json({ error: `Failed to delete circuit breaker: ${errorMessage}` });
  }
});

export default router;