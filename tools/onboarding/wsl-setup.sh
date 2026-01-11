#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

# Ensure Postgres is installed
if ! command -v psql > /dev/null 2>&1; then
    apt-get update -y > /dev/null 2>&1
    apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
fi

# Ensure service is running
service postgresql start > /dev/null 2>&1

# Detect Version
PGVER=$(ls /etc/postgresql | sort -V | tail -n 1)
CONF="/etc/postgresql/${PGVER}/main/postgresql.conf"
HBA="/etc/postgresql/${PGVER}/main/pg_hba.conf"

# Create User/DB (Idempotent)
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL > /dev/null 2>&1
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='terra_permit') THEN
    CREATE ROLE terra_permit LOGIN PASSWORD 'terra_permit_dev_pw';
  END IF;
END \$\$;
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname='terra_permit') THEN
    CREATE DATABASE terra_permit OWNER terra_permit;
  END IF;
END \$\$;
SQL

# Configure Listen Address
if [ -f "$CONF" ]; then
    sed -i "s/^[#]*\s*listen_addresses\s*=.*$/listen_addresses = '*'/" "$CONF"
fi

# Configure HBA
if [ -f "$HBA" ]; then
    # Remove old block if exists (simple idempotence)
    sed -i "/# terra_permit_allowlist_begin/,/# terra_permit_allowlist_end/d" "$HBA"
    
    cat >> "$HBA" <<RULES
# terra_permit_allowlist_begin
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             172.16.0.0/12           scram-sha-256
host    all             all             192.168.0.0/16          scram-sha-256
host    all             all             10.0.0.0/8              scram-sha-256
# terra_permit_allowlist_end
RULES
fi

service postgresql restart > /dev/null 2>&1

# Output ONLY the IP
hostname -I | awk '{print $1}'
