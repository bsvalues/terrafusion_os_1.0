#!/usr/bin/env bash
set -Eeuo pipefail

# Create schema if needed
cat <<SQL | docker exec -i terrafusion_benton-db-1 psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
CREATE EXTENSION IF NOT EXISTS postgis;
-- minimal demo tables
CREATE TABLE IF NOT EXISTS parcels (
  parcel_id TEXT PRIMARY KEY,
  situs_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  land_sqft INT,
  bldg_sqft INT,
  year_built INT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION
);
CREATE TABLE IF NOT EXISTS assessments (
  parcel_id TEXT REFERENCES parcels(parcel_id),
  assessed_value BIGINT,
  tax_year INT,
  PRIMARY KEY(parcel_id, tax_year)
);
CREATE TABLE IF NOT EXISTS sales (
  parcel_id TEXT REFERENCES parcels(parcel_id),
  sale_date DATE,
  sale_price BIGINT
);
SQL

# Load CSVs via ephemeral Python container (only if files exist)
if [[ -f "$DATA_DIR/parcels.csv" ]]; then
  docker run --rm --network "$TF_NETWORK" \
    -v "$PWD/$DATA_DIR":/data \
    -e PGHOST="$POSTGRES_HOST" -e PGPORT="$POSTGRES_PORT" \
    -e PGUSER="$POSTGRES_USER" -e PGPASSWORD="$POSTGRES_PASSWORD" \
    -e PGDATABASE="$POSTGRES_DB" \
    python:3.11-slim bash -lc "pip install --no-cache-dir pandas psycopg2-binary && python - <<'PY'
import os, pandas as pd
import psycopg2
from io import StringIO

conn = psycopg2.connect(host=os.environ['PGHOST'], port=os.environ['PGPORT'], user=os.environ['PGUSER'], password=os.environ['PGPASSWORD'], dbname=os.environ['PGDATABASE'])
cur = conn.cursor()

def copy_csv(name, table, cols):
    path=f\"/data/{name}\"
    if not os.path.exists(path):
        print(f\"skip {name}\"); return
    df=pd.read_csv(path)
    buf=StringIO()
    df.to_csv(buf, index=False, header=False)
    buf.seek(0)
    cur.copy_expert(f\"COPY {table} ({','.join(cols)}) FROM STDIN WITH CSV\", buf)
    conn.commit(); print(f\"loaded {name} -> {table}\")

copy_csv('parcels.csv', 'parcels', ['parcel_id','situs_address','city','state','zip','land_sqft','bldg_sqft','year_built','lat','lon'])
copy_csv('assessments.csv','assessments',['parcel_id','assessed_value','tax_year'])
copy_csv('sales.csv','sales',['parcel_id','sale_date','sale_price'])

cur.close(); conn.close()
PY"
fi

echo "Data seeded."
