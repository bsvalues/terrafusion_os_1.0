import logging
import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database Configuration
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:password@postgres:5432/terrafusion"
)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ═══════════════════════════════════════════════════════════════
# DATA MODEL: Raw Ingest Table
# ═══════════════════════════════════════════════════════════════
class RawIngest(db.Model):
    __tablename__ = "raw_ingest"

    id = db.Column(db.Integer, primary_key=True)
    parcel_id = db.Column(db.String(50), nullable=False, index=True)
    owner = db.Column(db.String(255))
    address = db.Column(db.String(500))
    value = db.Column(db.Numeric(15, 2))
    source = db.Column(db.String(100))
    raw_data = db.Column(db.JSON)
    ingested_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed = db.Column(db.Boolean, default=False)


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════
@app.route("/health", methods=["GET"])
def health():
    try:
        # Test DB connection
        db.session.execute(db.text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify(
        {
            "status": "healthy",
            "service": "data-pipeline",
            "version": "2.1.0",
            "database": db_status,
        }
    )


@app.route("/api/ingest", methods=["POST"])
def ingest():
    """
    Ingest a batch of parcel data and write to PostgreSQL.
    Expected JSON: { "source": "csv", "records": [ {...}, {...} ] }
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON payload provided"}), 400

        records = data.get("records", [])
        source = data.get("source", "unknown")

        if not records:
            return jsonify({"error": "No records provided"}), 400

        logger.info(f"Ingesting {len(records)} records from {source}")

        # Insert records into database
        inserted = 0
        for record in records:
            try:
                ingest_record = RawIngest(
                    parcel_id=record.get("parcel_id", "UNKNOWN"),
                    owner=record.get("owner"),
                    address=record.get("address"),
                    value=record.get("value"),
                    source=source,
                    raw_data=record,
                )
                db.session.add(ingest_record)
                inserted += 1
            except Exception as e:
                logger.error(f"Failed to insert record: {e}")

        db.session.commit()
        logger.info(f"Successfully inserted {inserted} records")

        return jsonify(
            {
                "status": "received",
                "count": inserted,
                "source": source,
                "message": "Data written to database",
            }
        ), 202

    except Exception as e:
        db.session.rollback()
        logger.error(f"Ingestion failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/ingest/stats", methods=["GET"])
def ingest_stats():
    """Get ingestion statistics."""
    try:
        total = db.session.query(RawIngest).count()
        unprocessed = db.session.query(RawIngest).filter_by(processed=False).count()

        return jsonify(
            {
                "total_records": total,
                "unprocessed": unprocessed,
                "processed": total - unprocessed,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════
with app.app_context():
    db.create_all()
    logger.info("Database tables created/verified")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
