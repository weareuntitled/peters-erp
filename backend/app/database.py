from sqlmodel import create_engine, SQLModel, Session, select
from typing import Generator
import os
import secrets
import bcrypt
from datetime import datetime, timezone

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/gswin_modern.db")

# Enable WAL mode for better concurrency and reliability
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Disable SQL echo in production
    connect_args=connect_args
)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session


def init_db():
    # Import all models here to ensure they are registered with SQLModel
    from .models import (
        Kunde, Artikel, Dokument, Zahlung,
        Position, Nummernkreis, Steuersatz,
        Vorlage, Formel, Warengruppe,
        FirmenEinstellungen,
    )
    
    # Create tables
    SQLModel.metadata.create_all(engine)
    
    # Enable WAL mode for SQLite
    if "sqlite" in DATABASE_URL:
        with engine.connect() as conn:
            conn.exec_driver_sql("PRAGMA journal_mode=WAL")
            conn.exec_driver_sql("PRAGMA synchronous=NORMAL")
            conn.exec_driver_sql("PRAGMA cache_size=-64000")
            # Performance indexes for dominant query paths
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_dokumente_typ_datum ON dokumente (typ, datum DESC)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_dokumente_kunde_id ON dokumente (kunde_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_dokumente_dokument_nr ON dokumente (dokument_nr)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_positionen_dokument_id ON positionen (dokument_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_positionen_warengruppe_id ON positionen (warengruppe_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_zahlungen_dokument_id ON zahlungen (dokument_id)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_kunden_name ON kunden (name)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_kunden_kundnr ON kunden (kundnr)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_warengruppen_bezeichnung ON warengruppen (bezeichnung)")
            conn.exec_driver_sql("CREATE INDEX IF NOT EXISTS idx_vorlagen_typ_aktiv ON vorlagen (typ, aktiv, ist_standard)")
    
    print("Database initialized successfully")


def ensure_admin_user():
    admin_user = os.getenv("GSWIN_ADMIN_USER", "")
    admin_pass = os.getenv("GSWIN_ADMIN_PASS", "")

    if not admin_user or not admin_pass:
        return

    from .auth.models import User

    with Session(engine) as session:
        existing = session.exec(select(User)).first()
        if existing:
            return

        hashed = bcrypt.hashpw(admin_pass.encode(), bcrypt.gensalt()).decode()
        now = datetime.now(timezone.utc)
        user = User(
            username=admin_user,
            email=f"{admin_user}@peters-erp.com",
            full_name="Administrator",
            hashed_password=hashed,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        session.commit()
        print(f"Default admin user '{admin_user}' created")
