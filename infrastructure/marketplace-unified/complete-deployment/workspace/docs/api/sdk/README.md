# Terrafusion Platform SDK Documentation

## Overview

The Terrafusion Platform provides SDKs in multiple programming languages to facilitate integration with our API. Each SDK provides a consistent interface while following language-specific conventions.

## Available SDKs

### JavaScript/TypeScript SDK

```bash
npm install @terrafusion/sdk
```

#### Quick Start

```typescript
import { TerraFusionClient } from "@terrafusion/sdk";

const client = new TerraFusionClient({
  apiKey: "your-api-key",
  environment: "production", // or 'staging', 'development'
});

// Authentication
const auth = await client.auth.login({
  email: "user@example.gov",
  password: "secure-password",
});

// Multi-tenant operations
const tenants = await client.tenants.list({
  page: 1,
  limit: 20,
});

// AI Workflow execution
const workflow = await client.ai.createWorkflow({
  name: "Document Processing",
  steps: [
    { type: "ocr", config: { language: "en" } },
    { type: "classify", config: { model: "v2" } },
  ],
});

const execution = await client.ai.executeWorkflow(workflow.id, {
  documentUrl: "https://example.com/document.pdf",
});
```

### Python SDK

```bash
pip install terrafusion-sdk
```

#### Quick Start

```python
from terrafusion import TerraFusionClient
from terrafusion.models import LoginRequest, WorkflowStep

client = TerraFusionClient(
    api_key="your-api-key",
    environment="production"
)

# Authentication
auth_response = client.auth.login(
    email="user@example.gov",
    password="secure-password"
)

# Multi-tenant operations
tenants = client.tenants.list(page=1, limit=20)

# AI Workflow execution
workflow = client.ai.create_workflow(
    name="Document Processing",
    steps=[
        WorkflowStep(type="ocr", config={"language": "en"}),
        WorkflowStep(type="classify", config={"model": "v2"})
    ]
)

execution = client.ai.execute_workflow(
    workflow_id=workflow.id,
    document_url="https://example.com/document.pdf"
)
```

### Java SDK

```xml
<dependency>
    <groupId>gov.terrafusion</groupId>
    <artifactId>terrafusion-sdk</artifactId>
    <version>3.0.0</version>
</dependency>
```

#### Quick Start

```java
import gov.terrafusion.sdk.TerraFusionClient;
import gov.terrafusion.sdk.models.*;

TerraFusionClient client = TerraFusionClient.builder()
    .apiKey("your-api-key")
    .environment(Environment.PRODUCTION)
    .build();

// Authentication
AuthResponse auth = client.auth().login(
    LoginRequest.builder()
        .email("user@example.gov")
        .password("secure-password")
        .build()
);

// Multi-tenant operations
TenantList tenants = client.tenants().list(1, 20);

// AI Workflow execution
Workflow workflow = client.ai().createWorkflow(
    CreateWorkflowRequest.builder()
        .name("Document Processing")
        .steps(Arrays.asList(
            WorkflowStep.builder()
                .type("ocr")
                .config(Map.of("language", "en"))
                .build()
        ))
        .build()
);
```

### Go SDK

```bash
go get github.com/terrafusion/terrafusion-go
```

#### Quick Start

```go
package main

import (
    "context"
    "github.com/terrafusion/terrafusion-go"
)

func main() {
    client := terrafusion.NewClient(
        terrafusion.WithAPIKey("your-api-key"),
        terrafusion.WithEnvironment(terrafusion.Production),
    )

    ctx := context.Background()

    // Authentication
    auth, err := client.Auth.Login(ctx, &terrafusion.LoginRequest{
        Email:    "user@example.gov",
        Password: "secure-password",
    })

    // Multi-tenant operations
    tenants, err := client.Tenants.List(ctx, &terrafusion.ListOptions{
        Page:  1,
        Limit: 20,
    })

    // AI Workflow execution
    workflow, err := client.AI.CreateWorkflow(ctx, &terrafusion.CreateWorkflowRequest{
        Name: "Document Processing",
        Steps: []terrafusion.WorkflowStep{
            {
                Type:   "ocr",
                Config: map[string]interface{}{"language": "en"},
            },
        },
    })
}
```

### .NET SDK

```bash
dotnet add package Terrafusion.SDK
```

#### Quick Start

```csharp
using Terrafusion.SDK;
using Terrafusion.SDK.Models;

var client = new TerraFusionClient(new TerraFusionOptions
{
    ApiKey = "your-api-key",
    Environment = TerraFusionEnvironment.Production
});

// Authentication
var auth = await client.Auth.LoginAsync(new LoginRequest
{
    Email = "user@example.gov",
    Password = "secure-password"
});

// Multi-tenant operations
var tenants = await client.Tenants.ListAsync(page: 1, limit: 20);

// AI Workflow execution
var workflow = await client.AI.CreateWorkflowAsync(new CreateWorkflowRequest
{
    Name = "Document Processing",
    Steps = new List<WorkflowStep>
    {
        new WorkflowStep
        {
            Type = "ocr",
            Config = new Dictionary<string, object> { ["language"] = "en" }
        }
    }
});
```

## Common Features

### Error Handling

All SDKs provide consistent error handling:

```typescript
// TypeScript
try {
  const result = await client.tenants.create({ name: "New Tenant" });
} catch (error) {
  if (error instanceof TerraFusionError) {
    console.error(`API Error: ${error.code} - ${error.message}`);
  }
}
```

```python
# Python
from terrafusion.exceptions import TerraFusionError

try:
    result = client.tenants.create(name="New Tenant")
except TerraFusionError as e:
    print(f"API Error: {e.code} - {e.message}")
```

### Pagination

All SDKs support pagination for list operations:

```typescript
// TypeScript
const paginator = client.tenants.paginate({ limit: 50 });
for await (const tenant of paginator) {
  console.log(tenant.name);
}
```

```python
# Python
for tenant in client.tenants.paginate(limit=50):
    print(tenant.name)
```

### Retry Logic

Built-in retry logic with exponential backoff:

```typescript
// TypeScript
const client = new TerraFusionClient({
  apiKey: "your-api-key",
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatuses: [429, 500, 502, 503, 504],
  },
});
```

### Request Interceptors

Add custom logic to requests:

```typescript
// TypeScript
client.addInterceptor({
  request: async (config) => {
    config.headers["X-Custom-Header"] = "value";
    return config;
  },
  response: async (response) => {
    console.log(`Request took ${response.duration}ms`);
    return response;
  },
});
```

## Advanced Features

### Webhook Support

```typescript
// TypeScript
const webhook = client.webhooks.create({
  url: "https://example.com/webhook",
  events: ["tenant.created", "workflow.completed"],
  secret: "webhook-secret",
});

// Verify webhook signature
const isValid = client.webhooks.verifySignature(payload, signature, secret);
```

### Streaming Responses

```typescript
// TypeScript
const stream = await client.analytics.streamReport({
  reportId: "large-report",
  format: "csv",
});

stream.on("data", (chunk) => {
  console.log("Received chunk:", chunk);
});
```

### Async Operations

```typescript
// TypeScript
const job = await client.quantum.submitComputation({
  algorithm: "optimization",
  qubits: 20,
});

// Poll for completion
const result = await client.quantum.waitForCompletion(job.jobId, {
  pollInterval: 5000,
  timeout: 300000,
});
```

## SDK Development

### Contributing

See our [SDK Contributing Guide](https://github.com/terrafusion/sdk-contrib) for information on:

- Building SDKs from OpenAPI specs
- Testing guidelines
- Release procedures

### Code Generation

Our SDKs are partially generated from OpenAPI specifications:

```bash
# Generate TypeScript SDK
npm run generate:sdk -- --language typescript --spec ../openapi/terrafusion-api-v1.yaml

# Generate Python SDK
npm run generate:sdk -- --language python --spec ../openapi/terrafusion-api-v1.yaml
```

## Support

- **Documentation**: https://docs.terrafusion.gov
- **API Reference**: https://api.terrafusion.gov/docs
- **Issues**: https://github.com/terrafusion/sdk-[language]/issues
- **Community**: https://community.terrafusion.gov
