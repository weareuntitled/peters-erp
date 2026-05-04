"""German locale formatting utilities for PDF generation."""

from datetime import datetime
from typing import Optional

from .date_correction import correct_date_string


def format_currency(amount: Optional[float]) -> str:
    """Format amount as German currency: 1.234,56 EUR"""
    if amount is None:
        return "0,00 \u20ac"
    
    # Format with 2 decimal places
    formatted = f"{amount:,.2f}"
    # Swap . and , for German format
    # First replace . with temp, then , with ., then temp with ,
    formatted = formatted.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{formatted} \u20ac"


def format_date(dt: Optional[datetime]) -> str:
    """Format datetime as German date: DD.MM.YYYY"""
    if dt is None:
        return ""
    if isinstance(dt, str):
        dt = correct_date_string(dt)
        if "." in dt and "-" not in dt[:10]:
            dt = datetime.strptime(dt[:10], "%d.%m.%Y")
        else:
            dt = datetime.fromisoformat(dt)
    return dt.strftime("%d.%m.%Y")


def format_document_number(typ: str, doc_id: int) -> str:
    """Format document number: RE-2026-0001"""
    year = datetime.now().year
    return f"{typ.upper()}-{year}-{doc_id:04d}"


def get_document_title(typ: str) -> str:
    """Get German title for document type."""
    titles = {
        "RE": "Rechnung",
        "AN": "Angebot",
        "GU": "Gutschrift",
        "LI": "Lieferschein",
        "AB": "Auftragsbest\u00e4tigung",
        "MA": "Mahnung",
    }
    return titles.get(typ.upper(), f"Dokument ({typ})")


def format_mwst_rate(rate: Optional[float]) -> str:
    """Format MwSt rate as percentage string."""
    if rate is None:
        return "19%"
    return f"{rate:.0f}%"
