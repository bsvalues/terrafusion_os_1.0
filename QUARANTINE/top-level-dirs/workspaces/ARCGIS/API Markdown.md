# ArcGIS to CIAPS API Integration

This document outlines the full implementation of an API for integrating ArcGIS data with the CIAPS system. It includes error-handling mechanisms, logging, and automated scheduled tasks.

---

## **1. Directory Structure**

---

## **2. Configuration**

### **config.py**
```python
ARCGIS_BASE_URL = "https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services"
ARCGIS_LAYERS = {
    "building_permits": "BuildingPermitsAll/FeatureServer/0",
    "property_data": "Parcels_and_Assess/FeatureServer/0"
}

DB_CONNECTION_STRING = (
    "Driver={SQL Server};"
    "Server=JCHARRISPACS;"
    "Database=PACS_OLTP;"
    "Trusted_Connection=yes;"
)
import requests
import pyodbc
import logging

# Configure logging
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
    try:
        url = f"{base_url}/{layer_name}/query"
        params = {
            "where": query,
            "outFields": fields,
            "f": "json"
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("features", [])
    except Exception as e:
        log_error(f"Error fetching data: {str(e)}")
        raise

def insert_data_to_sql(data, table_name, conn_str):
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        for record in data:
            placeholders = ", ".join(["?"] * len(record))
            columns = ", ".join(record.keys())
            sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
            cursor.execute(sql, *record.values())
        conn.commit()
        conn.close()
    except Exception as e:
        log_error(f"Error inserting data into {table_name}: {str(e)}")
        raise
from flask import Flask, request, jsonify
from config import ARCGIS_BASE_URL, ARCGIS_LAYERS, DB_CONNECTION_STRING
from utils import fetch_arcgis_data, insert_data_to_sql, log_info, log_error

app = Flask(__name__)

@app.errorhandler(Exception)
def handle_exception(e):
    log_error(f"Unhandled Exception: {str(e)}")
    return jsonify({"error": "An unexpected error occurred"}), 500

@app.route("/fetch_building_permits", methods=["GET"])
def fetch_building_permits():
    try:
        query = request.args.get("query", "1=1")
        fields = request.args.get("fields", "*")
        data = fetch_arcgis_data(
            layer_name=ARCGIS_LAYERS["building_permits"],
            query=query,
            fields=fields,
            base_url=ARCGIS_BASE_URL
        )
        log_info(f"Fetched {len(data)} building permits.")
        return jsonify(data)
    except Exception as e:
        log_error(f"Error fetching building permits: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/sync_to_ciaps", methods=["POST"])
def sync_to_ciaps():
    try:
        table_name = request.json.get("table_name")
        data = request.json.get("data")
        insert_data_to_sql(data, table_name, DB_CONNECTION_STRING)
        log_info(f"Synced {len(data)} records to {table_name}.")
        return jsonify({"status": "success"})
    except Exception as e:
        log_error(f"Error syncing data to CIAPS: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
import schedule
import time
import requests
from utils import log_info, log_error

def fetch_and_sync():
    try:
        log_info("Starting automated fetch and sync.")
        
        response = requests.get("http://localhost:5000/fetch_building_permits", params={
            "query": "1=1",
            "fields": "PermitID,Address,City,Status,Value"
        })
        building_permits = response.json()

        sync_response = requests.post("http://localhost:5000/sync_to_ciaps", json={
            "table_name": "ArcGIS.BuildingPermits",
            "data": building_permits
        })
        log_info(f"Automation completed: {sync_response.json()}")
    except Exception as e:
        log_error(f"Automation failed: {str(e)}")

schedule.every().day.at("03:00").do(fetch_and_sync)

if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(1)
