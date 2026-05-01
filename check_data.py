import sqlite3
conn = sqlite3.connect('backend/data/gswin_modern.db')
cur = conn.cursor()

# Check tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cur.fetchall())

# Check dokumente sample
try:
    cur.execute("SELECT id, dokument_nr, datum, typ FROM dokumente LIMIT 5")
    print("\nDokumente sample:", cur.fetchall())
except Exception as e:
    print("\nDokumente error:", e)

# Check warengruppen
try:
    cur.execute("SELECT id, bezeichnung FROM warengruppen LIMIT 10")
    print("\nWarengruppen:", cur.fetchall())
except Exception as e:
    print("\nWarengruppen error:", e)

# Check artikel with warengruppe_id
try:
    cur.execute("SELECT id, artnr, bezeichnung, warengruppe_id FROM artikel LIMIT 5")
    print("\nArtikel sample:", cur.fetchall())
except Exception as e:
    print("\nArtikel error:", e)

conn.close()