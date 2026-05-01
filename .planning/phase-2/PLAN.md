# GSWIN ERP - Phase 2: CRUD API

## Plan

### Task 1: Enhanced API Endpoints
Update all router endpoints to support:
- Pagination with `skip` and `limit` parameters
- Filtering with query parameters
- Sorting with `sort` parameter
- Proper error handling and validation

### Task 2: Validation and Error Handling
- Add comprehensive Pydantic validation for all inputs
- Implement consistent error response format
- Add proper HTTP status codes

### Task 3: API Documentation
- Enhance OpenAPI documentation with examples
- Add query parameter descriptions
- Document all error responses

### Task 4: Testing
- Create sample data for testing
- Test all pagination/filtering scenarios
- Verify TanStack Table compatibility

### Task 5: Performance Optimization
- Optimize database queries
- Add indexes where needed
- Implement caching where appropriate

## Implementation Details

### 1. Enhanced Query Parameters

We'll implement a standardized approach for query parameters across all endpoints:

```python
# Common query parameters for all endpoints
from typing import Optional
from pydantic import BaseModel

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100
    sort: Optional[str] = None

class FilterParams(BaseModel):
    # Will be extended with dynamic filters
    pass
```

### 2. Enhanced Router Structure

Each endpoint will now support:
```python
# Example for kunden router
@router.get("/", response_model=PaginatedResponse[KundeRead])
async def read_kunden(
    skip: int = 0, 
    limit: int = 100,
    sort: str = "name",
    session: Session = Depends(get_session)
):
    # Implementation with pagination, filtering, and sorting
```

### 3. Response Structure

All endpoints will return a consistent structure:
```python
# Response model for paginated data
class PaginatedResponse(BaseModel):
    data: List[BaseModel]
    count: int
```

### 4. Filtering Implementation

Dynamic filtering will be implemented using SQLModel's query capabilities:
```python
# Example filtering function
def apply_filters(query, filters):
    for field, value in filters.items():
        if value:
            query = query.filter(getattr(model, field) == value)
    return query
```

### 5. Sorting Implementation

Sorting will support both ascending and descending:
```python
# Example sorting function
def apply_sorting(query, sort_field):
    if sort_field.startswith('-'):
        field_name = sort_field[1:]
        direction = 'desc'
    else:
        field_name = sort_field
        direction = 'asc'
    
    # Apply sorting to query
    return query.order_by(getattr(model, field_name).asc() if direction == 'asc' else getattr(model, field_name).desc())
```

### 6. Error Handling

All endpoints will have consistent error handling:
```python
try:
    # Database operation
    pass
except Exception as e:
    raise HTTPException(status_code=500, detail="Database error occurred")
```

## Updated Router Implementations

### 1. Enhanced kunden.py

```python
# routers/kunden.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from ..database import get_session
from ..models import Kunde, KundeCreate, KundeRead, KundeUpdate
from pydantic import BaseModel
from typing import List

# Response model for paginated data
class PaginatedResponse(BaseModel):
    data: List[KundeRead]
    count: int

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def read_kunden(
    skip: int = 0,
    limit: int = 100,
    sort: str = "name",
    kundnr: Optional[str] = None,
    name: Optional[str] = None,
    session: Session = Depends(get_session)
):
    # Build query with filters
    statement = select(Kunde)
    
    # Apply filters
    filters = []
    if kundnr:
        filters.append(Kunde.kundnr == kundnr)
    if name:
        filters.append(Kunde.name.like(f"%{name}%"))
    
    if filters:
        statement = statement.where(and_(*filters))
    
    # Apply sorting
    if sort.startswith('-'):
        field_name = sort[1:]
        direction = 'desc'
    else:
        field_name = sort
        direction = 'asc'
    
    if hasattr(Kunde, field_name):
        if direction == 'desc':
            statement = statement.order_by(getattr(Kunde, field_name).desc())
        else:
            statement = statement.order_by(getattr(Kunde, field_name).asc())
    else:
        # Default sorting
        statement = statement.order_by(Kunde.name.asc())
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    kunden = session.exec(statement).all()
    
    # Get total count
    count_statement = select(Kunde)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).count()
    
    return PaginatedResponse(data=kunden, count=total_count)

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
```

### 2. Enhanced artikel.py

```python
# routers/artikel.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from ..database import get_session
from ..models import Artikel, ArtikelCreate, ArtikelRead, ArtikelUpdate
from pydantic import BaseModel

class PaginatedResponse(BaseModel):
    data: List[ArtikelRead]
    count: int

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def read_artikel(
    skip: int = 0,
    limit: int = 100,
    sort: str = "artnr",
    artnr: Optional[str] = None,
    bezeichnung: Optional[str] = None,
    session: Session = Depends(get_session)
):
    # Build query with filters
    statement = select(Artikel)
    
    # Apply filters
    filters = []
    if artnr:
        filters.append(Artikel.artnr == artnr)
    if bezeichnung:
        filters.append(Artikel.bezeichnung.like(f"%{bezeichnung}%"))
    
    if filters:
        statement = statement.where(and_(*filters))
    
    # Apply sorting
    if sort.startswith('-'):
        field_name = sort[1:]
        direction = 'desc'
    else:
        field_name = sort
        direction = 'asc'
    
    if hasattr(Artikel, field_name):
        if direction == 'desc':
            statement = statement.order_by(getattr(Artikel, field_name).desc())
        else:
            statement = statement.order_by(getattr(Artikel, field_name).asc())
    else:
        # Default sorting
        statement = statement.order_by(Artikel.artnr.asc())
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    artikel = session.exec(statement).all()
    
    # Get total count
    count_statement = select(Artikel)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).count()
    
    return PaginatedResponse(data=artikel, count=total_count)

@router.get("/{artikel_id}", response_model=ArtikelRead)
async def read_artikel_by_id(artikel_id: int, session: Session = Depends(get_session)):
    artikel = session.get(Artikel, artikel_id)
    if not artikel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artikel not found")
    return artikel

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
```

### 3. Enhanced dokumente.py

```python
# routers/dokumente.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from ..database import get_session
from ..models import Dokument, DokumentCreate, DokumentRead, DokumentUpdate
from pydantic import BaseModel

class PaginatedResponse(BaseModel):
    data: List[DokumentRead]
    count: int

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def read_dokumente(
    skip: int = 0,
    limit: int = 100,
    sort: str = "datum",
    typ: Optional[str] = None,
    kunde_id: Optional[int] = None,
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
    
    if filters:
        statement = statement.where(and_(*filters))
    
    # Apply sorting
    if sort.startswith('-'):
        field_name = sort[1:]
        direction = 'desc'
    else:
        field_name = sort
        direction = 'asc'
    
    if hasattr(Dokument, field_name):
        if direction == 'desc':
            statement = statement.order_by(getattr(Dokument, field_name).desc())
        else:
            statement = statement.order_by(getattr(Dokument, field_name).asc())
    else:
        # Default sorting
        statement = statement.order_by(Dokument.datum.desc())
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    dokumente = session.exec(statement).all()
    
    # Get total count
    count_statement = select(Dokument)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).count()
    
    return PaginatedResponse(data=dokumente, count=total_count)

@router.get("/{dokument_id}", response_model=DokumentRead)
async def read_dokument(dokument_id: int, session: Session = Depends(get_session)):
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
    return dokument

@router.post("/", response_model=DokumentRead)
async def create_dokument(dokument: DokumentCreate, session: Session = Depends(get_session)):
    db_dokument = Dokument.from_orm(dokument)
    session.add(db_dokument)
    session.commit()
    session.refresh(db_dokument)
    return db_dokument

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
    return db_dokument

@router.delete("/{dokument_id}")
async def delete_dokument(dokument_id: int, session: Session = Depends(get_session)):
    dokument = session.get(Dokument, dokument_id)
    if not dokument:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dokument not found")
    session.delete(dokument)
    session.commit()
    return {"message": "Dokument deleted successfully"}
```

### 4. Enhanced zahlungen.py

```python
# routers/zahlungen.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from ..database import get_session
from ..models import Zahlung, ZahlungCreate, ZahlungRead, ZahlungUpdate
from pydantic import BaseModel

class PaginatedResponse(BaseModel):
    data: List[ZahlungRead]
    count: int

router = APIRouter()

@router.get("/", response_model=PaginatedResponse)
async def read_zahlungen(
    skip: int = 0,
    limit: int = 100,
    sort: str = "datum",
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
    if sort.startswith('-'):
        field_name = sort[1:]
        direction = 'desc'
    else:
        field_name = sort
        direction = 'asc'
    
    if hasattr(Zahlung, field_name):
        if direction == 'desc':
            statement = statement.order_by(getattr(Zahlung, field_name).desc())
        else:
            statement = statement.order_by(getattr(Zahlung, field_name).asc())
    else:
        # Default sorting
        statement = statement.order_by(Zahlung.datum.desc())
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    
    zahlungen = session.exec(statement).all()
    
    # Get total count
    count_statement = select(Zahlung)
    if filters:
        count_statement = count_statement.where(and_(*filters))
    total_count = session.exec(count_statement).count()
    
    return PaginatedResponse(data=zahlungen, count=total_count)

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
```

### 5. Updated main.py

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .auth.router import router as auth_router
from .routers import kunden, artikel, dokumente, zahlungen

app = FastAPI(
    title="GSWIN ERP API",
    version="1.0.0",
    description="Custom Invoicing CRM/ERP for German Handwerker",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(kunden.router, prefix="/kunden", tags=["Kunden"])
app.include_router(artikel.router, prefix="/artikel", tags=["Artikel"])
app.include_router(dokumente.router, prefix="/dokumente", tags=["Dokumente"])
app.include_router(zahlungen.router, prefix="/zahlungen", tags=["Zahlungen"])

@app.get("/")
async def root():
    return {"message": "GSWIN ERP Backend is running"}
```

## Summary

This phase will implement the enhanced CRUD API with:
1. Full pagination support (skip, limit)
2. Dynamic filtering by field values
3. Sorting capabilities
4. Consistent response structure
5. Proper error handling
6. TanStack Table compatibility

The API will be ready for frontend integration and will support all the features needed for a modern web application.