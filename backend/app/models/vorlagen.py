"""Vorlagen model — document templates."""

from sqlmodel import SQLModel, Field, Column, String, Text, Integer
from typing import Optional


class VorlageBase(SQLModel):
    name: str = Field(sa_column=Column(String))
    typ: str = Field(sa_column=Column(String))
    warengruppe_id: Optional[int] = Field(default=None, sa_column=Column(Integer))
    kopftext: Optional[str] = Field(default=None, sa_column=Column(Text))
    fusstext: Optional[str] = Field(default=None, sa_column=Column(Text))
    template_datei: Optional[str] = Field(default=None, sa_column=Column(String))
    html_content: Optional[str] = Field(default=None, sa_column=Column(Text))
    mit_zwischensumme: Optional[int] = Field(default=0, sa_column=Column(Integer))
    mit_einzelpreisen: Optional[int] = Field(default=1, sa_column=Column(Integer))
    mit_positionsnummern: Optional[int] = Field(default=1, sa_column=Column(Integer))
    ist_standard: Optional[int] = Field(default=0, sa_column=Column(Integer))
    aktiv: Optional[int] = Field(default=1, sa_column=Column(Integer))


class Vorlage(VorlageBase, table=True):
    __tablename__ = "vorlagen"
    id: Optional[int] = Field(default=None, primary_key=True)


class VorlageRead(VorlageBase):
    id: int


class VorlageCreate(VorlageBase):
    pass


class VorlageUpdate(SQLModel):
    name: Optional[str] = None
    typ: Optional[str] = None
    warengruppe_id: Optional[int] = None
    kopftext: Optional[str] = None
    fusstext: Optional[str] = None
    template_datei: Optional[str] = None
    html_content: Optional[str] = None
    mit_zwischensumme: Optional[int] = None
    mit_einzelpreisen: Optional[int] = None
    mit_positionsnummern: Optional[int] = None
    ist_standard: Optional[int] = None
    aktiv: Optional[int] = None
