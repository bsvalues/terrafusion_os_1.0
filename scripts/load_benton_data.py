#!/usr/bin/env python3
"""
Alternative loader you can run locally instead of the ephemeral container in 04_seed_data.sh
Usage:
  PGHOST=localhost PGPORT=5432 PGUSER=terrafusion PGPASSWORD=... PGDATABASE=terrafusion \
  python scripts/load_benton_data.py ./data/benton
"""
import os, sys, pandas as pd
import psycopg2
from io import StringIO

src = sys.argv[1] if len(sys.argv)>1 else './data/benton'
conn = psycopg2.connect(host=os.environ['PGHOST'], port=os.environ['PGPORT'], user=os.environ['PGUSER'], password=os.environ['PGPASSWORD'], dbname=os.environ['PGDATABASE'])
cur = conn.cursor()

def copy_csv(path, table, cols):
    if not os.path.exists(path):
        print('skip', path); return
    df = pd.read_csv(path)
    buf = StringIO(); df.to_csv(buf, index=False, header=False); buf.seek(0)
    cur.copy_expert(f"COPY {table} ({','.join(cols)}) FROM STDIN WITH CSV", buf)
    conn.commit(); print('loaded', path)

copy_csv(os.path.join(src,'parcels.csv'),'parcels',['parcel_id','situs_address','city','state','zip','land_sqft','bldg_sqft','year_built','lat','lon'])
copy_csv(os.path.join(src,'assessments.csv'),'assessments',['parcel_id','assessed_value','tax_year'])
copy_csv(os.path.join(src,'sales.csv'),'sales',['parcel_id','sale_date','sale_price'])

cur.close(); conn.close(); print('done')
