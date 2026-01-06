from fastapi import FastAPI, Header, HTTPException, Depends
from .config import settings
from .translate.schema_map import SQL_GET_PARCEL
from .translate.mapper import sql_row_to_lattice_node
from typing import Optional

# Conditional Import for Mock vs Real DB
try:
    if not settings.PACS_USER:
        raise ValueError("No User")
    from .db import get_db_connection
    print("Using REAL Database Connection")
except Exception:
    from .mock_db import get_mock_connection as get_db_connection
    print("Using MOCK Database Connection (Missing Credentials)")

app = FastAPI(title="TerraFusion Bridge", version="1.0.0")

# Security Gatekeeper
async def verify_key(x_tf_bridge_key: Optional[str] = Header(None)):
    if x_tf_bridge_key != settings.TF_BRIDGE_KEY:
        raise HTTPException(status_code=401, detail="Sovereignty Violation: Invalid Bridge Key")

@app.get("/health")
def health_check():
    mode = "real" if settings.PACS_USER else "mock (proval-standard)"
    return {"status": "online", "target": settings.PACS_DB, "mode": mode}

@app.get("/v1/parcels/{parcel_id}", dependencies=[Depends(verify_key)])
def get_parcel_lattice(parcel_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Execute Parameterized Query
    cursor.execute(SQL_GET_PARCEL, parcel_id)
    
    # Convert Row to Dict
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Parcel not found in PACS")
        
    columns = [column[0] for column in cursor.description]
    row_dict = dict(zip(columns, row))
    
    # Translate
    result = sql_row_to_lattice_node(row_dict)
    return result
