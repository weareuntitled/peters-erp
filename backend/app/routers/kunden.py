from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel import Session, select, and_, func
from typing import List, Optional
from ..database import get_session
from ..models import Kunde, KundeCreate, KundeRead, KundeUpdate
from ..models.dokumente import Dokument
from ..models.positionen import Position
from ..models.artikel import Artikel
from ..models.warengruppen import Warengruppe
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[KundeRead])
async def read_kunden(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    kundnr: Optional[str] = None,
    name: Optional[str] = None,
    session: Session = Depends(get_session)
):
    statement = select(Kunde)
    
    filters = []
    if kundnr:
        filters.append(Kunde.kundnr == kundnr)
    if name:
        filters.append(Kunde.name.like(f"%{name}%"))
    
    if filters:
        statement = statement.where(and_(*filters))
    
    if sort.sort:
        if sort.sort.startswith('-'):
            field_name = sort.sort[1:]
            direction = 'desc'
        else:
            field_name = sort.sort
            direction = 'asc'
        
        if hasattr(Kunde, field_name):
            if direction == 'desc':
                statement = statement.order_by(getattr(Kunde, field_name).desc())
            else:
                statement = statement.order_by(getattr(Kunde, field_name).asc())
        else:
            statement = statement.order_by(Kunde.name.asc())
    else:
        statement = statement.order_by(Kunde.name.asc())
    
    statement = statement.offset(pagination.skip).limit(pagination.limit)

    kunden = session.exec(statement).all()

    count_statement = select(Kunde)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).all().__len__()

    page = (pagination.skip // pagination.limit) + 1 if pagination.limit > 0 else 1
    pages = (total_count + pagination.limit - 1) // pagination.limit if pagination.limit > 0 else 1

    return PaginatedResponse(items=kunden, total=total_count, page=page, size=pagination.limit, pages=pages)

@router.get("/search")
async def search_kunden(
    q: str,
    limit: int = 7,
    session: Session = Depends(get_session)
):
    """Compact customer search for autocomplete. Searches name, kundnr, ort."""
    if not q or len(q) < 2:
        return []
    
    search_term = f"%{q}%"
    statement = (
        select(Kunde)
        .where(
            (Kunde.name.like(search_term)) |
            (Kunde.kundnr.like(search_term)) |
            (Kunde.ort.like(search_term)) |
            (Kunde.vorname.like(search_term))
        )
        .limit(limit)
    )
    results = session.exec(statement).all()
    
    return [
        {
            'id': k.id,
            'label': k.name or f"{k.vorname} {k.name}",
            'kundnr': k.kundnr,
            'ort': k.ort,
            'type': 'kunde',
            'href': f'/stammdaten/kunden/{k.id}',
        }
        for k in results
    ]

@router.get("/recent")
async def recent_kunden(
    limit: int = 7,
    session: Session = Depends(get_session)
):
    """Get most recently used customers (by latest dokumente)."""
    stmt = (
        select(Kunde, func.max(Dokument.erstellt_am).label('last_used'))
        .join(Dokument, Kunde.id == Dokument.kunde_id)
        .group_by(Kunde.id)
        .order_by(func.max(Dokument.erstellt_am).desc())
        .limit(limit)
    )
    results = session.exec(stmt).all()
    
    return [
        {
            'id': k.id,
            'label': k.name or f"{k.vorname} {k.name}",
            'kundnr': k.kundnr,
            'ort': k.ort,
            'type': 'kunde',
            'href': f'/stammdaten/kunden/{k.id}',
        }
        for k, _ in results
    ]

@router.get("/{kunde_id}", response_model=KundeRead)
async def read_kunde(kunde_id: int, session: Session = Depends(get_session)):
    kunde = session.get(Kunde, kunde_id)
    if not kunde:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde not found")
    return kunde

@router.post("/", response_model=KundeRead)
async def create_kunde(kunde: KundeCreate, session: Session = Depends(get_session)):
    db_kunde = Kunde.from_orm(kunde)
    session.add(db_kunde)
    session.commit()
    session.refresh(db_kunde)
    return db_kunde

@router.put("/{kunde_id}", response_model=KundeRead)
async def update_kunde(kunde_id: int, kunde: KundeUpdate, session: Session = Depends(get_session)):
    db_kunde = session.get(Kunde, kunde_id)
    if not db_kunde:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde not found")
    
    data = kunde.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_kunde, key, value)
    
    session.add(db_kunde)
    session.commit()
    session.refresh(db_kunde)
    return db_kunde

@router.delete("/{kunde_id}")
async def delete_kunde(kunde_id: int, session: Session = Depends(get_session)):
    kunde = session.get(Kunde, kunde_id)
    if not kunde:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde not found")
    session.delete(kunde)
    session.commit()
    return {"message": "Kunde deleted successfully"}

@router.get("/{kunde_id}/statistik")
async def get_kunde_statistik(kunde_id: int, session: Session = Depends(get_session)):
    """Get aggregated statistics for a customer: umsatz by year, documents, products."""
    kunde = session.get(Kunde, kunde_id)
    if not kunde:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde not found")

    dokumente_stmt = select(Dokument).where(Dokument.kunde_id == kunde_id)
    dokumente = session.exec(dokumente_stmt).all()

    umsatz_by_year = {}
    total_umsatz = 0.0
    for doc in dokumente:
        if doc.datum and doc.betrag_brutto:
            try:
                year = doc.datum[:4]
                if year not in umsatz_by_year:
                    umsatz_by_year[year] = 0.0
                umsatz_by_year[year] += float(doc.betrag_brutto)
                total_umsatz += float(doc.betrag_brutto)
            except (ValueError, TypeError):
                pass

    doc_counts = {}
    for doc in dokumente:
        typ = doc.typ or 'UNKNOWN'
        doc_counts[typ] = doc_counts.get(typ, 0) + 1

    doc_ids = [doc.id for doc in dokumente]
    if doc_ids:
        positions_stmt = select(Position, Artikel, Warengruppe).join(
            Artikel, Position.artikel_id == Artikel.id, isouter=True
        ).join(
            Warengruppe, Position.warengruppe_id == Warengruppe.id, isouter=True
        ).where(Position.dokument_id.in_(doc_ids))
        positions = session.exec(positions_stmt).all()
    else:
        positions = []

    produkte_by_warengruppe = {}
    for pos, artikel, warengruppe in positions:
        wg_name = warengruppe.bezeichnung if warengruppe else 'Sonstiges'
        if wg_name not in produkte_by_warengruppe:
            produkte_by_warengruppe[wg_name] = {
                'count': 0,
                'menge': 0.0,
                'umsatz': 0.0,
            }
        produkte_by_warengruppe[wg_name]['count'] += 1
        produkte_by_warengruppe[wg_name]['menge'] += float(pos.menge or 0)
        produkte_by_warengruppe[wg_name]['umsatz'] += float(pos.gesamtpreis or 0)

    top_produkte = []
    for pos, artikel, warengruppe in positions:
        if artikel:
            top_produkte.append({
                'artikel_id': artikel.id,
                'artnr': artikel.artnr,
                'bezeichnung': artikel.bezeichnung,
                'menge': float(pos.menge or 0),
                'gesamtpreis': float(pos.gesamtpreis or 0),
            })

    return {
        'kunde_id': kunde_id,
        'total_umsatz': total_umsatz,
        'umsatz_by_year': dict(sorted(umsatz_by_year.items(), reverse=True)),
        'doc_counts': doc_counts,
        'total_documents': len(dokumente),
        'produkte_by_warengruppe': produkte_by_warengruppe,
        'top_produkte': top_produkte[:20],
    }
