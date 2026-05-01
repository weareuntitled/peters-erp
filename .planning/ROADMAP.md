1: # GSWIN Modern ERP - Roadmap
2: 
3: ## Milestone 1: Foundation
4: 
5: ### Phase 1: Infrastructure & Auth
6: - Docker Compose orchestration (FastAPI, React, n8n, Ollama)
7: - FastAPI backend with SQLModel classes for all tables
8: - JWT authentication system (full access/refresh token support)
9: - Database connection to `gswin_modern.db`
10: - [x] Completed
11: 
12: ### Phase 2: CRUD API
13: - Full REST endpoints for kunden, artikel, dokumente, positionen
14: - Pagination, filtering, sorting (compatible with TanStack Table)
15: - Swagger/OpenAPI docs for n8n integration
16: - [x] Completed
17: 
18: ### Phase 3: Business Logic
19: - Document duplication (AN→RE) with `vorgaenger_id`
20: - Auto-recalculation of totals from positions
21: - Nummernkreise auto-increment on document creation
22: 
23: ### Phase 4: PDF Generation
24: - WeasyPrint-based German invoice/Angebot PDF endpoint
25: - HTML templates with Tailwind CSS styling
26: 
27: ### Phase 5: Frontend Setup
28: - Clone `satnaing/shadcn-admin` boilerplate
29: - Configure routing and API client
30: - Setup TanStack Table + react-hook-form for data entry
31: 
32: ### Phase 6: Frontend Pages
33: - Data tables for Kunden, Artikel, Dokumente
34: - Forms for creating/editing records
35: - Document detail view with inline position editor
36: 
37: ### Phase 7: n8n Integration
38: - Webhooks on document state changes
39: - Email workflows (invoice sent, payment reminders)
40: - DATEV/CSV export automation
41: 
42: ### Phase 8: Ollama Integration
43: - Text parsing for OCR and unstructured inputs
44: - Auto-categorization of incoming requests into Artikel
45: - Smart search assistant
46: 
47: ### Phase 11: Complete Edit Functionality
- Fix broken `/stammdaten/kunden/new` route (P0)
- Fix dead "Neuer Artikel" button (P0)
- Implement real save mutation in QuoteCreationPage (P0)
- Add edit routes for Angebote and Rechnungen (P1)
- Add detail pages for Mahnungen and Stornierungen (P1)
- Add edit buttons to Kunden, Artikel, Vorlagen lists (P2)
- Remove duplicate backend route definitions (cleanup)
- [ ] 3 plans

Plans:
- [ ] 11-01-PLAN.md — P0 critical fixes: Kunden route, Artikel button, QuoteCreation save
- [ ] 11-02-PLAN.md — Document edit/detail pages: Angebote edit, Rechnungen edit, Mahnungen/Storno detail
- [ ] 11-03-PLAN.md — List view improvements + backend cleanup: edit buttons, Vorlagen cards, duplicate routes

## Backlog
48: 
49: ### Phase 999.1: Follow-up — Phase 1 incomplete plans (BACKLOG)
50: 
51: **Goal:** Resolve plans that ran without producing summaries during Phase 1 execution
52: **Source phase:** 1
53: **Deferred at:** 2026-04-28 during /gsd-next advancement to Phase 2
54: **Plans:**
55: - [ ] 1-1: Infrastructure setup (ran, no SUMMARY.md)
56: - [ ] 1-2: Auth system (ran, no SUMMARY.md)
### Phase 999.2: Voice-to-JSON Offer Generator (BACKLOG)

**Goal:** Integrate a global voice-recording feature that transcribes speech locally (faster-whisper) and uses an LLM to generate structured document drafts (Angebote/Rechnungen) directly in the database.
**Requirements:** TBD (Refer to 12-SPEC.md)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.3: SmartCombobox + Quick-Add (BACKLOG)

**Goal:** Inline search, selection, and creation of customers and articles from document forms. Smart duplicate detection, Warengruppe category chips, and co-occurrence recommendations from purchase history.
**Requirements:** TBD (Refer to 999.3-SPEC.md)
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
