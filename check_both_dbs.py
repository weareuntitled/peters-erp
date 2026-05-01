import sqlite3

for db_path in ['backend/data/gswin_modern.db', 'data/gswin_modern.db']:
    print(f"\n=== {db_path} ===")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Check tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cur.fetchall()]
    print(f"Tables: {tables}")

    # Check dokumente count and latest
    if 'dokumente' in tables:
        cur.execute("SELECT COUNT(*), MIN(datum), MAX(datum) FROM dokumente")
        count, min_date, max_date = cur.fetchone()
        print(f"Dokumente: {count} records, dates from {min_date} to {max_date}")

        # Get latest 5
        cur.execute("SELECT id, dokument_nr, datum, typ FROM dokumente ORDER BY id DESC LIMIT 5")
        print("Latest 5:")
        for row in cur.fetchall():
            print(f"  {row}")

    conn.close()