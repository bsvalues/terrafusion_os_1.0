import os

import schedule
import time
import requests

from utils import log_info, log_error

API_HOST = os.getenv("API_HOST", "http://localhost:5000")
API_KEY = os.getenv("API_KEY", "")


def _headers():
    h = {}
    if API_KEY:
        h["X-API-Key"] = API_KEY
    return h


def fetch_and_sync():
    try:
        log_info("Starting automated fetch and sync.")

        response = requests.get(
            f"{API_HOST}/fetch_building_permits",
            params={"query": "1=1", "fields": "PermitID,Address,City,Status,Value"},
            headers=_headers(),
            timeout=60,
        )
        response.raise_for_status()
        building_permits = response.json()

        sync_response = requests.post(
            f"{API_HOST}/sync_to_ciaps",
            json={"table_name": "ArcGIS.BuildingPermits", "data": building_permits},
            headers=_headers(),
            timeout=60,
        )
        sync_response.raise_for_status()
        log_info(f"Automation completed: {sync_response.json()}")
    except Exception as e:
        log_error(f"Automation failed: {e}")


schedule.every().day.at("03:00").do(fetch_and_sync)

if __name__ == "__main__":
    log_info("Scheduler started. Waiting for scheduled tasks...")
    while True:
        schedule.run_pending()
        time.sleep(1)
