# Property Assessment Workflow Template

## Overview

This workflow template provides a standardized process for conducting property
assessments using Terrafusion OS with Harris PACS integration.

## Prerequisites

- Harris PACS system access and credentials
- Terrafusion OS deployment with property assessment module
- Valid jurisdiction configuration
- Assessor role permissions

## Workflow Steps

### Phase 1: Property Data Collection

**Duration**: 2-3 business days  
**Responsible**: Assessment Team Lead

#### 1.1 Initialize Assessment Request

```typescript
// API Call Example
POST /api/harris-pacs/assessments/initialize
{
  "jurisdiction": "benton-county",
  "parcelId": "12345-67890",
  "assessmentType": "annual",
  "requestedBy": "assessor@county.gov",
  "priority": "standard"
}
```

#### 1.2 Retrieve Property Information

- **Property Details**: Address, legal description, zoning
- **Ownership History**: Current and previous owners
- **Physical Characteristics**: Square footage, lot size, construction details
- **Historical Assessments**: Previous valuations and adjustments

#### 1.3 Validate Data Integrity

```bash
# Data validation script
./scripts/validate-property-data.sh --parcel-id 12345-67890 --jurisdiction benton-county
```

### Phase 2: Market Analysis

**Duration**: 1-2 business days  
**Responsible**: Market Analyst

#### 2.1 Comparable Sales Analysis

- Identify 3-5 comparable properties within 1-mile radius
- Analyze sales within last 12 months
- Apply market adjustments for differences

#### 2.2 AI-Enhanced Valuation

```typescript
// Trigger AI valuation model
POST /api/ai/property-valuation
{
  "parcelId": "12345-67890",
  "comparables": ["12345-67891", "12345-67892", "12345-67893"],
  "marketConditions": "stable",
  "specialConsiderations": []
}
```

### Phase 3: Assessment Review

**Duration**: 1 business day  
**Responsible**: Senior Assessor

#### 3.1 Quality Assurance Check

- Review AI recommendations
- Validate against local market knowledge
- Check for assessment uniformity

#### 3.2 Adjustment Calculations

```sql
-- Example adjustment query
UPDATE property_assessments
SET assessed_value = base_value * market_factor * condition_factor
WHERE parcel_id = '12345-67890'
AND assessment_year = 2024;
```

### Phase 4: Final Assessment

**Duration**: 0.5 business days  
**Responsible**: Assessment Team Lead

#### 4.1 Generate Assessment Notice

```typescript
// Generate official notice
POST /api/assessments/generate-notice
{
  "parcelId": "12345-67890",
  "assessedValue": 285000,
  "effectiveDate": "2024-01-01",
  "appealDeadline": "2024-03-15"
}
```

#### 4.2 Update Harris PACS System

- Sync assessment data to Harris PACS
- Update property records
- Generate audit trail

## Quality Gates

### Gate 1: Data Completeness

- [ ] Property details verified
- [ ] Ownership information current
- [ ] Physical characteristics documented
- [ ] Zoning compliance confirmed

### Gate 2: Valuation Accuracy

- [ ] Comparable sales analysis completed
- [ ] AI model validation passed
- [ ] Market adjustments applied
- [ ] Senior assessor review completed

### Gate 3: Compliance Check

- [ ] Assessment uniformity verified
- [ ] Legal requirements met
- [ ] Documentation complete
- [ ] Harris PACS synchronization successful

## Error Handling

### Common Issues and Resolutions

#### Issue: Harris PACS Connection Timeout

**Symptoms**: API calls failing with timeout errors **Resolution**:

```bash
# Check Harris PACS connectivity
curl -X GET "https://harris-pacs.county.gov/api/health" \
  -H "Authorization: Bearer $HARRIS_TOKEN"

# Restart Harris PACS integration service
systemctl restart terrafusion-harris-integration
```

#### Issue: Incomplete Property Data

**Symptoms**: Missing square footage or construction details **Resolution**:

1. Check Harris PACS source data
2. Cross-reference with GIS system
3. Schedule field inspection if necessary

#### Issue: AI Valuation Outlier

**Symptoms**: AI suggested value >20% different from comparable sales
**Resolution**:

1. Review comparable property selection
2. Check for unique property characteristics
3. Manual override with justification

## Performance Metrics

### Key Performance Indicators

- **Assessment Completion Time**: Target <5 business days
- **Data Accuracy Rate**: Target >98%
- **Appeal Rate**: Target <5%
- **Harris PACS Sync Success**: Target >99%

### Monitoring Dashboard

Access real-time metrics at: `/dashboard/property-assessments`

## Compliance Requirements

### FISMA/NIST Security

- All data transmissions encrypted (TLS 1.3)
- Access logging enabled
- Role-based permissions enforced
- Regular security audits conducted

### State Assessment Standards

- Uniform assessment practices
- Market value determination methods
- Appeal process compliance
- Documentation retention (7 years)

## Related Workflows

- [Tax Collection Workflow](./tax-collection-workflow.md)
- [Permit Processing Workflow](./permit-processing-workflow.md)
- [Harris PACS Integration Guide](../troubleshooting/harris-pacs-integration.md)

## Revision History

| Version | Date       | Author           | Changes                   |
| ------- | ---------- | ---------------- | ------------------------- |
| 1.0     | 2024-08-18 | Terrafusion Team | Initial template creation |

---

_This workflow template is part of the Terrafusion OS Knowledge Base. For
technical support, contact: support@terrafusion.gov_
