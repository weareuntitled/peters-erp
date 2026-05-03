import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlmodel import Session, select
from ..database import get_session
from ..models.firmen_einstellungen import FirmenEinstellungen, FirmenEinstellungenRead, FirmenEinstellungenUpdate

router = APIRouter(tags=["Firmen-Einstellungen"])

UPLOAD_DIR = Path("app/static/logos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".bmp", ".tif", ".tiff", ".avif", ".ico"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

@router.get("/", response_model=FirmenEinstellungenRead)
async def read_settings(session: Session = Depends(get_session)):
    """Get the company settings. Creates them with defaults if not exist."""
    settings = session.get(FirmenEinstellungen, 1)
    if not settings:
        settings = FirmenEinstellungen(id=1)
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings

@router.put("/", response_model=FirmenEinstellungenRead)
async def update_settings(
    settings_update: FirmenEinstellungenUpdate,
    session: Session = Depends(get_session)
):
    """Update company settings."""
    db_settings = session.get(FirmenEinstellungen, 1)
    if not db_settings:
        db_settings = FirmenEinstellungen(id=1)
        session.add(db_settings)
    
    data = settings_update.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_settings, key, value)
    
    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)
    return db_settings

@router.post("/logo", response_model=FirmenEinstellungenRead)
async def upload_logo(
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """Upload a company logo."""
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ungültiges Dateiformat. Erlaubt sind: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check if settings exist
    db_settings = session.get(FirmenEinstellungen, 1)
    if not db_settings:
        db_settings = FirmenEinstellungen(id=1)
        session.add(db_settings)

    # Save file
    filename = f"logo{ext}"
    file_path = UPLOAD_DIR / filename
    
    # Simple file size check (approximate via read)
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Datei zu groß. Maximal 2MB erlaubt."
        )
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Update DB
    db_settings.logo_pfad = f"/static/logos/{filename}"
    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)
    
    return db_settings

@router.delete("/logo", response_model=FirmenEinstellungenRead)
async def delete_logo(session: Session = Depends(get_session)):
    """Delete the company logo."""
    db_settings = session.get(FirmenEinstellungen, 1)
    if not db_settings:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Einstellungen nicht gefunden")
    
    if db_settings.logo_pfad:
        # Delete file if exists
        file_path = Path("app") / db_settings.logo_pfad.lstrip("/")
        if file_path.exists():
            file_path.unlink()
        
        db_settings.logo_pfad = None
        session.add(db_settings)
        session.commit()
        session.refresh(db_settings)
    
    return db_settings


from pydantic import BaseModel
class TestEmailRequest(BaseModel):
    email: str

@router.post("/test-smtp")
async def test_smtp_connection(req: TestEmailRequest):
    try:
        from ..services.email_service import email_service
        if not email_service.is_configured():
            raise HTTPException(status_code=400, detail="SMTP-Server ist nicht in den Umgebungsvariablen konfiguriert (.env)")
        
        email_service.send_email_with_attachment(
            to_address=req.email,
            subject="GSWIN-ERP Test-E-Mail",
            message="Dies ist eine Test-E-Mail aus dem GSWIN-ERP System zur Verifikation der SMTP-Einstellungen.",
            attachment_bytes=b"Dies ist ein Test-Anhang.",
            filename="test.txt"
        )
        return {"message": "Test erfolgreich."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
