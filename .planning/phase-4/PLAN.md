# Phase 4: PDF Generation — Implementation Plan

## Goal
Implement WeasyPrint-based PDF generation for German invoices (Rechnung) and offers (Angebot) with professional HTML templates styled via Tailwind CSS.

## Prerequisites
- Phase 3 complete (business logic, document models, CRUD API)
- WeasyPrint dependencies already in Dockerfile
- Existing Dokument model with typ, kunde_id, datum, betrag, steuernr fields

---

## Plan 4-1: PDF Service & Templates

### Wave 1: Core PDF Service

**Task 1.1: Create PDF service module**
- File: `backend/app/services/__init__.py` (create directory)
- File: `backend/app/services/pdf_service.py`
- Implement `PDFService` class with:
  - `generate_pdf(document_id: int, template_name: str) -> bytes`
  - `render_html(document_id: int, template_name: str) -> str`
  - `get_template_for_type(doc_type: str) -> str`
- Use Jinja2 for HTML template rendering
- Use WeasyPrint to convert HTML → PDF
- Handle German locale (dates, currency formatting)

**Task 1.2: Create Jinja2 template structure**
- Directory: `backend/app/templates/pdf/`
- Files:
  - `base.html` — shared layout (header, footer, page margins)
  - `rechnung.html` — invoice template (extends base)
  - `angebot.html` — offer/quote template (extends base)
- Include Tailwind CSS via CDN link in `<style>` block (WeasyPrint-compatible subset)
- German business formatting:
  - Company header with logo placeholder
  - Recipient address block
  - Document number, date, due date
  - Line items table (Pos, Beschreibung, Menge, Einzelpreis, Gesamtpreis)
  - Subtotal, MwSt (19%), Total
  - Payment terms, bank details
  - Legal footer (Steuernummer, USt-IdNr, Handelsregister)

**Task 1.3: Create Tailwind-compatible CSS for PDF**
- File: `backend/app/templates/pdf/styles.css`
- Use only WeasyPrint-supported CSS properties
- Page size: A4 portrait with @page rules
- Margins: 25mm top/bottom, 20mm left/right
- Typography: professional German business font stack
- Table styling for line items
- Page break handling for long documents

### Wave 2: API Endpoints

**Task 2.1: Create PDF router**
- File: `backend/app/routers/pdf.py`
- Endpoints:
  - `GET /api/dokumente/{id}/pdf` — generate and return PDF as download
  - `GET /api/dokumente/{id}/pdf/preview` — return rendered HTML for preview
- Query parameters:
  - `template` (optional) — override default template selection
  - `download` (optional, bool) — force Content-Disposition: attachment
- Response headers: `Content-Type: application/pdf`, filename with document number
- Error handling: 404 for missing document, 422 for unsupported doc type

**Task 2.2: Register router and add dependencies**
- Update `backend/app/routers/__init__.py` to include pdf router
- Update `backend/app/main.py` to register the route
- Add `jinja2` to requirements.txt if not present

### Wave 3: Data Integration

**Task 3.1: Create PDF data assembler**
- File: `backend/app/services/pdf_data.py`
- Function `assemble_pdf_data(document_id: int) -> dict`:
  - Load Dokument with all fields
  - Load associated Kunde (name, address, contact)
  - Load Positionen (line items with artikel details)
  - Calculate subtotals, tax (19% MwSt), grand total
  - Format dates as DD.MM.YYYY (German standard)
  - Format currency as EUR with comma decimal (1.234,56 €)
- Handle missing/optional fields gracefully

**Task 3.2: German locale formatting utilities**
- File: `backend/app/services/formatting.py`
- Functions:
  - `format_currency(amount: float) -> str` — "1.234,56 €"
  - `format_date(dt: datetime) -> str` — "28.04.2026"
  - `format_document_number(typ: str, id: int) -> str` — "RE-2026-0001"
  - `get_document_title(typ: str) -> str` — "Rechnung" / "Angebot"

### Wave 4: Testing & Validation

**Task 4.1: Create test for PDF generation**
- File: `backend/tests/test_pdf.py`
- Test cases:
  - Generate PDF for Rechnung with valid data
  - Generate PDF for Angebot with valid data
  - Verify PDF is valid (non-empty bytes, starts with %PDF)
  - Test HTML preview endpoint returns valid HTML
  - Test 404 for non-existent document
  - Test German formatting (dates, currency, umlauts)

**Task 4.2: Create sample data fixture**
- Ensure test database has sample Dokument + Kunde + Positionen
- Verify proper rendering of umlauts (ä, ö, ü, ß)
- Verify correct MwSt calculation

---

## Success Criteria
- [ ] `GET /api/dokumente/{id}/pdf` returns valid PDF for Rechnung
- [ ] `GET /api/dokumente/{id}/pdf` returns valid PDF for Angebot
- [ ] `GET /api/dokumente/{id}/pdf/preview` returns rendered HTML
- [ ] PDF contains correct German formatting (dates, currency)
- [ ] PDF contains all required invoice fields (legal compliance)
- [ ] Umlauts and special characters render correctly
- [ ] Line items table renders with correct calculations
- [ ] Tests pass for PDF generation

## Dependencies
- WeasyPrint (already in Dockerfile)
- Jinja2 (template engine)
- Existing Dokument, Kunde, Position models from Phase 2/3

## Risks & Mitigations
- **Risk:** Tailwind CSS not fully supported by WeasyPrint
  - **Mitigation:** Use WeasyPrint-compatible CSS subset, test early
- **Risk:** Font rendering issues with German characters
  - **Mitigation:** Include proper font-face declarations, test umlauts
- **Risk:** Performance on large documents
  - **Mitigation:** Keep templates simple, consider async generation for batch
