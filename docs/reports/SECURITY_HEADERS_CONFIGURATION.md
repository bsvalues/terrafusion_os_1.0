# TerraFusion Security Headers Configuration
# THE TERRAFUSION WAY: Comprehensive security hardening for Node.js servers
# Reference: https://helmetjs.github.io/

## Security Headers Applied

### 1. Content Security Policy (CSP)
**Purpose:** Prevents XSS attacks by controlling resource loading.

**Configuration:**
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI frameworks
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));
```

### 2. HTTP Strict Transport Security (HSTS)
**Purpose:** Forces HTTPS connections, prevents downgrade attacks.

**Configuration:**
```javascript
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
```

### 3. X-Frame-Options
**Purpose:** Prevents clickjacking attacks.

**Configuration:**
```javascript
app.use(helmet.frameguard({ action: 'deny' }));
```

### 4. X-Content-Type-Options
**Purpose:** Prevents MIME type sniffing.

**Configuration:**
```javascript
app.use(helmet.noSniff());
```

### 5. Referrer-Policy
**Purpose:** Controls referrer information sent to other sites.

**Configuration:**
```javascript
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
```

### 6. Permissions-Policy
**Purpose:** Controls which browser features can be used.

**Configuration:**
```javascript
app.use(helmet.permissionsPolicy({
  features: {
    geolocation: ["'self'"],
    camera: ["'none'"],
    microphone: ["'none'"],
    payment: ["'none'"]
  }
}));
```

## Servers Updated

1. **backend/mcp-servers/document-server/src/server.js**
   - Status: ✅ Enhanced from basic helmet() to comprehensive configuration
   - Security Level: High

2. **src/terrafusion-gis/tf-assistant/backend/server.js**
   - Status: ✅ Added helmet with comprehensive configuration
   - Security Level: High

## Security Benefits

- ✅ **XSS Protection:** CSP prevents malicious script injection
- ✅ **Clickjacking Prevention:** X-Frame-Options blocks iframe embedding
- ✅ **HTTPS Enforcement:** HSTS forces secure connections
- ✅ **MIME Sniffing Protection:** X-Content-Type-Options prevents type confusion
- ✅ **Feature Policy:** Limits browser API access
- ✅ **Referrer Control:** Protects privacy in cross-origin requests

## Testing

To verify security headers are applied:

```bash
# Test document-server
curl -I http://localhost:8080/health

# Test tf-assistant
curl -I http://localhost:3001/health
```

Expected headers:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

## Next Steps

1. ✅ Install helmet in servers that don't have it
2. ✅ Configure CSP, HSTS, X-Frame-Options
3. ✅ Test security headers with curl
4. ⏳ Monitor for CSP violations in production
5. ⏳ Adjust CSP directives based on actual usage

---

**THE TERRAFUSION WAY:** Security is not optional, it's foundational! 🔒
