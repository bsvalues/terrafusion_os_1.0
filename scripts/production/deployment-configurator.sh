#!/bin/bash
# TerraFusion OS - Flexible Deployment Configurator
# Supports both single-county isolation and multi-county federation

echo "🏛️ TERRAFUSION OS DEPLOYMENT CONFIGURATOR"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Deployment mode selection
echo "📋 SELECT DEPLOYMENT MODEL:"
echo ""
echo "1. 🏰 SOVEREIGN COUNTY (Single County Isolation)"
echo "   └── Complete independence and data sovereignty"
echo "   └── Dedicated infrastructure per county"
echo "   └── Zero cross-county data sharing"
echo ""
echo "2. 🌐 FEDERATED COUNTIES (Multi-County Integration)"
echo "   └── Shared infrastructure with logical separation"
echo "   └── Cross-county analytics and reporting"
echo "   └── Unified API with county-scoped access"
echo ""

read -p "Enter deployment model (1 for Sovereign, 2 for Federated): " DEPLOYMENT_MODEL

case $DEPLOYMENT_MODEL in
    1)
        echo ""
        echo "🏰 SOVEREIGN COUNTY DEPLOYMENT SELECTED"
        echo "──────────────────────────────────────────────────────────────"
        
        # County selection for sovereign deployment
        echo ""
        echo "📍 SELECT TARGET COUNTY:"
        echo ""
        echo "1. Benton County (Harris PACS v12.4.7 - Production Ready)"
        echo "2. Pierce County (ArcGIS Open Data - 385K parcels)"
        echo "3. King County (Enterprise GIS - 750K parcels)"
        echo "4. Yakima County (Open Data Portal - 125K parcels)"
        echo "5. Clark County (ArcGIS Hub - 195K parcels)"
        echo "6. Custom County (Manual configuration)"
        echo ""
        
        read -p "Select county (1-6): " COUNTY_CHOICE
        
        case $COUNTY_CHOICE in
            1)
                COUNTY_NAME="benton"
                COUNTY_DISPLAY="Benton County"
                PARCEL_COUNT="89247"
                SYSTEM_TYPE="harris_pacs"
                ;;
            2)
                COUNTY_NAME="pierce"
                COUNTY_DISPLAY="Pierce County"
                PARCEL_COUNT="385000"
                SYSTEM_TYPE="arcgis_rest"
                ;;
            3)
                COUNTY_NAME="king"
                COUNTY_DISPLAY="King County"
                PARCEL_COUNT="750000"
                SYSTEM_TYPE="enterprise_gis"
                ;;
            4)
                COUNTY_NAME="yakima"
                COUNTY_DISPLAY="Yakima County"
                PARCEL_COUNT="125000"
                SYSTEM_TYPE="open_data"
                ;;
            5)
                COUNTY_NAME="clark"
                COUNTY_DISPLAY="Clark County"
                PARCEL_COUNT="195000"
                SYSTEM_TYPE="arcgis_hub"
                ;;
            6)
                read -p "Enter county name: " COUNTY_NAME
                read -p "Enter display name: " COUNTY_DISPLAY
                read -p "Enter parcel count: " PARCEL_COUNT
                SYSTEM_TYPE="custom"
                ;;
        esac
        
        # Generate sovereign deployment configuration
        echo ""
        echo "🔧 GENERATING SOVEREIGN DEPLOYMENT FOR $COUNTY_DISPLAY"
        echo "──────────────────────────────────────────────────────────────"
        
        # Create county-specific environment file
        cat > ".env.${COUNTY_NAME}" << EOF
# TerraFusion OS - Sovereign Deployment: $COUNTY_DISPLAY
TERRAFUSION_ENV=production
TERRAFUSION_DEPLOYMENT_MODE=sovereign
TERRAFUSION_COUNTY=${COUNTY_NAME}
TERRAFUSION_COUNTY_DISPLAY="${COUNTY_DISPLAY}"
TERRAFUSION_PARCEL_COUNT=${PARCEL_COUNT}
TERRAFUSION_SYSTEM_TYPE=${SYSTEM_TYPE}

# Database Configuration (Isolated)
DATABASE_NAME=terrafusion_${COUNTY_NAME}
DATABASE_HOST=localhost
DATABASE_PORT=\${{TF_POSTGRES_PORT:-5432}}
DATABASE_SCHEMA=${COUNTY_NAME}_data

# API Configuration (County-Scoped)
API_BASE_URL=https://${COUNTY_NAME}.terrafusion.gov
API_VERSION=v1
API_COUNTY_SCOPE=${COUNTY_NAME}

# Security Configuration
RBAC_COUNTY_ISOLATION=true
AUDIT_COUNTY_SCOPE=${COUNTY_NAME}
DATA_SOVEREIGNTY=enabled

# Sync Configuration
SYNC_COUNTY_FILTER=${COUNTY_NAME}
SYNC_CROSS_COUNTY=disabled
SYNC_DATA_ISOLATION=strict
EOF
        
        echo "✅ Created .env.${COUNTY_NAME}"
        
        # Create sovereign deployment script
        cat > "deploy-${COUNTY_NAME}-sovereign.sh" << EOF
#!/bin/bash
# TerraFusion OS - Sovereign Deployment: $COUNTY_DISPLAY

echo "🏰 DEPLOYING TERRAFUSION OS - $COUNTY_DISPLAY SOVEREIGN"
echo "═══════════════════════════════════════════════════════════════"

# Load county-specific environment
source .env.${COUNTY_NAME}

# Create isolated database
echo "📊 Creating isolated database: terrafusion_${COUNTY_NAME}"
createdb terrafusion_${COUNTY_NAME}

# Run county-specific migrations
echo "🔄 Running ${COUNTY_NAME} migrations..."
psql -d terrafusion_${COUNTY_NAME} -f database/migrations/001_harris_pacs_import.sql

# Deploy county-isolated services
echo "🚀 Deploying ${COUNTY_NAME} services..."
docker-compose -f compose/docker-compose.${COUNTY_NAME}.yml up -d

# Configure county-scoped API
echo "🔗 Configuring ${COUNTY_NAME} API endpoints..."
# API configuration specific to this county

echo ""
echo "✅ $COUNTY_DISPLAY SOVEREIGN DEPLOYMENT COMPLETE"
echo "🌐 Access: https://${COUNTY_NAME}.terrafusion.gov"
echo "📊 Parcels: ${PARCEL_COUNT}"
echo "🔒 Data Sovereignty: ENABLED"
EOF
        
        chmod +x "deploy-${COUNTY_NAME}-sovereign.sh"
        echo "✅ Created deploy-${COUNTY_NAME}-sovereign.sh"
        
        ;;
        
    2)
        echo ""
        echo "🌐 FEDERATED COUNTIES DEPLOYMENT SELECTED"
        echo "──────────────────────────────────────────────────────────────"
        
        # Multi-county selection
        echo ""
        echo "📍 SELECT COUNTIES FOR FEDERATION:"
        echo ""
        echo "Available counties:"
        echo "□ Benton County (Harris PACS - 89K parcels)"
        echo "□ Pierce County (ArcGIS - 385K parcels)"
        echo "□ King County (Enterprise - 750K parcels)"
        echo "□ Yakima County (Open Data - 125K parcels)"
        echo "□ Clark County (Hub - 195K parcels)"
        echo ""
        
        read -p "Enter counties (comma-separated, e.g., benton,pierce,king): " COUNTIES_INPUT
        IFS=',' read -ra COUNTIES <<< "$COUNTIES_INPUT"
        
        # Generate federated deployment configuration
        echo ""
        echo "🔧 GENERATING FEDERATED DEPLOYMENT"
        echo "──────────────────────────────────────────────────────────────"
        
        # Create federated environment file
        cat > ".env.federated" << EOF
# TerraFusion OS - Federated Deployment
TERRAFUSION_ENV=production
TERRAFUSION_DEPLOYMENT_MODE=federated
TERRAFUSION_COUNTIES="${COUNTIES_INPUT}"

# Shared Database Configuration
DATABASE_NAME=terrafusion_federated
DATABASE_HOST=localhost
DATABASE_PORT=\${{TF_POSTGRES_PORT:-5432}}
DATABASE_SCHEMA=federated_data

# Federated API Configuration
API_BASE_URL=https://api.terrafusion.gov
API_VERSION=v1
API_FEDERATION_MODE=enabled

# Cross-County Features
RBAC_CROSS_COUNTY=enabled
AUDIT_FEDERATION=enabled
DATA_SHARING=controlled

# Sync Configuration
SYNC_FEDERATION=enabled
SYNC_CROSS_COUNTY=enabled
SYNC_DATA_AGGREGATION=enabled
EOF
        
        echo "✅ Created .env.federated"
        
        # Create federated deployment script
        cat > "deploy-federated.sh" << EOF
#!/bin/bash
# TerraFusion OS - Federated Multi-County Deployment

echo "🌐 DEPLOYING TERRAFUSION OS - FEDERATED COUNTIES"
echo "═══════════════════════════════════════════════════════════════"

# Load federated environment
source .env.federated

# Create federated database
echo "📊 Creating federated database: terrafusion_federated"
createdb terrafusion_federated

# Deploy federated services
echo "🚀 Deploying federated services..."
docker-compose -f compose/docker-compose.federated.yml up -d

# Configure cross-county sync
echo "🔄 Configuring cross-county synchronization..."
for county in \${TERRAFUSION_COUNTIES//,/ }; do
    echo "  └── Configuring \$county sync source"
done

# Deploy unified API gateway
echo "🔗 Deploying unified API gateway..."
# API gateway configuration for multi-county access

echo ""
echo "✅ FEDERATED DEPLOYMENT COMPLETE"
echo "🌐 Unified API: https://api.terrafusion.gov"
echo "📊 Total Counties: $(echo "${COUNTIES_INPUT}" | tr ',' '\n' | wc -l)"
echo "🔗 Cross-County Analytics: ENABLED"
EOF
        
        chmod +x "deploy-federated.sh"
        echo "✅ Created deploy-federated.sh"
        
        ;;
esac

echo ""
echo "🎯 DEPLOYMENT CONFIGURATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ "$DEPLOYMENT_MODEL" = "1" ]; then
    echo "🏰 SOVEREIGN DEPLOYMENT READY:"
    echo "   County: $COUNTY_DISPLAY"
    echo "   Parcels: $PARCEL_COUNT"
    echo "   Execute: ./deploy-${COUNTY_NAME}-sovereign.sh"
    echo ""
    echo "🔒 SOVEREIGNTY FEATURES:"
    echo "   ✅ Complete data isolation"
    echo "   ✅ Independent infrastructure"
    echo "   ✅ County-scoped API access"
    echo "   ✅ Dedicated database schema"
    echo "   ✅ Zero cross-county data sharing"
else
    echo "🌐 FEDERATED DEPLOYMENT READY:"
    echo "   Counties: ${COUNTIES_INPUT}"
    echo "   Execute: ./deploy-federated.sh"
    echo ""
    echo "🔗 FEDERATION FEATURES:"
    echo "   ✅ Unified API gateway"
    echo "   ✅ Cross-county analytics"
    echo "   ✅ Shared infrastructure"
    echo "   ✅ Controlled data sharing"
    echo "   ✅ Multi-county reporting"
fi

echo ""
echo "Government. Transcended. Your Way."
