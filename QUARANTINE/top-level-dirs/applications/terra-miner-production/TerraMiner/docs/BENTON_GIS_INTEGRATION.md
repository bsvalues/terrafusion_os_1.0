# Benton County GIS Integration

## Overview

The TerraMiner platform integrates with Benton County's GIS services to provide authentic property assessment data. This document outlines the integration approach, data sources, and implementation details.

## Integration Strategy

We use the following approach to access authentic Benton County property data:

1. **Primary Source**: Direct connection to Benton County PACS database server via a secure API bridge
2. **Secondary Source**: Benton County GIS services via their ArcGIS REST API
3. **Fallback**: Authenticated access to Benton County Assessor's web services

## Data Sources

### Benton County GIS Services

The following Benton County GIS URLs are used for accessing authentic property data:

- Property Map Service: `https://gis.bentoncounty.us/arcgis/rest/services/BentonCountyGIS/Property/MapServer`
- Parcels Layer: `https://gis.bentoncounty.us/arcgis/rest/services/BentonCountyGIS/Property/MapServer/0`
- Address Points: `https://gis.bentoncounty.us/arcgis/rest/services/BentonCountyGIS/Property/MapServer/1`
- Feature Service: `https://services3.arcgis.com/K3UVdwu4FON52KVF/arcgis/rest/services`

### PACS Database Connection

The Benton County PACS database is accessed via a secure API bridge that connects to the backend database server (`jcharrispacs`) and retrieves authentic assessment data. Connection details are stored in separate configuration files and environment variables.

## Development and Testing

For development and testing purposes:

1. Set the `BENTON_ASSESSOR_API_KEY` environment variable if credentials are required
2. Set the `FORCE_ASSESSMENT_DATA_SOURCE` environment variable to `GIS` or `PACS` to force a specific data source
3. Use the test script `test_benton_gis_connector.py` to verify connectivity

### Network Access Requirements

The following network access is required for the GIS connector:

- Outbound HTTPS (port 443) access to `gis.bentoncounty.us`
- Outbound HTTPS (port 443) access to `services3.arcgis.com`

If using a proxy or firewall, ensure these domains are allowlisted.

### Integration Testing

Integration tests can be run using:

```bash
python test_benton_gis_connector.py
```

This test validates:
- Connectivity to Benton County GIS services
- Metadata retrieval
- Property lookup by parcel ID
- Property search by address and owner name

## Data Compliance

All property assessment data retrieved through this integration complies with:

- International Association of Assessing Officers (IAAO) standards
- Uniform Standards of Professional Appraisal Practice (USPAP)

Each property record includes compliance metadata to verify adherence to these standards.

## Troubleshooting

Common issues and their resolutions:

1. **Connection failures**: Verify network connectivity and firewall rules.
2. **API key errors**: Ensure the `BENTON_ASSESSOR_API_KEY` environment variable is set correctly.
3. **No results found**: Confirm search parameters match Benton County's data format.
4. **Missing field errors**: Field names in the GIS schema may have changed; check the metadata API response.

## Production Deployment

In a production environment, it is essential to:

1. Store API credentials securely using environment variables or a secrets manager
2. Implement rate limiting to avoid overwhelming the GIS services
3. Cache frequently accessed data to improve performance
4. Monitor API response times and error rates
5. Set up alerting for connection failures

## Future Enhancements

Planned enhancements to the integration include:

1. Expanded coverage to additional counties in Southeastern Washington
2. Integration with additional Benton County data services
3. Enhanced caching strategy for improved performance
4. More detailed property visualization capabilities