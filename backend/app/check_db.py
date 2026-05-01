import sqlite3
import os

db_path = "gswin-erp/backend/app/gswin_modern.db"
if not os.path.exists(db_path):
    print("DB not found!")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT * FROM positionen WHERE dokument_id = 1092")
    rows = cur.fetchall()
    print(f"Found {len(rows)} positions for dokument_id=1092")
    if len(rows) > 0:
        print(rows)
    
    cur.execute("SELECT * FROM positionen LIMIT 1")
    print("One row from positionen:", cur.fetchone())
    conn.close()
