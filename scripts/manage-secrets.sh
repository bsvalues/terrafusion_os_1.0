#!/bin/bash
# manage-secrets.sh - Secure Secrets Management
# AI Swarm Developer Squad: Government-grade secrets management

set -euo pipefail

echo "🔐 AI Secrets Management Agent: TerraFusion OS secure configuration"

# Encrypt secrets for production
encrypt_secrets() {
    echo "🔒 Encrypting secrets for production deployment..."
    
    if [ ! -f ".env" ]; then
        echo "❌ .env file not found"
        exit 1
    fi
    
    # Create encrypted secrets file
    gpg --symmetric --cipher-algo AES256 --output .env.gpg .env
    
    echo "✅ Secrets encrypted to .env.gpg"
    echo "⚠️ Do NOT commit .env to version control"
    echo "✅ You can safely commit .env.gpg (encrypted version)"
}

# Decrypt secrets for deployment
decrypt_secrets() {
    echo "🔓 Decrypting secrets..."
    
    if [ ! -f ".env.gpg" ]; then
        echo "❌ .env.gpg file not found"
        exit 1
    fi
    
    gpg --decrypt --output .env .env.gpg
    
    echo "✅ Secrets decrypted to .env"
}

# Rotate secrets
rotate_secrets() {
    echo "🔄 Rotating secrets..."
    
    # Generate new JWT secret
    NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-32)
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/g" .env
    
    # Generate new encryption keys
    NEW_ENCRYPTION_KEY=$(openssl rand -hex 16)
    NEW_DATA_PROTECTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    sed -i.bak "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$NEW_ENCRYPTION_KEY/g" .env
    sed -i.bak "s/DATA_PROTECTION_KEY=.*/DATA_PROTECTION_KEY=$NEW_DATA_PROTECTION_KEY/g" .env
    
    rm -f .env.bak
    
    echo "✅ Secrets rotated successfully"
    echo "⚠️ Update all deployed environments with new secrets"
}

case "${1:-help}" in
    "encrypt")
        encrypt_secrets
        ;;
    "decrypt")
        decrypt_secrets
        ;;
    "rotate")
        rotate_secrets
        ;;
    "help"|*)
        echo "Usage: $0 {encrypt|decrypt|rotate}"
        echo ""
        echo "Commands:"
        echo "  encrypt   Encrypt .env file to .env.gpg"
        echo "  decrypt   Decrypt .env.gpg to .env"
        echo "  rotate    Generate new secrets in .env"
        ;;
esac
