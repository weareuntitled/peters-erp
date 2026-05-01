"""Numbering service — atomic document number management."""

from typing import Optional
from sqlmodel import Session, text


class NumberingService:
    """Manages document numbering with atomic operations (Nummernkreise)."""

    def get_next_number(self, doc_type: str, session: Session) -> str:
        """
        Get next document number for given type using atomic increment.
        
        Format: {TYPE}-{YEAR}-{SEQUENCE:04d}
        Example: RE-2026-0042
        """
        from datetime import datetime
        year = datetime.now().year

        # Try to get current counter from nummernkreise table
        try:
            result = session.exec(
                text(
                    "SELECT aktuell FROM nummernkreise "
                    "WHERE typ = :typ AND jahr = :jahr"
                ),
                params={"typ": doc_type.upper(), "jahr": year},
            )
            current = result.scalar()

            if current is not None:
                # Increment
                next_num = current + 1
                session.exec(
                    text(
                        "UPDATE nummernkreise SET aktuell = :next "
                        "WHERE typ = :typ AND jahr = :jahr"
                    ),
                    params={"next": next_num, "typ": doc_type.upper(), "jahr": year},
                )
            else:
                # Create new entry
                next_num = 1
                session.exec(
                    text(
                        "INSERT INTO nummernkreise (typ, jahr, aktuell) "
                        "VALUES (:typ, :jahr, :next)"
                    ),
                    params={"typ": doc_type.upper(), "jahr": year, "next": next_num},
                )

            session.commit()
        except Exception:
            # Table doesn't exist — fall back to counting documents
            result = session.exec(
                text(
                    "SELECT COUNT(*) FROM dokument WHERE typ = :typ"
                ),
                params={"typ": doc_type.upper()},
            )
            count = result.scalar() or 0
            next_num = count + 1

        return f"{doc_type.upper()}-{year}-{next_num:04d}"


# Singleton
numbering_service = NumberingService()
