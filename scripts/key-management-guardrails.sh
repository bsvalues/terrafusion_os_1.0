#!/bin/bash

# TerraFusion OS 1.0 - Key Management Guardrails
# Production-ready cryptographic key management and validation system
# Handles Ed25519 keys for 1,008 AI agent swarm with enterprise security

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly KEYS_DIR="$PROJECT_ROOT/keys"
readonly BACKUP_DIR="$PROJECT_ROOT/security/key-backups"
readonly AUDIT_LOG="$PROJECT_ROOT/security/key-audit.log"
readonly CONFIG_FILE="$PROJECT_ROOT/security/key-management.conf"

# Security constants
readonly MIN_KEY_PERMISSIONS="600"
readonly MAX_KEY_AGE_DAYS="90"
readonly WARNING_THRESHOLD_DAYS="14"
readonly QUARANTINE_DIR="$PROJECT_ROOT/security/quarantine"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$AUDIT_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$AUDIT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$AUDIT_LOG"
}

log_security() {
    echo -e "${RED}[SECURITY]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "$AUDIT_LOG"
}

# Initialize directories and logging
initialize_environment() {
    log_info "Initializing key management environment..."
    
    # Create required directories
    mkdir -p "$KEYS_DIR" "$BACKUP_DIR" "$QUARANTINE_DIR" "$(dirname "$AUDIT_LOG")"
    
    # Set secure permissions on directories
    chmod 700 "$KEYS_DIR" "$BACKUP_DIR" "$QUARANTINE_DIR"
    
    # Initialize audit log
    if [[ ! -f "$AUDIT_LOG" ]]; then
        touch "$AUDIT_LOG"
        chmod 600 "$AUDIT_LOG"
    fi
    
    log_info "Environment initialized successfully"
}

# Validate key file permissions
validate_key_permissions() {
    local key_file="$1"
    local expected_perms="${2:-$MIN_KEY_PERMISSIONS}"
    
    if [[ ! -f "$key_file" ]]; then
        log_error "Key file not found: $key_file"
        return 1
    fi
    
    local current_perms
    current_perms=$(stat -c %a "$key_file" 2>/dev/null || stat -f %A "$key_file" 2>/dev/null)
    
    if [[ "$current_perms" != "$expected_perms" ]]; then
        log_security "SECURITY VIOLATION: Key file permissions incorrect for $key_file"
        log_security "Expected: $expected_perms, Found: $current_perms"
        
        # Auto-correct permissions
        chmod "$expected_perms" "$key_file"
        log_security "Permissions corrected for $key_file"
        
        # Log security event
        log_security_event "KEY_PERMISSION_CORRECTION" "$key_file" "$current_perms" "$expected_perms"
        
        return 0
    fi
    
    log_info "Key permissions validated: $key_file ($current_perms)"
    return 0
}

# Verify key integrity using checksums
verify_key_integrity() {
    local key_file="$1"
    local expected_hash="${2:-}"
    
    if [[ ! -f "$key_file" ]]; then
        log_error "Key file not found: $key_file"
        return 1
    fi
    
    log_info "Verifying integrity of $key_file..."
    
    # Calculate current hash
    local actual_hash
    if command -v sha256sum >/dev/null 2>&1; then
        actual_hash=$(sha256sum "$key_file" | awk '{print $1}')
    elif command -v openssl >/dev/null 2>&1; then
        actual_hash=$(openssl dgst -sha256 "$key_file" | awk '{print $2}')
    else
        log_error "No hash utility available (sha256sum or openssl)"
        return 1
    fi
    
    # Store hash if not provided (first run)
    local hash_file="${key_file}.sha256"
    if [[ -z "$expected_hash" ]]; then
        if [[ -f "$hash_file" ]]; then
            expected_hash=$(cat "$hash_file")
        else
            echo "$actual_hash" > "$hash_file"
            chmod 600 "$hash_file"
            log_info "Baseline hash stored for $key_file"
            return 0
        fi
    fi
    
    # Compare hashes
    if [[ "$actual_hash" != "$expected_hash" ]]; then
        log_security "🚨 KEY INTEGRITY FAILURE: $key_file"
        log_security "Expected: $expected_hash"
        log_security "Actual:   $actual_hash"
        
        quarantine_key "$key_file"
        initiate_key_recovery_protocol "$key_file"
        
        return 1
    fi
    
    log_info "✅ Key integrity verified: $key_file"
    return 0
}

# Validate Ed25519 key format and structure
validate_ed25519_key_format() {
    local key_file="$1"
    local key_type="${2:-public}" # public or private
    
    log_info "Validating Ed25519 $key_type key format: $key_file"
    
    if [[ ! -f "$key_file" ]]; then
        log_error "Key file not found: $key_file"
        return 1
    fi
    
    # Check PEM format headers
    local expected_header expected_footer
    if [[ "$key_type" == "private" ]]; then
        expected_header="-----BEGIN PRIVATE KEY-----"
        expected_footer="-----END PRIVATE KEY-----"
    else
        expected_header="-----BEGIN PUBLIC KEY-----"
        expected_footer="-----END PUBLIC KEY-----"
    fi
    
    if ! head -n1 "$key_file" | grep -q "$expected_header"; then
        log_error "Invalid PEM header in $key_file"
        return 1
    fi
    
    if ! tail -n1 "$key_file" | grep -q "$expected_footer"; then
        log_error "Invalid PEM footer in $key_file"
        return 1
    fi
    
    # Validate key length (base64 content between headers)
    local base64_content
    base64_content=$(sed '1d;$d' "$key_file" | tr -d '\n\r ')
    
    local expected_length
    if [[ "$key_type" == "private" ]]; then
        expected_length=88  # Ed25519 private key in DER format
    else
        expected_length=44  # Ed25519 public key in DER format
    fi
    
    # Decode and check binary length
    if command -v base64 >/dev/null 2>&1; then
        local binary_length
        binary_length=$(echo "$base64_content" | base64 -d | wc -c)
        
        if [[ "$binary_length" -ne "$expected_length" ]]; then
            log_error "Invalid Ed25519 $key_type key length: $binary_length (expected $expected_length)"
            return 1
        fi
    fi
    
    # OpenSSL validation if available
    if command -v openssl >/dev/null 2>&1; then
        if ! openssl pkey -in "$key_file" -noout 2>/dev/null; then
            log_error "OpenSSL key validation failed for $key_file"
            return 1
        fi
    fi
    
    log_info "✅ Ed25519 $key_type key format validated: $key_file"
    return 0
}

# Check key age and rotation requirements
check_key_age() {
    local key_file="$1"
    
    if [[ ! -f "$key_file" ]]; then
        log_error "Key file not found: $key_file"
        return 1
    fi
    
    # Get file modification time
    local mod_time
    if command -v stat >/dev/null 2>&1; then
        mod_time=$(stat -c %Y "$key_file" 2>/dev/null || stat -f %m "$key_file" 2>/dev/null)
    else
        log_warn "Cannot determine file modification time for $key_file"
        return 1
    fi
    
    local current_time
    current_time=$(date +%s)
    local age_seconds=$((current_time - mod_time))
    local age_days=$((age_seconds / 86400))
    
    log_info "Key age: $age_days days for $key_file"
    
    # Check if key needs rotation
    if [[ $age_days -gt $MAX_KEY_AGE_DAYS ]]; then
        log_security "🔄 KEY ROTATION REQUIRED: $key_file (age: $age_days days)"
        trigger_key_rotation_alert "$key_file" "$age_days"
        return 2  # Rotation required
    elif [[ $age_days -gt $((MAX_KEY_AGE_DAYS - WARNING_THRESHOLD_DAYS)) ]]; then
        log_warn "⚠️  Key rotation warning: $key_file (age: $age_days days)"
        return 1  # Warning
    fi
    
    log_info "✅ Key age acceptable: $key_file ($age_days days)"
    return 0
}

# Quarantine suspicious or compromised keys
quarantine_key() {
    local key_file="$1"
    local reason="${2:-integrity_failure}"
    
    log_security "🔒 QUARANTINING KEY: $key_file (reason: $reason)"
    
    # Create quarantine filename with timestamp
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    local quarantine_file="$QUARANTINE_DIR/$(basename "$key_file")_${timestamp}_${reason}"
    
    # Move key to quarantine
    if mv "$key_file" "$quarantine_file"; then
        chmod 400 "$quarantine_file"  # Read-only
        log_security "Key quarantined: $quarantine_file"
        
        # Log security event
        log_security_event "KEY_QUARANTINED" "$key_file" "$reason" "$quarantine_file"
        
        # Create placeholder with warning
        cat > "$key_file" << EOF
# WARNING: QUARANTINED KEY
# Original key has been quarantined due to: $reason
# Quarantine location: $quarantine_file
# Timestamp: $(date)
# DO NOT USE THIS FILE FOR CRYPTOGRAPHIC OPERATIONS
EOF
        chmod 600 "$key_file"
        
        return 0
    else
        log_error "Failed to quarantine key: $key_file"
        return 1
    fi
}

# Initiate key recovery protocol
initiate_key_recovery_protocol() {
    local failed_key="$1"
    
    log_security "🔧 INITIATING KEY RECOVERY PROTOCOL for $failed_key"
    
    # Look for backup keys
    local backup_pattern="$BACKUP_DIR/$(basename "$failed_key")_*"
    local latest_backup
    
    if latest_backup=$(ls -t $backup_pattern 2>/dev/null | head -n1); then
        log_info "Found backup key: $latest_backup"
        
        # Verify backup integrity before restoration
        if verify_key_integrity "$latest_backup"; then
            log_info "Backup key integrity verified, initiating restoration..."
            
            # Create restoration script
            cat > "$PROJECT_ROOT/scripts/restore_key_$(date +%s).sh" << EOF
#!/bin/bash
# Auto-generated key restoration script
# Generated: $(date)

echo "Restoring key from backup..."
cp "$latest_backup" "$failed_key"
chmod 600 "$failed_key"

echo "Key restoration completed"
echo "Please verify key functionality before resuming operations"
EOF
            
            log_security "Key recovery script generated. Manual verification required."
        else
            log_error "Backup key integrity check failed. Manual intervention required."
        fi
    else
        log_error "No backup keys found for $failed_key"
        log_security "CRITICAL: Manual key regeneration required"
    fi
    
    # Trigger emergency alert
    trigger_emergency_alert "KEY_RECOVERY_REQUIRED" "$failed_key"
}

# Create secure backup of keys
backup_key() {
    local key_file="$1"
    local backup_suffix="${2:-$(date '+%Y%m%d_%H%M%S')}"
    
    if [[ ! -f "$key_file" ]]; then
        log_error "Cannot backup non-existent key: $key_file"
        return 1
    fi
    
    local backup_file="$BACKUP_DIR/$(basename "$key_file")_$backup_suffix"
    
    log_info "Creating backup: $backup_file"
    
    if cp "$key_file" "$backup_file"; then
        chmod 400 "$backup_file"  # Read-only backup
        
        # Store integrity hash
        if command -v sha256sum >/dev/null 2>&1; then
            sha256sum "$backup_file" > "${backup_file}.sha256"
        elif command -v openssl >/dev/null 2>&1; then
            openssl dgst -sha256 "$backup_file" | awk '{print $2}' > "${backup_file}.sha256"
        fi
        
        log_info "✅ Key backup created: $backup_file"
        log_security_event "KEY_BACKUP_CREATED" "$key_file" "$backup_file"
        
        return 0
    else
        log_error "Failed to create backup for $key_file"
        return 1
    fi
}

# Generate new Ed25519 key pair with secure defaults
generate_ed25519_keypair() {
    local key_prefix="$1"
    local output_dir="${2:-$KEYS_DIR}"
    
    log_info "Generating new Ed25519 key pair: $key_prefix"
    
    local private_key="$output_dir/${key_prefix}-private.pem"
    local public_key="$output_dir/${key_prefix}-public.pem"
    
    # Check if keys already exist
    if [[ -f "$private_key" ]] || [[ -f "$public_key" ]]; then
        log_warn "Key files already exist for $key_prefix"
        read -p "Overwrite existing keys? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Key generation cancelled"
            return 1
        fi
        
        # Backup existing keys before overwrite
        [[ -f "$private_key" ]] && backup_key "$private_key" "pre_regeneration"
        [[ -f "$public_key" ]] && backup_key "$public_key" "pre_regeneration"
    fi
    
    # Generate private key
    if command -v openssl >/dev/null 2>&1; then
        if openssl genpkey -algorithm Ed25519 -out "$private_key"; then
            chmod 600 "$private_key"
            log_info "✅ Private key generated: $private_key"
        else
            log_error "Failed to generate private key"
            return 1
        fi
        
        # Extract public key
        if openssl pkey -in "$private_key" -pubout -out "$public_key"; then
            chmod 644 "$public_key"
            log_info "✅ Public key extracted: $public_key"
        else
            log_error "Failed to extract public key"
            return 1
        fi
    else
        log_error "OpenSSL not available for key generation"
        return 1
    fi
    
    # Validate generated keys
    validate_ed25519_key_format "$private_key" "private"
    validate_ed25519_key_format "$public_key" "public"
    
    # Create integrity checksums
    verify_key_integrity "$private_key"
    verify_key_integrity "$public_key"
    
    log_security_event "KEY_PAIR_GENERATED" "$key_prefix" "$private_key" "$public_key"
    log_info "🔑 Ed25519 key pair generation completed: $key_prefix"
    
    return 0
}

# Log security events for audit trail
log_security_event() {
    local event_type="$1"
    local primary_data="$2"
    local secondary_data="${3:-}"
    local tertiary_data="${4:-}"
    
    local event_data="{\"timestamp\":\"$(date -Iseconds)\",\"event\":\"$event_type\",\"primary\":\"$primary_data\""
    
    [[ -n "$secondary_data" ]] && event_data+=",\"secondary\":\"$secondary_data\""
    [[ -n "$tertiary_data" ]] && event_data+=",\"tertiary\":\"$tertiary_data\""
    
    event_data+="}"
    
    echo "$event_data" >> "$AUDIT_LOG"
    log_security "Security event logged: $event_type"
}

# Trigger rotation alert
trigger_key_rotation_alert() {
    local key_file="$1"
    local age_days="$2"
    
    log_security "🔄 KEY ROTATION ALERT: $key_file (age: $age_days days)"
    
    # Create rotation notice
    cat > "$PROJECT_ROOT/ROTATION_REQUIRED_$(basename "$key_file").txt" << EOF
KEY ROTATION REQUIRED

Key File: $key_file
Current Age: $age_days days
Maximum Age: $MAX_KEY_AGE_DAYS days
Detected: $(date)

ACTION REQUIRED:
1. Generate new key pair
2. Update all systems with new public key
3. Retire old key pair securely
4. Verify all dependent systems

Use: ./scripts/key-management-guardrails.sh --rotate "$key_file"
EOF
    
    log_security_event "KEY_ROTATION_ALERT" "$key_file" "$age_days"
}

# Trigger emergency alert
trigger_emergency_alert() {
    local alert_type="$1"
    local context="$2"
    
    log_security "🚨 EMERGENCY ALERT: $alert_type - $context"
    
    # Create emergency alert file
    cat > "$PROJECT_ROOT/EMERGENCY_$(date +%s).txt" << EOF
CRYPTOGRAPHIC EMERGENCY ALERT

Alert Type: $alert_type
Context: $context
Timestamp: $(date)
Hostname: $(hostname)

IMMEDIATE ACTION REQUIRED
This alert indicates a critical security event that requires immediate attention.

$(case "$alert_type" in
    "KEY_RECOVERY_REQUIRED")
        echo "A cryptographic key has failed integrity checks and requires recovery or regeneration."
        ;;
    "MULTIPLE_KEY_FAILURES")
        echo "Multiple keys have failed validation, indicating possible systematic compromise."
        ;;
    *)
        echo "Unknown emergency type. Investigate immediately."
        ;;
esac)

Contact security team immediately.
EOF
    
    log_security_event "EMERGENCY_ALERT" "$alert_type" "$context"
}

# Comprehensive system validation
validate_all_keys() {
    log_info "🔍 Starting comprehensive key validation..."
    
    local validation_errors=0
    local keys_processed=0
    
    # Find all key files
    while IFS= read -r -d '' key_file; do
        ((keys_processed++))
        
        log_info "Validating: $key_file"
        
        # Determine key type
        local key_type="public"
        if [[ "$key_file" == *"private"* ]]; then
            key_type="private"
        fi
        
        # Run all validations
        if ! validate_key_permissions "$key_file"; then
            ((validation_errors++))
        fi
        
        if ! verify_key_integrity "$key_file"; then
            ((validation_errors++))
        fi
        
        if ! validate_ed25519_key_format "$key_file" "$key_type"; then
            ((validation_errors++))
        fi
        
        check_key_age "$key_file"
        
    done < <(find "$KEYS_DIR" -name "*.pem" -type f -print0 2>/dev/null)
    
    log_info "📊 Validation complete: $keys_processed keys processed, $validation_errors errors"
    
    if [[ $validation_errors -gt 0 ]]; then
        log_security "⚠️  Validation completed with $validation_errors errors"
        return 1
    else
        log_info "✅ All keys passed validation"
        return 0
    fi
}

# Key rotation workflow
rotate_key() {
    local old_key="$1"
    
    if [[ ! -f "$old_key" ]]; then
        log_error "Key file not found: $old_key"
        return 1
    fi
    
    log_info "🔄 Starting key rotation for: $old_key"
    
    # Extract key prefix
    local key_basename
    key_basename=$(basename "$old_key" .pem)
    local key_prefix
    key_prefix=$(echo "$key_basename" | sed 's/-\(private\|public\)$//')
    
    # Backup old key
    backup_key "$old_key" "rotation_$(date +%s)"
    
    # Generate new key pair
    local temp_dir
    temp_dir=$(mktemp -d)
    
    if generate_ed25519_keypair "$key_prefix" "$temp_dir"; then
        log_info "New key pair generated successfully"
        
        # Move new keys to production location
        local old_private="$KEYS_DIR/${key_prefix}-private.pem"
        local old_public="$KEYS_DIR/${key_prefix}-public.pem"
        local new_private="$temp_dir/${key_prefix}-private.pem"
        local new_public="$temp_dir/${key_prefix}-public.pem"
        
        # Backup old keys
        [[ -f "$old_private" ]] && backup_key "$old_private" "rotation"
        [[ -f "$old_public" ]] && backup_key "$old_public" "rotation"
        
        # Install new keys
        mv "$new_private" "$old_private" 2>/dev/null || true
        mv "$new_public" "$old_public" 2>/dev/null || true
        
        # Clean up
        rm -rf "$temp_dir"
        
        log_security_event "KEY_ROTATION_COMPLETED" "$key_prefix"
        log_info "✅ Key rotation completed for $key_prefix"
        
        echo
        echo "🔑 KEY ROTATION COMPLETED"
        echo "=========================="
        echo "Key Prefix: $key_prefix"
        echo "New Private Key: $old_private"
        echo "New Public Key: $old_public"
        echo
        echo "NEXT STEPS:"
        echo "1. Update all systems with the new public key"
        echo "2. Test cryptographic operations"
        echo "3. Remove old key references"
        echo "4. Monitor for any authentication failures"
        
        return 0
    else
        rm -rf "$temp_dir"
        log_error "Key rotation failed"
        return 1
    fi
}

# Display system health dashboard
show_health_dashboard() {
    echo
    echo "🔒 TerraFusion OS 1.0 - Cryptographic Health Dashboard"
    echo "======================================================"
    echo
    
    # Key inventory
    local total_keys
    total_keys=$(find "$KEYS_DIR" -name "*.pem" -type f 2>/dev/null | wc -l)
    echo "📊 Key Inventory: $total_keys keys"
    
    # Key age analysis
    local aging_keys=0
    local expired_keys=0
    
    while IFS= read -r -d '' key_file; do
        if check_key_age "$key_file" >/dev/null 2>&1; then
            case $? in
                1) ((aging_keys++)) ;;
                2) ((expired_keys++)) ;;
            esac
        fi
    done < <(find "$KEYS_DIR" -name "*.pem" -type f -print0 2>/dev/null)
    
    echo "⏰ Key Age Status:"
    echo "   - Healthy: $((total_keys - aging_keys - expired_keys))"
    echo "   - Aging (warning): $aging_keys"
    echo "   - Expired (rotation required): $expired_keys"
    
    # Quarantine status
    local quarantined_keys
    quarantined_keys=$(find "$QUARANTINE_DIR" -name "*.pem*" -type f 2>/dev/null | wc -l)
    echo "🔒 Quarantined Keys: $quarantined_keys"
    
    # Backup status
    local backup_count
    backup_count=$(find "$BACKUP_DIR" -name "*.pem" -type f 2>/dev/null | wc -l)
    echo "💾 Available Backups: $backup_count"
    
    # Recent security events
    echo
    echo "🔍 Recent Security Events (last 24 hours):"
    if [[ -f "$AUDIT_LOG" ]]; then
        grep "$(date --date='1 day ago' '+%Y-%m-%d')\|$(date '+%Y-%m-%d')" "$AUDIT_LOG" | \
        grep -E "\[SECURITY\]" | tail -5 | \
        while IFS= read -r line; do
            echo "   $line"
        done
    else
        echo "   No security events logged"
    fi
    
    echo
    echo "📅 Last Health Check: $(date)"
    echo
}

# Main execution logic
main() {
    local command="${1:-validate}"
    
    # Initialize environment
    initialize_environment
    
    case "$command" in
        "validate"|"--validate")
            show_health_dashboard
            validate_all_keys
            ;;
        "generate"|"--generate")
            local key_prefix="${2:-terrafusion-agent}"
            generate_ed25519_keypair "$key_prefix"
            ;;
        "rotate"|"--rotate")
            local key_file="${2:-}"
            if [[ -z "$key_file" ]]; then
                log_error "Key file required for rotation"
                echo "Usage: $0 rotate <key_file>"
                exit 1
            fi
            rotate_key "$key_file"
            ;;
        "backup"|"--backup")
            local key_file="${2:-}"
            if [[ -z "$key_file" ]]; then
                log_error "Key file required for backup"
                echo "Usage: $0 backup <key_file>"
                exit 1
            fi
            backup_key "$key_file"
            ;;
        "health"|"--health")
            show_health_dashboard
            ;;
        "help"|"--help"|"-h")
            cat << EOF
TerraFusion OS 1.0 - Key Management Guardrails

USAGE:
    $0 [COMMAND] [OPTIONS]

COMMANDS:
    validate    Validate all cryptographic keys (default)
    generate    Generate new Ed25519 key pair
    rotate      Rotate an existing key pair
    backup      Create secure backup of a key
    health      Show cryptographic health dashboard
    help        Show this help message

EXAMPLES:
    $0 validate
    $0 generate my-agent
    $0 rotate keys/agent-private.pem
    $0 backup keys/important-key.pem
    $0 health

For TerraFusion OS 1.0 cryptographic security management.
EOF
            ;;
        *)
            log_error "Unknown command: $command"
            echo "Use '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"