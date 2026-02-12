import sqlite3
import json

# Inspect TerraAgent database structure
try:
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()

    print("🏛️ TerraAgent Database Structure Analysis")
    print("=" * 50)
    print("Database: app.db")
    print(f"Tables found: {len(tables)}")
    print()

    db_structure = {}

    for table in tables:
        table_name = table[0]
        print(f"📋 Table: {table_name}")

        # Get table schema
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()

        # Get record count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        record_count = cursor.fetchone()[0]

        print(f"   Records: {record_count}")
        print(f"   Columns: {len(columns)}")

        column_info = []
        for col in columns:
            col_info = {
                "name": col[1],
                "type": col[2],
                "not_null": bool(col[3]),
                "primary_key": bool(col[5]),
            }
            column_info.append(col_info)
            print(
                f"     - {col[1]} ({col[2]}) {'NOT NULL' if col[3] else ''} {'PRIMARY KEY' if col[5] else ''}"
            )

        db_structure[table_name] = {
            "record_count": record_count,
            "columns": column_info,
        }

        # Show sample data if table has records
        if record_count > 0 and record_count < 1000:  # Only for smaller tables
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
            sample_data = cursor.fetchall()
            print(f"   Sample data: {len(sample_data)} rows")

        print()

    conn.close()

    # Save structure analysis
    with open("terraagent_db_analysis.json", "w") as f:
        json.dump(db_structure, f, indent=2)

    print("✅ Database structure analysis complete")
    print("📄 Analysis saved to: terraagent_db_analysis.json")

except Exception as e:
    print(f"❌ Database analysis failed: {e}")
