from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .database import get_session, engine
from .database import ensure_admin_user
from .auth.router import router as auth_router
from .routers import kunden, artikel, dokumente, warengruppen, zahlungen, vorlagen, positionen, dashboard, firmen_einstellungen
from sqlmodel import Session, select
from fastapi.staticfiles import StaticFiles
import os
from .auth.models import User
from .models.kunden import Kunde
from .models.artikel import Artikel
from .models.dokumente import Dokument

app = FastAPI(
    title="GSWIN ERP API",
    version="1.0.0",
    description="Custom Invoicing CRM/ERP for German Handwerker",
)

# Read CORS origins from environment variable, comma-separated
import os
_default_cors = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://187.77.68.83:5175"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", _default_cors).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    from .database import init_db as db_init
    db_init()
    ensure_admin_user()

init_db()

# Ensure static directories exist
os.makedirs("app/static/logos", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(kunden.router, prefix="/api/kunden", tags=["Kunden"])
app.include_router(artikel.router, prefix="/api/artikel", tags=["Artikel"])
app.include_router(warengruppen.router, prefix="/api/warengruppen", tags=["Warengruppen"])
app.include_router(dokumente.router, prefix="/api/dokumente", tags=["Dokumente"])
app.include_router(zahlungen.router, prefix="/api/zahlungen", tags=["Zahlungen"])
app.include_router(vorlagen.router, prefix="/api/vorlagen", tags=["Vorlagen"])
app.include_router(positionen.router, prefix="/api/positionen", tags=["Positionen"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(firmen_einstellungen.router, prefix="/api/firmen-einstellungen", tags=["Firmen-Einstellungen"])

@app.get("/")
async def root():
    return {"message": "GSWIN ERP Backend is running"}

@app.get("/api/search")
async def global_search(q: str, session: Session = Depends(get_session)):
    if len(q) < 2:
        return []

    results = []
    q_lower = q.lower()

    # Search Kunden
    kunden_stmt = select(Kunde).where(
        (Kunde.name.ilike(f"%{q_lower}%")) |
        (Kunde.vorname.ilike(f"%{q_lower}%")) |
        (Kunde.kundnr.ilike(f"%{q}%"))
    ).limit(5)
    kunden = session.exec(kunden_stmt).all()
    for k in kunden:
        results.append({
            "type": "kunde",
            "id": k.id,
            "label": f"{k.vorname or ''} {k.name or ''}".strip() or f"Kunde #{k.id}",
            "subtitle": k.kundnr,
            "href": f"/stammdaten/kunden/{k.id}"
        })

    # Search Artikel
    artikel_stmt = select(Artikel).where(
        (Artikel.bezeichnung.ilike(f"%{q_lower}%")) |
        (Artikel.artnr.ilike(f"%{q}%"))
    ).limit(5)
    artikel_list = session.exec(artikel_stmt).all()
    for a in artikel_list:
        results.append({
            "type": "artikel",
            "id": a.id,
            "label": a.bezeichnung or f"Artikel #{a.id}",
            "subtitle": a.artnr,
            "href": f"/stammdaten/artikel/{a.id}"
        })

    # Search Dokumente
    dok_stmt = select(Dokument).where(
        Dokument.dokument_nr.ilike(f"%{q}%")
    ).limit(5)
    dokumente = session.exec(dok_stmt).all()
    for d in dokumente:
        typ_label = {"AN": "Angebot", "RE": "Rechnung", "LI": "Lieferschein", "GU": "Gutschrift", "MA": "Mahnung", "AU": "Auftrag", "ST": "Storno"}.get(d.typ, d.typ)
        results.append({
            "type": "dokument",
            "id": d.id,
            "label": f"{typ_label} {d.dokument_nr}",
            "subtitle": d.datum,
            "href": f"/{'angebote' if d.typ == 'AN' else 'rechnungen' if d.typ == 'RE' else 'mahnungen' if d.typ == 'MA' else 'storno'}/{d.id}"
        })

    return results

@app.get("/api/notifications")
async def get_notifications(session: Session = Depends(get_session)):
    # Get overdue invoices as notifications
    from datetime import datetime, timedelta
    from .models.dokumente import Dokument

    today = datetime.now().date()
    overdue_docs = session.exec(
        select(Dokument).where(
            Dokument.typ == "RE",
            Dokument.status != "bezahlt"
        ).order_by(Dokument.datum.desc()).limit(10)
    ).all()

    notifications = []
    for doc in overdue_docs:
        if doc.datum:
            doc_date = datetime.strptime(doc.datum, "%Y-%m-%d").date() if isinstance(doc.datum, str) else doc.datum
            days_overdue = (today - doc_date).days
            if days_overdue > 0:
                notifications.append({
                    "id": doc.id,
                    "title": f"Überfällige Rechnung",
                    "message": f"Rechnung {doc.dokument_nr} ist seit {days_overdue} Tagen überfällig",
                    "is_read": False,
                    "created_at": doc.datum,
                })

    return notifications
# Health check endpoint for Docker and monitoring
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "peters-erp-backend",
        "version": "1.0.0"
    }

# Health check endpoint for Docker and monitoring
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "peters-erp-backend",
        "version": "1.0.0"
    }

# test comment for hot reload
