# Sample Integration Code

## Python Example

```python
from terrafusion_sdk import TerraFusionClient

# Initialize client
client = TerraFusionClient(
    client_id='YOUR_CLIENT_ID',
    client_secret='YOUR_CLIENT_SECRET',
    environment='sandbox'  # or 'production'
)

# Authenticate
client.authenticate()

# Query datasets
datasets = client.datasets.list(tags=['gis', 'parcels'])
for ds in datasets:
    print(f"Dataset: {ds.name} ({ds.id})")

# Request valuation
valuation = client.valuations.create(
    property_id='PARCEL-12345',
    methods=['comparative', 'cost']
)
print(f"Estimated value: ${valuation.estimated_value:,.2f}")
```

## JavaScript Example

```javascript
const TerraFusion = require('@terrafusion/sdk');

const client = new TerraFusion.Client({
  clientId: process.env.TERRAFUSION_CLIENT_ID,
  clientSecret: process.env.TERRAFUSION_CLIENT_SECRET,
  environment: 'sandbox'
});

async function main() {
  // Authenticate
  await client.authenticate();
  
  // List services
  const services = await client.services.list({ tags: ['ai'] });
  services.forEach(svc => {
    console.log(`Service: ${svc.name}`);
  });
  
  // Create dataset
  const dataset = await client.datasets.create({
    name: 'Property Parcels 2025',
    type: 'geojson',
    file: './parcels.geojson'
  });
  console.log(`Created dataset: ${dataset.id}`);
}

main().catch(console.error);
```
