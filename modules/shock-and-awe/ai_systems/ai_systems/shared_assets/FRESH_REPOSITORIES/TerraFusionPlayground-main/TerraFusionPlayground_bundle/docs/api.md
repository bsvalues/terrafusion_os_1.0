# TerraFusion Playground API Documentation

## Overview

The TerraFusion Playground API provides endpoints for AI model processing, system status monitoring, and resource management.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Process Data

Process input data through the AI model.

```http
POST /process
```

#### Request Body

```json
{
  "data": [1, 2, 3]
}
```

#### Response

```json
{
  "result": [0.1, 0.2, 0.7],
  "processingTime": 100,
  "confidence": 0.7
}
```

### Get System Status

Retrieve the current status of the system.

```http
GET /status
```

#### Response

```json
{
  "model": "ready",
  "performance": {
    "cpu": 50,
    "memory": 1024
  },
  "security": {
    "authenticated": true
  }
}
```

### Initialize Model

Initialize the AI model.

```http
POST /initialize
```

#### Response

```json
{
  "status": "initialized"
}
```

### Cleanup Resources

Clean up system resources.

```http
POST /cleanup
```

#### Response

```json
{
  "status": "cleaned_up"
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error

```json
{
  "error": "Error message"
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per IP address.

## Best Practices

1. Always check the response status code
2. Handle errors gracefully
3. Implement retry logic for failed requests
4. Cache responses when appropriate
5. Monitor API usage and performance

## Examples

### JavaScript

```javascript
const processData = async (data) => {
  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) {
      throw new Error('Processing failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Python

```python
import requests

def process_data(data, token):
    try:
        response = requests.post(
            'http://localhost:3000/api/process',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            },
            json={'data': data}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        raise
```

## Support

For API support, please contact the TerraFusion team or open an issue in the GitHub repository. 