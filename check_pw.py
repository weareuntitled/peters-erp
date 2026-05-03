import sqlite3
conn = sqlite3.connect(r'C:\Users\hi\gswin-erp\data\gswin_modern.db')
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cursor.fetchall()]
print('Tables:', tables)
for t in tables:
    if 'user' in t.lower() or 'auth' in t.lower():
        c2 = conn.execute(f"SELECT * FROM {t}")
        print(f'{t}:', c2.fetchall())
conn.close()
