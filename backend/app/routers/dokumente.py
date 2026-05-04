from ..services.document_renderer import document_renderer
from ..services.document_service import document_service
from ..services.email_service import email_service
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel
from sqlmodel import Session, select, and_
from typing import List, Optional
from ..database import get_session
from ..models import Dokument, DokumentCreate, DokumentRead, DokumentUpdate, Kunde
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams
from ..services.date_correction import correct_document_dict

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[DokumentRead])
async def read_dokumente(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    typ: Optional[str] = None,
    kunde_id: Optional[int] = None,
    dokument_nr: Optional[str] = None,
    kopftext: Optional[str] = None,
    bemerkung: Optional[str] = None,
    session: Session = Depends(get_session)
):
    # Build query with filters
    statement = select(Dokument)

    # Apply filters
    filters = []
    if typ:
        filters.append(Dokument.typ == typ)
    if kunde_id:
        filters.append(Dokument.kunde_id == kunde_id)
    if dokument_nr:
        filters.append(Dokument.dokument_nr.like(f"%{dokument_nr}%"))
    if kopftext:
        filters.append(Dokument.kopftext.like(f"%{kopftext}%"))
    if bemerkung:
        filters.append(Dokument.bemerkung.like(f"%{bemerkung}%"))
    
    if filters:
        statement = statement.where(and_(*filters))
    
    # Apply sorting
    if sort.sort:
        if sort.sort.startswith('-'):
            field_name = sort.sort[1:]
            direction = 'desc'
        else:
            field_name = sort.sort
            direction = 'asc'
        
        if hasattr(Dokument, field_name):
            if direction == 'desc':
                statement = statement.order_by(getattr(Dokument, field_name).desc())
            else:
                statement = statement.order_by(getattr(Dokument, field_name).asc())
        else:
            # Default sorting
            statement = statement.order_by(Dokument.datum.desc())
    else:
        # Default sorting
        statement = statement.order_by(Dokument.datum.desc())
    
    # Apply pagination
    statement = statement.offset(pagination.skip).limit(pagination.limit)
    
    dokumente = session.exec(statement).all()
    
    # Enrich with kunde_name and correct dates
    result_items = []
    for doc in dokumente:
        doc_dict = correct_document_dict(doc.model_dump())
        kunde = session.get(Kunde, doc.kunde_id)
        if kunde:
            parts = [p for p in [kunde.vorname, kunde.name] if p]
            doc_dict['kunde_name'] = " ".join(parts) if parts else None
        result_items.append(DokumentRead(**doc_dict))
    
    # Get total count
    count_statement = select(Dokument)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).all().__len__()

    page = (pagination.skip // pagination.limit) + 1 if pagination.limit > 0 else 1
    pages = (total_count + pagination.limit - 1) // pagination.limit if pagination.limit > 0 else 1

    return PaginatedResponse(items=result_items, total=total_count, page=page, size=pagination.limit, pages=pages)

@router.get("/{dokument_id}", response_model=DokumentRead)
async def read_dokument(dokument_id: int, session: Session = Depends(get_session)):
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
        
    doc_dict = correct_document_dict(dokument.model_dump())
    kunde = session.get(Kunde, dokument.kunde_id)
    if kunde:
        parts = [p for p in [kunde.vorname, kunde.name] if p]
        doc_dict['kunde_name'] = " ".join(parts) if parts else None
    return DokumentRead(**doc_dict)

@router.post("/", response_model=DokumentRead)
async def create_dokument(dokument: DokumentCreate, session: Session = Depends(get_session)):
    db_dokument = document_service.create_document(dokument, session)
    doc_dict = correct_document_dict(db_dokument.model_dump())
    
    # Fill in kunde_name for response
    if db_dokument.kunde_id:
        kunde = session.get(Kunde, db_dokument.kunde_id)
        if kunde:
            parts = [p for p in [kunde.vorname, kunde.name] if p]
            doc_dict['kunde_name'] = " ".join(parts) if parts else None
            
    return DokumentRead(**doc_dict)

@router.post("/preview", response_class=HTMLResponse)
async def preview_dokument(
    preview_data: dict,
    session: Session = Depends(get_session),
):
    html = document_renderer.render_preview_html(preview_data, session)
    if not html:
        raise HTTPException(status_code=500, detail="Error generating preview HTML")
    return HTMLResponse(content=html)

@router.post("/{dokument_id}/word")
async def export_word(
    dokument_id: int,
    session: Session = Depends(get_session),
):
    """
    Export document as Word (.doc) file.
    Uses HTML rendered output saved with .doc extension — Word opens this natively.
    """
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    html = document_renderer.render_saved_html(dokument_id, session)
    if not html:
        raise HTTPException(status_code=500, detail="Fehler bei der HTML-Generierung")

    doc_type = dokument.typ or 'RE'
    doc_nr = dokument.dokument_nr or str(dokument_id)
    filename = f"{doc_type}_{doc_nr}.doc"

    return Response(
        content=html,
        media_type='application/msword',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )

class EmailPayload(BaseModel):
    empfaenger: str
    betreff: str
    nachricht: str
    als_pdf: bool = True
    als_word: bool = False

@router.post("/{dokument_id}/send")
async def send_dokument(
    dokument_id: int,
    payload: EmailPayload,
    session: Session = Depends(get_session),
):
    """
    Send document via email with PDF or Word attachment.
    SMTP settings are read from environment variables.
    """
    import os
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.base import MIMEBase
    from email import encoders
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    SMTP_HOST = os.getenv('SMTP_HOST', '')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SMTP_FROM = os.getenv('SMTP_FROM', SMTP_USER)

    if not SMTP_HOST or not SMTP_USER:
        raise HTTPException(status_code=500, detail="SMTP nicht konfiguriert. Bitte .env Datei prüfen.")

    
    msg = MIMEMultipart()
    msg['From'] = SMTP_FROM
    msg['To'] = payload.empfaenger
    msg['Subject'] = payload.betreff

    kunde = session.get(Kunde, dokument.kunde_id) if dokument.kunde_id else None
    kunde_name = " ".join(filter(None, [kunde.vorname, kunde.name])) if kunde else "Kunde"
    doc_typ_label = "Angebot" if dokument.typ == 'AN' else "Rechnung"
    doc_nr = dokument.dokument_nr or str(dokument_id)

    body = f"""Sehr geehrte/r {kunde_name},

{payload.nachricht}

Mit freundlichen Grüßen
Peters GmbH"""

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    if payload.als_pdf:
        pdf_bytes = document_renderer.render_saved_pdf(dokument_id, session)
        if pdf_bytes:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(pdf_bytes)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{doc_typ_label}_{doc_nr}.pdf"')
            msg.attach(part)

    if payload.als_word:
        html = document_renderer.render_saved_html(dokument_id, session)
        if html:
            part = MIMEBase('application', 'msword')
            part.set_payload(html.encode('utf-8'))
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{doc_typ_label}_{doc_nr}.doc"')
            msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"E-Mail konnte nicht gesendet werden: {str(e)}")

    dokument.gemailt = 1
    dokument.status = 'verschickt'
    session.add(dokument)
    session.commit()

    return {"message": "E-Mail gesendet", "empfaenger": payload.empfaenger}
async def convert_dokument(dokument_id: int, new_typ: str, session: Session = Depends(get_session)):
    from ..services.document_service import document_service
    
    # Load source to check if it's already storniert or something
    source = session.get(Dokument, dokument_id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")

    new_doc = document_service.duplicate_document(dokument_id, new_typ, session)
    if not new_doc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to duplicate document")
    
    # If we are creating a Storno, mark the original as storniert
    if new_typ == 'ST':
        source.status = 'storniert'
        source.storniert = 1
        session.add(source)
        session.commit()
    
    doc_dict = correct_document_dict(new_doc.model_dump())
    kunde = session.get(Kunde, new_doc.kunde_id)
    if kunde:
        parts = [p for p in [kunde.vorname, kunde.name] if p]
        doc_dict['kunde_name'] = " ".join(parts) if parts else None
    
    return DokumentRead(**doc_dict)

@router.put("/{dokument_id}", response_model=DokumentRead)
async def update_dokument(dokument_id: int, dokument: DokumentUpdate, session: Session = Depends(get_session)):
    db_dokument = session.get(Dokument, dokument_id)
    if not db_dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
    
    data = dokument.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_dokument, key, value)
    
    session.add(db_dokument)
    session.commit()
    session.refresh(db_dokument)
    
    doc_dict = correct_document_dict(db_dokument.model_dump())
    kunde = session.get(Kunde, db_dokument.kunde_id)
    if kunde:
        parts = [p for p in [kunde.vorname, kunde.name] if p]
        doc_dict['kunde_name'] = " ".join(parts) if parts else None
    return DokumentRead(**doc_dict)

@router.delete("/{dokument_id}")
async def delete_dokument(dokument_id: int, session: Session = Depends(get_session)):
    from ..models.positionen import Position
    from sqlmodel import select
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
        
    # Delete positions manually since SQLite foreign keys might be off
    positions = session.exec(select(Position).where(Position.dokument_id == dokument_id)).all()
    for p in positions:
        session.delete(p)
        
    session.delete(dokument)
    session.commit()
    return {"message": "Dokument deleted successfully"}

@router.put("/{dokument_id}/status")
async def update_dokument_status(
    dokument_id: int,
    status: str,
    session: Session = Depends(get_session)
):
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
    dokument.status = status
    session.add(dokument)
    session.commit()
    return {"message": "Status updated", "status": status}


@router.get("/{dokument_id}/pdf")
async def generate_pdf(
    dokument_id: int,
    session: Session = Depends(get_session),
):
    """
    Generate PDF for a document.
    """
    
    pdf_bytes = document_renderer.render_saved_pdf(dokument_id, session)

    if pdf_bytes is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dokument mit ID {dokument_id} nicht gefunden",
        )
    dokument = session.get(Dokument, dokument_id)
    doc_nr = dokument.dokument_nr if dokument else str(dokument_id)
    doc_type = dokument.typ if dokument else "DOC"
    filename = f"{doc_type}_{doc_nr}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"'
        }
    )
    dokument = session.get(Dokument, dokument_id)
    doc_nr = dokument.dokument_nr if dokument else str(dokument_id)
    doc_type = dokument.typ if dokument else "DOC"
    filename = f"{doc_type}_{doc_nr}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{dokument_id}/render", response_class=HTMLResponse)
async def render_document_html(
    dokument_id: int,
    session: Session = Depends(get_session),
):
    html = document_renderer.render_saved_html(dokument_id, session)
    if not html:
        raise HTTPException(status_code=404, detail="Could not render HTML")
    return HTMLResponse(content=html)


TYP_LABELS = {
    'AN': 'Angebot',
    'RE': 'Rechnung',
    'LI': 'Lieferschein',
    'GU': 'Gutschrift',
    'MA': 'Mahnung',
    'AU': 'Auftrag',
    'ST': 'Stornierung',
}


@router.get("/search")
async def search_dokumente(
    q: str,
    limit: int = 7,
    session: Session = Depends(get_session)
):
    if not q or len(q) < 2:
        return []

    search_term = f"%{q}%"
    statement = (
        select(Dokument)
        .where(
            (Dokument.dokument_nr.like(search_term)) |
            (Dokument.kopftext.like(search_term)) |
            (Dokument.bemerkung.like(search_term)) |
            (Dokument.auftragsbezeichnung.like(search_term))
        )
        .limit(limit)
    )
    results = session.exec(statement).all()

    def get_doc_href(dokument):
        hrefs = {
            'RE': f'/rechnungen/{dokument.id}',
            'AN': f'/angebote/{dokument.id}',
            'MA': f'/mahnungen/{dokument.id}',
            'ST': f'/storno/{dokument.id}',
        }
        return hrefs.get(dokument.typ, f'/angebote/{dokument.id}')

    return [
        {
            'id': d.id,
            'label': d.dokument_nr,
            'subtitle': f"{TYP_LABELS.get(d.typ, d.typ)}  {d.datum or '?\"'}",
            'type': 'dokument',
            'href': get_doc_href(d),
        }
        for d in results
    ]
