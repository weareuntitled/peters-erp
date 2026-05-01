"""Tests for PDF data position loading (TDD RED phase)."""

import pytest
from sqlmodel import Session, create_engine, select
from app.models.dokumente import Dokument, DokumentCreate
from app.models.positionen import Position, PositionCreate
from app.services.pdf_data_builder import PDFDataBuilder


import time
import random

class TestPDFDataBuilderPositions:
    """Test position loading in PDF data builder."""

    def test_load_positionen_returns_list_with_data(self, test_session: Session):
        """RED: _load_positionen should return populated list."""
        builder = PDFDataBuilder()
        
        doc_nr = f"TEST-1-{int(time.time())}-{random.randint(1000, 9999)}"
        # Create test document with positions
        doc = Dokument(dokument_nr=doc_nr, typ="RE", kunde_id=1, betrag_netto=100.0, datum="2026-04-30")
        test_session.add(doc)
        test_session.commit()
        test_session.refresh(doc)
        
        pos_nr = random.randint(10000, 99999)
        pos = Position(
            dokument_id=doc.id,
            position_nr=pos_nr,
            bezeichnung="Test",
            menge=2.0,
            einzelpreis=50.0,
            gesamtpreis=100.0,
        )
        test_session.add(pos)
        test_session.commit()

        # Load positions
        result = builder._load_positionen(doc.id, test_session)
        
        assert len(result) == 1
        assert result[0]["bezeichnung"] == "Test"
        assert result[0]["menge"] == 2.0
        assert result[0]["einzelpreis"] == 50.0
        assert "einzelpreis_formatted" in result[0]

    def test_grouped_positionen_always_populated(self, test_session: Session):
        """RED: grouped_positionen should be populated even if no warengruppe."""
        builder = PDFDataBuilder()
        
        doc_nr = f"TEST-2-{int(time.time())}-{random.randint(1000, 9999)}"
        # Create test doc
        doc = Dokument(dokument_nr=doc_nr, typ="RE", datum="2026-04-30")
        test_session.add(doc)
        test_session.commit()
        test_session.refresh(doc)
        
        # 1 pos without WG, 1 with WG
        pos_nr1 = random.randint(10000, 49999)
        pos_nr2 = random.randint(50000, 99999)
        
        pos1 = Position(dokument_id=doc.id, position_nr=pos_nr1, bezeichnung="Pos1", gesamtpreis=10.0)
        pos2 = Position(dokument_id=doc.id, position_nr=pos_nr2, bezeichnung="Pos2", gesamtpreis=20.0, warengruppe_id=1)
        test_session.add(pos1)
        test_session.add(pos2)
        test_session.commit()

        # Build data - grouped_positionen should ALWAYS be present
        pdf_data = builder.build_from_document(doc.id, test_session)
        
        assert pdf_data is not None
        assert "grouped_positionen" in pdf_data
        assert pdf_data["grouped_positionen"] is not None
        assert len(pdf_data["grouped_positionen"]) >= 1

    def test_build_from_preview_returns_positions(self, test_session: Session):
        """RED: build_from_preview should include positions."""
        builder = PDFDataBuilder()
        preview_data = {
            'typ': 'RE',
            'positionen': [
                {'bezeichnung': 'Test', 'menge': 1, 'einzelpreis': 100, 'gesamtspreis': 100}
            ]
        }
        
        result = builder.build_from_preview(preview_data, test_session)
        
        assert len(result["positionen"]) == 1
        assert result["positionen"][0]["bezeichnung"] == "Test"
