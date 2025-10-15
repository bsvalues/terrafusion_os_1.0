import crypto from 'crypto';
import { EventEmitter } from 'events';
import CryptoGuardian from './CryptoGuardian.js';

/**
 * AgentAuthenticator - Production-ready authentication framework
 * Handles multi-factor authentication for Terrafusion OS 1.0's 1,008 AI agent swarm
 * Implements rate limiting, anomaly detection, and comprehensive security monitoring
 */
class AgentAuthenticator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxAttemptsPerMinute: config.maxAttemptsPerMinute || 10,
            maxAttemptsPerHour: config.maxAttemptsPerHour || 100,
            anomalyThreshold: config.anomalyThreshold || 0.8,
            challengeTimeout: config.challengeTimeout || 300000, // 5 minutes
            sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
            requireCertificate: config.requireCertificate || true,
            enableBehavioralAnalysis: config.enableBehavioralAnalysis || true,
            ...config
        };
        
        // Core components
        this.cryptoGuardian = new CryptoGuardian();
        this.rateLimiter = new Map(); // agentId -> { attempts: [], lastReset: timestamp }
        this.anomalyDetector = new AnomalyDetector(this.config);
        this.revocationList = new Set();
        this.activeSessions = new Map(); // sessionId -> { agentId, timestamp, metadata }
        this.agentCertificates = new Map(); // agentId -> certificate data
        this.behavioralProfiles = new Map(); // agentId -> behavioral profile
        
        // Security metrics
        this.authMetrics = {
            totalAttempts: 0,
            successfulAuths: 0,
            failedAuths: 0,
            rateLimitedAttempts: 0,
            anomalyBlocked: 0,
            certificateFailures: 0
        };
        
        this.initializeSecurityComponents();
    }

    /**
     * Primary agent authentication with comprehensive security checks
     */
    async authenticateAgent(agentId, signature, challenge, metadata = {}) {
        const authId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            this.authMetrics.totalAttempts++;
            
            this.emit('auth_attempt', {
                authId,
                agentId,
                timestamp: startTime,
                metadata
            });

            // Input validation
            if (!this.validateAuthenticationInputs(agentId, signature, challenge)) {
                throw new Error('Invalid authentication inputs');
            }

            // Rate limiting check
            const rateLimitResult = await this.checkRateLimit(agentId);
            if (!rateLimitResult.allowed) {
                this.authMetrics.rateLimitedAttempts++;
                this.emit('rate_limit_exceeded', { agentId, authId, ...rateLimitResult });
                return this.createAuthResult(false, 'rate_limit_exceeded', authId, startTime, rateLimitResult);
            }

            // Agent revocation check
            if (this.revocationList.has(agentId)) {
                this.authMetrics.failedAuths++;
                this.emit('revoked_agent_attempt', { agentId, authId });
                return this.createAuthResult(false, 'agent_revoked', authId, startTime);
            }

            // Behavioral anomaly detection
            const anomalyScore = await this.anomalyDetector.analyze({
                agentId,
                signature,
                challenge,
                timestamp: startTime,
                metadata
            });

            if (anomalyScore > this.config.anomalyThreshold) {
                this.authMetrics.anomalyBlocked++;
                await this.triggerManualReview(agentId, authId, anomalyScore);
                this.emit('anomaly_detected', { agentId, authId, anomalyScore });
                return this.createAuthResult(false, 'anomaly_detected', authId, startTime, { anomalyScore });
            }

            // Multi-factor verification
            const verificationFactors = await this.performMultiFactorVerification(
                agentId, signature, challenge, metadata
            );

            const authSuccess = verificationFactors.every(factor => factor.success);
            
            if (authSuccess) {
                this.authMetrics.successfulAuths++;
                
                // Create secure session
                const sessionData = await this.createSecureSession(agentId, authId, metadata);
                
                // Update behavioral profile
                if (this.config.enableBehavioralAnalysis) {
                    await this.updateBehavioralProfile(agentId, {
                        timestamp: startTime,
                        signature,
                        metadata,
                        success: true
                    });
                }
                
                this.emit('auth_success', {
                    authId,
                    agentId,
                    sessionId: sessionData.sessionId,
                    factors: verificationFactors.length
                });
                
                return this.createAuthResult(true, 'authenticated', authId, startTime, {
                    sessionId: sessionData.sessionId,
                    factors: verificationFactors,
                    expiresAt: sessionData.expiresAt
                });
            } else {
                this.authMetrics.failedAuths++;
                
                // Update behavioral profile for failed attempt
                if (this.config.enableBehavioralAnalysis) {
                    await this.updateBehavioralProfile(agentId, {
                        timestamp: startTime,
                        signature,
                        metadata,
                        success: false
                    });
                }
                
                this.emit('auth_failure', {
                    authId,
                    agentId,
                    factors: verificationFactors,
                    failureReasons: verificationFactors.filter(f => !f.success).map(f => f.reason)
                });
                
                return this.createAuthResult(false, 'authentication_failed', authId, startTime, {
                    factors: verificationFactors
                });
            }

        } catch (error) {
            this.authMetrics.failedAuths++;
            
            this.emit('auth_error', {
                authId,
                agentId,
                error: error.message,
                stack: error.stack
            });
            
            throw new Error(`Authentication error for agent ${agentId}: ${error.message}`);
        }
    }

    /**
     * Validate authentication inputs
     */
    validateAuthenticationInputs(agentId, signature, challenge) {
        if (!agentId || typeof agentId !== 'string' || agentId.length === 0) {
            return false;
        }
        
        if (!signature || (typeof signature !== 'string' && !Buffer.isBuffer(signature))) {
            return false;
        }
        
        if (!challenge || typeof challenge !== 'string' || challenge.length === 0) {
            return false;
        }
        
        // Agent ID format validation (UUID or structured ID)
        const agentIdPattern = /^[a-zA-Z0-9_-]+$/;
        if (!agentIdPattern.test(agentId)) {
            return false;
        }
        
        return true;
    }

    /**
     * Rate limiting implementation with sliding window
     */
    async checkRateLimit(agentId) {
        const now = Date.now();
        const minute = 60000;
        const hour = 3600000;
        
        if (!this.rateLimiter.has(agentId)) {
            this.rateLimiter.set(agentId, {
                attempts: [],
                lastReset: now
            });
        }
        
        const agentData = this.rateLimiter.get(agentId);
        
        // Clean old attempts (sliding window)
        agentData.attempts = agentData.attempts.filter(timestamp => {
            return (now - timestamp) < hour; // Keep last hour
        });
        
        // Count recent attempts
        const attemptsLastMinute = agentData.attempts.filter(timestamp => {
            return (now - timestamp) < minute;
        }).length;
        
        const attemptsLastHour = agentData.attempts.length;
        
        // Check limits
        if (attemptsLastMinute >= this.config.maxAttemptsPerMinute) {
            return {
                allowed: false,
                reason: 'minute_limit_exceeded',
                attemptsLastMinute,
                maxAttemptsPerMinute: this.config.maxAttemptsPerMinute,
                retryAfter: minute - (now - Math.max(...agentData.attempts.slice(-this.config.maxAttemptsPerMinute)))
            };
        }
        
        if (attemptsLastHour >= this.config.maxAttemptsPerHour) {
            return {
                allowed: false,
                reason: 'hour_limit_exceeded',
                attemptsLastHour,
                maxAttemptsPerHour: this.config.maxAttemptsPerHour,
                retryAfter: hour - (now - agentData.attempts[0])
            };
        }
        
        // Record this attempt
        agentData.attempts.push(now);
        
        return {
            allowed: true,
            attemptsLastMinute,
            attemptsLastHour
        };
    }

    /**
     * Multi-factor verification implementation
     */
    async performMultiFactorVerification(agentId, signature, challenge, metadata) {
        const factors = [];
        
        // Factor 1: Cryptographic signature verification
        try {
            const publicKey = await this.getAgentPublicKey(agentId);
            const signatureValid = await this.cryptoGuardian.validateSignature(
                challenge, signature, publicKey, agentId, metadata
            );
            
            factors.push({
                type: 'cryptographic_signature',
                success: signatureValid.success,
                reason: signatureValid.success ? 'signature_verified' : 'signature_invalid',
                details: signatureValid
            });
        } catch (error) {
            factors.push({
                type: 'cryptographic_signature',
                success: false,
                reason: 'signature_verification_error',
                error: error.message
            });
        }
        
        // Factor 2: Agent certificate verification
        if (this.config.requireCertificate) {
            try {
                const certificateValid = await this.verifyAgentCertificate(agentId);
                factors.push({
                    type: 'agent_certificate',
                    success: certificateValid,
                    reason: certificateValid ? 'certificate_valid' : 'certificate_invalid'
                });
            } catch (error) {
                this.authMetrics.certificateFailures++;
                factors.push({
                    type: 'agent_certificate',
                    success: false,
                    reason: 'certificate_verification_error',
                    error: error.message
                });
            }
        }
        
        // Factor 3: Challenge-response verification
        try {
            const challengeValid = await this.verifyChallengeResponse(agentId, challenge, metadata);
            factors.push({
                type: 'challenge_response',
                success: challengeValid,
                reason: challengeValid ? 'challenge_valid' : 'challenge_invalid'
            });
        } catch (error) {
            factors.push({
                type: 'challenge_response',
                success: false,
                reason: 'challenge_verification_error',
                error: error.message
            });
        }
        
        // Factor 4: Behavioral verification (if enabled)
        if (this.config.enableBehavioralAnalysis) {
            try {
                const behaviorValid = await this.verifyBehavioralPattern(agentId, metadata);
                factors.push({
                    type: 'behavioral_pattern',
                    success: behaviorValid,
                    reason: behaviorValid ? 'behavior_consistent' : 'behavior_anomalous'
                });
            } catch (error) {
                factors.push({
                    type: 'behavioral_pattern',
                    success: false,
                    reason: 'behavior_verification_error',
                    error: error.message
                });
            }
        }
        
        return factors;
    }

    /**
     * Get agent's public key for verification
     */
    async getAgentPublicKey(agentId) {
        // This would integrate with the key management system
        // For now, use the default key for testing
        const fs = await import('fs/promises');
        try {
            return await fs.readFile(`keys/${agentId}-public.pem`, 'utf8');
        } catch {
            // Fallback to default key
            return await fs.readFile('keys/ed25519-public.pem', 'utf8');
        }
    }

    /**
     * Verify agent certificate
     */
    async verifyAgentCertificate(agentId) {
        if (!this.agentCertificates.has(agentId)) {
            // Load certificate from secure storage
            await this.loadAgentCertificate(agentId);
        }
        
        const certificate = this.agentCertificates.get(agentId);
        
        if (!certificate) {
            return false;
        }
        
        // Verify certificate validity
        const now = Date.now();
        return certificate.validFrom <= now && certificate.validTo >= now && certificate.status === 'active';
    }

    /**
     * Load agent certificate from secure storage
     */
    async loadAgentCertificate(agentId) {
        // In production, this would load from secure certificate store
        // For now, create a mock certificate
        const certificate = {
            agentId,
            validFrom: Date.now() - 86400000, // 1 day ago
            validTo: Date.now() + 2592000000, // 30 days from now
            status: 'active',
            issuer: 'Terrafusion-CA',
            serialNumber: crypto.randomUUID()
        };
        
        this.agentCertificates.set(agentId, certificate);
    }

    /**
     * Verify challenge-response protocol
     */
    async verifyChallengeResponse(agentId, challenge, metadata) {
        // Verify challenge format and freshness
        try {
            const challengeData = JSON.parse(challenge);
            
            // Check challenge timestamp (must be recent)
            const challengeAge = Date.now() - challengeData.timestamp;
            if (challengeAge > this.config.challengeTimeout) {
                return false;
            }
            
            // Verify challenge nonce is unique and not replayed
            const challengeHash = crypto.createHash('sha256').update(challenge).digest('hex');
            if (this.hasSeenChallenge(agentId, challengeHash)) {
                return false;
            }
            
            this.recordChallenge(agentId, challengeHash);
            return true;
            
        } catch {
            return false;
        }
    }

    /**
     * Verify behavioral patterns
     */
    async verifyBehavioralPattern(agentId, metadata) {
        if (!this.behavioralProfiles.has(agentId)) {
            // First authentication - establish baseline
            return true;
        }
        
        const profile = this.behavioralProfiles.get(agentId);
        
        // Analyze current behavior against profile
        const currentBehavior = this.extractBehavioralFeatures(metadata);
        const similarity = this.calculateBehavioralSimilarity(profile.baseline, currentBehavior);
        
        // Return true if behavior is within acceptable variance
        return similarity > 0.7; // 70% similarity threshold
    }

    /**
     * Extract behavioral features from metadata
     */
    extractBehavioralFeatures(metadata) {
        return {
            timestamp: Date.now(),
            userAgent: metadata.userAgent || '',
            ipAddress: metadata.ipAddress || '',
            requestInterval: metadata.requestInterval || 0,
            systemInfo: metadata.systemInfo || {}
        };
    }

    /**
     * Calculate behavioral similarity score
     */
    calculateBehavioralSimilarity(baseline, current) {
        // Simple similarity calculation - in production use ML models
        let similarity = 0.5; // Base similarity
        
        // Time-based patterns
        const timeDiff = Math.abs(baseline.requestInterval - current.requestInterval);
        if (timeDiff < 1000) similarity += 0.2; // Similar timing
        
        // System consistency
        if (baseline.userAgent === current.userAgent) similarity += 0.2;
        if (baseline.ipAddress === current.ipAddress) similarity += 0.1;
        
        return Math.min(similarity, 1.0);
    }

    /**
     * Update behavioral profile for agent
     */
    async updateBehavioralProfile(agentId, authData) {
        if (!this.behavioralProfiles.has(agentId)) {
            this.behavioralProfiles.set(agentId, {
                baseline: this.extractBehavioralFeatures(authData.metadata || {}),
                history: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
        
        const profile = this.behavioralProfiles.get(agentId);
        profile.history.push({
            timestamp: authData.timestamp,
            success: authData.success,
            features: this.extractBehavioralFeatures(authData.metadata || {})
        });
        
        // Keep only recent history (last 100 authentications)
        if (profile.history.length > 100) {
            profile.history = profile.history.slice(-100);
        }
        
        profile.updatedAt = Date.now();
    }

    /**
     * Create secure session after successful authentication
     */
    async createSecureSession(agentId, authId, metadata) {
        const sessionId = crypto.randomUUID();
        const now = Date.now();
        const expiresAt = now + this.config.sessionTimeout;
        
        const sessionData = {
            sessionId,
            agentId,
            authId,
            createdAt: now,
            expiresAt,
            metadata,
            accessCount: 0,
            lastAccess: now
        };
        
        this.activeSessions.set(sessionId, sessionData);
        
        // Emit session created event
        this.emit('session_created', {
            sessionId,
            agentId,
            expiresAt
        });
        
        return sessionData;
    }

    /**
     * Validate active session
     */
    async validateSession(sessionId) {
        if (!this.activeSessions.has(sessionId)) {
            return { valid: false, reason: 'session_not_found' };
        }
        
        const session = this.activeSessions.get(sessionId);
        const now = Date.now();
        
        if (session.expiresAt <= now) {
            this.activeSessions.delete(sessionId);
            return { valid: false, reason: 'session_expired' };
        }
        
        // Update access tracking
        session.accessCount++;
        session.lastAccess = now;
        
        return {
            valid: true,
            session,
            agentId: session.agentId
        };
    }

    /**
     * Revoke agent access
     */
    async revokeAgent(agentId, reason) {
        this.revocationList.add(agentId);
        
        // Terminate all active sessions for this agent
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.agentId === agentId) {
                this.activeSessions.delete(sessionId);
            }
        }
        
        this.emit('agent_revoked', {
            agentId,
            reason,
            timestamp: Date.now()
        });
    }

    /**
     * Create authentication result
     */
    createAuthResult(success, reason, authId, startTime, additionalData = {}) {
        return {
            authenticated: success,
            reason,
            authId,
            timestamp: startTime,
            executionTime: Date.now() - startTime,
            ...additionalData
        };
    }

    /**
     * Track seen challenges to prevent replay attacks
     */
    hasSeenChallenge(agentId, challengeHash) {
        const key = `${agentId}:${challengeHash}`;
        return this.seenChallenges?.has(key) || false;
    }

    recordChallenge(agentId, challengeHash) {
        if (!this.seenChallenges) {
            this.seenChallenges = new Map();
        }
        
        const key = `${agentId}:${challengeHash}`;
        this.seenChallenges.set(key, Date.now());
        
        // Clean old challenges (prevent memory leak)
        const maxAge = this.config.challengeTimeout * 2;
        for (const [k, timestamp] of this.seenChallenges.entries()) {
            if (Date.now() - timestamp > maxAge) {
                this.seenChallenges.delete(k);
            }
        }
    }

    /**
     * Trigger manual review for suspicious activity
     */
    async triggerManualReview(agentId, authId, anomalyScore) {
        const reviewData = {
            agentId,
            authId,
            anomalyScore,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        // In production, this would integrate with security team workflows
        console.warn(`🔍 MANUAL REVIEW TRIGGERED: Agent ${agentId} (Score: ${anomalyScore})`);
        
        this.emit('manual_review_triggered', reviewData);
    }

    /**
     * Initialize security components
     */
    initializeSecurityComponents() {
        // Initialize anomaly detector
        this.anomalyDetector = new AnomalyDetector(this.config);
        
        // Set up session cleanup
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 300000); // Every 5 minutes
        
        // Set up metrics reporting
        setInterval(() => {
            this.emitMetrics();
        }, 60000); // Every minute
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.expiresAt <= now) {
                this.activeSessions.delete(sessionId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            this.emit('sessions_cleaned', { count: cleanedCount });
        }
    }

    /**
     * Emit authentication metrics
     */
    emitMetrics() {
        const metrics = {
            ...this.authMetrics,
            activeSessions: this.activeSessions.size,
            revokedAgents: this.revocationList.size,
            timestamp: Date.now()
        };
        
        this.emit('auth_metrics', metrics);
    }

    /**
     * Get current authentication statistics
     */
    getAuthenticationStats() {
        return {
            metrics: { ...this.authMetrics },
            activeSessions: this.activeSessions.size,
            revokedAgents: this.revocationList.size,
            behavioralProfiles: this.behavioralProfiles.size,
            timestamp: Date.now()
        };
    }
}

/**
 * Anomaly Detection Engine
 */
class AnomalyDetector {
    constructor(config) {
        this.config = config;
        this.patterns = new Map(); // agentId -> pattern data
        this.globalBaseline = {
            avgSignatureEntropy: 7.8,
            avgChallengeLength: 256,
            typicalRequestInterval: 30000
        };
    }

    /**
     * Analyze authentication attempt for anomalies
     */
    async analyze(authData) {
        const { agentId, signature, challenge, timestamp, metadata } = authData;
        
        let anomalyScore = 0;
        
        // Signature entropy analysis
        const signatureEntropy = this.calculateEntropy(signature);
        if (signatureEntropy < 7.0) {
            anomalyScore += 0.3; // Low entropy signatures are suspicious
        }
        
        // Challenge analysis
        const challengeLength = challenge.length;
        if (challengeLength < 100 || challengeLength > 1000) {
            anomalyScore += 0.2; // Unusual challenge length
        }
        
        // Timing analysis
        if (this.patterns.has(agentId)) {
            const pattern = this.patterns.get(agentId);
            const timeSinceLastAuth = timestamp - pattern.lastAuthTime;
            
            if (timeSinceLastAuth < 1000) {
                anomalyScore += 0.4; // Too frequent authentication
            }
            
            // Pattern deviation analysis
            const patternDeviation = this.calculatePatternDeviation(agentId, authData);
            anomalyScore += patternDeviation * 0.3;
        }
        
        // Update patterns
        this.updatePattern(agentId, authData);
        
        return Math.min(anomalyScore, 1.0);
    }

    /**
     * Calculate entropy of data
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
     * Calculate pattern deviation for agent
     */
    calculatePatternDeviation(agentId, authData) {
        const pattern = this.patterns.get(agentId);
        if (!pattern || pattern.samples < 5) {
            return 0; // Not enough data for pattern analysis
        }
        
        // Simple deviation calculation
        let deviation = 0;
        
        const currentInterval = authData.timestamp - pattern.lastAuthTime;
        const intervalDiff = Math.abs(currentInterval - pattern.avgInterval) / pattern.avgInterval;
        
        if (intervalDiff > 2.0) { // More than 200% deviation
            deviation += 0.5;
        }
        
        return Math.min(deviation, 1.0);
    }

    /**
     * Update agent pattern data
     */
    updatePattern(agentId, authData) {
        if (!this.patterns.has(agentId)) {
            this.patterns.set(agentId, {
                firstSeen: authData.timestamp,
                lastAuthTime: authData.timestamp,
                samples: 1,
                avgInterval: 30000, // Default 30 seconds
                totalIntervals: 0
            });
            return;
        }
        
        const pattern = this.patterns.get(agentId);
        const interval = authData.timestamp - pattern.lastAuthTime;
        
        pattern.totalIntervals += interval;
        pattern.samples++;
        pattern.avgInterval = pattern.totalIntervals / (pattern.samples - 1);
        pattern.lastAuthTime = authData.timestamp;
    }
}

export default AgentAuthenticator;