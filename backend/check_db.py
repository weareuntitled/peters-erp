import sys
sys.path.insert(0, '/app')
from sqlmodel import Session, select, create_engine
from app.models.vorlagen import Vorlage

engine = create_engine('sqlite:////data/gswin_modern.db')
with Session(engine) as session:
    v = session.get(Vorlage, 1)
    print(f"id={v.id}, name={v.name}")
    print(f"html_content len: {len(v.html_content) if v.html_content else 0}")
    print(f"html_content first 100: {v.html_content[:100] if v.html_content else 'NULL'}")

    v2 = session.get(Vorlage, 2)
    print(f"\nid={v2.id}, name={v2.name}")
    print(f"html_content len: {len(v2.html_content) if v2.html_content else 0}")
