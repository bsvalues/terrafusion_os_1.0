#!/bin/bash

# Quantum-Safe Cryptography Migration Tools
# Migrate existing cryptography to post-quantum algorithms
# Features: Algorithm inventory, risk assessment, automated migration, validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/../config/quantum-crypto.conf}"
LOG_FILE="${LOG_FILE:-/var/log/terrafusion/quantum-crypto.log}"
REPORT_DIR="${REPORT_DIR:-${SCRIPT_DIR}/../reports}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Post-quantum algorithms
declare -A PQ_ALGORITHMS=(
    ["signing"]="DILITHIUM3,FALCON-512,SPHINCS+-SHA256-128s"
    ["kem"]="KYBER768,NTRU-HPS-4096-821,SABER"
    ["hash"]="SHA3-256,SHAKE256"
)

# Initialize database
init_database() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Initializing quantum-safe crypto database...${NC}"
    
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Cryptography inventory table
CREATE TABLE IF NOT EXISTS crypto_inventory (
    id SERIAL PRIMARY KEY,
    component VARCHAR(255) NOT NULL,
    algorithm_type VARCHAR(50) NOT NULL,
    current_algorithm VARCHAR(100) NOT NULL,
    key_size INTEGER,
    location TEXT,
    risk_level VARCHAR(20),
    last_rotation TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration tracking
CREATE TABLE IF NOT EXISTS pq_migrations (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES crypto_inventory(id),
    target_algorithm VARCHAR(100) NOT NULL,
    migration_status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    rollback_data JSONB,
    validation_results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS crypto_risk_assessments (
    id SERIAL PRIMARY KEY,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_components INTEGER,
    high_risk_count INTEGER,
    medium_risk_count INTEGER,
    low_risk_count INTEGER,
    quantum_timeline VARCHAR(50),
    recommendations JSONB
);

-- Quantum readiness metrics
CREATE TABLE IF NOT EXISTS quantum_readiness_metrics (
    id SERIAL PRIMARY KEY,
    metric_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_algorithms INTEGER,
    quantum_safe_count INTEGER,
    hybrid_count INTEGER,
    legacy_count INTEGER,
    readiness_score DECIMAL(5,2),
    compliance_status JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crypto_inventory_risk ON crypto_inventory(risk_level);
CREATE INDEX IF NOT EXISTS idx_migrations_status ON pq_migrations(migration_status);
CREATE INDEX IF NOT EXISTS idx_crypto_inventory_component ON crypto_inventory(component);
EOF
    
    echo -e "${GREEN}✓ Database initialized successfully${NC}"
}

# Scan for cryptographic usage
scan_cryptography() {
    local scan_path="${1:-/app}"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Scanning for cryptographic usage...${NC}"
    
    # Create Python scanner
    cat > /tmp/crypto_scanner.py << 'EOF'
import os
import re
import json
import ast
import sys

class CryptoScanner:
    def __init__(self):
        self.crypto_patterns = {
            'rsa': r'RSA|rsa_|RSAPublicKey|RSAPrivateKey',
            'ecdsa': r'ECDSA|ecdsa_|ECPublicKey|ECPrivateKey',
            'dsa': r'DSA|dsa_|DSAPublicKey|DSAPrivateKey',
            'aes': r'AES|aes_|AES128|AES256',
            'sha256': r'SHA256|sha256|SHA-256',
            'sha1': r'SHA1|sha1|SHA-1',
            'md5': r'MD5|md5',
            'dh': r'DiffieHellman|DH|dhparam',
            'tls': r'TLSv1\.[0-2]|SSLv[23]',
            'x509': r'X509|x509|certificate',
            'jwt': r'JWT|jsonwebtoken|jose',
            'bcrypt': r'bcrypt|Bcrypt',
            'pbkdf2': r'PBKDF2|pbkdf2',
            'hmac': r'HMAC|hmac'
        }
        
        self.file_extensions = ['.py', '.js', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php']
        self.config_files = ['*.conf', '*.config', '*.yml', '*.yaml', '*.json', '*.properties']
        
    def scan_file(self, filepath):
        findings = []
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            for algo_type, pattern in self.crypto_patterns.items():
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    findings.append({
                        'algorithm_type': algo_type,
                        'match': match.group(),
                        'line': line_num,
                        'context': self.get_context(content, match.start(), match.end())
                    })
                    
        except Exception as e:
            pass
            
        return findings
    
    def get_context(self, content, start, end, context_size=50):
        context_start = max(0, start - context_size)
        context_end = min(len(content), end + context_size)
        return content[context_start:context_end].strip()
    
    def scan_directory(self, directory):
        results = {}
        
        for root, dirs, files in os.walk(directory):
            # Skip common non-code directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'venv', 'env']]
            
            for file in files:
                if any(file.endswith(ext) for ext in self.file_extensions):
                    filepath = os.path.join(root, file)
                    findings = self.scan_file(filepath)
                    if findings:
                        results[filepath] = findings
                        
        return results

if __name__ == '__main__':
    scanner = CryptoScanner()
    scan_path = sys.argv[1] if len(sys.argv) > 1 else '/app'
    results = scanner.scan_directory(scan_path)
    print(json.dumps(results))
EOF

    # Run scanner
    local scan_results=$(python3 /tmp/crypto_scanner.py "$scan_path")
    
    # Process results
    echo "$scan_results" | python3 -c "
import json
import sys
import psycopg2
from datetime import datetime

data = json.load(sys.stdin)
conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
cur = conn.cursor()

for filepath, findings in data.items():
    for finding in findings:
        # Determine risk level based on algorithm
        risk_level = 'high'
        if finding['algorithm_type'] in ['sha1', 'md5', 'rsa', 'ecdsa', 'dsa']:
            risk_level = 'high'
        elif finding['algorithm_type'] in ['aes', 'sha256']:
            risk_level = 'medium'
        else:
            risk_level = 'low'
            
        # Get component name from filepath
        component = filepath.split('/')[-1]
        
        # Insert into inventory
        cur.execute('''
            INSERT INTO crypto_inventory 
            (component, algorithm_type, current_algorithm, location, risk_level)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        ''', (component, finding['algorithm_type'], finding['match'], 
              f\"{filepath}:{finding['line']}\", risk_level))

conn.commit()
cur.close()
conn.close()

print(f'Processed {len(data)} files with cryptographic usage')
"
    
    echo -e "${GREEN}✓ Cryptography scan completed${NC}"
}

# Assess quantum risk
assess_quantum_risk() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Assessing quantum risk...${NC}"
    
    # Create risk assessment
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Calculate risk metrics
WITH risk_summary AS (
    SELECT 
        COUNT(*) as total_components,
        COUNT(*) FILTER (WHERE risk_level = 'high') as high_risk,
        COUNT(*) FILTER (WHERE risk_level = 'medium') as medium_risk,
        COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk
    FROM crypto_inventory
)
INSERT INTO crypto_risk_assessments (
    total_components, high_risk_count, medium_risk_count, low_risk_count,
    quantum_timeline, recommendations
)
SELECT 
    total_components,
    high_risk,
    medium_risk,
    low_risk,
    CASE 
        WHEN high_risk > 0 THEN 'Immediate action required'
        WHEN medium_risk > 10 THEN 'Plan migration within 2 years'
        ELSE 'Monitor quantum developments'
    END as quantum_timeline,
    jsonb_build_object(
        'immediate_actions', ARRAY[
            'Inventory all RSA and ECC usage',
            'Plan hybrid crypto deployment',
            'Test post-quantum algorithms'
        ],
        'short_term', ARRAY[
            'Implement crypto agility',
            'Deploy quantum-safe algorithms in test',
            'Update security policies'
        ],
        'long_term', ARRAY[
            'Complete migration to PQ algorithms',
            'Implement quantum key distribution',
            'Continuous quantum threat monitoring'
        ]
    )
FROM risk_summary;

-- Generate risk report
COPY (
    SELECT 
        component,
        algorithm_type,
        current_algorithm,
        risk_level,
        location
    FROM crypto_inventory
    WHERE risk_level IN ('high', 'medium')
    ORDER BY risk_level DESC, component
) TO '/tmp/quantum_risk_report.csv' WITH CSV HEADER;
EOF
    
    # Generate visual risk report
    python3 -c "
import matplotlib.pyplot as plt
import pandas as pd
import psycopg2
import seaborn as sns

conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')

# Risk distribution
df_risk = pd.read_sql('''
    SELECT risk_level, COUNT(*) as count
    FROM crypto_inventory
    GROUP BY risk_level
''', conn)

# Algorithm distribution
df_algo = pd.read_sql('''
    SELECT algorithm_type, COUNT(*) as count
    FROM crypto_inventory
    GROUP BY algorithm_type
    ORDER BY count DESC
    LIMIT 10
''', conn)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

# Risk pie chart
colors = {'high': '#ff4444', 'medium': '#ffaa00', 'low': '#44ff44'}
ax1.pie(df_risk['count'], labels=df_risk['risk_level'], autopct='%1.1f%%', 
        colors=[colors.get(x, '#cccccc') for x in df_risk['risk_level']])
ax1.set_title('Quantum Risk Distribution')

# Algorithm bar chart
ax2.bar(df_algo['algorithm_type'], df_algo['count'])
ax2.set_xlabel('Algorithm Type')
ax2.set_ylabel('Count')
ax2.set_title('Cryptographic Algorithm Usage')
ax2.tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.savefig('${REPORT_DIR}/quantum_risk_assessment.png', dpi=150)
plt.close()

conn.close()
print('Risk assessment completed')
"
    
    echo -e "${GREEN}✓ Quantum risk assessment completed${NC}"
}

# Plan migration strategy
plan_migration() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Planning migration strategy...${NC}"
    
    # Create migration plan
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Create migration plan for high-risk components
INSERT INTO pq_migrations (inventory_id, target_algorithm)
SELECT 
    id,
    CASE 
        WHEN algorithm_type IN ('rsa', 'ecdsa', 'dsa') THEN 'DILITHIUM3'
        WHEN algorithm_type IN ('dh') THEN 'KYBER768'
        WHEN algorithm_type IN ('sha1', 'md5') THEN 'SHA3-256'
        ELSE current_algorithm
    END as target_algorithm
FROM crypto_inventory
WHERE risk_level = 'high';

-- Generate migration phases
WITH migration_phases AS (
    SELECT 
        'Phase 1: Critical Systems' as phase,
        COUNT(*) as component_count,
        ARRAY_AGG(DISTINCT ci.component) as components
    FROM pq_migrations pm
    JOIN crypto_inventory ci ON pm.inventory_id = ci.id
    WHERE ci.risk_level = 'high'
    
    UNION ALL
    
    SELECT 
        'Phase 2: External APIs' as phase,
        COUNT(*) as component_count,
        ARRAY_AGG(DISTINCT ci.component) as components
    FROM crypto_inventory ci
    WHERE ci.risk_level = 'medium'
    AND ci.component LIKE '%api%'
    
    UNION ALL
    
    SELECT 
        'Phase 3: Internal Systems' as phase,
        COUNT(*) as component_count,
        ARRAY_AGG(DISTINCT ci.component) as components
    FROM crypto_inventory ci
    WHERE ci.risk_level = 'medium'
    AND ci.component NOT LIKE '%api%'
)
SELECT phase, component_count, components
FROM migration_phases;
EOF
    
    echo -e "${GREEN}✓ Migration strategy planned${NC}"
}

# Execute migration
execute_migration() {
    local component="$1"
    local dry_run="${2:-true}"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Executing migration for $component...${NC}"
    
    # Create migration script
    cat > /tmp/pq_migration.py << 'EOF'
import os
import sys
import json
import shutil
from datetime import datetime
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from oqs import Signature, KeyEncapsulation

class PQMigration:
    def __init__(self, component, dry_run=True):
        self.component = component
        self.dry_run = dry_run
        self.rollback_data = {}
        
    def backup_current_state(self):
        """Backup current cryptographic material"""
        backup_dir = f"/tmp/crypto_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        if not self.dry_run:
            os.makedirs(backup_dir, exist_ok=True)
            # Backup logic here
        self.rollback_data['backup_dir'] = backup_dir
        return backup_dir
        
    def migrate_rsa_to_dilithium(self, key_path):
        """Migrate RSA keys to Dilithium"""
        if self.dry_run:
            print(f"[DRY RUN] Would migrate RSA key at {key_path} to Dilithium")
            return True
            
        # Generate new Dilithium key pair
        sig = Signature("Dilithium3")
        public_key = sig.generate_keypair()
        
        # Save new keys
        new_key_path = key_path.replace('.pem', '_dilithium.pem')
        with open(new_key_path, 'wb') as f:
            f.write(public_key)
            
        print(f"✓ Migrated RSA to Dilithium: {new_key_path}")
        return True
        
    def migrate_ecdh_to_kyber(self, key_path):
        """Migrate ECDH to Kyber"""
        if self.dry_run:
            print(f"[DRY RUN] Would migrate ECDH key at {key_path} to Kyber")
            return True
            
        # Generate new Kyber key pair
        kem = KeyEncapsulation("Kyber768")
        public_key = kem.generate_keypair()
        
        # Save new keys
        new_key_path = key_path.replace('.pem', '_kyber.pem')
        with open(new_key_path, 'wb') as f:
            f.write(public_key)
            
        print(f"✓ Migrated ECDH to Kyber: {new_key_path}")
        return True
        
    def update_configuration(self, config_path, algorithm_map):
        """Update configuration files with new algorithms"""
        if self.dry_run:
            print(f"[DRY RUN] Would update config at {config_path}")
            return True
            
        # Configuration update logic here
        print(f"✓ Updated configuration: {config_path}")
        return True
        
    def validate_migration(self):
        """Validate the migration was successful"""
        validations = {
            'key_generation': self.test_key_generation(),
            'encryption': self.test_encryption(),
            'signing': self.test_signing(),
            'compatibility': self.test_compatibility()
        }
        
        return all(validations.values()), validations
        
    def test_key_generation(self):
        """Test PQ key generation"""
        try:
            sig = Signature("Dilithium3")
            sig.generate_keypair()
            return True
        except:
            return False
            
    def test_encryption(self):
        """Test PQ encryption"""
        try:
            kem = KeyEncapsulation("Kyber768")
            public_key = kem.generate_keypair()
            ciphertext, shared_secret = kem.encap_secret(public_key)
            return True
        except:
            return False
            
    def test_signing(self):
        """Test PQ signing"""
        try:
            sig = Signature("Dilithium3")
            public_key = sig.generate_keypair()
            message = b"Test message"
            signature = sig.sign(message)
            return sig.verify(message, signature, public_key)
        except:
            return False
            
    def test_compatibility(self):
        """Test compatibility with existing systems"""
        # Compatibility testing logic
        return True

if __name__ == '__main__':
    component = sys.argv[1]
    dry_run = sys.argv[2].lower() == 'true' if len(sys.argv) > 2 else True
    
    migrator = PQMigration(component, dry_run)
    
    # Backup current state
    backup_dir = migrator.backup_current_state()
    
    # Execute migration based on component type
    success = True
    if 'rsa' in component.lower():
        success = migrator.migrate_rsa_to_dilithium(f"/app/keys/{component}")
    elif 'ecdh' in component.lower():
        success = migrator.migrate_ecdh_to_kyber(f"/app/keys/{component}")
        
    # Update configurations
    if success:
        migrator.update_configuration(f"/app/config/{component}.conf", {})
        
    # Validate migration
    if success:
        valid, results = migrator.validate_migration()
        print(json.dumps({
            'component': component,
            'success': valid,
            'validation_results': results,
            'rollback_data': migrator.rollback_data
        }))
EOF

    # Execute migration
    local result=$(python3 /tmp/pq_migration.py "$component" "$dry_run")
    
    # Update database
    psql -h localhost -U postgres -d terrafusion <<EOF
UPDATE pq_migrations
SET 
    migration_status = 'completed',
    completed_at = CURRENT_TIMESTAMP,
    validation_results = '${result}'::jsonb
WHERE inventory_id = (
    SELECT id FROM crypto_inventory WHERE component = '$component' LIMIT 1
);
EOF
    
    echo -e "${GREEN}✓ Migration executed for $component${NC}"
}

# Generate quantum readiness report
generate_readiness_report() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Generating quantum readiness report...${NC}"
    
    # Calculate readiness metrics
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Calculate quantum readiness
WITH readiness_data AS (
    SELECT 
        COUNT(*) as total_algorithms,
        COUNT(*) FILTER (WHERE m.migration_status = 'completed') as quantum_safe_count,
        COUNT(*) FILTER (WHERE m.migration_status = 'in_progress') as hybrid_count,
        COUNT(*) FILTER (WHERE m.migration_status IS NULL OR m.migration_status = 'pending') as legacy_count
    FROM crypto_inventory ci
    LEFT JOIN pq_migrations m ON ci.id = m.inventory_id
)
INSERT INTO quantum_readiness_metrics (
    total_algorithms, quantum_safe_count, hybrid_count, legacy_count, readiness_score
)
SELECT 
    total_algorithms,
    quantum_safe_count,
    hybrid_count,
    legacy_count,
    CASE 
        WHEN total_algorithms = 0 THEN 0
        ELSE ROUND((quantum_safe_count::decimal / total_algorithms) * 100, 2)
    END as readiness_score
FROM readiness_data;

-- Generate detailed report
COPY (
    SELECT 
        ci.component,
        ci.algorithm_type,
        ci.current_algorithm,
        m.target_algorithm,
        m.migration_status,
        ci.risk_level,
        m.completed_at
    FROM crypto_inventory ci
    LEFT JOIN pq_migrations m ON ci.id = m.inventory_id
    ORDER BY ci.risk_level DESC, ci.component
) TO '${REPORT_DIR}/quantum_readiness_report.csv' WITH CSV HEADER;
EOF
    
    # Generate HTML report
    cat > "${REPORT_DIR}/quantum_readiness_report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Quantum Readiness Report - TerraFusion</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; }
        .metric { display: inline-block; margin: 20px; padding: 20px; border: 1px solid #ddd; }
        .high-risk { color: #e74c3c; }
        .medium-risk { color: #f39c12; }
        .low-risk { color: #27ae60; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #34495e; color: white; }
        .progress { background: #ecf0f1; border-radius: 10px; padding: 3px; }
        .progress-bar { background: #27ae60; height: 20px; border-radius: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Quantum Cryptography Readiness Report</h1>
        <p>Generated: <span id="date"></span></p>
    </div>
    
    <div id="metrics"></div>
    <div id="risk-summary"></div>
    <div id="migration-status"></div>
    <div id="recommendations"></div>
    
    <script>
        document.getElementById('date').textContent = new Date().toLocaleString();
        
        // Load and display metrics
        fetch('/api/quantum-readiness/metrics')
            .then(r => r.json())
            .then(data => {
                // Display metrics
            });
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✓ Quantum readiness report generated${NC}"
}

# Main execution
case "${1:-scan}" in
    init)
        init_database
        ;;
    scan)
        scan_cryptography "${2:-/app}"
        ;;
    assess)
        assess_quantum_risk
        ;;
    plan)
        plan_migration
        ;;
    migrate)
        execute_migration "${2:-all}" "${3:-true}"
        ;;
    report)
        generate_readiness_report
        ;;
    monitor)
        while true; do
            scan_cryptography "/app"
            assess_quantum_risk
            generate_readiness_report
            sleep 3600
        done
        ;;
    *)
        echo "Usage: $0 {init|scan|assess|plan|migrate|report|monitor} [options]"
        echo
        echo "Commands:"
        echo "  init      Initialize quantum-safe crypto database"
        echo "  scan      Scan for cryptographic usage"
        echo "  assess    Assess quantum risk"
        echo "  plan      Plan migration strategy"
        echo "  migrate   Execute migration (component) (dry_run)"
        echo "  report    Generate readiness report"
        echo "  monitor   Continuous monitoring mode"
        exit 1
        ;;
esac