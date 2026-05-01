from sqlmodel import SQLModel, Field, Column, String, Float, Integer
from typing import Optional

class ArtikelBase(SQLModel):
    artnr: str = Field(sa_column=Column(String, unique=True))
    bezeichnung: str = Field(sa_column=Column(String))
    langtext: Optional[str] = Field(sa_column=Column(String))
    warengruppe_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    vk_preis: float = Field(default=0.0, sa_column=Column(Float))
    preis_brutto: Optional[int] = Field(default=1, sa_column=Column(Integer))
    mwst_satz: Optional[float] = Field(default=19.0, sa_column=Column(Float))
    einheit: Optional[str] = Field(default="Stk", sa_column=Column(String))
    ek_preis: Optional[float] = Field(default=0.0, sa_column=Column(Float))
    gewicht: Optional[float] = Field(default=None, sa_column=Column(Float))
    kurztext: Optional[str] = Field(sa_column=Column(String))
    artzusatz: Optional[str] = Field(sa_column=Column(String))
    sachnr: Optional[str] = Field(sa_column=Column(String))
    aktiv: Optional[int] = Field(default=1, sa_column=Column(Integer))

class Artikel(ArtikelBase, table=True):
    __tablename__ = "artikel"
    id: Optional[int] = Field(default=None, primary_key=True)
    erstellt_am: Optional[str] = Field(default=None, sa_column=Column(String))
    geaendert_am: Optional[str] = Field(default=None, sa_column=Column(String))

class ArtikelCreate(ArtikelBase):
    pass

class ArtikelRead(ArtikelBase):
    id: int
    warengruppe_bezeichnung: Optional[str] = None

class ArtikelUpdate(ArtikelBase):
    artnr: Optional[str] = None
    bezeichnung: Optional[str] = None