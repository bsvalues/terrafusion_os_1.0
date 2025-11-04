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
