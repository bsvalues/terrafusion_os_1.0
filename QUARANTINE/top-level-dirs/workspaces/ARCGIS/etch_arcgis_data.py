pyhton

import requests
import pyodbc
import json

def fetch_arcgis_data(layer_name, query="1=1", fields="*", base_url=None):
    url = f"{base_url}/{layer_name}/query"
    params = {
        "where": query,
        "outFields": fields,
        "f": "json"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("features", [])
    else:
        raise Exception(f"Error fetching data: {response.text}")

def insert_data_to_sql(data, table_name, conn_str):
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    for record in data:
        placeholders = ", ".join(["?"] * len(record))
        columns = ", ".join(record.keys())
        sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        cursor.execute(sql, *record.values())
    conn.commit()
    conn.close()
