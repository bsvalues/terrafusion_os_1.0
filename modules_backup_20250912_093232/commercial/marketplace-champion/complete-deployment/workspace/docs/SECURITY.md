# Terrafusion Security Guide

## Security Overview

Terrafusion implements government-grade security standards to protect sensitive
municipal data and ensure compliance with federal, state, and local regulations.

## Security Principles

### Defense in Depth

- **Multiple Security Layers**: Authentication, authorization, encryption,
  monitoring
- **Fail-Safe Defaults**: Secure by default configurations
- **Least Privilege**: Minimal access rights for users and services
- **Zero Trust Architecture**: Verify every request and connection

### Compliance Standards

- **FISMA**: Federal Information Security Management Act
- **NIST Cybersecurity Framework**: Comprehensive security guidelines
- **State DOE Requirements**: Department of Education compliance
- **County Audit Standards**: Local government audit requirements

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

```javascript
// MFA Configuration
const mfaConfig = {
  required: true,
  methods: [
    'totp', // Time-based One-Time Password
    'sms', // SMS verification
    'email', // Email verification
    'webauthn', // Hardware security keys
    'biometric', // Fingerprint/Face ID
  ],
  backupCodes: true,
  sessionTimeout: '8 hours',
};
```

### Role-Based Access Control (RBAC)

```javascript
// Role Definitions
const roles = {
  system_admin: {
    permissions: ['*'],
    description: 'Full system access',
  },
  county_admin: {
    permissions: [
      'county.read',
      'county.write',
      'users.manage',
      'reports.generate',
      'properties.manage',
      'assessments.manage',
    ],
    description: 'County-level administration',
  },
  assessor: {
    permissions: [
      'properties.read',
      'properties.write',
      'assessments.read',
      'assessments.write',
      'reports.property',
    ],
    description: 'Property assessment functions',
  },
  realtor: {
    permissions: ['properties.read', 'assessments.read', 'reports.property'],
    description: 'Real estate professional access',
  },
  user: {
    permissions: ['properties.read', 'own_property.read'],
    description: 'Basic citizen access',
  },
  public: {
    permissions: ['public_records.read'],
    description: 'Public information access',
  },
};
```

### JWT Token Management

```javascript
// JWT Configuration
const jwtConfig = {
  algorithm: 'RS256',
  issuer: 'terrafusion.gov',
  audience: 'terrafusion-api',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  keyRotation: '90d',
  blacklistEnabled: true,
};

// Token Security Headers
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

## Data Protection

### Encryption Standards

```javascript
// Encryption Configuration
const encryptionConfig = {
  atRest: {
    algorithm: 'AES-256-GCM',
    keyManagement: 'AWS KMS', // or Azure Key Vault, HashiCorp Vault
    keyRotation: '90d',
  },
  inTransit: {
    protocol: 'TLS 1.3',
    cipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
    ],
    hsts: true,
  },
  database: {
    transparentDataEncryption: true,
    columnLevelEncryption: ['ssn', 'tax_id', 'bank_account'],
    backupEncryption: true,
  },
};
```

### Personally Identifiable Information (PII)

```javascript
// PII Protection
const piiFields = [
  'social_security_number',
  'tax_identification_number',
  'bank_account_number',
  'credit_card_number',
  'drivers_license_number',
  'email_address',
  'phone_number',
];

// Data Masking Rules
const maskingRules = {
  development: {
    ssn: 'XXX-XX-1234',
    email: 'user@example.com',
    phone: '555-0100',
  },
  staging: {
    ssn: 'hash_with_salt',
    email: 'hash_with_salt',
    phone: 'hash_with_salt',
  },
  production: {
    // No masking - full encryption
  },
};
```

## API Security

### Rate Limiting

```javascript
// Rate Limiting Configuration
const rateLimits = {
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per window
  },
  authentication: {
    windowMs: 15 * 60 * 1000,
    max: 5, // login attempts per window
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // API calls per minute
  },
  upload: {
    windowMs: 60 * 1000,
    max: 10, // file uploads per minute
  },
};
```

### Input Validation & Sanitization

```javascript
// Input Validation Rules
const validationRules = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?1?[0-9]{10}$/,
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  parcelId: /^[A-Z0-9]{6,20}$/,
  currency: /^\d+(\.\d{2})?$/,
};

// SQL Injection Prevention
const queryConfig = {
  parameterizedQueries: true,
  ormEnabled: true, // Prisma ORM
  rawQueryRestricted: true,
  inputSanitization: true,
};
```

### CORS Configuration

```javascript
// CORS Security Settings
const corsConfig = {
  origin: [
    'https://terrafusion.gov',
    'https://app.terrafusion.gov',
    'https://admin.terrafusion.gov',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
  ],
};
```

## Infrastructure Security

### Network Security

```yaml
# Network Security Configuration
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: terrafusion-security-policy
spec:
  podSelector:
    matchLabels:
      app: terrafusion
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app: terrafusion-frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: database
      ports:
        - protocol: TCP
          port: 5432
```

### Container Security

```dockerfile
# Secure Container Configuration
FROM node:18-alpine AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S terrafusion -u 1001

# Security updates
RUN apk update && apk upgrade
RUN apk add --no-cache dumb-init

# Remove unnecessary packages
RUN apk del --purge wget curl

# Set secure permissions
COPY --chown=terrafusion:nodejs . .
USER terrafusion

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

## Secrets Management

### Environment Variables

```bash
# .env.example - Template for environment variables
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_ENCRYPTION_KEY=your-32-character-encryption-key

# JWT Secrets
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# API Keys
GOOGLE_MAPS_API_KEY=your-google-maps-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Encryption
ENCRYPTION_KEY=your-aes-256-encryption-key
SALT_ROUNDS=12

# Third-party Services
STRIPE_SECRET_KEY=your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Kubernetes Secrets

```yaml
# k8s/secrets/database-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: database-secret
  namespace: terrafusion-production
type: Opaque
data:
  username: dGVycmFmdXNpb24= # base64 encoded
  password: c3VwZXJfc2VjdXJlX3Bhc3N3b3Jk # base64 encoded
  url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0Bob3N0OjU0MzIvZGI= # base64 encoded
```

### HashiCorp Vault Integration

```javascript
// Vault Configuration
const vaultConfig = {
  endpoint: 'https://vault.terrafusion.gov',
  namespace: 'terrafusion',
  authMethod: 'kubernetes',
  role: 'terrafusion-app',
  secretPaths: {
    database: 'secret/data/database',
    jwt: 'secret/data/jwt',
    encryption: 'secret/data/encryption',
  },
  renewalThreshold: 0.9, // Renew when 90% of lease time elapsed
};
```

## Security Monitoring

### Audit Logging

```javascript
// Audit Log Configuration
const auditConfig = {
  enabled: true,
  logLevel: 'info',
  events: [
    'user_login',
    'user_logout',
    'password_change',
    'role_change',
    'data_access',
    'data_modification',
    'system_configuration_change',
    'security_event',
  ],
  retention: '7 years', // Government requirement
  encryption: true,
  immutable: true,
};

// Audit Log Format
const auditLogEntry = {
  timestamp: '2025-08-04T20:48:49.000Z',
  userId: 'user-uuid',
  sessionId: 'session-uuid',
  action: 'property_assessment_update',
  resource: 'property:12345',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  success: true,
  changes: {
    old_value: 150000,
    new_value: 155000,
  },
};
```

### Intrusion Detection

```javascript
// Security Monitoring Rules
const securityRules = {
  failedLoginThreshold: 5,
  suspiciousActivityPatterns: [
    'multiple_failed_logins',
    'unusual_access_patterns',
    'privilege_escalation_attempts',
    'data_exfiltration_indicators',
  ],
  alerting: {
    email: ['security@terrafusion.gov'],
    slack: '#security-alerts',
    pagerduty: 'security-team',
  },
  automaticResponse: {
    accountLockout: true,
    ipBlocking: true,
    sessionTermination: true,
  },
};
```

## Incident Response

### Security Incident Playbook

```markdown
## Incident Response Procedures

### Phase 1: Detection & Analysis (0-15 minutes)

1. Identify and classify the incident
2. Assemble incident response team
3. Preserve evidence and logs
4. Assess scope and impact

### Phase 2: Containment (15-60 minutes)

1. Isolate affected systems
2. Prevent further damage
3. Maintain business continuity
4. Document all actions

### Phase 3: Eradication & Recovery (1-24 hours)

1. Remove threat from environment
2. Patch vulnerabilities
3. Restore systems from clean backups
4. Monitor for recurring issues

### Phase 4: Post-Incident (24-72 hours)

1. Conduct lessons learned session
2. Update security procedures
3. Improve detection capabilities
4. Report to stakeholders
```

### Emergency Contacts

```javascript
// Emergency Response Team
const emergencyContacts = {
  securityTeam: {
    primary: 'security@terrafusion.gov',
    phone: '+1-555-SECURITY',
  },
  itOperations: {
    primary: 'ops@terrafusion.gov',
    phone: '+1-555-OPS-TEAM',
  },
  legalCounsel: {
    primary: 'legal@terrafusion.gov',
    phone: '+1-555-LEGAL',
  },
  publicRelations: {
    primary: 'pr@terrafusion.gov',
    phone: '+1-555-PR-TEAM',
  },
};
```

## Compliance & Auditing

### Regular Security Assessments

- **Quarterly**: Vulnerability scans and penetration testing
- **Annually**: Comprehensive security audit
- **Continuously**: Automated security monitoring
- **Ad-hoc**: Incident-driven assessments

### Compliance Reporting

```javascript
// Compliance Metrics
const complianceMetrics = {
  passwordPolicy: {
    minLength: 12,
    complexity: true,
    rotation: '90d',
    history: 12,
  },
  accessReview: {
    frequency: 'quarterly',
    automated: true,
    documentation: true,
  },
  dataRetention: {
    auditLogs: '7 years',
    personalData: 'as_required_by_law',
    backups: '30 days',
  },
  encryption: {
    atRest: 'AES-256',
    inTransit: 'TLS 1.3',
    keyManagement: 'FIPS 140-2 Level 3',
  },
};
```

## Security Training

### Staff Security Awareness

- **Phishing Awareness**: Monthly simulated phishing tests
- **Password Security**: Best practices training
- **Social Engineering**: Recognition and prevention
- **Incident Reporting**: Proper escalation procedures

### Developer Security Training

- **Secure Coding**: OWASP Top 10 prevention
- **Code Review**: Security-focused reviews
- **Threat Modeling**: Application security assessment
- **Security Testing**: Automated and manual testing

---

**Security Philosophy**: Defense in Depth, Zero Trust Architecture  
**Compliance**: Government-grade security standards  
**Monitoring**: Continuous threat detection and response
