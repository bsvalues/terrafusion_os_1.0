# Terrafusion Environment Setup Guide

This guide covers the complete environment configuration for the Terrafusion property management platform.

## File Structure

```
Terrafusion/
├── .env                    # Non-sensitive environment variables
├── .env.example           # Template for environment setup
├── secrets/               # Secure folder for sensitive data
│   ├── .env.secrets       # API keys and sensitive config
│   ├── api-keys/          # Individual API key files
│   ├── certificates/      # SSL certificates
│   ├── database/          # Database credentials
│   ├── load-secrets.js    # Environment loader
│   └── README.md          # Secrets documentation
└── .gitignore             # Excludes secrets from version control
```

## Quick Setup

### 1. Basic Configuration
```bash
# Copy environment template
cp .env.example .env

# Create secrets file
cp secrets/.env.secrets.example secrets/.env.secrets
```

### 2. Required Secrets
Add these to `secrets/.env.secrets`:

```bash
# Essential for AI features
OPENAI_API_KEY=sk-your-openai-key

# Database (automatically provided by Replit)
DATABASE_URL=postgresql://...

# Session security
SESSION_SECRET=your-secure-random-string
```

### 3. Start Development
```bash
npm run dev
```

## Environment Variables Reference

### Core Application
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Server port | No | `5000` |
| `DATABASE_URL` | PostgreSQL connection | Yes | Auto-provided |

### AI and Machine Learning
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API access | For AI features | `sk-...` |

### Communication Services
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | For SMS | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio authentication | For SMS | `...` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | For SMS | `+1...` |
| `SENDGRID_API_KEY` | SendGrid email service | For email | `SG...` |

### Payment Processing
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe payment processing | For payments | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe client-side key | For payments | `pk_test_...` |

### Mapping and Geospatial
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `GOOGLE_MAPS_API_KEY` | Google Maps integration | For mapping | `AIza...` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox mapping service | For mapping | `pk...` |

### County Data Sources
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `BENTON_COUNTY_API_KEY` | Direct county data access | For live data | `...` |
| `ARCGIS_API_TOKEN` | ArcGIS mapping data | For GIS | `...` |

## Development vs Production

### Development (.env)
- Non-sensitive configuration
- Local development settings
- Debug flags enabled

### Production (Replit Secrets)
- Sensitive API keys
- Production database URLs
- Security tokens

## Security Best Practices

### 1. API Key Management
- Rotate keys every 90 days
- Use least privilege access
- Monitor usage patterns
- Separate dev/prod keys

### 2. Database Security
- Use connection pooling
- Enable SSL/TLS
- Regular security updates
- Backup encryption

### 3. Environment Isolation
- Separate staging/production
- Environment-specific configs
- Secure secrets storage
- Access logging

## Service Integration Setup

### OpenAI Configuration
1. Visit https://platform.openai.com/api-keys
2. Create new API key with appropriate limits
3. Add to `OPENAI_API_KEY` in secrets
4. Monitor usage at https://platform.openai.com/usage

### Twilio SMS Setup
1. Create account at https://console.twilio.com/
2. Get Account SID and Auth Token
3. Purchase or verify phone number
4. Add credentials to secrets file

### Stripe Payments Setup
1. Create account at https://dashboard.stripe.com/
2. Get test keys for development
3. Configure webhooks for events
4. Add keys to secrets file

### Google Maps Setup
1. Enable Maps JavaScript API in Google Cloud Console
2. Create API key with appropriate restrictions
3. Set up billing account
4. Add key to secrets file

## Troubleshooting

### Common Issues

**API Keys Not Working**
- Verify key format and validity
- Check service billing status
- Confirm environment loading
- Review access permissions

**Database Connection Errors**
- Verify DATABASE_URL format
- Check network connectivity
- Confirm SSL settings
- Review connection limits

**Environment Loading Issues**
- Check file paths and permissions
- Verify dotenv configuration
- Review console logs
- Confirm .gitignore settings

### Debug Commands
```bash
# Check environment variables
node -e "console.log(process.env)"

# Test database connection
npm run test:db

# Verify API keys
npm run test:services

# Load secrets manually
node secrets/load-secrets.js
```

## Production Deployment

### Replit Deployment
1. Add secrets to Replit environment
2. Configure production environment variables
3. Enable database backups
4. Set up monitoring alerts

### Environment Checklist
- [ ] All required secrets configured
- [ ] Database connection verified
- [ ] API keys tested and valid
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup systems enabled

## Support

For environment setup issues:
1. Check this documentation
2. Review service-specific documentation
3. Test individual API connections
4. Contact platform support if needed