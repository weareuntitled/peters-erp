from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlmodel import Session, select, and_, func
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_session
from ..models import Vorlage, VorlageCreate, VorlageRead, VorlageUpdate
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams
try:
    from ..services.pdf_service import pdf_service
except (ImportError, OSError):
    pdf_service = None

router = APIRouter()

class PreviewRenderRequest(BaseModel):
    html_content: str
    typ: str = 'AN'
    dokument_nr: str = 'VORSCHAU-001'
    datum: str = ''
    kopftext: str = ''
    fusstext: str = ''
    kunde_name: str = ''
    kunde_strasse: str = ''
    kunde_plz_ort: str = ''
    kundnr: str = ''
    positionen: List[dict] = []
    betrag_netto: float = 0
    betrag_brutto: float = 0

@router.get("/", response_model=PaginatedResponse[VorlageRead])
async def read_vorlagen(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    typ: Optional[str] = None,
    session: Session = Depends(get_session)
):
    statement = select(Vorlage)

    filters = []
    if typ:
        filters.append(Vorlage.typ == typ)

    if filters:
        statement = statement.where(and_(*filters))

    if sort.sort:
        if sort.sort.startswith('-'):
            field_name = sort.sort[1:]
            direction = 'desc'
        else:
            field_name = sort.sort
            direction = 'asc'

        if hasattr(Vorlage, field_name):
            if direction == 'desc':
                statement = statement.order_by(getattr(Vorlage, field_name).desc())
            else:
                statement = statement.order_by(getattr(Vorlage, field_name).asc())
    else:
        statement = statement.order_by(Vorlage.name.asc())

    statement = statement.offset(pagination.skip).limit(pagination.limit)

    vorlagen = session.exec(statement).all()

    count_statement = select(func.count(Vorlage.id))
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = int(session.exec(count_statement).one() or 0)

    page = (pagination.skip // pagination.limit) + 1 if pagination.limit > 0 else 1
    pages = (total_count + pagination.limit - 1) // pagination.limit if pagination.limit > 0 else 1

    return PaginatedResponse(items=vorlagen, total=total_count, page=page, size=pagination.limit, pages=pages)

@router.get("/{vorlage_id}", response_model=VorlageRead)
async def read_vorlage(vorlage_id: int, session: Session = Depends(get_session)):
    vorlage = session.get(Vorlage, vorlage_id)
    if not vorlage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vorlage not found")
    return vorlage

@router.post("/", response_model=VorlageRead)
async def create_vorlage(vorlage: VorlageCreate, session: Session = Depends(get_session)):
    db_vorlage = Vorlage.from_orm(vorlage)
    session.add(db_vorlage)
    session.commit()
    session.refresh(db_vorlage)
    return db_vorlage

@router.put("/{vorlage_id}", response_model=VorlageRead)
async def update_vorlage(vorlage_id: int, vorlage: VorlageUpdate, session: Session = Depends(get_session)):
    db_vorlage = session.get(Vorlage, vorlage_id)
    if not db_vorlage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vorlage not found")

    data = vorlage.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_vorlage, key, value)

    session.add(db_vorlage)
    session.commit()
    session.refresh(db_vorlage)
    return db_vorlage

@router.delete("/{vorlage_id}")
async def delete_vorlage(vorlage_id: int, session: Session = Depends(get_session)):
    vorlage = session.get(Vorlage, vorlage_id)
    if not vorlage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vorlage not found")
    session.delete(vorlage)
    session.commit()
    return {"message": "Vorlage deleted successfully"}

@router.put("/{vorlage_id}/set-standard")
async def set_standard_vorlage(vorlage_id: int, session: Session = Depends(get_session)):
    vorlage = session.get(Vorlage, vorlage_id)
    if not vorlage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vorlage not found")

    session.exec(
        select(Vorlage)
        .where(Vorlage.typ == vorlage.typ)
        .where(Vorlage.aktiv == 1)
    ).all()

    for v in session.exec(
        select(Vorlage)
        .where(Vorlage.typ == vorlage.typ)
        .where(Vorlage.aktiv == 1)
        .where(Vorlage.ist_standard == 1)
    ).all():
        v.ist_standard = 0
        session.add(v)

    vorlage.ist_standard = 1
    session.add(vorlage)
    session.commit()
    return {"message": "Standard set", "id": vorlage_id}

@router.post("/{vorlage_id}/init-template")
async def init_vorlage_template(vorlage_id: int, session: Session = Depends(get_session)):
    """
    Load the disk template, flatten {% extends %}, and save to html_content.
    This enables the Vorlage to be edited in the template editor UI.
    """
    if not pdf_service:
        raise HTTPException(status_code=500, detail="PDF service not available")

    vorlage = session.get(Vorlage, vorlage_id)
    if not vorlage:
        raise HTTPException(status_code=404, detail="Vorlage not found")

    template_name = vorlage.template_datei
    if not template_name:
        templates_by_typ = {
            "RE": "rechnung.html",
            "AN": "angebot.html",
            "GU": "rechnung.html",
            "LI": "rechnung.html",
            "AB": "angebot.html",
            "MA": "rechnung.html",
            "ST": "rechnung.html",
        }
        template_name = templates_by_typ.get(vorlage.typ, "rechnung.html")

    flattened = pdf_service.flatten_template(template_name)
    if flattened is None:
        raise HTTPException(status_code=500, detail="Template file not found on disk")

    vorlage.html_content = flattened
    session.add(vorlage)
    session.commit()
    session.refresh(vorlage)
    return {"message": "Template initialized", "html_content_length": len(flattened)}

@router.get("/{vorlage_id}/document-count")
async def get_vorlage_document_count(vorlage_id: int, session: Session = Depends(get_session)):
    from sqlmodel import func
    from ..models.dokumente import Dokument

    vorlage = session.get(Vorlage, vorlage_id)
    if not vorlage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vorlage not found")

    count = session.exec(
        select(func.count(Dokument.id))
        .where(Dokument.vorlage_id == vorlage_id)
    ).first() or 0

    return {"count": count}

@router.post("/preview/render", response_class=HTMLResponse)
async def render_vorlage_preview(
    data: PreviewRenderRequest,
    session: Session = Depends(get_session),
):
    """
    Render a Vorlage html_content with sample document data for preview.
    Used by TemplateEditorPage to preview actual template rendering.
    """
    try:
        from ..services.formatting import format_currency, format_mwst_rate
        from ..services.pdf_data import get_company_info, format_currency_with_unit

        company_info = get_company_info(session)
        mwst = data.betrag_brutto - data.betrag_netto

        pdf_data = {
            "document": {
                "id": 0,
                "typ": data.typ,
                "dokument_nr": data.dokument_nr,
                "datum": data.datum,
                "liefertermin": None,
                "betrag_netto": float(data.betrag_netto or 0),
                "betrag_brutto": float(data.betrag_brutto or 0),
                "kopftext": data.kopftext,
                "fusstext": data.fusstext,
                "bemerkung": None,
                "status": 'entwurf',
            },
            "kunde": {
                "name": data.kunde_name or "Max Mustermann",
                "vorname": None,
                "name": data.kunde_name or "Mustermann",
                "strasse": data.kunde_strasse or "Musterstraße 123",
                "plz": data.kunde_plz_ort.split()[0] if data.kunde_plz_ort else "80331",
                "ort": " ".join(data.kunde_plz_ort.split()[1:]) if data.kunde_plz_ort else "München",
                "land": "Deutschland",
                "kundnr": data.kundnr or "10019",
            },
            "vorlage": {
                "name": None,
                "kopftext": data.kopftext,
                "fusstext": data.fusstext,
                "mit_zwischensumme": 0,
                "mit_einzelpreisen": 1,
                "mit_positionsnummern": 1,
            },
            "positionen": [
                {
                    "pos": i + 1,
                    "bezeichnung": pos.get('bezeichnung', ''),
                    "menge": float(pos.get('menge', 1)),
                    "einheit": pos.get('einheit', 'Stk'),
                    "einzelpreis": float(pos.get('einzelpreis', 0)),
                    "einzelpreis_formatted": format_currency_with_unit(float(pos.get('einzelpreis', 0)), pos.get('einheit', 'Stk')),
                    "gesamtpreis": float(pos.get('gesamtspreis', pos.get('einzelpreis', 0))),
                    "gesamtpreis_formatted": format_currency(float(pos.get('gesamtspreis', pos.get('einzelpreis', 0)))),
                    "warengruppe_id": None,
                    "warengruppe_name": 'Sonstige',
                }
                for i, pos in enumerate(data.positionen)
            ],
            "grouped_positionen": None,
            "totals": {
                "subtotal": float(data.betrag_netto or 0),
                "subtotal_formatted": format_currency(float(data.betrag_netto or 0)),
                "mwst_rate": 19.0,
                "mwst_rate_formatted": format_mwst_rate(19.0),
                "mwst_betrag": float(mwst or 0),
                "mwst_betrag_formatted": format_currency(float(mwst or 0)),
                "total": float(data.betrag_brutto or 0),
                "total_formatted": format_currency(float(data.betrag_brutto or 0)),
            },
            "company": company_info,
            "meta": {
                "title": "Angebot" if data.typ == 'AN' else "Rechnung",
                "number": data.dokument_nr,
                "datum_formatted": data.datum,
                "liefertermin_formatted": None,
                "typ": data.typ,
            },
        }

        from jinja2 import Template
        template = Template(data.html_content)
        html = template.render(**pdf_data)
        
        from ..services.pdf_service import pdf_service
        if pdf_service:
            html = pdf_service._inline_css(html)
            
        return HTMLResponse(content=html)
    except Exception as e:
        return HTMLResponse(content=f"<html><body><p>Render error: {str(e)}</p></body></html>", status_code=500)
