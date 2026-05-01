from sqlmodel import SQLModel, Field, Column, String, Float, Integer, Text
from typing import Optional

class ZahlungBase(SQLModel):
    dokument_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    betrag: float = Field(sa_column=Column(Float))
    datum: str = Field(sa_column=Column(String))
    bemerkung: Optional[str] = Field(default=None, sa_column=Column(Text))
    zahlungsart: Optional[str] = Field(default=None, sa_column=Column(String))
    bank: Optional[str] = Field(default=None, sa_column=Column(String))
    erstellt_am: Optional[str] = Field(default=None, sa_column=Column(String))
    rueckgaengig: Optional[int] = Field(default=0, sa_column=Column(Integer))

class Zahlung(ZahlungBase, table=True):
    __tablename__ = "zahlungen"
    id: Optional[int] = Field(default=None, primary_key=True)

class ZahlungCreate(ZahlungBase):
    pass

class ZahlungRead(ZahlungBase):
    id: int

class ZahlungUpdate(ZahlungBase):
    dokument_id: Optional[int] = None
    betrag: Optional[float] = None
    datum: Optional[str] = None