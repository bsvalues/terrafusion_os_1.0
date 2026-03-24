import os
from dotenv import load_dotenv

load_dotenv()

ARCGIS_BASE_URL = os.getenv(
    "ARCGIS_BASE_URL",
    "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services",
)

ARCGIS_LAYERS = {
    "building_permits": "BuildingPermitsAll/FeatureServer/0",
    "property_data": "Parcels_and_Assess/FeatureServer/0",
}

_driver = os.getenv("DB_DRIVER", "SQL Server")
_server = os.getenv("DB_SERVER", "JCHARRISPACS")
_database = os.getenv("DB_DATABASE", "PACS_OLTP")
_trusted = os.getenv("DB_TRUSTED_CONNECTION", "yes")

DB_CONNECTION_STRING = (
    f"Driver={{{_driver}}};"
    f"Server={_server};"
    f"Database={_database};"
    f"Trusted_Connection={_trusted};"
)

FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

API_KEY = os.getenv("API_KEY", "")

# Whitelist of SQL table names allowed for sync operations
ALLOWED_TABLES = {
    "ArcGIS.BuildingPermits",
    "ArcGIS.PropertyData",
}
