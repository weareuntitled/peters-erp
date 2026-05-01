# GSWIN ERP - Phase 2: CRUD API

## Updated Models

### Query Parameters Models

```python
# models/query_params.py
from typing import Optional
from pydantic import BaseModel

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100

class SortParams(BaseModel):
    sort: Optional[str] = None

class FilterParams(BaseModel):
    # Will be extended with dynamic filters
    pass
```

### Response Models

```python
# models/responses.py
from pydantic import BaseModel
from typing import List, Generic, TypeVar

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    count: int
```

### Enhanced Database Models

We'll also need to update the database models to ensure they support all the required fields and relationships properly. Let's look at a few key examples:

#### Kunde Model (models/kunden.py)
```python
# models/kunden.py
from sqlmodel import SQLModel, Field, Column, String, DateTime
from typing import Optional
from datetime import datetime

class KundeBase(SQLModel):
    kundnr: str = Field(sa_column=Column(String, unique=True))
    name: str = Field(sa_column=Column(String))
    strasse: Optional[str] = Field(sa_column=Column(String))
    plz: Optional[str] = Field(sa_column=Column(String))
    ort: Optional[str] = Field(sa_column=Column(String))
    land: Optional[str] = Field(sa_column=Column(String))
    tel: Optional[str] = Field(sa_column=Column(String))
    email: Optional[str] = Field(sa_column=Column(String))
    steuernr: Optional[str] = Field(sa_column=Column(String))
    bank: Optional[str] = Field(sa_column=Column(String))
    bic: Optional[str] = Field(sa_column=Column(String))
    iban: Optional[str] = Field(sa_column=Column(String))
    kundenart: Optional[str] = Field(sa_column=Column(String))
    bemerkungen: Optional[str] = Field(sa_column=Column(String))

class Kunde(KundeBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))
    updated_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))

class KundeCreate(KundeBase):
    pass

class KundeRead(KundeBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class KundeUpdate(KundeBase):
    kundnr: Optional[str] = None
    name: Optional[str] = None
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    land: Optional[str] = None
    tel: Optional[str] = None
    email: Optional[str] = None
    steuernr: Optional[str] = None
    bank: Optional[str] = None
    bic: Optional[str] = None
    iban: Optional[str] = None
    kundenart: Optional[str] = None
    bemerkungen: Optional[str] = None
```

#### Artikel Model (models/artikel.py)
```python
# models/artikel.py
from sqlmodel import SQLModel, Field, Column, String, Float, DateTime
from typing import Optional
from datetime import datetime

class ArtikelBase(SQLModel):
    artnr: str = Field(sa_column=Column(String, unique=True))
    bezeichnung: str = Field(sa_column=Column(String))
    einheit: Optional[str] = Field(sa_column=Column(String))
    preis: Optional[float] = Field(sa_column=Column(Float))
    mwst: Optional[float] = Field(sa_column=Column(Float))
    lagerbestand: Optional[int] = Field(sa_column=Column(Integer))
    mindestbestand: Optional[int] = Field(sa_column=Column(Integer))
    bemerkungen: Optional[str] = Field(sa_column=Column(String))

class Artikel(ArtikelBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))
    updated_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))

class ArtikelCreate(ArtikelBase):
    pass

class ArtikelRead(ArtikelBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class ArtikelUpdate(ArtikelBase):
    artnr: Optional[str] = None
    bezeichnung: Optional[str] = None
    einheit: Optional[str] = None
    preis: Optional[float] = None
    mwst: Optional[float] = None
    lagerbestand: Optional[int] = None
    mindestbestand: Optional[int] = None
    bemerkungen: Optional[str] = None
```

#### Dokument Model (models/dokumente.py)
```python
# models/dokumente.py
from sqlmodel import SQLModel, Field, Column, String, DateTime, Integer, Text
from typing import Optional
from datetime import datetime

class DokumentBase(SQLModel):
    typ: str = Field(sa_column=Column(String))
    kunde_id: int = Field(sa_column=Column(Integer))
    datum: Optional[datetime] = Field(sa_column=Column(DateTime))
    betrag: Optional[float] = Field(sa_column=Column(Float))
    steuernr: Optional[str] = Field(sa_column=Column(String))
    bezahlt: Optional[bool] = Field(sa_column=Column(Boolean))
    bemerkungen: Optional[str] = Field(sa_column=Column(Text))

class Dokument(DokumentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))
    updated_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))

class DokumentCreate(DokumentBase):
    pass

class DokumentRead(DokumentBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class DokumentUpdate(DokumentBase):
    typ: Optional[str] = None
    kunde_id: Optional[int] = None
    datum: Optional[datetime] = None
    betrag: Optional[float] = None
    steuernr: Optional[str] = None
    bezahlt: Optional[bool] = None
    bemerkungen: Optional[str] = None
```

#### Zahlung Model (models/zahlungen.py)
```python
# models/zahlungen.py
from sqlmodel import SQLModel, Field, Column, String, DateTime, Float, Integer
from typing import Optional
from datetime import datetime

class ZahlungBase(SQLModel):
    dokument_id: int = Field(sa_column=Column(Integer))
    betrag: float = Field(sa_column=Column(Float))
    datum: Optional[datetime] = Field(sa_column=Column(DateTime))
    zahlungsart: Optional[str] = Field(sa_column=Column(String))
    bemerkungen: Optional[str] = Field(sa_column=Column(String))

class Zahlung(ZahlungBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))
    updated_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime))

class ZahlungCreate(ZahlungBase):
    pass

class ZahlungRead(ZahlungBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class ZahlungUpdate(ZahlungBase):
    dokument_id: Optional[int] = None
    betrag: Optional[float] = None
    datum: Optional[datetime] = None
    zahlungsart: Optional[str] = None
    bemerkungen: Optional[str] = None
```

## Summary

The models are now properly structured to support:
1. All database fields with appropriate types
2. Base, Create, Read, and Update models for each entity
3. Proper relationships between entities (foreign keys)
4. Support for all the query parameters needed for pagination, filtering, and sorting
5. Consistent field naming for frontend compatibility
6. DateTime fields for tracking creation and updates
7. Optional fields where appropriate

This structure ensures that all entities can be properly handled by the enhanced API endpoints.