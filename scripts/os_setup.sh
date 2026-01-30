
#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

if ! command -v psql > /dev/null 2>&1; then
    apt-get update -y > /dev/null 2>&1
    apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
fi

service postgresql start > /dev/null 2>&1

# Use backticks for command substitution in sh/bash to avoid  confusion if possible, or correct escaping
PGVER=\ls /etc/postgresql | sort -V | tail -n 1\
CONF=/etc/postgresql/\/main/postgresql.conf
HBA=/etc/postgresql/\/main/pg_hba.conf

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL > /dev/null 2>&1
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='terrafusion_os') THEN
    CREATE ROLE terrafusion_os LOGIN PASSWORD 'terrafusion_dev_secret';
    ALTER ROLE terrafusion_os CREATEDB;
  END IF;
END \$\$;
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname='terrafusion_os') THEN
    CREATE DATABASE terrafusion_os OWNER terrafusion_os;
  END IF;
END \$\$;
SQL

if [ -f "\" ]; then
    sed -i "s/^[#]*\s*listen_addresses\s*=.*$/listen_addresses = '*'" "\"
fi

if [ -f "\" ]; then
    sed -i "/# terrafusion_allowlist_begin/,/# terrafusion_allowlist_end/d" "\"
    cat >> "\" <<'RULES'
# terrafusion_allowlist_begin
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             172.16.0.0/12           scram-sha-256
host    all             all             192.168.0.0/16          scram-sha-256
host    all             all             10.0.0.0/8              scram-sha-256
# terrafusion_allowlist_end
RULES
fi

service postgresql restart > /dev/null 2>&1
hostname -I | awk '{print \}'

