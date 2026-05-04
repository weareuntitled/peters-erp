from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

FAKE_YEAR = 2005
REAL_YEAR = 2026


def correct_date_string(value: Optional[str]) -> Optional[str]:
    if not value:
        return value

    raw = value.strip()
    if not raw:
        return raw

    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d.%m.%Y"):
        try:
            dt = datetime.strptime(raw, fmt)
            if dt.year == FAKE_YEAR:
                dt = dt.replace(year=REAL_YEAR)
            return dt.strftime(fmt)
        except ValueError:
            continue

    if raw.startswith(f"{FAKE_YEAR}-"):
        return raw.replace(f"{FAKE_YEAR}-", f"{REAL_YEAR}-", 1)

    return raw


def correct_document_number(value: Optional[str]) -> Optional[str]:
    if not value:
        return value

    out = value
    out = out.replace(f"-{FAKE_YEAR}-", f"-{REAL_YEAR}-")
    out = re.sub(r"(\d{2})2005$", r"\g<1>2026", out)
    return out


def correct_document_dict(payload: dict) -> dict:
    corrected = dict(payload)
    for key in ("datum", "liefertermin", "erstellt_am", "geaendert_am"):
        corrected[key] = correct_date_string(corrected.get(key))
    corrected["dokument_nr"] = correct_document_number(corrected.get("dokument_nr"))
    return corrected
