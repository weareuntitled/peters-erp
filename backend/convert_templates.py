"""Reset wrong template html_content and reconvert."""
import sys
sys.path.insert(0, '/app')

from app.services.pdf_service import pdf_service
from app.models.vorlagen import Vorlage
from sqlmodel import Session, select, create_engine
from sqlalchemy import text

DATABASE_URL = 'sqlite:///./data/gswin_modern.db'
engine = create_engine(DATABASE_URL)

TEMPLATE_MAP = {
    'Standard-Angebot': 'angebot.html',
    'Standard-Rechnung': 'rechnung.html',
    'Standard-Gutschrift': 'rechnung.html',
    'Standard-Lieferschein': 'rechnung.html',
}

with Session(engine) as session:
    # Reset wrong conversions (those that got only child block content, not full template)
    session.execute(text("UPDATE vorlagen SET html_content = NULL WHERE LENGTH(html_content) < 2000"))
    session.commit()
    print("Reset templates with wrong html_content")

with Session(engine) as session:
    vorlagen = session.exec(select(Vorlage)).all()
    for vorlage in vorlagen:
        if vorlage.html_content:
            print(f"[{vorlage.name}] already has html_content ({len(vorlage.html_content)} chars) — SKIP")
            continue

        disk_file = vorlage.template_datei
        if not disk_file:
            disk_file = TEMPLATE_MAP.get(vorlage.name)

        if not disk_file:
            print(f"[{vorlage.name}] no disk template — SKIP")
            continue

        flattened = pdf_service.flatten_template(disk_file)
        if flattened is None:
            print(f"[{vorlage.name}] FAILED — SKIP")
            continue

        vorlage.html_content = flattened
        session.add(vorlage)
        print(f"[{vorlage.name}] SAVED {len(flattened)} chars")

    session.commit()
    print("\nAll templates converted!")
