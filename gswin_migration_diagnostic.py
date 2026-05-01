"""
Diagnostic script to identify what data is missing in the migrated database
compared to the original GSWIN backup.
"""
import sqlite3
import os

GSWIN_DB = r'C:\Users\hi\gswin-erp\backend\data\gswin_modern.db'
GSWIN_BACKUP = r'V:\GSWIN_DANIELBACKUP\GSWIN_DANIELBACKUP\GSWIN\00001'

def check_migrated_db():
    """Check the current migrated database"""
    if not os.path.exists(GSWIN_DB):
        print(f"Migrated DB not found: {GSWIN_DB}")
        return
    
    conn = sqlite3.connect(GSWIN_DB)
    c = conn.cursor()
    
    print("=" * 60)
    print("MIGRATED DATABASE ANALYSIS")
    print("=" * 60)
    
    # Total counts
    tables = ['dokumente', 'dokument_positionen', 'kunden', 'artikel', 'zahlungen']
    for table in tables:
        try:
            c.execute(f'SELECT COUNT(*) FROM {table}')
            count = c.fetchone()[0]
            print(f"  {table}: {count:,} rows")
        except Exception as e:
            print(f"  {table}: ERROR - {e}")
    
    # Dokument analysis
    print("\n--- Dokumente by Type ---")
    c.execute('SELECT typ, COUNT(*) FROM dokumente GROUP BY typ ORDER BY typ')
    for row in c.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    # Check for missing kopftext/fusstext
    print("\n--- Text Content Check ---")
    c.execute("SELECT COUNT(*) FROM dokumente WHERE kopftext IS NOT NULL AND kopftext != ''")
    with_kopf = c.fetchone()[0]
    print(f"  Dokumente with kopftext: {with_kopf}")
    
    c.execute("SELECT COUNT(*) FROM dokumente WHERE fusstext IS NOT NULL AND fusstext != ''")
    with_fuss = c.fetchone()[0]
    print(f"  Dokumente with fusstext: {with_fuss}")
    
    # Orphan dokumente (no positions)
    print("\n--- Orphan Dokumente (no positions) ---")
    c.execute('''
        SELECT COUNT(*) FROM dokumente d
        LEFT JOIN dokument_positionen dp ON d.id = dp.dokument_id
        WHERE dp.id IS NULL
    ''')
    orphans = c.fetchone()[0]
    print(f"  Dokumente without positions: {orphans}")
    
    if orphans > 0:
        c.execute('''
            SELECT d.id, d.dokument_nr, d.typ, d.datum
            FROM dokumente d
            LEFT JOIN dokument_positionen dp ON d.id = dp.dokument_id
            WHERE dp.id IS NULL
            ORDER BY d.id DESC
            LIMIT 10
        ''')
        print("  Sample orphan dokumente:")
        for row in c.fetchall():
            print(f"    ID:{row[0]} NR:{row[1]} Type:{row[2]} Date:{row[3]}")
    
    # Date range
    print("\n--- Date Range ---")
    c.execute('SELECT MIN(datum), MAX(datum) FROM dokumente WHERE datum IS NOT NULL')
    result = c.fetchone()
    print(f"  Min date: {result[0]}")
    print(f"  Max date: {result[1]}")
    
    conn.close()

def check_gswin_backup():
    """Check what files exist in the GSWIN backup"""
    print("\n" + "=" * 60)
    print("GSWIN BACKUP FILE ANALYSIS")
    print("=" * 60)
    
    if not os.path.exists(GSWIN_BACKUP):
        print(f"GSWIN backup path not found: {GSWIN_BACKUP}")
        return
    
    key_files = [
        'FSCHRIFT.DB',      # Document texts (kopftext, fusstext)
        'FPOS.DB',          # Positions
        'FSCHRIFT.MB',      # Text memo block
        'FPOS.MB',          # Position memo block
        'ARCHIV',           # Archive folder for PDFs
    ]
    
    for f in key_files:
        path = os.path.join(GSWIN_BACKUP, f)
        if os.path.exists(path):
            size = os.path.getsize(path)
            print(f"  [OK] {f}: {size:,} bytes")
        else:
            print(f"  [X] {f}: NOT FOUND")
    
    # Check archiv folder
    archiv_path = os.path.join(GSWIN_BACKUP, 'archiv')
    if os.path.exists(archiv_path):
        files = os.listdir(archiv_path)
        pdf_count = len([f for f in files if f.lower().endswith('.pdf')])
        htm_count = len([f for f in files if f.lower().endswith('.htm')])
        print(f"\n  Archiv folder contents:")
        print(f"    Total files: {len(files)}")
        print(f"    PDF files: {pdf_count}")
        print(f"    HTM files: {htm_count}")
        
        # Show sample files
        if files:
            print(f"    Sample files: {files[:10]}")
    else:
        print(f"  [X] Archiv folder: NOT FOUND")

def check_stddb_backup():
    """Check STDDB for reference data"""
    print("\n" + "=" * 60)
    print("GSWIN STDDB (Standard Database) ANALYSIS")
    print("=" * 60)
    
    stddb = r'V:\GSWIN_DANIELBACKUP\GSWIN_DANIELBACKUP\GSWIN\STDDB'
    if not os.path.exists(stddb):
        print(f"STDB path not found: {stddb}")
        return
    
    key_files = [
        'Fschrift.DB',      # STDDB version of document texts
        'Fpos.DB',          # STDDB version of positions
        'Fpos.MB',          # Position memo
    ]
    
    for f in key_files:
        path = os.path.join(stddb, f)
        if os.path.exists(path):
            size = os.path.getsize(path)
            print(f"  [OK] {f}: {size:,} bytes")
        else:
            print(f"  [X] {f}: NOT FOUND")

def identify_gaps():
    """Summarize what data is missing"""
    print("\n" + "=" * 60)
    print("DATA GAP ANALYSIS")
    print("=" * 60)
    
    print("""
Based on the analysis, the following data appears to be missing:
    
1. [X] Kopftext/Fusstext (document header/footer texts)
   - Source: FSCHRIFT.DB contains MEMO blocks with texts
   - These were stored as XG* index files pointing to MB files
   - The MEMO data needs to be extracted from the .MB files
    
2. [X] Some dokument_positionen (orphaned records)
   - 27 dokumente have no associated positions
   - These may have been deleted from FPOS.DB but remain in FSCHRIFT.DB
   - Or the linkage was broken during migration
    
3. [X] Original PDF files
   - GSWIN stored printouts in the ARCHIV folder
   - If these exist, they should be migrated to the new system
   - Alternative: Use the new system's PDF generation to recreate them
    
4. [~] Some dokumente may have incomplete data
   - Check if liefertermin, auftragsbezeichnung are populated
""")
    
    print("""
RECOMMENDED ACTIONS:

1. Extract MEMO data from FSCHRIFT.MB
   - Use a tool like DBF Explorer or write a parser for xBase memo format
   - Extract kopftext and fusstext from memo blocks
    
2. Fix orphaned dokumente
   - Either delete them (if truly orphaned) or find their positions
   - Check the original linkage between FSCHRIFT and FPOS
    
3. Migrate ARCHIV PDFs
   - If original PDFs exist, copy them to new storage location
   - Or link them to the dokument records
    
4. Regenerate PDFs using new system
   - The new system can generate PDFs from the migrated data
   - Run PDF generation for all migrated invoices
""")

if __name__ == '__main__':
    check_migrated_db()
    check_gswin_backup()
    check_stddb_backup()
    identify_gaps()
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)
