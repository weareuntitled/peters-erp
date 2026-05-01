from sqlmodel import SQLModel, Field, Column, String, Integer, Text
from typing import Optional, List
from .positionen import PositionCreate

class DokumentBase(SQLModel):
    dokument_nr: Optional[str] = Field(default=None, sa_column=Column(String, unique=True))
    typ: str = Field(sa_column=Column(String))
    status: Optional[str] = Field(default="offen", sa_column=Column(String))
    kunde_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    vorlage_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    betrag_netto: float = Field(default=0.0, sa_column=Column(String))
    betrag_brutto: float = Field(default=0.0, sa_column=Column(String))
    bezahlt_summe: float = Field(default=0.0, sa_column=Column(String))
    datum: Optional[str] = Field(default=None, sa_column=Column(String))
    liefertermin: Optional[str] = Field(default=None, sa_column=Column(String))
    kopftext: Optional[str] = Field(default=None, sa_column=Column(Text))
    fusstext: Optional[str] = Field(default=None, sa_column=Column(Text))
    bemerkung: Optional[str] = Field(default=None, sa_column=Column(Text))
    auftragsbezeichnung: Optional[str] = Field(default=None, sa_column=Column(String))
    gueltigkeit: Optional[int] = Field(default=30, sa_column=Column(Integer))
    gedruckt: Optional[int] = Field(default=0, sa_column=Column(Integer))
    gemailt: Optional[int] = Field(default=0, sa_column=Column(Integer))
    storniert: Optional[int] = Field(default=0, sa_column=Column(Integer))
    erstellt_am: Optional[str] = Field(default=None, sa_column=Column(String))
    geaendert_am: Optional[str] = Field(default=None, sa_column=Column(String))

class Dokument(DokumentBase, table=True):
    __tablename__ = "dokumente"
    id: Optional[int] = Field(default=None, primary_key=True)

class DokumentCreate(DokumentBase):
    positionen: Optional[List[PositionCreate]] = None

class DokumentRead(DokumentBase):
    id: int
    kunde_name: Optional[str] = None

class DokumentUpdate(DokumentBase):
    dokument_nr: Optional[str] = None
    typ: Optional[str] = None