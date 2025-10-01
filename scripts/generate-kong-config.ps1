# TerraFusion OS - Kong Configuration Generator (PowerShell)
# Government. Transcended.
# Generate Kong configuration with proper environment variables (NO HARDCODED PORTS!)

param(
    [string]$TF_API_PORT = $env:TF_API_PORT ?? "5046",
    [string]$TF_FRONTEND_PORT = $env:TF_FRONTEND_PORT ?? "3102"
)

Write-Host "🚀 TerraFusion OS - Generating Kong Configuration" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Environment Variables:" -ForegroundColor Yellow
Write-Host "  TF_API_PORT: $TF_API_PORT" -ForegroundColor White
Write-Host "  TF_FRONTEND_PORT: $TF_FRONTEND_PORT" -ForegroundColor White
Write-Host ""

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Generate Kong configuration content
$kongConfig = @"
# GENERATED FILE - DO NOT EDIT MANUALLY
# TerraFusion OS Kong Configuration
# Generated: $timestamp
# API Port: $TF_API_PORT
# Frontend Port: $TF_FRONTEND_PORT

apiVersion: v1
kind: ConfigMap
metadata:
  name: kong-declarative-config
  namespace: terrafusion-system
  labels:
    app: kong
    component: api-gateway
    government-compliance: "FISMA-SOC2"
    generated-by: "terrafusion-kong-generator"
    generated-at: "$timestamp"
data:
  kong.yml: |
    _format_version: "3.0"
    _transform: true
    
    # TerraFusion Government Services Configuration
    # Generated with TF_API_PORT=$TF_API_PORT, TF_FRONTEND_PORT=$TF_FRONTEND_PORT
    services:
    - name: terrafusion-api
      url: http://terrafusion-api.terrafusion-system.svc.cluster.local:$TF_API_PORT
      plugins:
      - name: prometheus
        config:
          per_consumer: true
      - name: rate-limiting
        config:
          minute: 1000
          hour: 10000
          day: 100000
          policy: cluster
          redis_host: redis-cluster.terrafusion-system.svc.cluster.local
          redis_port: 6379
      - name: request-id
        config:
          header_name: X-TerraFusion-Request-ID
          echo_downstream: true
      - name: correlation-id
        config:
          header_name: X-Government-Correlation-ID
          generator: uuid#counter
          echo_downstream: true
      
    - name: terrafusion-frontend
      url: http://terrafusion-frontend.terrafusion-system.svc.cluster.local:$TF_FRONTEND_PORT
      plugins:
      - name: prometheus
      - name: rate-limiting
        config:
          minute: 2000
          hour: 20000
          day: 200000
      - name: cors
        config:
          origins: 
          - "https://*.terrafusion.gov"
          - "https://terrafusion.gov"
          credentials: true
          max_age: 3600
          
    # Government compliance routing
    routes:
    - name: api-v1
      service: terrafusion-api
      paths:
      - /api/v1
      plugins:
      - name: jwt
        config:
          claims_to_verify: ["exp", "iss"]
          key_claim_name: kid
          secret_is_base64: false
      - name: acl
        config:
          allow: ["government", "county", "municipality"]
          
    - name: modules-api
      service: terrafusion-api
      paths:
      - /modules
      plugins:
      - name: request-size-limiting
        config:
          allowed_payload_size: 50
          
    - name: county-benton
      service: terrafusion-api
      paths:
      - /county/benton
      plugins:
      - name: request-transformer
        config:
          add:
            headers:
            - "X-County-Theme: benton"
            - "X-County-Primary: #00B3A4"
            
    - name: county-yakima
      service: terrafusion-api
      paths:
      - /county/yakima
      plugins:
      - name: request-transformer
        config:
          add:
            headers:
            - "X-County-Theme: yakima"
            - "X-County-Primary: #2FB3FF"
            
    - name: frontend-app
      service: terrafusion-frontend
      paths:
      - /
      plugins:
      - name: response-transformer
        config:
          add:
            headers:
            - "X-Frame-Options: DENY"
            - "X-Content-Type-Options: nosniff"
            - "Referrer-Policy: strict-origin-when-cross-origin"
            - "X-Government-Mode: true"
            
    # Upstreams for load balancing
    upstreams:
    - name: terrafusion-api-upstream
      algorithm: round-robin
      healthchecks:
        active:
          healthy:
            interval: 30
            successes: 3
          unhealthy:
            interval: 30
            http_failures: 3
      targets:
      - target: terrafusion-api.terrafusion-system.svc.cluster.local:$TF_API_PORT
        weight: 100
        
    - name: terrafusion-frontend-upstream
      algorithm: round-robin
      healthchecks:
        active:
          healthy:
            interval: 30
            successes: 3
          unhealthy:
            interval: 30
            http_failures: 3
      targets:
      - target: terrafusion-frontend.terrafusion-system.svc.cluster.local:$TF_FRONTEND_PORT
        weight: 100
"@

# Write to file
$outputPath = "infrastructure\kubernetes\kong\kong-config-generated.yaml"
$kongConfig | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host "✅ Kong configuration generated with environment variables" -ForegroundColor Green
Write-Host "📁 File: $outputPath" -ForegroundColor White
Write-Host "🔧 API Port: $TF_API_PORT" -ForegroundColor White
Write-Host "🌐 Frontend Port: $TF_FRONTEND_PORT" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready for government deployment!" -ForegroundColor Cyan