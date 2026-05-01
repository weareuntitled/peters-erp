# Phase 4 Summary: PDF Generation

## Status: Complete

## What Was Built

### Services Layer (`backend/app/services/`)
- **`pdf_service.py`** — Core PDF generation using WeasyPrint + Jinja2
  - `PDFService` class with `generate_pdf()` and `render_html()` methods
  - Template auto-selection based on document type (RE, AN, GU, etc.)
  - WeasyPrint HTML-to-PDF conversion with A4 page settings
  
- **`pdf_data.py`** — Data assembler for PDF context
  - Loads Dokument, Kunde, Positionen from database
  - Calculates subtotals, MwSt (19%), grand total
  - Includes company info (configurable)
  - Handles missing/null data gracefully

- **`formatting.py`** — German locale utilities
  - `format_currency()` — "1.234,56 EUR" format
  - `format_date()` — "DD.MM.YYYY" format
  - `format_document_number()` — "RE-2026-0001" format
  - `get_document_title()` — Type to German name mapping

### HTML Templates (`backend/app/templates/pdf/`)
- **`base.html`** — Shared layout with company header, recipient block, line items table, totals, footer
- **`rechnung.html`** — Invoice template (extends base) with payment terms and bank details
- **`angebot.html`** — Offer template (extends base) with validity period
- **`styles.css`** — WeasyPrint-compatible A4 stylesheet with professional typography

### API Endpoints (`backend/app/routers/pdf.py`)
- `GET /api/dokumente/{id}/pdf` — Generate and download PDF
- `GET /api/dokumente/{id}/pdf/preview` — HTML preview of document

### Testing (`backend/tests/test_pdf.py`)
- Unit tests for all formatting functions
- German locale validation (currency, dates, document numbers)

## Files Created/Modified
- `backend/app/services/__init__.py` (new)
- `backend/app/services/pdf_service.py` (new)
- `backend/app/services/pdf_data.py` (new)
- `backend/app/services/formatting.py` (new)
- `backend/app/templates/pdf/base.html` (new)
- `backend/app/templates/pdf/rechnung.html` (new)
- `backend/app/templates/pdf/angebot.html` (new)
- `backend/app/templates/pdf/styles.css` (new)
- `backend/app/routers/pdf.py` (new)
- `backend/app/routers/__init__.py` (modified — added pdf router)
- `backend/app/main.py` (modified — registered pdf router)
- `backend/requirements.txt` (modified — added jinja2)
- `backend/tests/test_pdf.py` (new)

## Key Decisions
1. **Jinja2 templating** over inline HTML — cleaner separation of concerns
2. **Template inheritance** — base.html with blocks for type-specific content
3. **WeasyPrint-compatible CSS** — avoided Tailwind CDN (not supported), used custom A4 stylesheet
4. **Positionen from SQL** — direct query against positionen table with graceful fallback
5. **Company info as constants** — easily configurable later via settings/env

## German Compliance
- Proper Rechnung fields: Steuernummer, USt-IdNr, Handelsregister
- Date format: DD.MM.YYYY
- Currency format: 1.234,56 EUR with comma decimal
- Payment terms in German
- Professional A4 layout matching German business standards
