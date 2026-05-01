"""
Migration script: Convert position numeric fields from String to Float.

Run this ONCE after updating the model. It converts existing String data
to Float values in the database.
"""

import sqlite3
import sys
from pathlib import Path

def migrate_positions(db_path: str = "data/gswin_modern.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Columns to convert
    columns = [
        "einzelpreis",
        "rabatt_prozent",
        "mwst_satz",
        "gesamtpreis"
    ]

    for col in columns:
        # Check current column type
        cursor.execute(f"PRAGMA table_info(dokument_positionen)")
        columns_info = cursor.execute(f"PRAGMA table_info(dokument_positionen)").fetchall()
        col_info = next((c for c in columns_info if c[1] == col), None)

        if col_info:
            print(f"Column '{col}' type: {col_info[2]}")

        # Try to convert - handle both String and Float data
        cursor.execute(f"SELECT id, {col} FROM dokument_positionen WHERE {col} IS NOT NULL")
        rows = cursor.fetchall()

        converted = 0
        errors = 0

        for row_id, value in rows:
            try:
                if value is None or value == '':
                    new_value = 0.0
                else:
                    # Handle both String and Float stored in DB
                    if isinstance(value, float):
                        new_value = value
                    else:
                        new_value = float(str(value).replace(',', '.'))

                cursor.execute(
                    f"UPDATE dokument_positionen SET {col} = ? WHERE id = ?",
                    (new_value, row_id)
                )
                converted += 1
            except (ValueError, TypeError) as e:
                print(f"  Error converting row {row_id}, value '{value}': {e}")
                errors += 1

        print(f"  Converted {converted} rows, {errors} errors")

    conn.commit()
    conn.close()
    print("\nMigration complete!")


if __name__ == "__main__":
    # Run from backend directory
    db_path = Path(__file__).parent / "data" / "gswin_modern.db"
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        sys.exit(1)

    print(f"Migrating database: {db_path}")
    migrate_positions(str(db_path))