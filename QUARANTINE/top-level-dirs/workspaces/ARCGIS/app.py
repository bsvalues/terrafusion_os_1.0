from functools import wraps

from flask import Flask, request, jsonify

from config import (
    ARCGIS_BASE_URL,
    ARCGIS_LAYERS,
    DB_CONNECTION_STRING,
    FLASK_HOST,
    FLASK_PORT,
    FLASK_DEBUG,
    API_KEY,
    ALLOWED_TABLES,
)
from utils import fetch_arcgis_data, insert_data_to_sql, log_info, log_error

app = Flask(__name__)


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if API_KEY:
            key = request.headers.get("X-API-Key")
            if key != API_KEY:
                return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


@app.errorhandler(Exception)
def handle_exception(e):
    log_error(f"Unhandled Exception: {e}")
    return jsonify({"error": "An unexpected error occurred"}), 500


@app.route("/fetch_building_permits", methods=["GET"])
@require_api_key
def fetch_building_permits():
    try:
        query = request.args.get("query", "1=1")
        fields = request.args.get("fields", "*")
        data = fetch_arcgis_data(
            layer_name=ARCGIS_LAYERS["building_permits"],
            query=query,
            fields=fields,
            base_url=ARCGIS_BASE_URL,
        )
        log_info(f"Fetched {len(data)} building permits.")
        return jsonify(data)
    except Exception as e:
        log_error(f"Error fetching building permits: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/fetch_property_data", methods=["GET"])
@require_api_key
def fetch_property_data():
    try:
        query = request.args.get("query", "1=1")
        fields = request.args.get("fields", "*")
        data = fetch_arcgis_data(
            layer_name=ARCGIS_LAYERS["property_data"],
            query=query,
            fields=fields,
            base_url=ARCGIS_BASE_URL,
        )
        log_info(f"Fetched {len(data)} property records.")
        return jsonify(data)
    except Exception as e:
        log_error(f"Error fetching property data: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/sync_to_ciaps", methods=["POST"])
@require_api_key
def sync_to_ciaps():
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({"error": "Request body must be JSON"}), 400

        table_name = payload.get("table_name")
        data = payload.get("data")

        if not table_name or not isinstance(data, list):
            return jsonify({"error": "table_name (string) and data (array) are required"}), 400

        insert_data_to_sql(data, table_name, DB_CONNECTION_STRING, ALLOWED_TABLES)
        log_info(f"Synced {len(data)} records to {table_name}.")
        return jsonify({"status": "success", "records_synced": len(data)})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        log_error(f"Error syncing data to CIAPS: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=FLASK_DEBUG)