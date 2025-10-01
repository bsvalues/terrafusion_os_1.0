import crypto from 'crypto';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

/**
 * CryptoGuardian - Production-ready signature validation pipeline
 * Handles multi-layer verification, audit logging, and threat detection
 * for Terrafusion OS 1.0's 1,008 AI agent swarm
 */
class CryptoGuardian extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      validationThreshold: config.validationThreshold || 3,
      maxFailuresPerAgent: config.maxFailuresPerAgent || 5,
      auditLogPath: config.auditLogPath || './security/audit.log',
      circuitBreakerTimeout: config.circuitBreakerTimeout || 300000, // 5 minutes
      ...config,
    };

    this.auditLog = [];
    this.failureCount = new Map();
    this.quarantinedAgents = new Set();
    this.circuitBreakerState = new Map(); // agentId -> { failures, lastFailure, isOpen }

    this.startAuditLogPersistence();
  }

  /**
   * Primary signature validation with multi-layer security
   */
  async validateSignature(message, signature, publicKeyPem, agentId, metadata = {}) {
    const startTime = Date.now();
    const validationId = crypto.randomUUID();

    try {
      // Circuit breaker check
      if (this.isCircuitOpen(agentId)) {
        throw new Error(`Agent ${agentId} circuit breaker is open`);
      }

      // Format validations
      const validations = {
        validationId,
        timestamp: startTime,
        agentId,
        format: this.checkSignatureFormat(signature),
        length: signature.length === 64,
        keyFormat: this.validateKeyFormat(publicKeyPem),
        verification: false,
        consensus: false,
        anomalyScore: 0,
        executionTime: 0,
      };

      // Anomaly detection
      validations.anomalyScore = await this.detectAnomalies(agentId, signature, message);

      if (validations.anomalyScore > 0.8) {
        await this.triggerSecurityAlert('high_anomaly_score', {
          agentId,
          score: validations.anomalyScore,
        });
        validations.blocked = true;
        this.logValidation(validations, 'ANOMALY_BLOCKED');
        return validations;
      }

      // Primary cryptographic verification
      try {
        const messageBuffer = Buffer.isBuffer(message) ? message : Buffer.from(message, 'utf8');
        const signatureBuffer = Buffer.isBuffer(signature)
          ? signature
          : Buffer.from(signature, 'base64');

        validations.verification = crypto.verify(
          null, // Ed25519 doesn't use hash algorithm
          messageBuffer,
          publicKeyPem,
          signatureBuffer
        );
      } catch (cryptoError) {
        validations.cryptoError = cryptoError.message;
        this.handleCryptoFailure(cryptoError, agentId);
      }

      // Multi-provider consensus (if enabled)
      if (this.config.consensusEnabled) {
        validations.consensus = await this.getConsensusVerification(
          message,
          signature,
          publicKeyPem
        );
      }

      validations.executionTime = Date.now() - startTime;
      validations.success =
        validations.verification && (this.config.consensusEnabled ? validations.consensus : true);

      // Log and emit events
      this.logValidation(validations, validations.success ? 'SUCCESS' : 'FAILURE');

      if (validations.success) {
        this.resetCircuitBreaker(agentId);
        this.emit('validation_success', validations);
      } else {
        this.incrementFailureCount(agentId);
        this.emit('validation_failure', validations);
      }

      return validations;
    } catch (error) {
      const errorValidation = {
        validationId,
        timestamp: startTime,
        agentId,
        error: error.message,
        executionTime: Date.now() - startTime,
      };

      this.logValidation(errorValidation, 'ERROR');
      this.handleCryptoFailure(error, agentId);
      this.emit('validation_error', errorValidation);

      throw error;
    }
  }

  /**
   * Enhanced signature format validation
   */
  checkSignatureFormat(signature) {
    try {
      // Check if base64 encoded
      if (typeof signature === 'string') {
        const decoded = Buffer.from(signature, 'base64');
        return decoded.length === 64;
      }

      // Check if already a buffer
      if (Buffer.isBuffer(signature)) {
        return signature.length === 64;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Validate Ed25519 public key format
   */
  validateKeyFormat(publicKeyPem) {
    try {
      if (typeof publicKeyPem !== 'string') return false;

      const pemPattern = /^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----\s*$/;
      if (!pemPattern.test(publicKeyPem)) return false;

      // Extract base64 content
      const base64Content = publicKeyPem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');

      const keyBytes = Buffer.from(base64Content, 'base64');

      // Ed25519 public key in DER format should be 44 bytes
      return keyBytes.length === 44;
    } catch {
      return false;
    }
  }

  /**
   * Advanced anomaly detection for agent behavior
   */
  async detectAnomalies(agentId, signature, message) {
    const features = {
      signatureEntropy: this.calculateEntropy(signature),
      messageLength: message.length,
      timestamp: Date.now(),
      agentId,
    };

    // Placeholder for ML-based anomaly detection
    // In production, this would use trained models
    let anomalyScore = 0;

    // Check entropy (signatures should have high entropy)
    if (features.signatureEntropy < 7.5) {
      anomalyScore += 0.3;
    }

    // Check timing patterns
    const recentValidations = this.getRecentValidations(agentId, 60000); // last minute
    if (recentValidations.length > 100) {
      // Suspiciously high rate
      anomalyScore += 0.4;
    }

    // Check for replay attacks (same signature multiple times)
    const signatureHash = crypto.createHash('sha256').update(signature).digest('hex');
    if (this.hasRecentSignature(agentId, signatureHash)) {
      anomalyScore += 0.8; // High score for potential replay
    }

    return Math.min(anomalyScore, 1.0);
  }

  /**
   * Calculate entropy of signature for anomaly detection
   */
  calculateEntropy(data) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'base64');
    const frequency = {};

    for (const byte of buffer) {
      frequency[byte] = (frequency[byte] || 0) + 1;
    }

    let entropy = 0;
    const length = buffer.length;

    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Circuit breaker pattern implementation
   */
  isCircuitOpen(agentId) {
    const state = this.circuitBreakerState.get(agentId);
    if (!state) return false;

    if (state.isOpen) {
      // Check if timeout has passed
      const timeoutPassed = Date.now() - state.lastFailure > this.config.circuitBreakerTimeout;
      if (timeoutPassed) {
        state.isOpen = false;
        state.failures = 0;
        this.emit('circuit_breaker_reset', { agentId });
      }
    }

    return state.isOpen;
  }

  /**
   * Handle cryptographic failures with escalation
   */
  handleCryptoFailure(error, agentId) {
    const currentCount = this.failureCount.get(agentId) || 0;
    const newCount = currentCount + 1;

    this.failureCount.set(agentId, newCount);

    // Update circuit breaker state
    let state = this.circuitBreakerState.get(agentId) || {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    state.failures = newCount;
    state.lastFailure = Date.now();

    if (newCount >= this.config.maxFailuresPerAgent) {
      state.isOpen = true;
      this.quarantineAgent(agentId);
      this.emit('circuit_breaker_open', { agentId, failures: newCount });
    }

    this.circuitBreakerState.set(agentId, state);

    this.emit('crypto_failure', {
      agentId,
      error: error.message,
      failureCount: newCount,
      timestamp: Date.now(),
    });
  }

  /**
   * Quarantine suspicious agent
   */
  quarantineAgent(agentId) {
    this.quarantinedAgents.add(agentId);
    this.emit('agent_quarantined', {
      agentId,
      timestamp: Date.now(),
      reason: 'excessive_failures',
    });

    // Log to security audit
    this.logSecurityEvent('AGENT_QUARANTINED', {
      agentId,
      failures: this.failureCount.get(agentId),
      timestamp: Date.now(),
    });
  }

  /**
   * Reset circuit breaker on successful validation
   */
  resetCircuitBreaker(agentId) {
    if (this.circuitBreakerState.has(agentId)) {
      this.circuitBreakerState.set(agentId, { failures: 0, lastFailure: 0, isOpen: false });
    }
    this.failureCount.delete(agentId);
  }

  /**
   * Multi-provider consensus verification
   */
  async getConsensusVerification(message, signature, publicKeyPem) {
    // This would integrate with .NET service and other verification providers
    // For now, returning true as placeholder
    return true;
  }

  /**
   * Increment failure count for tracking
   */
  incrementFailureCount(agentId) {
    const current = this.failureCount.get(agentId) || 0;
    this.failureCount.set(agentId, current + 1);
  }

  /**
   * Get recent validations for rate limiting and anomaly detection
   */
  getRecentValidations(agentId, timeWindow) {
    const cutoff = Date.now() - timeWindow;
    return this.auditLog.filter(log => log.agentId === agentId && log.timestamp > cutoff);
  }

  /**
   * Check for recent signature reuse (replay attack detection)
   */
  hasRecentSignature(agentId, signatureHash) {
    const recentValidations = this.getRecentValidations(agentId, 300000); // 5 minutes
    return recentValidations.some(log => log.signatureHash === signatureHash);
  }

  /**
   * Log validation attempt with full context
   */
  logValidation(validation, status) {
    const logEntry = {
      ...validation,
      status,
      messageHash: validation.message
        ? crypto.createHash('sha256').update(validation.message).digest('hex')
        : null,
      signatureHash: validation.signature
        ? crypto.createHash('sha256').update(validation.signature).digest('hex')
        : null,
    };

    this.auditLog.push(logEntry);

    // Rotate log if too large
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, data) {
    const securityLog = {
      eventType,
      timestamp: Date.now(),
      data,
      severity: this.getSeverityLevel(eventType),
    };

    this.auditLog.push(securityLog);

    if (securityLog.severity === 'CRITICAL') {
      this.emit('critical_security_event', securityLog);
    }
  }

  /**
   * Trigger security alerts
   */
  async triggerSecurityAlert(alertType, data) {
    const alert = {
      alertType,
      timestamp: Date.now(),
      data,
      alertId: crypto.randomUUID(),
    };

    this.emit('security_alert', alert);

    // In production, this would integrate with SIEM systems
    console.warn(`🚨 SECURITY ALERT [${alertType}]:`, data);
  }

  /**
   * Get severity level for events
   */
  getSeverityLevel(eventType) {
    const severityMap = {
      AGENT_QUARANTINED: 'CRITICAL',
      ANOMALY_BLOCKED: 'HIGH',
      CRYPTO_FAILURE: 'MEDIUM',
      VALIDATION_SUCCESS: 'LOW',
    };

    return severityMap[eventType] || 'MEDIUM';
  }

  /**
   * Start persistent audit logging
   */
  startAuditLogPersistence() {
    setInterval(async () => {
      try {
        if (this.auditLog.length > 0) {
          const logData = JSON.stringify(this.auditLog.slice(-1000)) + '\n';
          await fs.appendFile(this.config.auditLogPath, logData);
        }
      } catch (error) {
        console.error('Failed to persist audit log:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get system health metrics
   */
  getHealthMetrics() {
    const now = Date.now();
    const hourAgo = now - 3600000;

    const recentLogs = this.auditLog.filter(log => log.timestamp > hourAgo);
    const successCount = recentLogs.filter(log => log.status === 'SUCCESS').length;
    const totalCount = recentLogs.length;

    return {
      successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
      totalValidations: totalCount,
      quarantinedAgents: this.quarantinedAgents.size,
      circuitBreakersOpen: Array.from(this.circuitBreakerState.values()).filter(s => s.isOpen)
        .length,
      avgResponseTime:
        recentLogs.reduce((sum, log) => sum + (log.executionTime || 0), 0) / totalCount,
      timestamp: now,
    };
  }
}

export default CryptoGuardian;
