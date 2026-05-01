# Plan: Document Templates System

## Context
GSWIN ERP project migrated data from Paradox DB. Source files at `V:\GSWIN_DANIELBACKUP\GSWIN_DANIELBACKUP\GSWIN\00001` contain HTML document templates (Rechnung.htm, Angebot.htm, etc.) with `$variable` placeholders for merge fields.

## Goal
Implement a template management system where users can:
1. View migrated HTML templates
2. Edit templates with WYSIWYG editor
3. Preview templates with sample data
4. Generate PDFs from documents using templates

## Tasks

### Phase 1: Backend - Template Storage & API
- [x] Update `vorlagen.py` model: add `html_content` field
- [x] Add `VorlageCreate`, `VorlageUpdate` classes
- [x] Create `vorlagen.py` router with CRUD endpoints
- [ ] Register vorlagen router in `app/routers/__init__.py`
- [ ] Add `html_content` column to schema.sql

### Phase 2: Import Existing Templates
- [ ] Write script to import HTML templates from `V:\GSWIN_DANIELBACKUP\GSWIN_DANIELBACKUP\GSWIN\00001\*.htm`
- [ ] Map template types: Angebot.htm → AN, Rechnung.htm → RE, Lieferschein.htm → LI, Gutschrift.htm → GU, Mahnung.htm → MA
- [ ] Insert into vorlagen table with `html_content`

### Phase 3: Frontend - Template List Page
- [ ] Create `TemplatesPage.tsx` listing all templates
- [ ] Add template type filter tabs (AN, RE, LI, GU, MA)
- [ ] Link to template editor

### Phase 4: Frontend - Template Editor with Preview
- [ ] Create `TemplateEditorPage.tsx`
- [ ] Split view: code editor (left) + live preview (right)
- [ ] Use `<iframe>` for preview rendering
- [ ] Replace `$variables` with sample data in preview
- [ ] Save changes via API

### Phase 5: Template Variable System
- [ ] Define standard variables: `$kundnr`, `$datum`, `$aufnr`, `$positionen`, `$summenetto`, `$summesteuer`, `$summebrutto`, `$briefanrede`, `$post1-7`
- [ ] Create preview context with sample kunde/artikel data
- [ ] Implement variable substitution for preview

### Phase 6: PDF Generation Enhancement
- [ ] Update PDF router to use stored `html_content` from vorlagen table
- [ ] Support template selection per document type

## Dependencies
- Backend: FastAPI, SQLModel, WeasyPrint (existing)
- Frontend: React, @tanstack/react-query, Monaco Editor (or CodeMirror for HTML editing)

## Verification
- Template list shows imported templates
- Clicking template opens editor with HTML source
- Preview renders with sample data substituted
- Editing and saving persists to database
- PDF generation uses template from database
