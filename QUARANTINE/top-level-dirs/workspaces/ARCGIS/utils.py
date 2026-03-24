import re
import logging

import requests
import pyodbc

logging.basicConfig(
    filename="api.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


def log_error(message):
    logging.error(message)


def log_info(message):
    logging.info(message)


def fetch_arcgis_data(layer_name, query="1=1", fields="*", base_url=None):
    """Fetch features from an ArcGIS REST FeatureServer layer with pagination."""
    try:
        url = f"{base_url}/{layer_name}/query"
        params = {
            "where": query,
            "outFields": fields,
            "f": "json",
            "resultOffset": 0,
            "resultRecordCount": 2000,
        }
        all_features = []
        while True:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            features = data.get("features", [])
            all_features.extend(features)
            if data.get("exceededTransferLimit"):
                params["resultOffset"] += len(features)
            else:
                break
        return all_features
    except Exception as e:
        log_error(f"Error fetching data from {layer_name}: {e}")
        raise


_SAFE_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_.]*$")


def _validate_identifier(name):
    """Validate that a SQL identifier contains only safe characters."""
    if not _SAFE_IDENTIFIER.match(name):
        raise ValueError(f"Invalid SQL identifier: {name}")
    return name


def insert_data_to_sql(data, table_name, conn_str, allowed_tables=None):
    """Insert records into SQL Server. table_name must be in allowed_tables."""
    if allowed_tables and table_name not in allowed_tables:
        raise ValueError(f"Table '{table_name}' is not in the allowed tables list")
    _validate_identifier(table_name)

    try:
        with pyodbc.connect(conn_str) as conn:
            cursor = conn.cursor()
            for record in data:
                columns = [_validate_identifier(k) for k in record.keys()]
                placeholders = ", ".join(["?"] * len(record))
                col_str = ", ".join(columns)
                sql = f"INSERT INTO {table_name} ({col_str}) VALUES ({placeholders})"
                cursor.execute(sql, list(record.values()))
            conn.commit()
    except Exception as e:
        log_error(f"Error inserting data into {table_name}: {e}")
        raise
