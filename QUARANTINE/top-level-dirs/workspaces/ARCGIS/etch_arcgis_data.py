"""Standalone script to fetch ArcGIS data and insert into SQL Server."""

from config import ARCGIS_BASE_URL, ARCGIS_LAYERS, DB_CONNECTION_STRING, ALLOWED_TABLES
from utils import fetch_arcgis_data, insert_data_to_sql, log_info


if __name__ == "__main__":
    data = fetch_arcgis_data(
        layer_name=ARCGIS_LAYERS["building_permits"],
        query="1=1",
        fields="*",
        base_url=ARCGIS_BASE_URL,
    )
    log_info(f"Fetched {len(data)} building permit records.")

    records = [f["attributes"] for f in data if "attributes" in f]
    insert_data_to_sql(records, "ArcGIS.BuildingPermits", DB_CONNECTION_STRING, ALLOWED_TABLES)
    log_info(f"Inserted {len(records)} records into ArcGIS.BuildingPermits.")
