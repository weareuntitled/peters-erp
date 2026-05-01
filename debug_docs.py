import sqlite3

conn = sqlite3.connect('backend/data/gswin_modern.db')
cur = conn.cursor()

# Check all dokument types
print("All dokument types and their max numbers:")
for typ in ['AN', 'AU', 'LI', 'RE', 'GU', 'ST', 'MA']:
    cur.execute(f"SELECT dokument_nr FROM dokumente WHERE typ='{typ}' ORDER BY dokument_nr DESC LIMIT 3")
    results = cur.fetchall()
    print(f"{typ}: {results}")

conn.close()