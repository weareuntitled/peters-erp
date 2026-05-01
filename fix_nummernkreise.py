import sqlite3
import re

conn = sqlite3.connect('backend/data/gswin_modern.db')
cur = conn.cursor()

def extract_seq_number(doc_nr, doc_typ):
    """Extract sequential number from dokument_nr, handling both old and new formats."""
    # New format: just digits after prefix like "RE01301" or "AN00631"
    match = re.match(rf'^{doc_typ}(\d+)$', doc_nr)
    if match:
        return int(match.group(1))
    
    # Old format: "RE01054-112005" - extract digits between prefix and dash
    match = re.match(rf'^{doc_typ}(\d+)-', doc_nr)
    if match:
        return int(match.group(1))
    
    return 0

# Get the current max numbers for each type
for typ in ['AN', 'AU', 'LI', 'RE', 'GU', 'ST', 'MA']:
    cur.execute(f"SELECT dokument_nr FROM dokumente WHERE typ='{typ}' ORDER BY dokument_nr DESC LIMIT 50")
    results = [r[0] for r in cur.fetchall()]
    
    max_num = 0
    max_doc = None
    for doc_nr in results:
        num = extract_seq_number(doc_nr, typ)
        if num > max_num:
            max_num = num
            max_doc = doc_nr
    
    if max_num > 0:
        print(f"{typ}: current max = {max_num} (from {max_doc})")
        cur.execute(
            f"UPDATE nummernkreise SET laufende_nr = ? WHERE typ = ?",
            (max_num, typ)
        )
        print(f"  Updated counter to {max_num}")

conn.commit()

# Verify the update
print("\nNummernkreise after update:")
cur.execute("SELECT * FROM nummernkreise")
for row in cur.fetchall():
    print(f"  {row}")

conn.close()
print("\nDone! New documents will increment from these numbers.")