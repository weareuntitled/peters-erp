import sqlite3
import os

DB_PATH = r'C:\Users\hi\gswin-erp\backend\data\gswin_modern.db'
SCHEMA_PATH = r'C:\Users\hi\gswin_schema.sql'

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA foreign_keys = OFF")

cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
for (table_name,) in cur.fetchall():
    if table_name != 'sqlite_sequence':
        print(f"Dropping {table_name}")
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")

cur.execute("SELECT name FROM sqlite_master WHERE type='view'")
for (view_name,) in cur.fetchall():
    print(f"Dropping view {view_name}")
    conn.execute(f"DROP VIEW IF EXISTS {view_name}")

conn.commit()

# Recreate from schema
with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
    schema = f.read()

conn.executescript(schema)
conn.commit()

# Verify
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print(f"\nTables created: {tables}")
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    print(f"  {t}: {cur.fetchone()[0]} rows")

conn.close()
print("\nDone!")