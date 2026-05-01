"""Nummernkreise model — document numbering ranges."""

from sqlmodel import SQLModel, Field, Column, String, Integer
from typing import Optional


class NummernkreisBase(SQLModel):
    typ: str = Field(sa_column=Column(String, unique=True))
    prefix: Optional[str] = Field(default=None, sa_column=Column(String))
    laufende_nr: Optional[int] = Field(default=0, sa_column=Column(Integer))
    format: Optional[str] = Field(default=None, sa_column=Column(String))


class Nummernkreis(NummernkreisBase, table=True):
    __tablename__ = "nummernkreise"
    id: Optional[int] = Field(default=None, primary_key=True)


class NummernkreisRead(NummernkreisBase):
    id: int
