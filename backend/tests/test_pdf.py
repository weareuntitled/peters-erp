"""Tests for Phase 4: PDF Generation."""

import pytest
from datetime import datetime
from app.services.formatting import (
    format_currency,
    format_date,
    format_document_number,
    get_document_title,
    format_mwst_rate,
)


class TestFormatCurrency:
    """Test German currency formatting."""

    def test_basic_amount(self):
        assert format_currency(100.00) == "100,00 \u20ac"

    def test_thousands_separator(self):
        assert format_currency(1234.56) == "1.234,56 \u20ac"

    def test_large_amount(self):
        assert format_currency(12345678.90) == "12.345.678,90 \u20ac"

    def test_zero(self):
        assert format_currency(0) == "0,00 \u20ac"

    def test_none(self):
        assert format_currency(None) == "0,00 \u20ac"

    def test_small_amount(self):
        assert format_currency(0.99) == "0,99 \u20ac"


class TestFormatDate:
    """Test German date formatting."""

    def test_basic_date(self):
        dt = datetime(2026, 4, 28, 12, 0, 0)
        assert format_date(dt) == "28.04.2026"

    def test_single_digit_day(self):
        dt = datetime(2026, 1, 5)
        assert format_date(dt) == "05.01.2026"

    def test_none(self):
        assert format_date(None) == ""


class TestFormatDocumentNumber:
    """Test document number formatting."""

    def test_rechnung(self):
        result = format_document_number("RE", 1)
        assert result.startswith("RE-")
        assert result.endswith("-0001")

    def test_angebot(self):
        result = format_document_number("AN", 42)
        assert result.startswith("AN-")
        assert result.endswith("-0042")

    def test_uppercase(self):
        result = format_document_number("re", 1)
        assert result.startswith("RE-")


class TestGetDocumentTitle:
    """Test document title mapping."""

    def test_rechnung(self):
        assert get_document_title("RE") == "Rechnung"

    def test_angebot(self):
        assert get_document_title("AN") == "Angebot"

    def test_gutschrift(self):
        assert get_document_title("GU") == "Gutschrift"

    def test_unknown(self):
        result = get_document_title("XX")
        assert "XX" in result

    def test_case_insensitive(self):
        assert get_document_title("re") == "Rechnung"


class TestFormatMwstRate:
    """Test MwSt rate formatting."""

    def test_standard_rate(self):
        assert format_mwst_rate(19.0) == "19%"

    def test_reduced_rate(self):
        assert format_mwst_rate(7.0) == "7%"

    def test_none_defaults_to_19(self):
        assert format_mwst_rate(None) == "19%"
