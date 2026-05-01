from sqlmodel import SQLModel, Field, Column, String, Float, Integer, Text
from typing import Optional

class FirmenEinstellungenBase(SQLModel):
    # Stammdaten
    firmenname: Optional[str] = Field(default=None, sa_column=Column(String))
    inhaber_geschaeftsfuehrer: Optional[str] = Field(default=None, sa_column=Column(String))
    strasse: Optional[str] = Field(default=None, sa_column=Column(String))
    plz: Optional[str] = Field(default=None, sa_column=Column(String))
    ort: Optional[str] = Field(default=None, sa_column=Column(String))
    telefon: Optional[str] = Field(default=None, sa_column=Column(String))
    mobiltelefon: Optional[str] = Field(default=None, sa_column=Column(String))
    email: Optional[str] = Field(default=None, sa_column=Column(String))
    website: Optional[str] = Field(default=None, sa_column=Column(String))

    # Bankverbindung
    bankname: Optional[str] = Field(default=None, sa_column=Column(String))
    iban: Optional[str] = Field(default=None, sa_column=Column(String))
    bic: Optional[str] = Field(default=None, sa_column=Column(String))

    # Steuern & Rechtliches
    steuernummer: Optional[str] = Field(default=None, sa_column=Column(String))
    ust_id_nr: Optional[str] = Field(default=None, sa_column=Column(String))
    registergericht: Optional[str] = Field(default=None, sa_column=Column(String))
    registernummer: Optional[str] = Field(default=None, sa_column=Column(String))
    handwerkskammer: Optional[str] = Field(default=None, sa_column=Column(String))
    betriebsnummer: Optional[str] = Field(default=None, sa_column=Column(String))

    # Dokumenten-Defaults
    praefix_angebot: str = Field(default="AN-", sa_column=Column(String))
    praefix_rechnung: str = Field(default="RE-", sa_column=Column(String))
    standard_zahlungsziel: int = Field(default=14, sa_column=Column(Integer))
    standard_mwst_satz: float = Field(default=19.0, sa_column=Column(Float))

    # Standard-Texte
    einleitung_angebot: Optional[str] = Field(default=None, sa_column=Column(Text))
    schlusstext_rechnung: Optional[str] = Field(default=None, sa_column=Column(Text))
    text_35a: Optional[str] = Field(default=None, sa_column=Column(Text))
    info_freistellung: Optional[str] = Field(default=None, sa_column=Column(Text))

    # Dashboard-KPIs
    umsatzziel_monat: float = Field(default=0.0, sa_column=Column(Float))
    umsatzziel_jahr: float = Field(default=0.0, sa_column=Column(Float))

    # Logo
    logo_pfad: Optional[str] = Field(default=None, sa_column=Column(String))

class FirmenEinstellungen(FirmenEinstellungenBase, table=True):
    __tablename__ = "firmen_einstellungen"
    id: int = Field(default=1, primary_key=True)

class FirmenEinstellungenRead(FirmenEinstellungenBase):
    id: int

class FirmenEinstellungenUpdate(SQLModel):
    firmenname: Optional[str] = None
    inhaber_geschaeftsfuehrer: Optional[str] = None
    strasse: Optional[str] = None
    plz: Optional[str] = None
    ort: Optional[str] = None
    telefon: Optional[str] = None
    mobiltelefon: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    bankname: Optional[str] = None
    iban: Optional[str] = None
    bic: Optional[str] = None
    steuernummer: Optional[str] = None
    ust_id_nr: Optional[str] = None
    registergericht: Optional[str] = None
    registernummer: Optional[str] = None
    handwerkskammer: Optional[str] = None
    betriebsnummer: Optional[str] = None
    praefix_angebot: Optional[str] = None
    praefix_rechnung: Optional[str] = None
    standard_zahlungsziel: Optional[int] = None
    standard_mwst_satz: Optional[float] = None
    einleitung_angebot: Optional[str] = None
    schlusstext_rechnung: Optional[str] = None
    text_35a: Optional[str] = None
    info_freistellung: Optional[str] = None
    umsatzziel_monat: Optional[float] = None
    umsatzziel_jahr: Optional[float] = None
