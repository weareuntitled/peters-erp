"""Warengruppen model — product categories."""

from sqlmodel import SQLModel, Field, Column, String, Integer
from typing import Optional


class WarengruppeBase(SQLModel):
    bezeichnung: str = Field(sa_column=Column(String))
    beschreibung: Optional[str] = Field(default=None, sa_column=Column(String))
    erloes_konto: Optional[str] = Field(default=None, sa_column=Column(String))
    mwst_code: Optional[str] = Field(default=None, sa_column=Column(String))
    aktiv: Optional[int] = Field(default=1, sa_column=Column(Integer))


class Warengruppe(WarengruppeBase, table=True):
    __tablename__ = "warengruppen"
    id: Optional[int] = Field(default=None, primary_key=True)


class WarengruppeRead(WarengruppeBase):
    id: int


class WarengruppeCreate(WarengruppeBase):
    pass


class WarengruppeUpdate(WarengruppeBase):
    bezeichnung: Optional[str] = None
    beschreibung: Optional[str] = None
    erloes_konto: Optional[str] = None
    mwst_code: Optional[str] = None
    aktiv: Optional[int] = None
