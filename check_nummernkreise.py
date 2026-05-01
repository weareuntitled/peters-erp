import sqlite3
conn = sqlite3.connect('backend/data/gswin_modern.db')
cur = conn.cursor()

# Check nummernkreise
cur.execute("SELECT * FROM nummernkreise")
print("Nummernkreise:")
for row in cur.fetchall():
    print(f"  {row}")

# Check latest dokument_nr for each type
for typ in ['AN', 'AU', 'LI', 'RE']:
    cur.execute(f"SELECT dokument_nr FROM dokumente WHERE typ='{typ}' ORDER BY id DESC LIMIT 1")
    result = cur.fetchone()
    print(f"\nLatest {typ}: {result[0] if result else 'None'}")

conn.close()