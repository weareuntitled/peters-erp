from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from ..database import get_session
from ..models.positionen import Position, PositionCreate, PositionRead, PositionUpdate
from ..models.dokumente import Dokument

router = APIRouter(tags=["positionen"])

@router.get("/", response_model=List[PositionRead])
async def read_positionen(
    dokument_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """Get all positions, optionally filtered by dokument_id."""
    statement = select(Position)
    if dokument_id:
        statement = statement.where(Position.dokument_id == dokument_id)
    return session.exec(statement).all()

@router.get("/{position_id}", response_model=PositionRead)
async def read_position(position_id: int, session: Session = Depends(get_session)):
    position = session.get(Position, position_id)
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    return position

@router.post("/", response_model=PositionRead)
async def create_position(position: PositionCreate, session: Session = Depends(get_session)):
    """Create a new line item for a document."""
    # Verify document exists
    dokument = session.get(Dokument, position.dokument_id)
    if not dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
    
    db_position = Position.from_orm(position)
    session.add(db_position)
    session.commit()
    session.refresh(db_position)
    
    # Recalculate document totals
    _recalculate_dokument(session, position.dokument_id)
    
    return db_position

@router.put("/{position_id}", response_model=PositionRead)
async def update_position(
    position_id: int,
    position: PositionUpdate,
    session: Session = Depends(get_session)
):
    db_position = session.get(Position, position_id)
    if not db_position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    data = position.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(db_position, key, value)
    
    session.add(db_position)
    session.commit()
    session.refresh(db_position)
    
    # Recalculate document totals
    _recalculate_dokument(session, db_position.dokument_id)
    
    return db_position

@router.delete("/{position_id}")
async def delete_position(position_id: int, session: Session = Depends(get_session)):
    position = session.get(Position, position_id)
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    
    dokument_id = position.dokument_id
    session.delete(position)
    session.commit()
    
    # Recalculate document totals
    _recalculate_dokument(session, dokument_id)
    
    return {"message": "Position deleted successfully"}

def _recalculate_dokument(session: Session, dokument_id: int):
    """Recalculate netto and brutto amounts for a document based on its positions."""
    positions = session.exec(
        select(Position).where(Position.dokument_id == dokument_id)
    ).all()
    
    netto = sum(float(p.gesamtpreis or 0) for p in positions)
    brutto = netto * 1.19  # 19% MwSt
    
    dokument = session.get(Dokument, dokument_id)
    if dokument:
        dokument.betrag_netto = str(round(netto, 2))
        dokument.betrag_brutto = str(round(brutto, 2))
        session.add(dokument)
        session.commit()
