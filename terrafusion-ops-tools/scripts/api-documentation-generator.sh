#!/bin/bash

# TerraFusion Comprehensive API Documentation Generator
# Auto-generates OpenAPI/Swagger docs with live testing capabilities

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
DOCS_DB="${DOCS_DB:-terrafusion_apidocs}"
DOCS_USER="${DB_USER:-tfapidocs}"
DOCS_PASS="${DB_PASS:-$(generate_password)}"
SWAGGER_UI_PORT="${SWAGGER_UI_PORT:-8080}"
REDOC_PORT="${REDOC_PORT:-8081}"
API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:\${{TF_FRONTEND_PORT:-3000}}}"

# Initialize database
init_docs_database() {
    log_info "Initializing API documentation database..."
    
    psql -U postgres -c "CREATE DATABASE ${DOCS_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${DOCS_USER} WITH PASSWORD '${DOCS_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DOCS_DB} TO ${DOCS_USER};"
    
    psql -U ${DOCS_USER} -d ${DOCS_DB} <<EOF
-- API services
CREATE TABLE IF NOT EXISTS api_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500),
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    base_url VARCHAR(500),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    license_name VARCHAR(100),
    license_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API endpoints
CREATE TABLE IF NOT EXISTS api_endpoints (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES api_services(id),
    path VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    operation_id VARCHAR(255),
    summary VARCHAR(500),
    description TEXT,
    tags TEXT[],
    deprecated BOOLEAN DEFAULT false,
    security_requirements JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, path, method)
);

-- Request/Response schemas
CREATE TABLE IF NOT EXISTS api_schemas (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES api_services(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- object, array, string, number, boolean
    properties JSONB,
    required TEXT[],
    example JSONB,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, name)
);

-- Parameters
CREATE TABLE IF NOT EXISTS api_parameters (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    name VARCHAR(255) NOT NULL,
    in_type VARCHAR(20), -- path, query, header, cookie
    required BOOLEAN DEFAULT false,
    data_type VARCHAR(50),
    format VARCHAR(50),
    description TEXT,
    default_value TEXT,
    enum_values TEXT[],
    example TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Request bodies
CREATE TABLE IF NOT EXISTS api_request_bodies (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    content_type VARCHAR(100) DEFAULT 'application/json',
    schema_ref VARCHAR(255),
    schema_inline JSONB,
    required BOOLEAN DEFAULT true,
    description TEXT,
    examples JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Responses
CREATE TABLE IF NOT EXISTS api_responses (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    status_code INTEGER,
    description TEXT,
    content_type VARCHAR(100) DEFAULT 'application/json',
    schema_ref VARCHAR(255),
    schema_inline JSONB,
    headers JSONB,
    examples JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API examples
CREATE TABLE IF NOT EXISTS api_examples (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    request_headers JSONB,
    request_params JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    curl_command TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API test cases
CREATE TABLE IF NOT EXISTS api_test_cases (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50), -- functional, performance, security
    test_data JSONB,
    expected_status INTEGER,
    expected_response JSONB,
    assertions JSONB,
    last_run TIMESTAMP,
    last_result VARCHAR(20), -- pass, fail, error
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentation versions
CREATE TABLE IF NOT EXISTS doc_versions (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES api_services(id),
    version VARCHAR(50) NOT NULL,
    openapi_spec JSONB NOT NULL,
    changelog TEXT,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_by VARCHAR(255),
    UNIQUE(service_id, version)
);

-- API metrics
CREATE TABLE IF NOT EXISTS api_metrics (
    id SERIAL PRIMARY KEY,
    endpoint_id INTEGER REFERENCES api_endpoints(id),
    timestamp TIMESTAMP NOT NULL,
    request_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    p95_response_time_ms DECIMAL(10,2),
    p99_response_time_ms DECIMAL(10,2),
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_endpoints_service ON api_endpoints(service_id);
CREATE INDEX IF NOT EXISTS idx_api_parameters_endpoint ON api_parameters(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_responses_endpoint ON api_responses(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_examples_endpoint ON api_examples(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_time ON api_metrics(endpoint_id, timestamp DESC);
EOF
    
    log_success "API documentation database initialized"
}

# Scan API endpoints
scan_api_endpoints() {
    local service_name=$1
    local base_url=$2
    
    log_info "Scanning API endpoints for ${service_name}..."
    
    # Auto-discover endpoints
    python3 <<EOF
import requests
import psycopg2
import json
import re
from urllib.parse import urlparse

conn = psycopg2.connect(
    dbname="${DOCS_DB}",
    user="${DOCS_USER}",
    password="${DOCS_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Create or update service
cur.execute("""
    INSERT INTO api_services (name, base_url)
    VALUES (%s, %s)
    ON CONFLICT (name) DO UPDATE SET
        base_url = EXCLUDED.base_url,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id
""", ("${service_name}", "${base_url}"))
service_id = cur.fetchone()[0]

# Try to fetch OpenAPI spec
spec_urls = [
    f"${base_url}/swagger.json",
    f"${base_url}/openapi.json",
    f"${base_url}/api-docs",
    f"${base_url}/v3/api-docs",
    f"${base_url}/docs/swagger.json"
]

spec_found = False
for url in spec_urls:
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            spec = response.json()
            spec_found = True
            print(f"Found OpenAPI spec at {url}")
            
            # Parse OpenAPI spec
            if 'info' in spec:
                cur.execute("""
                    UPDATE api_services SET
                        title = %s,
                        description = %s,
                        version = %s,
                        contact_name = %s,
                        contact_email = %s,
                        license_name = %s
                    WHERE id = %s
                """, (
                    spec['info'].get('title'),
                    spec['info'].get('description'),
                    spec['info'].get('version', '1.0.0'),
                    spec['info'].get('contact', {}).get('name'),
                    spec['info'].get('contact', {}).get('email'),
                    spec['info'].get('license', {}).get('name'),
                    service_id
                ))
            
            # Parse paths
            for path, methods in spec.get('paths', {}).items():
                for method, operation in methods.items():
                    if method in ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']:
                        # Insert endpoint
                        cur.execute("""
                            INSERT INTO api_endpoints (
                                service_id, path, method, operation_id,
                                summary, description, tags, deprecated
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (service_id, path, method) DO UPDATE SET
                                summary = EXCLUDED.summary,
                                description = EXCLUDED.description,
                                updated_at = CURRENT_TIMESTAMP
                            RETURNING id
                        """, (
                            service_id, path, method.upper(),
                            operation.get('operationId'),
                            operation.get('summary'),
                            operation.get('description'),
                            operation.get('tags', []),
                            operation.get('deprecated', False)
                        ))
                        endpoint_id = cur.fetchone()[0]
                        
                        # Parse parameters
                        for param in operation.get('parameters', []):
                            cur.execute("""
                                INSERT INTO api_parameters (
                                    endpoint_id, name, in_type, required,
                                    data_type, description, example
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """, (
                                endpoint_id,
                                param.get('name'),
                                param.get('in'),
                                param.get('required', False),
                                param.get('schema', {}).get('type'),
                                param.get('description'),
                                str(param.get('example', ''))
                            ))
                        
                        # Parse responses
                        for status_code, response in operation.get('responses', {}).items():
                            content = response.get('content', {})
                            for content_type, media_type in content.items():
                                cur.execute("""
                                    INSERT INTO api_responses (
                                        endpoint_id, status_code, description,
                                        content_type, schema_inline
                                    ) VALUES (%s, %s, %s, %s, %s)
                                """, (
                                    endpoint_id,
                                    int(status_code) if status_code.isdigit() else 0,
                                    response.get('description'),
                                    content_type,
                                    json.dumps(media_type.get('schema', {}))
                                ))
            
            # Store the full spec
            cur.execute("""
                INSERT INTO doc_versions (service_id, version, openapi_spec)
                VALUES (%s, %s, %s)
                ON CONFLICT (service_id, version) DO UPDATE SET
                    openapi_spec = EXCLUDED.openapi_spec,
                    published_at = CURRENT_TIMESTAMP
            """, (service_id, spec['info'].get('version', '1.0.0'), json.dumps(spec)))
            
            break
    except Exception as e:
        continue

if not spec_found:
    print("No OpenAPI spec found, attempting to discover endpoints...")
    
    # Try to discover endpoints through common patterns
    common_paths = [
        '/api/v1', '/api/v2', '/api', '/v1', '/v2',
        '/users', '/products', '/orders', '/auth',
        '/health', '/status', '/metrics'
    ]
    
    discovered_endpoints = []
    
    for path in common_paths:
        for method in ['GET', 'POST', 'PUT', 'DELETE']:
            try:
                url = f"${base_url}{path}"
                response = requests.request(method, url, timeout=2)
                if response.status_code < 500:  # Not a server error
                    discovered_endpoints.append({
                        'path': path,
                        'method': method,
                        'status': response.status_code
                    })
                    print(f"Discovered: {method} {path} -> {response.status_code}")
            except:
                pass
    
    # Store discovered endpoints
    for endpoint in discovered_endpoints:
        cur.execute("""
            INSERT INTO api_endpoints (service_id, path, method, summary)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (service_id, path, method) DO NOTHING
        """, (
            service_id, endpoint['path'], endpoint['method'],
            f"Auto-discovered endpoint (status: {endpoint['status']})"
        ))

conn.commit()
cur.close()
conn.close()

print(f"API endpoint scan complete for {service_name}")
EOF
    
    log_success "API endpoint scan complete"
}

# Generate documentation
generate_documentation() {
    local service_name=$1
    local format=${2:-"all"}
    
    log_info "Generating API documentation for ${service_name}..."
    
    # Generate OpenAPI specification
    python3 <<EOF
import psycopg2
import json
import yaml
from datetime import datetime

conn = psycopg2.connect(
    dbname="${DOCS_DB}",
    user="${DOCS_USER}",
    password="${DOCS_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get service info
cur.execute("""
    SELECT id, title, description, version, base_url,
           contact_name, contact_email, license_name
    FROM api_services
    WHERE name = %s
""", ("${service_name}",))

service = cur.fetchone()
if not service:
    print(f"Service {service_name} not found")
    exit(1)

service_id = service[0]

# Build OpenAPI spec
openapi_spec = {
    "openapi": "3.0.3",
    "info": {
        "title": service[1] or "${service_name} API",
        "description": service[2] or f"API documentation for {service_name}",
        "version": service[3] or "1.0.0",
        "contact": {
            "name": service[5],
            "email": service[6]
        } if service[5] else None,
        "license": {
            "name": service[7]
        } if service[7] else None
    },
    "servers": [
        {
            "url": service[4],
            "description": "Default server"
        }
    ],
    "paths": {},
    "components": {
        "schemas": {},
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            },
            "apiKey": {
                "type": "apiKey",
                "in": "header",
                "name": "X-API-Key"
            }
        }
    }
}

# Get all endpoints
cur.execute("""
    SELECT id, path, method, operation_id, summary, description,
           tags, deprecated, security_requirements
    FROM api_endpoints
    WHERE service_id = %s
    ORDER BY path, method
""", (service_id,))

endpoints = cur.fetchall()

for endpoint in endpoints:
    endpoint_id, path, method, op_id, summary, desc, tags, deprecated, security = endpoint
    
    if path not in openapi_spec["paths"]:
        openapi_spec["paths"][path] = {}
    
    operation = {
        "summary": summary,
        "description": desc,
        "operationId": op_id or f"{method.lower()}_{path.replace('/', '_').replace('{', '').replace('}', '')}",
        "tags": tags or [],
        "deprecated": deprecated
    }
    
    # Add parameters
    cur.execute("""
        SELECT name, in_type, required, data_type, format,
               description, default_value, enum_values, example
        FROM api_parameters
        WHERE endpoint_id = %s
    """, (endpoint_id,))
    
    parameters = cur.fetchall()
    if parameters:
        operation["parameters"] = []
        for param in parameters:
            param_obj = {
                "name": param[0],
                "in": param[1],
                "required": param[2],
                "description": param[5],
                "schema": {
                    "type": param[3] or "string"
                }
            }
            if param[4]:
                param_obj["schema"]["format"] = param[4]
            if param[6]:
                param_obj["schema"]["default"] = param[6]
            if param[7]:
                param_obj["schema"]["enum"] = param[7]
            if param[8]:
                param_obj["example"] = param[8]
            
            operation["parameters"].append(param_obj)
    
    # Add request body
    cur.execute("""
        SELECT content_type, schema_ref, schema_inline, required, description
        FROM api_request_bodies
        WHERE endpoint_id = %s
    """, (endpoint_id,))
    
    request_body = cur.fetchone()
    if request_body:
        operation["requestBody"] = {
            "required": request_body[3],
            "description": request_body[4],
            "content": {
                request_body[0]: {
                    "schema": request_body[2] if request_body[2] else {"$ref": f"#/components/schemas/{request_body[1]}"}
                }
            }
        }
    
    # Add responses
    cur.execute("""
        SELECT status_code, description, content_type, schema_ref, schema_inline
        FROM api_responses
        WHERE endpoint_id = %s
    """, (endpoint_id,))
    
    responses = cur.fetchall()
    if responses:
        operation["responses"] = {}
        for response in responses:
            status = str(response[0])
            operation["responses"][status] = {
                "description": response[1] or f"Response {status}"
            }
            if response[2]:
                operation["responses"][status]["content"] = {
                    response[2]: {
                        "schema": response[4] if response[4] else {"$ref": f"#/components/schemas/{response[3]}"}
                    }
                }
    else:
        # Default responses
        operation["responses"] = {
            "200": {"description": "Successful response"},
            "400": {"description": "Bad request"},
            "401": {"description": "Unauthorized"},
            "500": {"description": "Internal server error"}
        }
    
    # Add security requirements
    if security:
        operation["security"] = security
    
    openapi_spec["paths"][path][method.lower()] = operation

# Get schemas
cur.execute("""
    SELECT name, type, properties, required, example, description
    FROM api_schemas
    WHERE service_id = %s
""", (service_id,))

schemas = cur.fetchall()
for schema in schemas:
    schema_obj = {
        "type": schema[1] or "object",
        "description": schema[5]
    }
    if schema[2]:
        schema_obj["properties"] = schema[2]
    if schema[3]:
        schema_obj["required"] = schema[3]
    if schema[4]:
        schema_obj["example"] = schema[4]
    
    openapi_spec["components"]["schemas"][schema[0]] = schema_obj

# Save as JSON
with open("${service_name}-openapi.json", "w") as f:
    json.dump(openapi_spec, f, indent=2)

# Save as YAML
with open("${service_name}-openapi.yaml", "w") as f:
    yaml.dump(openapi_spec, f, default_flow_style=False, sort_keys=False)

print(f"Generated OpenAPI specification for {service_name}")

# Generate Markdown documentation
if "${format}" in ["all", "markdown"]:
    markdown_content = f"""# {openapi_spec['info']['title']}

{openapi_spec['info']['description']}

**Version:** {openapi_spec['info']['version']}  
**Base URL:** {openapi_spec['servers'][0]['url']}

## Authentication

This API supports the following authentication methods:

- **Bearer Token**: Include `Authorization: Bearer <token>` in request headers
- **API Key**: Include `X-API-Key: <key>` in request headers

## Endpoints

"""
    
    # Group by tags
    endpoints_by_tag = {}
    for path, methods in openapi_spec['paths'].items():
        for method, operation in methods.items():
            tags = operation.get('tags', ['Other'])
            for tag in tags:
                if tag not in endpoints_by_tag:
                    endpoints_by_tag[tag] = []
                endpoints_by_tag[tag].append((path, method, operation))
    
    for tag, tag_endpoints in sorted(endpoints_by_tag.items()):
        markdown_content += f"### {tag}\n\n"
        
        for path, method, operation in tag_endpoints:
            markdown_content += f"#### {method.upper()} `{path}`\n\n"
            
            if operation.get('summary'):
                markdown_content += f"**Summary:** {operation['summary']}\n\n"
            
            if operation.get('description'):
                markdown_content += f"{operation['description']}\n\n"
            
            if operation.get('deprecated'):
                markdown_content += "⚠️ **Deprecated**\n\n"
            
            # Parameters
            if operation.get('parameters'):
                markdown_content += "**Parameters:**\n\n"
                markdown_content += "| Name | Type | In | Required | Description |\n"
                markdown_content += "|------|------|-----|----------|-------------|\n"
                
                for param in operation['parameters']:
                    required = "Yes" if param.get('required') else "No"
                    markdown_content += f"| {param['name']} | {param['schema']['type']} | {param['in']} | {required} | {param.get('description', '')} |\n"
                
                markdown_content += "\n"
            
            # Request body
            if operation.get('requestBody'):
                markdown_content += "**Request Body:**\n\n"
                content = list(operation['requestBody']['content'].values())[0]
                if 'example' in content:
                    markdown_content += f"\`\`\`json\n{json.dumps(content['example'], indent=2)}\n\`\`\`\n\n"
            
            # Responses
            markdown_content += "**Responses:**\n\n"
            for status, response in operation.get('responses', {}).items():
                markdown_content += f"- **{status}**: {response['description']}\n"
            
            markdown_content += "\n---\n\n"
    
    with open("${service_name}-api-docs.md", "w") as f:
        f.write(markdown_content)
    
    print(f"Generated Markdown documentation for {service_name}")

conn.close()
EOF
    
    log_success "API documentation generated"
}

# Generate API examples
generate_examples() {
    local service_name=$1
    
    log_info "Generating API examples for ${service_name}..."
    
    python3 <<EOF
import psycopg2
import json
import requests
from datetime import datetime

conn = psycopg2.connect(
    dbname="${DOCS_DB}",
    user="${DOCS_USER}",
    password="${DOCS_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get service and endpoints
cur.execute("""
    SELECT s.id, s.base_url, e.id, e.path, e.method, e.summary
    FROM api_services s
    JOIN api_endpoints e ON s.id = e.service_id
    WHERE s.name = %s
    ORDER BY e.path, e.method
""", ("${service_name}",))

endpoints = cur.fetchall()

for service_id, base_url, endpoint_id, path, method, summary in endpoints:
    # Generate example based on parameters
    cur.execute("""
        SELECT name, in_type, required, data_type, example
        FROM api_parameters
        WHERE endpoint_id = %s
    """, (endpoint_id,))
    
    parameters = cur.fetchall()
    
    # Build example request
    headers = {"Content-Type": "application/json"}
    params = {}
    path_params = {}
    
    for param_name, in_type, required, data_type, example in parameters:
        if in_type == 'header':
            headers[param_name] = example or 'example-value'
        elif in_type == 'query':
            params[param_name] = example or 'example-value'
        elif in_type == 'path':
            path_params[param_name] = example or 'example-value'
    
    # Replace path parameters
    example_path = path
    for param_name, param_value in path_params.items():
        example_path = example_path.replace(f"{{{param_name}}}", str(param_value))
    
    # Generate curl command
    curl_cmd = f"curl -X {method}"
    
    if headers:
        for header, value in headers.items():
            curl_cmd += f" -H '{header}: {value}'"
    
    if params:
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        curl_cmd += f" '{base_url}{example_path}?{param_str}'"
    else:
        curl_cmd += f" '{base_url}{example_path}'"
    
    if method in ['POST', 'PUT', 'PATCH']:
        # Add example request body
        cur.execute("""
            SELECT schema_inline
            FROM api_request_bodies
            WHERE endpoint_id = %s
            LIMIT 1
        """, (endpoint_id,))
        
        request_body = cur.fetchone()
        if request_body and request_body[0]:
            example_body = generate_example_from_schema(request_body[0])
            curl_cmd += f" -d '{json.dumps(example_body)}'"
    
    # Store example
    cur.execute("""
        INSERT INTO api_examples (
            endpoint_id, name, description, request_headers,
            request_params, curl_command
        ) VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        endpoint_id,
        f"Example {method} {path}",
        f"Example request for {summary or path}",
        json.dumps(headers),
        json.dumps(params),
        curl_cmd
    ))

def generate_example_from_schema(schema):
    """Generate example data from JSON schema"""
    if isinstance(schema, dict):
        if schema.get('type') == 'object':
            example = {}
            for prop, prop_schema in schema.get('properties', {}).items():
                example[prop] = generate_example_from_schema(prop_schema)
            return example
        elif schema.get('type') == 'array':
            return [generate_example_from_schema(schema.get('items', {}))]
        elif schema.get('type') == 'string':
            return schema.get('example', 'string-value')
        elif schema.get('type') == 'number':
            return schema.get('example', 123.45)
        elif schema.get('type') == 'integer':
            return schema.get('example', 123)
        elif schema.get('type') == 'boolean':
            return schema.get('example', True)
    return {}

conn.commit()
conn.close()

print(f"Generated API examples for {service_name}")
EOF
    
    log_success "API examples generated"
}

# Deploy documentation UI
deploy_docs_ui() {
    local service_name=$1
    
    log_info "Deploying documentation UI for ${service_name}..."
    
    # Create Swagger UI container
    cat > docker-compose-docs.yml <<EOF
version: '3.8'

services:
  swagger-ui:
    image: swaggerapi/swagger-ui:latest
    container_name: terrafusion-swagger-ui
    ports:
      - "${SWAGGER_UI_PORT}:${TF_STATIC_PORT:-8080}"
    environment:
      - SWAGGER_JSON=/docs/${service_name}-openapi.json
      - BASE_URL=/swagger
      - DISPLAY_REQUEST_DURATION=true
      - TRY_IT_OUT_ENABLED=true
    volumes:
      - ./${service_name}-openapi.json:/docs/${service_name}-openapi.json:ro
    restart: unless-stopped
    
  redoc:
    image: redocly/redoc:latest
    container_name: terrafusion-redoc
    ports:
      - "${REDOC_PORT}:80"
    environment:
      - SPEC_URL=/docs/${service_name}-openapi.json
    volumes:
      - ./${service_name}-openapi.json:/usr/share/nginx/html/docs/${service_name}-openapi.json:ro
    restart: unless-stopped
    
  api-docs-server:
    image: nginx:alpine
    container_name: terrafusion-api-docs
    ports:
      - "8082:80"
    volumes:
      - ./api-docs-site:/usr/share/nginx/html:ro
    restart: unless-stopped
EOF
    
    # Create static documentation site
    mkdir -p api-docs-site
    
    cat > api-docs-site/index.html <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${service_name} API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        .header {
            background: #1976d2;
            color: white;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .doc-section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .button-group {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.3s;
        }
        .button:hover {
            background: #1565c0;
        }
        .button-secondary {
            background: #757575;
        }
        .button-secondary:hover {
            background: #616161;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #1976d2;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .endpoint-list {
            list-style: none;
            padding: 0;
        }
        .endpoint-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .method {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            min-width: 60px;
            text-align: center;
        }
        .method-get { background: #4caf50; color: white; }
        .method-post { background: #2196f3; color: white; }
        .method-put { background: #ff9800; color: white; }
        .method-delete { background: #f44336; color: white; }
        .method-patch { background: #9c27b0; color: white; }
        code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>${service_name} API Documentation</h1>
            <p>Comprehensive API documentation with interactive testing</p>
        </div>
    </div>
    
    <div class="container">
        <div class="button-group">
            <a href="http://localhost:${SWAGGER_UI_PORT}" class="button" target="_blank">
                Open Swagger UI
            </a>
            <a href="http://localhost:${REDOC_PORT}" class="button button-secondary" target="_blank">
                Open ReDoc
            </a>
            <a href="${service_name}-openapi.json" class="button button-secondary" download>
                Download OpenAPI Spec
            </a>
            <a href="${service_name}-api-docs.md" class="button button-secondary" download>
                Download Markdown Docs
            </a>
        </div>
        
        <div class="doc-section">
            <h2>API Overview</h2>
            <div class="stats" id="api-stats">
                <!-- Stats will be populated by JavaScript -->
            </div>
        </div>
        
        <div class="doc-section">
            <h2>Available Endpoints</h2>
            <ul class="endpoint-list" id="endpoint-list">
                <!-- Endpoints will be populated by JavaScript -->
            </ul>
        </div>
        
        <div class="doc-section">
            <h2>Getting Started</h2>
            <h3>Authentication</h3>
            <p>This API uses Bearer token authentication. Include your API token in the Authorization header:</p>
            <code>Authorization: Bearer YOUR_API_TOKEN</code>
            
            <h3>Base URL</h3>
            <code id="base-url">${API_GATEWAY_URL}</code>
            
            <h3>Example Request</h3>
            <pre><code id="example-curl">Loading...</code></pre>
        </div>
        
        <div class="doc-section">
            <h2>SDKs and Client Libraries</h2>
            <p>Generate client libraries for your preferred language:</p>
            <div class="button-group">
                <a href="#" class="button button-secondary" onclick="generateSDK('javascript')">JavaScript</a>
                <a href="#" class="button button-secondary" onclick="generateSDK('python')">Python</a>
                <a href="#" class="button button-secondary" onclick="generateSDK('java')">Java</a>
                <a href="#" class="button button-secondary" onclick="generateSDK('go')">Go</a>
            </div>
        </div>
    </div>
    
    <script>
        // Load OpenAPI spec and populate UI
        fetch('${service_name}-openapi.json')
            .then(response => response.json())
            .then(spec => {
                // Update base URL
                document.getElementById('base-url').textContent = spec.servers[0].url;
                
                // Count endpoints
                let endpointCount = 0;
                let methodCounts = {};
                const endpointList = document.getElementById('endpoint-list');
                
                for (const [path, methods] of Object.entries(spec.paths)) {
                    for (const [method, operation] of Object.entries(methods)) {
                        endpointCount++;
                        methodCounts[method] = (methodCounts[method] || 0) + 1;
                        
                        // Add to endpoint list
                        const li = document.createElement('li');
                        li.className = 'endpoint-item';
                        li.innerHTML = \`
                            <span class="method method-\${method}">\${method.toUpperCase()}</span>
                            <code>\${path}</code>
                            <span>\${operation.summary || ''}</span>
                        \`;
                        endpointList.appendChild(li);
                    }
                }
                
                // Update stats
                const statsHtml = \`
                    <div class="stat-card">
                        <div class="stat-value">\${endpointCount}</div>
                        <div class="stat-label">Total Endpoints</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${Object.keys(spec.paths).length}</div>
                        <div class="stat-label">API Paths</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${Object.keys(spec.components.schemas || {}).length}</div>
                        <div class="stat-label">Data Models</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${spec.info.version}</div>
                        <div class="stat-label">API Version</div>
                    </div>
                \`;
                document.getElementById('api-stats').innerHTML = statsHtml;
                
                // Show example curl
                const firstPath = Object.keys(spec.paths)[0];
                const firstMethod = Object.keys(spec.paths[firstPath])[0];
                const exampleCurl = \`curl -X \${firstMethod.toUpperCase()} \\
  \${spec.servers[0].url}\${firstPath} \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json'\`;
                document.getElementById('example-curl').textContent = exampleCurl;
            });
        
        function generateSDK(language) {
            alert(\`SDK generation for \${language} would be implemented here using OpenAPI Generator\`);
        }
    </script>
</body>
</html>
EOF
    
    docker-compose -f docker-compose-docs.yml up -d
    
    log_success "Documentation UI deployed"
    echo "  - Swagger UI: http://localhost:${SWAGGER_UI_PORT}"
    echo "  - ReDoc: http://localhost:${REDOC_PORT}"
    echo "  - API Docs Site: http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
}

# Test API endpoints
test_endpoints() {
    local service_name=$1
    
    log_info "Testing API endpoints for ${service_name}..."
    
    python3 <<EOF
import psycopg2
import requests
import json
from datetime import datetime

conn = psycopg2.connect(
    dbname="${DOCS_DB}",
    user="${DOCS_USER}",
    password="${DOCS_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get endpoints to test
cur.execute("""
    SELECT e.id, e.path, e.method, s.base_url,
           array_agg(DISTINCT ex.curl_command) as examples
    FROM api_endpoints e
    JOIN api_services s ON e.service_id = s.id
    LEFT JOIN api_examples ex ON e.id = ex.endpoint_id
    WHERE s.name = %s
    GROUP BY e.id, e.path, e.method, s.base_url
""", ("${service_name}",))

endpoints = cur.fetchall()
test_results = []

for endpoint_id, path, method, base_url, examples in endpoints:
    print(f"Testing {method} {path}...")
    
    try:
        # Use example if available
        if examples and examples[0]:
            # Parse curl command to extract headers and body
            # This is simplified - real implementation would parse curl properly
            response = requests.request(
                method,
                f"{base_url}{path}",
                timeout=5,
                verify=False
            )
        else:
            response = requests.request(
                method,
                f"{base_url}{path}",
                timeout=5,
                verify=False
            )
        
        test_result = {
            'endpoint_id': endpoint_id,
            'status': response.status_code,
            'response_time': response.elapsed.total_seconds() * 1000,
            'success': 200 <= response.status_code < 400
        }
        
        # Store test result
        cur.execute("""
            INSERT INTO api_test_cases (
                endpoint_id, name, test_type, expected_status,
                last_run, last_result
            ) VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            endpoint_id,
            f"Basic {method} test",
            'functional',
            200,
            datetime.now(),
            'pass' if test_result['success'] else 'fail'
        ))
        
        # Update metrics
        cur.execute("""
            INSERT INTO api_metrics (
                endpoint_id, timestamp, request_count,
                error_count, avg_response_time_ms
            ) VALUES (%s, %s, 1, %s, %s)
        """, (
            endpoint_id,
            datetime.now(),
            0 if test_result['success'] else 1,
            test_result['response_time']
        ))
        
        test_results.append(test_result)
        
    except Exception as e:
        print(f"Error testing {method} {path}: {e}")
        test_results.append({
            'endpoint_id': endpoint_id,
            'error': str(e),
            'success': False
        })

conn.commit()
conn.close()

# Summary
successful_tests = sum(1 for r in test_results if r.get('success', False))
print(f"\nTest Summary: {successful_tests}/{len(test_results)} endpoints passed")
EOF
    
    log_success "API endpoint testing complete"
}

# Generate SDK
generate_sdk() {
    local service_name=$1
    local language=$2
    
    log_info "Generating ${language} SDK for ${service_name}..."
    
    # Use OpenAPI Generator
    docker run --rm \
        -v "${PWD}:/local" \
        openapitools/openapi-generator-cli generate \
        -i "/local/${service_name}-openapi.json" \
        -g "${language}" \
        -o "/local/${service_name}-sdk-${language}" \
        --additional-properties=packageName="${service_name}Client"
    
    log_success "${language} SDK generated in ${service_name}-sdk-${language}/"
}

# Main execution
case ${1:-} in
    "init")
        init_docs_database
        ;;
        
    "scan")
        scan_api_endpoints "$2" "$3"
        ;;
        
    "generate")
        generate_documentation "$2" "${3:-all}"
        generate_examples "$2"
        ;;
        
    "deploy")
        deploy_docs_ui "$2"
        ;;
        
    "test")
        test_endpoints "$2"
        ;;
        
    "sdk")
        generate_sdk "$2" "$3"
        ;;
        
    *)
        echo "Usage: $0 {init|scan|generate|deploy|test|sdk} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                          - Initialize documentation system"
        echo "  scan <service> <url>          - Scan API endpoints"
        echo "  generate <service> [format]   - Generate documentation"
        echo "  deploy <service>              - Deploy documentation UI"
        echo "  test <service>                - Test API endpoints"
        echo "  sdk <service> <language>      - Generate SDK"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 scan api-service http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
        echo "  $0 generate api-service all"
        echo "  $0 deploy api-service"
        echo "  $0 test api-service"
        echo "  $0 sdk api-service python"
        exit 1
        ;;
esac