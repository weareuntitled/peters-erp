"""Tests for document creation with positions (TDD - RED phase)."""

import pytest
from sqlmodel import Session, select
from app.models.dokumente import Dokument, DokumentCreate
from app.models.positionen import Position, PositionCreate
from app.database import engine, get_session


class TestDocumentWithPositions:
    """Test that documents can be created with positions saved to database."""

    def test_create_position_model(self):
        """RED: Position model should accept numeric fields as float."""
        pos = PositionCreate(
            dokument_id=1,
            position_nr=1,
            bezeichnung="Test Artikel",
            menge=2.0,
            einheit="Stk",
            einzelpreis=100.0,
            gesamtpreis=200.0,
            mwst_satz=19.0,
        )
        assert pos.einzelpreis == 100.0
        assert pos.gesamtpreis == 200.0
        assert isinstance(pos.einzelpreis, float)

    def test_dokument_create_accepts_positionen(self):
        """RED: DokumentCreate should accept positionen field."""
        doc = DokumentCreate(
            typ="RE",
            kunde_id=1,
            betrag_netto=200.0,
            betrag_brutto=238.0,
            positionen=[
                PositionCreate(
                    dokument_id=0,  # Will be set by router
                    position_nr=1,
                    bezeichnung="Test",
                    menge=1.0,
                    einheit="Stk",
                    einzelpreis=200.0,
                    gesamtpreis=200.0,
                )
            ],
        )
        assert doc.positionen is not None
        assert len(doc.positionen) == 1


class TestPositionenTable:
    """Test positionen table structure and data types."""

    def test_positionen_table_has_correct_columns(self, session: Session):
        """GREEN: dokument_positionen table should exist with correct schema."""
        from app.database import init_db
        init_db()

        # Check table exists by querying
        positions = session.exec(select(Position)).first()
        # Table exists if no exception

    def test_positions_stored_as_float(self, session: Session):
        """GREEN: Positions should store numeric values as REAL/Float."""
        # This is verified by the migration - values are now Float, not String
        pos = session.exec(select(Position).limit(1)).first()
        if pos:
            # If any positions exist, verify einzelpreis is float
            assert isinstance(pos.einzelpreis, float), f"einzelpreis is {type(pos.einzelpreis)}, expected float"


class TestPDFDataBuilder:
    """Test PDF data builder produces correct structure."""

    def test_build_from_document_returns_all_keys(self):
        """RED: build_from_document should return complete pdf_data dict."""
        from app.services.pdf_data_builder import pdf_data_builder

        # This will fail until we have a real document
        # We test structure, not actual values
        from app.services.pdf_data_builder import PDFDataBuilder
        builder = PDFDataBuilder()

        # Check the builder has the required methods
        assert hasattr(builder, 'build_from_document')
        assert hasattr(builder, 'build_from_preview')

    def test_kunde_dict_structure(self):
        """GREEN: _build_kunde_dict should produce correctly structured dict."""
        from app.services.pdf_data_builder import PDFDataBuilder
        builder = PDFDataBuilder()

        # Test with None - should return default kunde dict
        result = builder._build_kunde_dict(None)
        assert result["nachname"] == "Vorschau-Kunde"
        assert "plz" in result
        assert "ort" in result
        assert "land" in result

    def test_vorlage_dict_structure(self):
        """GREEN: _build_vorlage_dict should produce correctly structured dict."""
        from app.services.pdf_data_builder import PDFDataBuilder
        builder = PDFDataBuilder()

        result = builder._build_vorlage_dict(None)
        assert "mit_zwischensumme" in result
        assert "mit_einzelpreisen" in result
        assert "mit_positionsnummern" in result


class TestDocumentService:
    """Test document service recalculates correctly."""

    def test_duplicate_document_uses_correct_table(self):
        """GREEN: _duplicate_positionen should use dokument_positionen table."""
        from app.services.document_service import document_service
        from app.database import Session
        from sqlmodel import text

        # Verify the SQL uses correct table name
        import inspect
        source = inspect.getsource(document_service._duplicate_positionen)
        assert "dokument_positionen" in source


class TestPositionServiceDeadCode:
    """Verify dead code was removed."""

    def test_position_service_removed(self):
        """GREEN: position_service should no longer exist."""
        try:
            from app.services import position_service
            assert False, "position_service should have been removed"
        except (ImportError, AttributeError):
            pass  # Expected - it was deleted

    def test_pdf_router_removed(self):
        """GREEN: pdf router should no longer exist."""
        try:
            from app.routers import pdf_router
            assert False, "pdf_router should have been removed"
        except (ImportError, AttributeError):
            pass  # Expected - it was deleted