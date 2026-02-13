# County Pack Environment Overrides

This directory contains environment-specific configuration overrides for the Benton County Pack.

## File Structure

- **county.json** - Base configuration (production defaults)
- **county.development.json** - Development environment overrides
- **county.staging.json** - Staging environment overrides
- **county.production.json** - Production environment overrides (optional, uses base)

## Override Mechanism

When deploying with `--env <environment>`, the deploy command:

1. Loads base configuration from `county.json`
2. Applies environment-specific overrides from `county.<environment>.json`
3. Merges configurations (environment overrides take precedence)
4. Validates merged configuration against schema

## Example Usage

```bash
# Development deployment (uses county.development.json overrides)
tdc county deploy tools/county-packs/benton-pack-v1.0 --env development --execute

# Staging deployment (uses county.staging.json overrides)
tdc county deploy tools/county-packs/benton-pack-v1.0 --env staging --execute

# Production deployment (uses base county.json)
tdc county deploy tools/county-packs/benton-pack-v1.0 --env production --execute
```

## Environment-Specific Settings

### Development
- **Parcel Count**: Small dataset (100 parcels)
- **Sync Frequency**: Frequent (1h) for rapid testing
- **Backup Retention**: Short (7d) for storage savings
- **High Availability**: Disabled (single instance)
- **Debug Mode**: Enabled (verbose logging)

### Staging
- **Parcel Count**: Medium dataset (1,000 parcels)
- **Sync Frequency**: Moderate (2h)
- **Backup Retention**: Medium (30d)
- **High Availability**: Disabled (cost optimization)
- **Debug Mode**: Disabled (production-like)

### Production
- **Parcel Count**: Full dataset (89,247 parcels)
- **Sync Frequency**: Standard (4h)
- **Backup Retention**: Long (90d) for compliance
- **High Availability**: Enabled (multi-instance)
- **Debug Mode**: Disabled (performance optimized)

## Governance

Environment-specific configurations must:
- Not modify `countyName`, `fipsCode`, `state`, or `timezone`
- Maintain schema compliance (validated on deploy)
- Include `deployment.environment` matching the override file
- Document differences in comments or customFields

## Evidence Trail

Each deployment generates:
- **Deployment manifest** - SHA256 checksums of deployed artifacts
- **Evidence pack** - Validation contracts + deployment proof
- **Merge artifact** - Final merged configuration with environment overrides
