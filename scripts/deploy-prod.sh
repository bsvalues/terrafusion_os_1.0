#!/bin/bash

# TerraFusion Production Deployment Script
# This script deploys TerraFusion to production environment

set -e

echo "🚀 Starting TerraFusion Production Deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Check required environment variables
required_vars=("POSTGRES_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET_KEY" "AZURE_SUBSCRIPTION_ID" "AZURE_RESOURCE_GROUP")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Environment variable $var is not set"
        exit 1
    fi
done

# Check if Azure CLI is installed and logged in
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Set Azure subscription
echo "🔧 Setting Azure subscription..."
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Create resource group if it doesn't exist
echo "🏗️  Creating resource group..."
az group create \
    --name "$AZURE_RESOURCE_GROUP" \
    --location "$AZURE_LOCATION" \
    --output table

# Create Container Registry if it doesn't exist
echo "📦 Creating Azure Container Registry..."
REGISTRY_NAME=$(echo "$DOCKER_REGISTRY" | cut -d'.' -f1)
az acr create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$REGISTRY_NAME" \
    --sku Standard \
    --admin-enabled true \
    --output table

# Get ACR login credentials
echo "🔑 Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name "$REGISTRY_NAME" --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name "$REGISTRY_NAME" --query passwords[0].value --output tsv)

# Login to ACR
echo "🔐 Logging in to Azure Container Registry..."
echo "$ACR_PASSWORD" | docker login "$DOCKER_REGISTRY" --username "$ACR_USERNAME" --password-stdin

# Build and tag images
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build

# Tag images for ACR
echo "🏷️  Tagging images..."
docker tag terrafusion_backend:latest "$DOCKER_REGISTRY/terrafusion-backend:$DOCKER_IMAGE_TAG"
docker tag terrafusion_frontend:latest "$DOCKER_REGISTRY/terrafusion-frontend:$DOCKER_IMAGE_TAG"
docker tag terrafusion_ai-agent:latest "$DOCKER_REGISTRY/terrafusion-ai-agent:$DOCKER_IMAGE_TAG"

# Push images to ACR
echo "📤 Pushing images to registry..."
docker push "$DOCKER_REGISTRY/terrafusion-backend:$DOCKER_IMAGE_TAG"
docker push "$DOCKER_REGISTRY/terrafusion-frontend:$DOCKER_IMAGE_TAG"
docker push "$DOCKER_REGISTRY/terrafusion-ai-agent:$DOCKER_IMAGE_TAG"

# Create Container App Environment
echo "🌐 Creating Container App Environment..."
az containerapp env create \
    --name "$AZURE_CONTAINER_APP_ENVIRONMENT" \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --location "$AZURE_LOCATION" \
    --output table

# Create PostgreSQL Flexible Server
echo "🗄️  Creating PostgreSQL server..."
POSTGRES_SERVER_NAME="terrafusion-db-$(date +%s)"
az postgres flexible-server create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER_NAME" \
    --location "$AZURE_LOCATION" \
    --admin-user "$POSTGRES_USER" \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --version 15 \
    --storage-size 32 \
    --output table

# Create Redis Cache
echo "📊 Creating Redis Cache..."
REDIS_NAME="terrafusion-redis-$(date +%s)"
az redis create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$REDIS_NAME" \
    --location "$AZURE_LOCATION" \
    --sku Basic \
    --vm-size c0 \
    --output table

# Get connection strings
POSTGRES_CONNECTION_STRING="Host=$POSTGRES_SERVER_NAME.postgres.database.azure.com;Database=terrafusion;Username=$POSTGRES_USER;Password=$POSTGRES_PASSWORD;SSL Mode=Require"
REDIS_CONNECTION_STRING=$(az redis show-connection-string --name "$REDIS_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --auth-type key --query connectionString --output tsv)

# Deploy Backend Container App
echo "🔧 Deploying Backend Container App..."
az containerapp create \
    --name terrafusion-backend \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --environment "$AZURE_CONTAINER_APP_ENVIRONMENT" \
    --image "$DOCKER_REGISTRY/terrafusion-backend:$DOCKER_IMAGE_TAG" \
    --registry-server "$DOCKER_REGISTRY" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --target-port 8080 \
    --ingress external \
    --env-vars \
        "ASPNETCORE_ENVIRONMENT=Production" \
        "ConnectionStrings__DefaultConnection=$POSTGRES_CONNECTION_STRING" \
        "ConnectionStrings__Redis=$REDIS_CONNECTION_STRING" \
        "JWT__SecretKey=$JWT_SECRET_KEY" \
        "JWT__Issuer=TerraFusion" \
        "JWT__Audience=TerraFusion-Client" \
    --cpu 1.0 \
    --memory 2.0Gi \
    --min-replicas 1 \
    --max-replicas 10 \
    --output table

# Deploy AI Agent Container App
echo "🤖 Deploying AI Agent Container App..."
BACKEND_URL=$(az containerapp show --name terrafusion-backend --resource-group "$AZURE_RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)
az containerapp create \
    --name terrafusion-ai-agent \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --environment "$AZURE_CONTAINER_APP_ENVIRONMENT" \
    --image "$DOCKER_REGISTRY/terrafusion-ai-agent:$DOCKER_IMAGE_TAG" \
    --registry-server "$DOCKER_REGISTRY" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --target-port 3001 \
    --ingress external \
    --env-vars \
        "NODE_ENV=production" \
        "PORT=3001" \
        "API_BASE_URL=https://$BACKEND_URL" \
        "REDIS_URL=$REDIS_CONNECTION_STRING" \
    --cpu 1.0 \
    --memory 2.0Gi \
    --min-replicas 1 \
    --max-replicas 5 \
    --output table

# Deploy Frontend Container App
echo "🌐 Deploying Frontend Container App..."
AI_AGENT_URL=$(az containerapp show --name terrafusion-ai-agent --resource-group "$AZURE_RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)
az containerapp create \
    --name terrafusion-frontend \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --environment "$AZURE_CONTAINER_APP_ENVIRONMENT" \
    --image "$DOCKER_REGISTRY/terrafusion-frontend:$DOCKER_IMAGE_TAG" \
    --registry-server "$DOCKER_REGISTRY" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --target-port 8080 \
    --ingress external \
    --env-vars \
        "REACT_APP_API_BASE_URL=https://$BACKEND_URL" \
        "REACT_APP_AI_AGENT_URL=https://$AI_AGENT_URL" \
    --cpu 0.5 \
    --memory 1.0Gi \
    --min-replicas 1 \
    --max-replicas 10 \
    --output table

# Get application URLs
echo "📝 Getting application URLs..."
FRONTEND_URL=$(az containerapp show --name terrafusion-frontend --resource-group "$AZURE_RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)

echo ""
echo "✅ TerraFusion Production Deployment Complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:    https://$FRONTEND_URL"
echo "   Backend API: https://$BACKEND_URL"
echo "   AI Agent:    https://$AI_AGENT_URL"
echo ""
echo "🗄️  Database:"
echo "   Server:      $POSTGRES_SERVER_NAME.postgres.database.azure.com"
echo "   Database:    terrafusion"
echo "   Username:    $POSTGRES_USER"
echo ""
echo "📊 Redis Cache:"
echo "   Name:        $REDIS_NAME"
echo ""
echo "📦 Container Registry:"
echo "   Registry:    $DOCKER_REGISTRY"
echo ""
echo "🔧 Management commands:"
echo "   View logs:   az containerapp logs show --name [app-name] --resource-group $AZURE_RESOURCE_GROUP"
echo "   Scale app:   az containerapp update --name [app-name] --resource-group $AZURE_RESOURCE_GROUP --min-replicas [min] --max-replicas [max]"
echo "   Update app:  az containerapp update --name [app-name] --resource-group $AZURE_RESOURCE_GROUP --image [new-image]"
echo ""
echo "🎉 Deployment complete! Your application is now live!"
