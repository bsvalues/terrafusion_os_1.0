CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY,
    parcel_id TEXT,
    address TEXT,
    assessed_value REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
