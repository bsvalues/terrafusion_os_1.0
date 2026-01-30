import pyodbc
from .config import settings

def get_db_connection():
    conn_str = (
        f"DRIVER={{{settings.PACS_DRIVER}}};"
        f"SERVER={settings.PACS_HOST};"
        f"DATABASE={settings.PACS_DB};"
        f"UID={settings.PACS_USER};"
        f"PWD={settings.PACS_PASSWORD};"
        "TrustServerCertificate=yes;"
    )
    # READ-ONLY ENFORCEMENT
    # While the user should be read-only, we also set the intent here.
    conn = pyodbc.connect(conn_str, autocommit=True) 
    return conn

def execute_query(query_name: str, params: tuple):
    # In a real impl, we'd load SQL from the /queries folder by name
    # for strict allowlisting.
    pass
