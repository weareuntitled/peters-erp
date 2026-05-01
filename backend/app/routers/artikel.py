from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_, func, func
from typing import List, Optional
from ..database import get_session
from ..models import Artikel, ArtikelCreate, ArtikelRead, ArtikelUpdate
from ..models.warengruppen import Warengruppe
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams

router = APIRouter()

@router.get("/search")
async def search_artikel(
    q: str,
    limit: int = 7,
    session: Session = Depends(get_session)
):
    """Compact article search for autocomplete. Searches bezeichnung, artnr, warengruppe."""
    if not q or len(q) < 2:
        return []
    
    search_term = f"%{q}%"
    statement = (
        select(Artikel, Warengruppe)
        .join(Warengruppe, Artikel.warengruppe_id == Warengruppe.id, isouter=True)
        .where(
            (Artikel.bezeichnung.like(search_term)) |
            (Artikel.artnr.like(search_term))
        )
        .limit(limit)
    )
    results = session.exec(statement).all()
    
    return [
        {
            'id': a.id,
            'label': a.bezeichnung,
            'artnr': a.artnr,
            'warengruppe_id': wg.id if wg else None,
            'warengruppe': wg.bezeichnung if wg else '',
            'einzelpreis': float(a.vk_preis or 0),
            'type': 'artikel',
            'href': f'/stammdaten/artikel',
        }
        for a, wg in results
    ]

@router.get("/recent")
async def recent_artikel(
    limit: int = 7,
    session: Session = Depends(get_session)
):
    """Get most recently used articles (from document positions)."""
    from ..models.positionen import Position
    
    stmt = (
        select(Artikel, Warengruppe)
        .join(Position, Artikel.id == Position.artikel_id)
        .join(Warengruppe, Artikel.warengruppe_id == Warengruppe.id, isouter=True)
        .group_by(Artikel.id)
        .order_by(func.max(Position.id).desc())
        .limit(limit)
    )
    results = session.exec(stmt).all()
    
    return [
        {
            'id': a.id,
            'label': a.bezeichnung,
            'artnr': a.artnr,
            'warengruppe_id': wg.id if wg else None,
            'warengruppe': wg.bezeichnung if wg else '',
            'einzelpreis': float(a.vk_preis or 0),
            'type': 'artikel',
            'href': f'/stammdaten/artikel',
        }
        for a, wg in results
    ]

@router.get("/", response_model=PaginatedResponse[ArtikelRead])
async def read_artikel(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    artnr: Optional[str] = None,
    bezeichnung: Optional[str] = None,
    warengruppe_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    # Build query with filters + join Warengruppe for warengruppe_bezeichnung
    statement = (
        select(Artikel, Warengruppe)
        .join(Warengruppe, Artikel.warengruppe_id == Warengruppe.id, isouter=True)
    )

    # Apply filters
    filters = []
    if artnr:
        filters.append(Artikel.artnr == artnr)
    if bezeichnung:
        filters.append(Artikel.bezeichnung.like(f"%{bezeichnung}%"))
    if warengruppe_id is not None:
        filters.append(Artikel.warengruppe_id == warengruppe_id)

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
        
        if hasattr(Artikel, field_name):
            if direction == 'desc':
                statement = statement.order_by(getattr(Artikel, field_name).desc())
            else:
                statement = statement.order_by(getattr(Artikel, field_name).asc())
        else:
            # Default sorting
            statement = statement.order_by(Artikel.artnr.asc())
    else:
        # Default sorting
        statement = statement.order_by(Artikel.artnr.asc())
    
    # Apply pagination
    statement = statement.offset(pagination.skip).limit(pagination.limit)

    results = session.exec(statement).all()

    # Build response with warengruppe_bezeichnung
    artikel_items = []
    for artikel, warengruppe in results:
        item = ArtikelRead.model_validate(artikel)
        item.warengruppe_bezeichnung = warengruppe.bezeichnung if warengruppe else None
        artikel_items.append(item)

    # Get total count
    count_statement = select(Artikel)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = len(session.exec(count_statement).all())

    page = (pagination.skip // pagination.limit) + 1 if pagination.limit > 0 else 1
    pages = (total_count + pagination.limit - 1) // pagination.limit if pagination.limit > 0 else 1

    return PaginatedResponse(items=artikel_items, total=total_count, page=page, size=pagination.limit, pages=pages)

@router.get("/{artikel_id}", response_model=ArtikelRead)
async def read_artikel_by_id(artikel_id: int, session: Session = Depends(get_session)):
    statement = (
        select(Artikel, Warengruppe)
        .join(Warengruppe, Artikel.warengruppe_id == Warengruppe.id, isouter=True)
        .where(Artikel.id == artikel_id)
    )
    result = session.exec(statement).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artikel not found")
    artikel, warengruppe = result
    item = ArtikelRead.model_validate(artikel)
    item.warengruppe_bezeichnung = warengruppe.bezeichnung if warengruppe else None
    return item

@router.post("/", response_model=ArtikelRead)
async def create_artikel(artikel: ArtikelCreate, session: Session = Depends(get_session)):
    db_artikel = Artikel.from_orm(artikel)
    session.add(db_artikel)
    session.commit()
    session.refresh(db_artikel)
    return db_artikel

@router.put("/{artikel_id}", response_model=ArtikelRead)
async def update_artikel(artikel_id: int, artikel: ArtikelUpdate, session: Session = Depends(get_session)):
    db_artikel = session.get(Artikel, artikel_id)
    if not db_artikel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artikel not found")
    
    data = artikel.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_artikel, key, value)
    
    session.add(db_artikel)
    session.commit()
    session.refresh(db_artikel)
    return db_artikel

@router.delete("/{artikel_id}")
async def delete_artikel(artikel_id: int, session: Session = Depends(get_session)):
    artikel = session.get(Artikel, artikel_id)
    if not artikel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artikel not found")
    session.delete(artikel)
    session.commit()
    return {"message": "Artikel deleted successfully"}