import sys
import os

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.db import get_db_connection
    from app.config import settings
    from app.translate.schema_map import PacsSchema
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def print_table(rows, headers):
    # Simple table printer
    w = [30, 30, 15]
    print(f"{headers[0]:<{w[0]}} | {headers[1]:<{w[1]}} | {headers[2]:<{w[2]}}")
    print("-" * (sum(w) + 6))
    if not rows:
        print("(No results found)")
    else:
        for r in rows:
            # Handle standard rows or simulated tuples
            val0 = str(r[0]) if r[0] is not None else ""
            val1 = str(r[1]) if r[1] is not None else ""
            val2 = str(r[2]) if r[2] is not None else ""
            print(f"{val0[:w[0]]:<{w[0]}} | {val1[:w[1]]:<{w[1]}} | {val2[:w[2]]:<{w[2]}}")

def run_mock_discovery():
    print("\n[WARN] Connection Failed to Live DB. Falling back to OFFLINE REFERENCE MODE (ProVal Standard).")
    print("Generating simulated discovery report based on 'app.translate.schema_map'...")
    
    # Simulate Query 1
    print("\n### Query 1: Parcel Identity (Simulated)")
    print("```")
    rows = [
        (PacsSchema.TABLE_REAL_PROP, PacsSchema.COL_PARCEL_ID, "varchar"),
        (PacsSchema.TABLE_REAL_PROP, PacsSchema.COL_PROP_ID, "int"),
        (PacsSchema.TABLE_REAL_PROP, PacsSchema.COL_SITUS, "varchar"),
        (PacsSchema.TABLE_REAL_PROP, PacsSchema.COL_LEGAL, "text"),
        (PacsSchema.TABLE_REAL_PROP, PacsSchema.COL_NBHD, "varchar")
    ]
    print_table(rows, ["TABLE_NAME", "COLUMN_NAME", "DATA_TYPE"])
    print("```")

    # Simulate Query 2
    print("\n### Query 2: Valuation (Simulated)")
    print("```")
    rows = [
        (PacsSchema.TABLE_VALUATION, PacsSchema.COL_TAX_YEAR, "int"),
        (PacsSchema.TABLE_VALUATION, PacsSchema.COL_LAND_VAL, "money"),
        (PacsSchema.TABLE_VALUATION, PacsSchema.COL_IMP_VAL, "money"),
        (PacsSchema.TABLE_VALUATION, PacsSchema.COL_TOTAL_VAL, "money"),
    ]
    print_table(rows, ["TABLE_NAME", "COLUMN_NAME", "DATA_TYPE"])
    print("```")
    
    print("\nDiscovery Complete (Offline/Standard Mode).")
    print("To enable Live Discovery, provide valid PACS_USER/PACS_PASSWORD in backend/terrafusion-bridge/.env")


def run_discovery():
    print(f"Attempting connection to {settings.PACS_HOST}/{settings.PACS_DB} as user '{settings.PACS_USER or 'None'}'...")
    
    queries = [
        ("Query 1: Parcel Identity", 
         "SELECT TOP 50 TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%Parcel%' OR COLUMN_NAME LIKE '%PIN%' OR COLUMN_NAME LIKE '%Geo%'"),
        ("Query 2: Valuation", 
         "SELECT TOP 50 TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%Apprais%' OR COLUMN_NAME LIKE '%Assess%' OR COLUMN_NAME LIKE '%Market%'"),
        ("Query 3: Levies", 
         "SELECT TOP 50 TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%Levy%' OR COLUMN_NAME LIKE '%Rate%'")
    ]

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        for label, sql in queries:
            print(f"\n### {label}")
            print("```")
            try:
                cursor.execute(sql)
                columns = [column[0] for column in cursor.description]
                print_table(cursor.fetchall(), columns)
            except Exception as e:
                print(f"Error executing query: {e}")
            print("```")
            
        conn.close()
        print("\nDiscovery Complete.")
        
    except Exception as e:
        print(f"Connection Error: {e}")
        run_mock_discovery()

if __name__ == "__main__":
    run_discovery()
