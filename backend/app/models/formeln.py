"""Formeln model — calculation formulas."""

from sqlmodel import SQLModel, Field, Column, String, Text
from typing import Optional


class FormelBase(SQLModel):
    bezeichnung: str = Field(sa_column=Column(String))
    formel: Optional[str] = Field(default=None, sa_column=Column(Text))
    werteeinheit: Optional[str] = Field(default=None, sa_column=Column(String))
    masseinheit: Optional[str] = Field(default=None, sa_column=Column(String))
    feld1_label: Optional[str] = Field(default=None, sa_column=Column(String))
    feld2_label: Optional[str] = Field(default=None, sa_column=Column(String))
    feld3_label: Optional[str] = Field(default=None, sa_column=Column(String))
    feld4_label: Optional[str] = Field(default=None, sa_column=Column(String))
    feld5_label: Optional[str] = Field(default=None, sa_column=Column(String))
    feld6_label: Optional[str] = Field(default=None, sa_column=Column(String))
    beschreibung: Optional[str] = Field(default=None, sa_column=Column(String))


class Formel(FormelBase, table=True):
    __tablename__ = "formeln"
    id: Optional[int] = Field(default=None, primary_key=True)


class FormelRead(FormelBase):
    id: int
