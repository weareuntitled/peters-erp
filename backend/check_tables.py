import sqlite3
conn = sqlite3.connect('C:/Users/hi/gswin-erp/backend/data/gswin_modern.db')
cur = conn.cursor()
cur.execute('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name')
tables = [r[0] for r in cur.fetchall()]
print('All tables:', tables)
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}"')
    print(f'  {t}: {cur.fetchone()[0]} rows')
conn.close()