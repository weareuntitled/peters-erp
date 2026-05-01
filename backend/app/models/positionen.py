"""Positionen model — line items for documents."""

from sqlmodel import SQLModel, Field, Column, String, Float, Integer, Text
from typing import Optional


class PositionBase(SQLModel):
    dokument_id: int = Field(sa_column=Column(Integer))
    position_nr: int = Field(sa_column=Column(Integer))
    artikel_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    artnr: Optional[str] = Field(default=None, sa_column=Column(String))
    bezeichnung: str = Field(sa_column=Column(String))
    menge: float = Field(default=1.0, sa_column=Column(Float))
    einheit: Optional[str] = Field(default="Stk", sa_column=Column(String))
    einzelpreis: float = Field(default=0.0, sa_column=Column(Float))
    rabatt_prozent: float = Field(default=0.0, sa_column=Column(Float))
    mwst_satz: float = Field(default=19.0, sa_column=Column(Float))
    gesamtpreis: float = Field(default=0.0, sa_column=Column(Float))
    warengruppe_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    formel_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    formel_wert1: Optional[float] = Field(default=None, sa_column=Column(String))
    formel_wert2: Optional[float] = Field(default=None, sa_column=Column(String))
    formel_wert3: Optional[float] = Field(default=None, sa_column=Column(String))
    formel_ergebnis: Optional[float] = Field(default=None, sa_column=Column(String))
    langtext: Optional[str] = Field(default=None, sa_column=Column(Text))
    erstellt_am: Optional[str] = Field(default=None, sa_column=Column(String))


class Position(PositionBase, table=True):
    __tablename__ = "dokument_positionen"
    id: Optional[int] = Field(default=None, primary_key=True)


class PositionCreate(SQLModel):
    """For creating positions - dokument_id is optional because it's auto-set when creating via Dokument."""
    dokument_id: Optional[int] = None
    position_nr: Optional[int] = None
    artikel_id: Optional[int] = None
    artnr: Optional[str] = None
    bezeichnung: str
    menge: float = 1.0
    einheit: str = "Stk"
    einzelpreis: float = 0.0
    rabatt_prozent: float = 0.0
    mwst_satz: float = 19.0
    gesamtpreis: float = 0.0
    warengruppe_id: Optional[int] = None
    warengruppe_name: Optional[str] = None
    formel_id: Optional[int] = None
    formel_wert1: Optional[float] = None
    formel_wert2: Optional[float] = None
    formel_wert3: Optional[float] = None
    formel_ergebnis: Optional[float] = None
    langtext: Optional[str] = None
    erstellt_am: Optional[str] = None


class PositionRead(PositionBase):
    id: int


class PositionUpdate(SQLModel):
    bezeichnung: Optional[str] = None
    menge: Optional[float] = None
    einheit: Optional[str] = None
    einzelpreis: Optional[float] = None
    gesamtpreis: Optional[float] = None
