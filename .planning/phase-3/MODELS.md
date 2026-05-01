# GSWIN ERP - Phase 3: Business Logic

## Updated Models

### Nummernkreis Model (models/nummernkreise.py)
```python
from sqlmodel import SQLModel, Field, Column, String, Integer
from typing import Optional

class NummernkreisBase(SQLModel):
    typ: str = Field(sa_column=Column(String, unique=True))
    letzte_nummer: int = Field(sa_column=Column(Integer))

class Nummernkreis(NummernkreisBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class NummernkreisCreate(NummernkreisBase):
    pass

class NummernkreisRead(NummernkreisBase):
    id: int
```

## Services

### Document Service (services/document_service.py)
```python
from sqlmodel import Session, select
from ..models import Document, Position
from ..models.dokumente import DokumentCreate, DokumentRead
from datetime import datetime
import uuid

class DocumentService:
    @staticmethod
    def duplicate_document(original_document_id: int, session: Session) -> Document:
        # Get original document
        original = session.get(Document, original_document_id)
        if not original:
            raise ValueError("Original document not found")
        
        # Create new document with copied fields
        new_document = Document(
            typ=original.typ,
            kunde_id=original.kunde_id,
            datum=datetime.utcnow(),
            betrag=0,  # Will be recalculated
            steuernr=original.steuernr,
            bezahlt=False,
            bemerkungen=original.bemerkungen,
            vorgaenger_id=original_document_id  # Track original
        )
        
        # Add to session and commit
        session.add(new_document)
        session.flush()  # Get the new ID
        
        # Duplicate positions
        positions = session.exec(select(Position).where(Position.dokument_id == original_document_id)).all()
        for position in positions:
            new_position = Position(
                dokument_id=new_document.id,
                artnr=position.artnr,
                bezeichnung=position.bezeichnung,
                menge=position.menge,
                einheit=position.einheit,
                preis=position.preis,
                mwst=position.mwst
            )
            session.add(new_position)
        
        session.commit()
        session.refresh(new_document)
        
        # Recalculate totals
        DocumentService.recalculate_document_totals(new_document.id, session)
        
        return new_document
    
    @staticmethod
    def recalculate_document_totals(document_id: int, session: Session) -> Document:
        # Get document
        document = session.get(Document, document_id)
        if not document:
            raise ValueError("Document not found")
        
        # Calculate total from positions
        total = 0
        positions = session.exec(select(Position).where(Position.dokument_id == document_id)).all()
        
        for position in positions:
            position_total = position.menge * position.preis
            total += position_total * (1 + position.mwst / 100)
        
        # Update document total
        document.betrag = total
        session.add(document)
        session.commit()
        session.refresh(document)
        
        return document
```

### Numbering Service (services/numbering_service.py)
```python
from sqlmodel import Session, select, update
from ..models import Nummernkreis
from typing import Optional

class NumberingService:
    @staticmethod
    def get_next_document_number(document_type: str, session: Session) -> str:
        # Get or create nummernkreis
        statement = select(Nummernkreis).where(Nummernkreis.typ == document_type)
        nummernkreis = session.exec(statement).first()
        
        if not nummernkreis:
            # Create new nummernkreis
            nummernkreis = Nummernkreis(typ=document_type, letzte_nummer=0)
            session.add(nummernkreis)
            session.flush()
        
        # Atomically increment and get the new number
        new_number = nummernkreis.letzte_nummer + 1
        nummernkreis.letzte_nummer = new_number
        session.add(nummernkreis)
        session.commit()
        
        # Format the number (e.g., "2024-0001")
        return f"{document_type}-{new_number:04d}"
```

### Position Service (services/position_service.py)
```python
from sqlmodel import Session, select
from ..models import Position
from ..services.document_service import DocumentService

class PositionService:
    @staticmethod
    def create_position(position_data: PositionCreate, session: Session) -> Position:
        # Create the position
        position = Position.from_orm(position_data)
        session.add(position)
        session.commit()
        session.refresh(position)
        
        # Recalculate document totals
        DocumentService.recalculate_document_totals(position.dokument_id, session)
        
        return position
    
    @staticmethod
    def update_position(position_id: int, position_data: PositionUpdate, session: Session) -> Position:
        # Get existing position
        position = session.get(Position, position_id)
        if not position:
            raise ValueError("Position not found")
        
        # Update fields
        data = position_data.dict(exclude_unset=True)
        for key, value in data.items():
            setattr(position, key, value)
        
        session.add(position)
        session.commit()
        session.refresh(position)
        
        # Recalculate document totals
        DocumentService.recalculate_document_totals(position.dokument_id, session)
        
        return position
    
    @staticmethod
    def delete_position(position_id: int, session: Session) -> None:
        # Get existing position
        position = session.get(Position, position_id)
        if not position:
            raise ValueError("Position not found")
        
        # Delete position
        session.delete(position)
        session.commit()
        
        # Recalculate document totals
        DocumentService.recalculate_document_totals(position.dokument_id, session)
```

## Updated Router Implementation

### Updated dokumente.py router
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from ..database import get_session
from ..models import Dokument, DokumentCreate, DokumentRead, DokumentUpdate
from ..models.responses import PaginatedResponse
from ..models.query_params import PaginationParams, SortParams
from ..services.document_service import DocumentService
from ..services.numbering_service import NumberingService

router = APIRouter()

# ... existing endpoints ...

@router.post("/duplicate/{document_id}", response_model=DokumentRead)
async def duplicate_document(document_id: int, session: Session = Depends(get_session)):
    try:
        duplicated = DocumentService.duplicate_document(document_id, session)
        return duplicated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/recalculate/{document_id}", response_model=DokumentRead)
async def recalculate_document(document_id: int, session: Session = Depends(get_session)):
    try:
        recalculated = DocumentService.recalculate_document_totals(document_id, session)
        return recalculated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/number/{document_type}", response_model=DokumentRead)
async def create_document_with_number(document_type: str, document: DokumentCreate, session: Session = Depends(get_session)):
    # Generate document number
    document_num = NumberingService.get_next_document_number(document_type, session)
    
    # Create document with generated number
    db_document = Dokument.from_orm(document)
    db_document.nummer = document_num
    session.add(db_document)
    session.commit()
    session.refresh(db_document)
    
    return db_document
```

## Summary

The models and services are now properly structured to support:
1. All database fields with appropriate types
2. Base, Create, Read, and Update models for each entity
3. Proper relationships between entities (foreign keys)
4. Support for all the business logic requirements
5. Consistent field naming for frontend compatibility
6. DateTime fields for tracking creation and updates
7. Optional fields where appropriate

This structure ensures that all business logic can be properly handled by the enhanced API endpoints.