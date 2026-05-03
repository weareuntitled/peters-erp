import sqlite3
import bcrypt
from datetime import datetime, timezone

conn = sqlite3.connect(r'C:\Users\hi\gswin-erp\data\gswin_modern.db')

conn.execute("""
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    is_active INTEGER DEFAULT 1,
    hashed_password TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT
)
""")

conn.execute("DELETE FROM user")

now = datetime.now(timezone.utc).isoformat()
hashed = bcrypt.hashpw(b'Spengler1508', bcrypt.gensalt()).decode()
conn.execute(
    "INSERT INTO user (username, email, full_name, is_active, hashed_password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ('norbert', 'norbert@spenglerei-peters.de', 'Norbert', 1, hashed, now, now)
)
conn.commit()

cursor = conn.execute("SELECT id, username, email, full_name, is_active FROM user")
for row in cursor.fetchall():
    print(f"  User: id={row[0]}, username={row[1]}, email={row[2]}, name={row[3]}, active={row[4]}")

conn.close()
print("Done")
