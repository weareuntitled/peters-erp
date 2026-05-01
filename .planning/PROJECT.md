# GSWIN Modern ERP

A custom Invoicing CRM/ERP system for German Handwerker (trades) workflow.

## Stack
- Backend: Python (FastAPI) + SQLModel + SQLite + JWT Authentication
- Frontend: React + Vite + Tailwind CSS + TanStack Router + Shadcn UI
- Infrastructure: Docker + Docker Compose
- AI/Workflow: n8n + Ollama

## Constraints
1. `artnr` (Artikelnummer) must remain 1:1 identical to legacy system
2. Document flow: Angebot (AN) → Auftrag (AU) → Lieferschein (LI) → Rechnung (RE)
3. Strict German locale (PDF, date formats, currency)
4. Formula calculations: m², m³, etc. in `dokument_positionen`
5. PDF generation: WeasyPrint for legal invoices
6. Full JWT authentication (access + refresh tokens)

## Team
Solo developer
