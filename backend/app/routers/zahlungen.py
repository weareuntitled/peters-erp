from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_, func
from typing import List, Optional
from ..database import get_session
from ..models import Zahlung, ZahlungCreate, ZahlungRead, ZahlungUpdate
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[ZahlungRead])
async def read_zahlungen(
    pagination: PaginationParams = Depends(),
    sort: SortParams = Depends(),
    dokument_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    # Build query with filters
    statement = select(Zahlung)
    
    # Apply filters
    filters = []
    if dokument_id:
        filters.append(Zahlung.dokument_id == dokument_id)
    
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
        
        if hasattr(Zahlung, field_name):
            if direction == 'desc':
                statement = statement.order_by(getattr(Zahlung, field_name).desc())
            else:
                statement = statement.order_by(getattr(Zahlung, field_name).asc())
        else:
            # Default sorting
            statement = statement.order_by(Zahlung.datum.desc())
    else:
        # Default sorting
        statement = statement.order_by(Zahlung.datum.desc())
    
    # Apply pagination
    statement = statement.offset(pagination.skip).limit(pagination.limit)
    
    zahlungen = session.exec(statement).all()
    
    # Get total count
    count_statement = select(func.count(Zahlung.id))
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = int(session.exec(count_statement).one() or 0)

    page = (pagination.skip // pagination.limit) + 1 if pagination.limit > 0 else 1
    pages = (total_count + pagination.limit - 1) // pagination.limit if pagination.limit > 0 else 1

    return PaginatedResponse(items=zahlungen, total=total_count, page=page, size=pagination.limit, pages=pages)

@router.get("/{zahlung_id}", response_model=ZahlungRead)
async def read_zahlung(zahlung_id: int, session: Session = Depends(get_session)):
    zahlung = session.get(Zahlung, zahlung_id)
    if not zahlung:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zahlung not found")
    return zahlung

@router.post("/", response_model=ZahlungRead)
async def create_zahlung(zahlung: ZahlungCreate, session: Session = Depends(get_session)):
    db_zahlung = Zahlung.from_orm(zahlung)
    session.add(db_zahlung)
    session.commit()
    session.refresh(db_zahlung)
    return db_zahlung

@router.put("/{zahlung_id}", response_model=ZahlungRead)
async def update_zahlung(zahlung_id: int, zahlung: ZahlungUpdate, session: Session = Depends(get_session)):
    db_zahlung = session.get(Zahlung, zahlung_id)
    if not db_zahlung:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zahlung not found")
    
    data = zahlung.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_zahlung, key, value)
    
    session.add(db_zahlung)
    session.commit()
    session.refresh(db_zahlung)
    return db_zahlung

@router.delete("/{zahlung_id}")
async def delete_zahlung(zahlung_id: int, session: Session = Depends(get_session)):
    zahlung = session.get(Zahlung, zahlung_id)
    if not zahlung:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zahlung not found")
    session.delete(zahlung)
    session.commit()
    return {"message": "Zahlung deleted successfully"}
