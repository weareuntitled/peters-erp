from sqlmodel import SQLModel, Field, Column, String, DateTime
from typing import Optional
from datetime import datetime

class KundeBase(SQLModel):
    kundnr: Optional[str] = Field(sa_column=Column(String, unique=True))
    anrede: Optional[str] = Field(sa_column=Column(String))
    name: str = Field(sa_column=Column(String))
    vorname: Optional[str] = Field(sa_column=Column(String))
    zusatz: Optional[str] = Field(sa_column=Column(String))
    strasse: Optional[str] = Field(sa_column=Column(String))
    plz: Optional[str] = Field(sa_column=Column(String))
    ort: Optional[str] = Field(sa_column=Column(String))
    land: Optional[str] = Field(default="DE", sa_column=Column(String))
    telefon: Optional[str] = Field(sa_column=Column(String))
    mobil: Optional[str] = Field(sa_column=Column(String))
    email: Optional[str] = Field(sa_column=Column(String))
    homepage: Optional[str] = Field(sa_column=Column(String))
    iban: Optional[str] = Field(sa_column=Column(String))
    bic: Optional[str] = Field(sa_column=Column(String))
    bank: Optional[str] = Field(sa_column=Column(String))
    kundengruppe: Optional[str] = Field(sa_column=Column(String))
    kennung1: Optional[str] = Field(sa_column=Column(String))
    kennung2: Optional[str] = Field(sa_column=Column(String))
    notiz: Optional[str] = Field(sa_column=Column(String))

class Kunde(KundeBase, table=True):
    __tablename__ = "kunden"
    id: Optional[int] = Field(default=None, primary_key=True)
    erstellt_am: Optional[str] = Field(default=None, sa_column=Column(String))
    geaendert_am: Optional[str] = Field(default=None, sa_column=Column(String))

class KundeCreate(KundeBase):
    pass

class KundeRead(KundeBase):
    id: int

class KundeUpdate(KundeBase):
    kundnr: Optional[str] = None
    anrede: Optional[str] = None
    name: Optional[str] = None
    vorname: Optional[str] = None