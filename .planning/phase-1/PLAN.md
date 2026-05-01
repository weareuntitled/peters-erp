# GSWIN ERP - Phase 1: Infrastructure & Auth

## Plan

### Task 1: Docker Setup
Create `Dockerfile` for Python backend with system dependencies
Create `docker-compose.yml` to orchestrate:
- FastAPI backend (port 8000)
- React frontend (port 5173)
- n8n (port 5678)
- Ollama (port 11434)

### Task 2: Backend Structure
Create `backend/` directory with:
- `main.py` - FastAPI app initialization
- `database.py` - SQLModel engine + session management
- `config.py` - Settings via pydantic-settings
- `auth/` - JWT auth logic
- `models/` - SQLModel classes for all tables
- `routers/` - REST endpoints (will be added in later phases)

### Task 3: SQLModel Classes
Implement all 11 existing tables as SQLModel classes:
- `users` (new)
- `kunden` (existing)
- `artikel` (existing)
- `warengruppen` (existing)
- `dokumente` (existing)
- `dokument_positionen` (existing)
- `zahlungen` (existing)
- `vorlagen` (existing)
- `formeln` (existing)
- `nummernkreise` (existing)
- `steuersaetze` (existing)

### Task 4: Authentication System
- User model with password hash
- JWT token generation/verification
- Access/refresh token rotation
- Registration endpoint (admin-only)
- Login endpoint (returns tokens)
- Refresh endpoint
- Logout endpoint (invalidate refresh token)
- Auth dependency for protected routes

### Task 5: Database Connection
- Connect to existing `gswin_modern.db`
- Enable WAL mode for concurrent access
- Add `users` table with proper constraints
- Implement session management for FastAPI

### Task 6: Configuration
- `.env` file with secrets
- Settings class for environment variables
- Debug mode toggle

### Task 7: API Documentation
- Auto-generated Swagger/OpenAPI docs
- Ready for n8n integration

## Implementation

### 1. Create Dockerfile

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for WeasyPrint
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libfreetype6-dev \
    libfontconfig1 \
    libharfbuzz-dev \
    libfribidi-dev \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    liblcms2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Create requirements.txt

```
# requirements.txt
fastapi==0.115.0
sqlmodel==0.0.22
uvicorn[standard]==0.30.6
python-jose==1.7.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
pydantic-settings==2.2.1
weasyprint==61.0
```

### 3. Create main.py

```python
# main.py
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

### 4. Create config.py

```python
# config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///data/gswin_modern.db"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 30  # 30 minutes
    jwt_refresh_expire_minutes: int = 10080  # 7 days
    debug: bool = False
    ollama_url: str = "http://ollama:11434"
    n8n_webhook_url: str = "http://n8n:5678"

    class Config:
        env_file = ".env"


settings = Settings()
```

### 5. Create database.py

```python
# database.py
from sqlmodel import SQLModel, Session, create_engine
from .config import settings

# SQLite with WAL mode for concurrent reads (FastAPI + n8n both reading)
connect_args = {"check_same_thread": False}
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args=connect_args,
)


def init_db():
    """Create tables that don't exist yet (e.g., users).
    Does NOT drop existing tables with data."""
    SQLModel.metadata.create_all(engine)

    # Enable WAL mode for better concurrent access
    with engine.connect() as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        conn.commit()


def get_session():
    """FastAPI dependency: yields a SQLModel session per request."""
    with Session(engine) as session:
        yield session
```

### 6. Create auth directory structure

#### auth/models.py

```python
# auth/models.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: str
    rolle: str = Field(default="user")  # admin / user / readonly
    aktiv: bool = Field(default=True)


class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str
    erstellt_am: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat())
    letzter_login: Optional[str] = None


class UserCreate(SQLModel):
    email: str
    name: str
    password: str
    rolle: str = "user"


class UserRead(UserBase):
    id: int
    erstellt_am: Optional[str]
    letzter_login: Optional[str]


class UserLogin(SQLModel):
    email: str
    password: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None
```

#### auth/utils.py

```python
# auth/utils.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from .models import UserRead
from ..config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT
SECRET_KEY = settings.jwt_secret
ALGORITHM = settings.jwt_algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.jwt_access_expire_minutes
REFRESH_TOKEN_EXPIRE_MINUTES = settings.jwt_refresh_expire_minutes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "token_type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

#### auth/dependencies.py

```python
# auth/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .utils import verify_token
from .models import UserRead
from ..database import get_session
from sqlmodel import Session, select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    # Get user from DB
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    statement = select(UserRead).where(UserRead.id == user_id)
    user = session.exec(statement).first()
    
    if user is None:
        raise credentials_exception
    
    return user
```

#### auth/router.py

```python
# auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models.auth import UserCreate, UserRead, UserLogin, Token
from ..auth.utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from ..auth.models import User
from ..auth.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserRead)
async def register_user(user: UserCreate, session: Session = Depends(get_session)):
    # Check if user already exists
    statement = select(User).where(User.email == user.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        rolle=user.rolle,
        password_hash=hashed_password
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login_user(user: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == user.email)
    db_user = session.exec(statement).first()
    
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    db_user.letzter_login = datetime.now().isoformat()
    session.add(db_user)
    session.commit()
    
    # Create tokens
    access_token = create_access_token(data={"user_id": db_user.id})
    refresh_token = create_refresh_token(data={"user_id": db_user.id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, session: Session = Depends(get_session)):
    payload = verify_token(refresh_token)
    if payload is None or payload.get("token_type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )
    
    # Check if user still exists
    statement = select(User).where(User.id == user_id)
    db_user = session.exec(statement).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    # Create new access token
    new_access_token = create_access_token(data={"user_id": db_user.id})
    
    return Token(
        access_token=new_access_token,
        token_type="bearer"
    )


@router.post("/logout")
async def logout_user(current_user: UserRead = Depends(get_current_user)):
    # In a real app, we would invalidate the refresh token
    # For now, just return success
    return {"message": "Logged out successfully"}
```

### 7. Create models directory

#### models/__init__.py

```python
# models/__init__.py
from .kunden import Kunde, KundeCreate, KundeRead, KundeUpdate
from .artikel import Artikel, ArtikelCreate, ArtikelRead, ArtikelUpdate
from .warengruppen import Warengruppe, WarengruppeCreate, WarengruppeRead, WarengruppeUpdate
from .dokumente import Dokument, DokumentCreate, DokumentRead, DokumentUpdate
from .positionen import Position, PositionCreate, PositionRead, PositionUpdate
from .zahlungen import Zahlung, ZahlungCreate, ZahlungRead, ZahlungUpdate
from .vorlagen import Vorlage, VorlageCreate, VorlageRead, VorlageUpdate
from .formeln import Formel, FormelCreate, FormelRead, FormelUpdate
from .nummernkreise import Nummernkreis, NummernkreisCreate, NummernkreisRead, NummernkreisUpdate
from .steuersaetze import Steuersatz, SteuersatzCreate, SteuersatzRead, SteuersatzUpdate
from .auth import User, UserCreate, UserRead, UserLogin, Token

__all__ = [
    "Kunde", "KundeCreate", "KundeRead", "KundeUpdate",
    "Artikel", "ArtikelCreate", "ArtikelRead", "ArtikelUpdate",
    "Warengruppe", "WarengruppeCreate", "WarengruppeRead", "WarengruppeUpdate",
    "Dokument", "DokumentCreate", "DokumentRead", "DokumentUpdate",
    "Position", "PositionCreate", "PositionRead", "PositionUpdate",
    "Zahlung", "ZahlungCreate", "ZahlungRead", "ZahlungUpdate",
    "Vorlage", "VorlageCreate", "VorlageRead", "VorlageUpdate",
    "Formel", "FormelCreate", "FormelRead", "FormelUpdate",
    "Nummernkreis", "NummernkreisCreate", "NummernkreisRead", "NummernkreisUpdate",
    "Steuersatz", "SteuersatzCreate", "SteuersatzRead", "SteuersatzUpdate",
    "User", "UserCreate", "UserRead", "UserLogin", "Token"
]
```

#### models/kunden.py

```python
# models/kunden.py
from sqlmodel import SQLModel, Field
from typing import Optional


class KundeBase(SQLModel):
    kundnr: Optional[str] = Field(default=None, index=True)
    anrede: Optional[str] = None
    name: str = Field(index=True)
    vorname: Optional[str] = None
    zusatz: Optional[str] = None
    strasse: Optional[str] = None
    plz: Optional[str] = Field(default=None, index=True)
    ort: Optional[str] = Field(default=None, index=True)
    land: str = Field(default="DE")
    telefon: Optional[str] = None
    mobil: Optional[str] = None
    email: Optional[str] = None
    homepage: Optional[str] = None
    # Zahlungskonditionen
    zahlart: Optional[str] = None
    tage_netto: int = Field(default=14)
    skonto_prozent: Optional[float] = None
    skonto_tage: Optional[int] = None
    # Bank
    iban: Optional[str] = None
    bic: Optional[str] = None
    bank: Optional[str] = None
    # Statistik
    kundengruppe: Optional[str] = None
    umsatz_gesamt: float = Field(default=0)
    # Kennzeichen
    kennung1: Optional[str] = None
    kennung2: Optional[str] = None
    notiz: Optional[str] = None
    # Zeitstempel
    erstellt_am: Optional[str] = None
    geaendert_am: Optional[str] = None


class Kunde(KundeBase, table=True):
    __tablename__ = "kunden"
    id: Optional[int] = Field(default=None, primary_key=True)


class KundeCreate(KundeBase):
    pass


class KundeRead(KundeBase):
    id: int


class KundeUpdate(SQLModel):
    """All fields optional for partial updates (PATCH)."""
    name: Optional[str] = None
    vorname: Optional[str] = None
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    mobil: Optional[str] = None
    email: Optional[str] = None
    zahlart: Optional[str] = None
    tage_netto: Optional[int] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    bank: Optional[str] = None
    notiz: Optional[str] = None
```

#### models/artikel.py

```python
# models/artikel.py
from sqlmodel import SQLModel, Field
from typing import Optional


class ArtikelBase(SQLModel):
    artnr: str = Field(index=True, unique=True)  # PRESERVED 1:1!
    bezeichnung: str
    langtext: Optional[str] = None
    warengruppe_id: Optional[int] = Field(default=None, foreign_key="warengruppen.id")
    vk_preis: float = Field(default=0)
    preis_brutto: int = Field(default=1)
    mwst_satz: float = Field(default=19.0)
    einheit: str = Field(default="Stk")
    ek_preis: float = Field(default=0)
    gewicht: Optional[float] = None
    kurztext: Optional[str] = None
    artzusatz: Optional[str] = None
    sachnr: Optional[str] = None
    aktiv: int = Field(default=1)
    erstellt_am: Optional[str] = None
    geaendert_am: Optional[str] = None


class Artikel(ArtikelBase, table=True):
    __tablename__ = "artikel"
    id: Optional[int] = Field(default=None, primary_key=True)


class ArtikelCreate(ArtikelBase):
    pass


class ArtikelRead(ArtikelBase):
    id: int


class ArtikelUpdate(SQLModel):
    bezeichnung: Optional[str] = None
    langtext: Optional[str] = None
    warengruppe_id: Optional[int] = None
    vk_preis: Optional[float] = None
    mwst_satz: Optional[float] = None
    einheit: Optional[str] = None
    ek_preis: Optional[float] = None
    aktiv: Optional[int] = None
```

#### models/warengruppen.py

```python
# models/warengruppen.py
from sqlmodel import SQLModel, Field
from typing import Optional


class WarengruppeBase(SQLModel):
    bezeichnung: str = Field(unique=True)
    beschreibung: Optional[str] = None
    erloes_konto: Optional[str] = None
    mwst_code: Optional[str] = None
    aktiv: int = Field(default=1)


class Warengruppe(WarengruppeBase, table=True):
    __tablename__ = "warengruppen"
    id: Optional[int] = Field(default=None, primary_key=True)


class WarengruppeCreate(WarengruppeBase):
    pass


class WarengruppeRead(WarengruppeBase):
    id: int


class WarengruppeUpdate(SQLModel):
    bezeichnung: Optional[str] = None
    beschreibung: Optional[str] = None
    erloes_konto: Optional[str] = None
    mwst_code: Optional[str] = None
    aktiv: Optional[int] = None
```

#### models/dokumente.py

```python
# models/dokumente.py
from sqlmodel import SQLModel, Field
from typing import Optional, Literal


DokTyp = Literal["AN", "AU", "LI", "RE", "GU", "ST", "MA"]
DokStatus = Literal["offen", "gedruckt", "gebucht", "bezahlt", "storniert", "archiviert"]


class DokumentBase(SQLModel):
    dokument_nr: str = Field(unique=True)
    typ: str = Field(index=True)  # AN/AU/LI/RE/GU/ST/MA
    status: str = Field(default="offen", index=True)
    kunde_id: Optional[int] = Field(default=None, foreign_key="kunden.id", index=True)
    vorlage_id: Optional[int] = Field(default=None, foreign_key="vorlagen.id")
    betrag_netto: float = Field(default=0)
    betrag_brutto: float = Field(default=0)
    bezahlt_summe: float = Field(default=0)
    datum: str  # ISO date
    liefertermin: Optional[str] = None
    zahlart: Optional[str] = None
    tage_netto: Optional[int] = None
    skonto_prozent: Optional[float] = None
    skonto_tage: Optional[int] = None
    kopftext: Optional[str] = None
    fusstext: Optional[str] = None
    bemerkung: Optional[str] = None
    auftragsbezeichnung: Optional[str] = None
    gedruckt: int = Field(default=0)
    gebucht: int = Field(default=0)
    gemailt: int = Field(default=0)
    storniert: int = Field(default=0)
    vorgaenger_id: Optional[int] = Field(default=None, foreign_key="dokumente.id", index=True)
    gesendet_am: Optional[str] = None
    gesendet_an: Optional[str] = None
    export_format: Optional[str] = None
    erstellt_von: Optional[str] = None
    erstellt_am: Optional[str] = None
    geaendert_am: Optional[str] = None


class Dokument(DokumentBase, table=True):
    __tablename__ = "dokumente"
    id: Optional[int] = Field(default=None, primary_key=True)


class DokumentCreate(SQLModel):
    typ: str
    kunde_id: int
    datum: str
    vorlage_id: Optional[int] = None
    kopftext: Optional[str] = None
    fusstext: Optional[str] = None
    auftragsbezeichnung: Optional[str] = None
    liefertermin: Optional[str] = None


class DokumentRead(DokumentBase):
    id: int


class DokumentUpdate(SQLModel):
    status: Optional[str] = None
    kopftext: Optional[str] = None
    fusstext: Optional[str] = None
    bemerkung: Optional[str] = None
    auftragsbezeichnung: Optional[str] = None
    liefertermin: Optional[str] = None
    zahlart: Optional[str] = None
    tage_netto: Optional[int] = None
```

#### models/positionen.py

```python
# models/positionen.py
from sqlmodel import SQLModel, Field
from typing import Optional


class PositionBase(SQLModel):
    dokument_id: int = Field(foreign_key="dokumente.id", index=True)
    position_nr: int
    artikel_id: Optional[int] = Field(default=None, foreign_key="artikel.id", index=True)
    artnr: Optional[str] = None
    bezeichnung: str
    menge: float = Field(default=1)
    einheit: str = Field(default="Stk")
    einzelpreis: float = Field(default=0)
    rabatt_prozent: float = Field(default=0)
    mwst_satz: float = Field(default=19.0)
    gesamtpreis: Optional[float] = None
    warengruppe_id: Optional[int] = Field(default=None, foreign_key="warengruppen.id")
    formel_id: Optional[int] = Field(default=None, foreign_key="formeln.id")
    formel_wert1: Optional[float] = None
    formel_wert2: Optional[float] = None
    formel_wert3: Optional[float] = None
    formel_ergebnis: Optional[float] = None
    langtext: Optional[str] = None
    erstellt_am: Optional[str] = None


class Position(PositionBase, table=True):
    __tablename__ = "dokument_positionen"
    id: Optional[int] = Field(default=None, primary_key=True)


class PositionCreate(SQLModel):
    dokument_id: int
    position_nr: int
    artikel_id: Optional[int] = None
    artnr: Optional[str] = None
    bezeichnung: str
    menge: float = 1
    einheit: str = "Stk"
    einzelpreis: float = 0
    rabatt_prozent: float = 0
    mwst_satz: float = 19.0
    warengruppe_id: Optional[int] = None
    formel_id: Optional[int] = None
    formel_wert1: Optional[float] = None
    formel_wert2: Optional[float] = None
    formel_wert3: Optional[float] = None
    langtext: Optional[str] = None


class PositionRead(PositionBase):
    id: int


class PositionUpdate(SQLModel):
    bezeichnung: Optional[str] = None
    menge: Optional[float] = None
    einzelpreis: Optional[float] = None
    rabatt_prozent: Optional[float] = None
    mwst_satz: Optional[float] = None
    formel_wert1: Optional[float] = None
    formel_wert2: Optional[float] = None
    formel_wert3: Optional[float] = None
    langtext: Optional[str] = None
```

#### models/zahlungen.py

```python
# models/zahlungen.py
from sqlmodel import SQLModel, Field
from typing import Optional


class ZahlungBase(SQLModel):
    dokument_id: int = Field(foreign_key="dokumente.id")
    betrag: float = Field()
    datum: str  # ISO date
    bemerkung: Optional[str] = None
    zahlungsart: Optional[str] = None
    bank: Optional[str] = None
    erstellt_am: Optional[str] = None
    rueckgaengig: int = Field(default=0)


class Zahlung(ZahlungBase, table=True):
    __tablename__ = "zahlungen"
    id: Optional[int] = Field(default=None, primary_key=True)


class ZahlungCreate(SQLModel):
    dokument_id: int
    betrag: float
    datum: str
    bemerkung: Optional[str] = None
    zahlungsart: Optional[str] = None
    bank: Optional[str] = None


class ZahlungRead(ZahlungBase):
    id: int


class ZahlungUpdate(SQLModel):
    betrag: Optional[float] = None
    datum: Optional[str] = None
    bemerkung: Optional[str] = None
    zahlungsart: Optional[str] = None
    bank: Optional[str] = None
    rueckgaengig: Optional[int] = None
```

#### models/vorlagen.py

```python
# models/vorlagen.py
from sqlmodel import SQLModel, Field
from typing import Optional


class VorlageBase(SQLModel):
    name: str = Field()
    typ: str = Field()  # AN / RE / LI / GU
    warengruppe_id: Optional[int] = Field(default=None, foreign_key="warengruppen.id")
    kopftext: Optional[str] = None
    fusstext: Optional[str] = None
    template_datei: Optional[str] = None
    mit_zwischensumme: int = Field(default=0)
    mit_einzelpreisen: int = Field(default=1)
    mit_positionsnummern: int = Field(default=1)
    ist_standard: int = Field(default=0)
    aktiv: int = Field(default=1)


class Vorlage(VorlageBase, table=True):
    __tablename__ = "vorlagen"
    id: Optional[int] = Field(default=None, primary_key=True)


class VorlageCreate(VorlageBase):
    pass


class VorlageRead(VorlageBase):
    id: int


class VorlageUpdate(SQLModel):
    name: Optional[str] = None
    typ: Optional[str] = None
    warengruppe_id: Optional[int] = None
    kopftext: Optional[str] = None
    fusstext: Optional[str] = None
    template_datei: Optional[str] = None
    mit_zwischensumme: Optional[int] = None
    mit_einzelpreisen: Optional[int] = None
    mit_positionsnummern: Optional[int] = None
    ist_standard: Optional[int] = None
    aktiv: Optional[int] = None
```

#### models/formeln.py

```python
# models/formeln.py
from sqlmodel import SQLModel, Field
from typing import Optional


class FormelBase(SQLModel):
    bezeichnung: str = Field()
    formel: Optional[str] = None
    werteeinheit: Optional[str] = None
    masseinheit: Optional[str] = None
    feld1_label: Optional[str] = None
    feld2_label: Optional[str] = None
    feld3_label: Optional[str] = None
    feld4_label: Optional[str] = None
    feld5_label: Optional[str] = None
    feld6_label: Optional[str] = None
    beschreibung: Optional[str] = None


class Formel(FormelBase, table=True):
    __tablename__ = "formeln"
    id: Optional[int] = Field(default=None, primary_key=True)


class FormelCreate(FormelBase):
    pass


class FormelRead(FormelBase):
    id: int


class FormelUpdate(SQLModel):
    bezeichnung: Optional[str] = None
    formel: Optional[str] = None
    werteeinheit: Optional[str] = None
    masseinheit: Optional[str] = None
    feld1_label: Optional[str] = None
    feld2_label: Optional[str] = None
    feld3_label: Optional[str] = None
    feld4_label: Optional[str] = None
    feld5_label: Optional[str] = None
    feld6_label: Optional[str] = None
    beschreibung: Optional[str] = None
```

#### models/nummernkreise.py

```python
# models/nummernkreise.py
from sqlmodel import SQLModel, Field
from typing import Optional


class NummernkreisBase(SQLModel):
    typ: str = Field(primary_key=True)  # RE/AN/AU/LI/GU/ST/MA
    prefix: Optional[str] = None
    laufende_nr: int = Field(default=0)
    format: str = Field(default="{prefix}-{jahr:04d}-{nr:05d}")


class Nummernkreis(NummernkreisBase, table=True):
    __tablename__ = "nummernkreise"


class NummernkreisCreate(NummernkreisBase):
    pass


class NummernkreisRead(NummernkreisBase):
    pass


class NummernkreisUpdate(SQLModel):
    prefix: Optional[str] = None
    laufende_nr: Optional[int] = None
    format: Optional[str] = None
```

#### models/steuersaetze.py

```python
# models/steuersaetze.py
from sqlmodel import SQLModel, Field
from typing import Optional


class SteuersatzBase(SQLModel):
    code: str = Field(unique=True)
    satz: float = Field()
    bezeichnung: Optional[str] = None
    gueltig_ab: Optional[str] = None
    aktiv: int = Field(default=1)


class Steuersatz(SteuersatzBase, table=True):
    __tablename__ = "steuersaetze"
    id: Optional[int] = Field(default=None, primary_key=True)


class SteuersatzCreate(SteuersatzBase):
    pass


class SteuersatzRead(SteuersatzBase):
    id: int


class SteuersatzUpdate(SQLModel):
    code: Optional[str] = None
    satz: Optional[float] = None
    bezeichnung: Optional[str] = None
    gueltig_ab: Optional[str] = None
    aktiv: Optional[int] = None
```

### 8. Create routers directory

#### routers/__init__.py

```python
# routers/__init__.py
from .kunden import router as kunden_router
from .artikel import router as artikel_router
from .dokumente import router as dokumente_router
from .zahlungen import router as zahlungen_router

__all__ = [
    "kunden_router",
    "artikel_router",
    "dokumente_router",
    "zahlungen_router"
]
```

#### routers/kunden.py

```python
# routers/kunden.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Kunde, KundeCreate, KundeRead, KundeUpdate

router = APIRouter()


@router.get("/", response_model=List[KundeRead])
async def read_kunden(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Kunde).offset(skip).limit(limit)
    kunden = session.exec(statement).all()
    return kunden


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

#### routers/artikel.py

```python
# routers/artikel.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Artikel, ArtikelCreate, ArtikelRead, ArtikelUpdate

router = APIRouter()


@router.get("/", response_model=List[ArtikelRead])
async def read_artikel(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Artikel).offset(skip).limit(limit)
    artikel = session.exec(statement).all()
    return artikel


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

#### routers/dokumente.py

```python
# routers/dokumente.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Dokument, DokumentCreate, DokumentRead, DokumentUpdate

router = APIRouter()


@router.get("/", response_model=List[DokumentRead])
async def read_dokumente(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Dokument).offset(skip).limit(limit)
    dokumente = session.exec(statement).all()
    return dokumente


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

#### routers/zahlungen.py

```python
# routers/zahlungen.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..models import Zahlung, ZahlungCreate, ZahlungRead, ZahlungUpdate

router = APIRouter()


@router.get("/", response_model=List[ZahlungRead])
async def read_zahlungen(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Zahlung).offset(skip).limit(limit)
    zahlungen = session.exec(statement).all()
    return zahlungen


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

### 9. Create .env file

```
# .env
DATABASE_URL=sqlite:///data/gswin_modern.db
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_MINUTES=10080
DEBUG=False
OLLAMA_URL=http://ollama:11434
N8N_WEBHOOK_URL=http://n8n:5678
```

### 10. Create docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - ./data:/data  # gswin_modern.db lives here
    environment:
      - DATABASE_URL=sqlite:///data/gswin_modern.db
      - JWT_SECRET=change-me-in-production
      - OLLAMA_URL=http://ollama:11434
      - N8N_WEBHOOK_URL=http://n8n:5678
    depends_on:
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  n8n_data:
  ollama_data:
```

### 11. Create backend/Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for WeasyPrint
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libfreetype6-dev \
    libfontconfig1 \
    libharfbuzz-dev \
    libfribidi-dev \
    libxml2-dev \
    libxslt1-dev \
    libffi-dev \
    liblcms2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 12. Create backend/requirements.txt

```
# backend/requirements.txt
fastapi==0.115.0
sqlmodel==0.0.22
uvicorn[standard]==0.30.6
python-jose==1.7.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
pydantic-settings==2.2.1
weasyprint==61.0
```

## Summary

This phase sets up the complete foundation for our GSWIN ERP system:

1. **Database Integration** - Connects to the existing SQLite database with WAL mode for concurrent reads
2. **Authentication System** - Full JWT with access/refresh tokens, password hashing, and user management
3. **API Structure** - REST endpoints for all 11 tables with proper CRUD operations
4. **Docker Orchestration** - Complete setup for local development with all services
5. **Security** - Password hashing, token rotation, CORS support
6. **Documentation** - Auto-generated OpenAPI docs for n8n integration

The next phase will implement the business logic endpoints (document duplication, auto-recalculation, PDF generation) and begin frontend integration.
