import logging
import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func

# Config
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database Config
db_url = os.environ.get(
    "DATABASE_URL", "postgresql://postgres:password@postgres:5432/terrafusion"
)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ═══════════════════════════════════════════════════════════════
# MODELS
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

    def to_dict(self):
        return {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "owner": self.owner,
            "address": self.address,
            "value": float(self.value) if self.value else 0,
            "source": self.source,
            "processed": self.processed,
            "ingested_at": self.ingested_at.isoformat() if self.ingested_at else None,
        }


# ═══════════════════════════════════════════════════════════════
# INITIALIZATION
# ═══════════════════════════════════════════════════════════════
with app.app_context():
    try:
        db.create_all()
        logger.info("✅ Database tables verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")


# ═══════════════════════════════════════════════════════════════
# ROUTES: HEALTH
# ═══════════════════════════════════════════════════════════════
@app.route("/health", methods=["GET"])
def health():
    try:
        count = RawIngest.query.count()
        db_status = "connected"
    except Exception as e:
        count = 0
        db_status = f"error: {str(e)}"

    return jsonify(
        {
            "status": "healthy",
            "service": "data-pipeline",
            "version": "2.2.0",
            "database": db_status,
            "record_count": count,
        }
    )


# ═══════════════════════════════════════════════════════════════
# ROUTES: INGESTION
# ═══════════════════════════════════════════════════════════════
@app.route("/api/ingest", methods=["POST"])
def ingest():
    """Ingest batch of parcel data into raw_ingest table."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No payload"}), 400

        records = data.get("records", [])
        source = data.get("source", "unknown")

        if not records:
            return jsonify({"error": "No records provided"}), 400

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
                logger.error(f"Failed to insert: {e}")

        db.session.commit()
        logger.info(f"💾 Persisted {inserted} records from {source}")

        return jsonify(
            {
                "status": "received",
                "count": inserted,
                "source": source,
                "message": "Data persisted to raw_ingest",
            }
        ), 202

    except Exception as e:
        db.session.rollback()
        logger.error(f"Ingestion Error: {e}")
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# ROUTES: RETRIEVAL (NEW - For Service Propagation)
# ═══════════════════════════════════════════════════════════════
@app.route("/api/parcels", methods=["GET"])
def get_parcels():
    """Retrieve ingested parcels with pagination and filtering."""
    try:
        # Pagination
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)
        per_page = min(per_page, 500)  # Max 500 per request

        # Filters
        source = request.args.get("source")
        processed = request.args.get("processed", type=lambda x: x.lower() == "true")
        min_value = request.args.get("min_value", type=float)
        max_value = request.args.get("max_value", type=float)

        # Build query
        query = RawIngest.query

        if source:
            query = query.filter(RawIngest.source == source)
        if processed is not None:
            query = query.filter(RawIngest.processed == processed)
        if min_value:
            query = query.filter(RawIngest.value >= min_value)
        if max_value:
            query = query.filter(RawIngest.value <= max_value)

        # Execute with pagination
        pagination = query.order_by(RawIngest.ingested_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify(
            {
                "parcels": [p.to_dict() for p in pagination.items],
                "total": pagination.total,
                "page": page,
                "per_page": per_page,
                "pages": pagination.pages,
            }
        )

    except Exception as e:
        logger.error(f"Retrieval Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/parcels/<parcel_id>", methods=["GET"])
def get_parcel(parcel_id):
    """Retrieve a specific parcel by ID."""
    try:
        parcel = RawIngest.query.filter_by(parcel_id=parcel_id).first()
        if not parcel:
            return jsonify({"error": "Parcel not found"}), 404
        return jsonify(parcel.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/parcels/search", methods=["GET"])
def search_parcels():
    """Search parcels by owner name or address."""
    try:
        q = request.args.get("q", "")
        limit = request.args.get("limit", 20, type=int)

        if not q:
            return jsonify({"error": "Search query required"}), 400

        results = (
            RawIngest.query.filter(
                db.or_(
                    RawIngest.owner.ilike(f"%{q}%"),
                    RawIngest.address.ilike(f"%{q}%"),
                    RawIngest.parcel_id.ilike(f"%{q}%"),
                )
            )
            .limit(limit)
            .all()
        )

        return jsonify(
            {
                "query": q,
                "count": len(results),
                "results": [p.to_dict() for p in results],
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# ROUTES: STATISTICS
# ═══════════════════════════════════════════════════════════════
@app.route("/api/ingest/stats", methods=["GET"])
def stats():
    """Get ingestion statistics."""
    try:
        total = RawIngest.query.count()
        unprocessed = RawIngest.query.filter_by(processed=False).count()

        # Value statistics
        value_stats = db.session.query(
            func.min(RawIngest.value).label("min"),
            func.max(RawIngest.value).label("max"),
            func.avg(RawIngest.value).label("avg"),
            func.sum(RawIngest.value).label("total"),
        ).first()

        # Source breakdown
        source_counts = (
            db.session.query(RawIngest.source, func.count(RawIngest.id))
            .group_by(RawIngest.source)
            .all()
        )

        return jsonify(
            {
                "total_records": total,
                "unprocessed": unprocessed,
                "processed": total - unprocessed,
                "value_statistics": {
                    "min": float(value_stats.min)
                    if value_stats and value_stats.min
                    else 0,
                    "max": float(value_stats.max)
                    if value_stats and value_stats.max
                    else 0,
                    "avg": float(value_stats.avg)
                    if value_stats and value_stats.avg
                    else 0,
                    "total": float(value_stats.total)
                    if value_stats and value_stats.total
                    else 0,
                },
                "sources": {src: cnt for src, cnt in source_counts},
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# ROUTES: PROCESSING (Mark as processed)
# ═══════════════════════════════════════════════════════════════
@app.route("/api/parcels/<int:id>/process", methods=["POST"])
def mark_processed(id):
    """Mark a parcel as processed."""
    try:
        parcel = RawIngest.query.get(id)
        if not parcel:
            return jsonify({"error": "Record not found"}), 404

        parcel.processed = True
        db.session.commit()

        return jsonify({"status": "processed", "id": id})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
