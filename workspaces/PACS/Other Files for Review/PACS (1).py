from arcgis.gis import GIS
import pandas as pd
import pyodbc
import json
import datetime

# Step 1: Connect to ArcGIS
gis = GIS("https://www.arcgis.com", "Bill.Spencer_BentonCo", "Kimberly#3")

# Step 2: Query ArcGIS Layers
def fetch_arcgis_data(layer_name, query="1=1", fields="*"):
    print(f"Fetching data from layer: {layer_name}")
    try:
        layer = gis.content.search(layer_name, item_type="Feature Layer")[0].layers[0]
        result = layer.query(where=query, out_fields=fields)
        data = [feature.attributes for feature in result.features]
        return pd.DataFrame(data)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()

# Step 3: Insert Data into SQL
def insert_data_to_sql(df, table_name, conn):
    if df.empty:
        print(f"No data to insert into {table_name}.")
        return
    
    print(f"Inserting data into {table_name}...")
    cursor = conn.cursor()
    for _, row in df.iterrows():
        placeholders = ", ".join(["?"] * len(row))
        columns = ", ".join(df.columns)
        sql = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
        cursor.execute(sql, *row)
    conn.commit()
    print(f"Data successfully inserted into {table_name}.")

# Step 4: Log API Transactions
def log_api_transaction(conn, operation, request, response, status_code, notes=None):
    cursor = conn.cursor()
    sql = """
        INSERT INTO ArcGIS.APILog (Operation, Request, Response, StatusCode, Timestamp, Notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    cursor.execute(sql, operation, json.dumps(request), json.dumps(response), status_code, datetime.datetime.now(), notes)
    conn.commit()
    print("Transaction logged.")

# Step 5: Main Process
def main():
    try:
        # Database Connection
        conn = pyodbc.connect(
            "Driver={SQL Server};"
            "Server=JCHARRISPACS;"
            "Database=PACS_training;"
            "Trusted_Connection=yes;"
        )
        print("Connected to SQL Server.")

        # Fetch and Insert Building Permits
        building_permits = fetch_arcgis_data("BuildingPermitsAll", query="1=1", fields="PermitID, Address, City, Status")
        insert_data_to_sql(building_permits, "ArcGIS.PermitData", conn)

        # Fetch and Insert Property Data
        property_data = fetch_arcgis_data("Parcels_and_Assess", query="1=1", fields="ParcelID, Owner, TaxLot, MarketValue")
        insert_data_to_sql(property_data, "ArcGIS.PropertyData", conn)

        # Log Successful API Calls
        log_api_transaction(
            conn,
            operation="Fetch and Insert Data",
            request={"layers": ["BuildingPermitsAll", "Parcels_and_Assess"]},
            response={"status": "Success", "record_count": len(building_permits) + len(property_data)},
            status_code="200"
        )

    except Exception as e:
        print(f"Error during processing: {e}")

if __name__ == "__main__":
    main()

