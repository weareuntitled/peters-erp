"""Steuersaetze model — tax rates."""

from sqlmodel import SQLModel, Field, Column, String, Float, Integer
from typing import Optional


class SteuersatzBase(SQLModel):
    code: str = Field(sa_column=Column(String))
    satz: float = Field(sa_column=Column(Float))
    bezeichnung: Optional[str] = Field(default=None, sa_column=Column(String))
    gueltig_ab: Optional[str] = Field(default=None, sa_column=Column(String))
    aktiv: Optional[int] = Field(default=1, sa_column=Column(Integer))


class Steuersatz(SteuersatzBase, table=True):
    __tablename__ = "steuersaetze"
    id: Optional[int] = Field(default=None, primary_key=True)


class SteuersatzRead(SteuersatzBase):
    id: int
