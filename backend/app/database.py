from sqlmodel import create_engine, SQLModel, Session
from typing import Generator
import os

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
    
    print("Database initialized successfully")