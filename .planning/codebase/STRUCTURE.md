# Project Structure

## Backend (`backend/app/`)

```
backend/app/
├── __init__.py
├── main.py                 # FastAPI app factory, CORS, router assembly
├── database.py             # Database connection setup
├── routers/
│   ├── __init__.py
│   ├── auth.py             # Authentication endpoints
│   ├── dashboard.py        # Dashboard widgets
│   ├── dokumente.py        # Documents (Angebote, Rechnungen, etc.)
│   ├── kunden.py           # Customer CRUD
│   ├── server.py           # Server info
│   └── warengruppen.py     # Product group CRUD
├── models/
│   ├── __init__.py         # Model exports
│   ├── kunden.py           # Customer model
│   ├── auth.py             # User model
│   └── warengruppen.py     # Warengruppe model
└── dependencies.py         # Shared dependencies (auth, db session)
```

## Frontend (`frontend/src/`)

```
frontend/src/
├── api/
│   └── apiClient.ts        # Axios HTTP client
├── components/
│   ├── customers/          # Customer-specific components
│   ├── documents/         # Document-specific components
│   ├── layout/
│   │   ├── AppSidebar.tsx  # Main sidebar navigation
│   │   ├── GlobalSearch.tsx # Navbar search
│   │   └── TopBar.tsx      # Top navigation bar
│   └── ui/
│       ├── Badge.tsx       # Badge component
│       ├── Button.tsx      # Button component
│       ├── Modal.tsx       # Modal dialog
│       ├── PageHeader.tsx  # Page header component
│       ├── Pagination.tsx  # Pagination component
│       └── Skeleton.tsx    # Loading skeleton
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   └── useTranslation.ts   # i18n hook
├── pages/
│   ├── customers/          # Customer pages (legacy)
│   ├── dashboard/
│   │   └── DashboardPage.tsx
│   ├── documents/
│   │   ├── AngebotePage.tsx       # Quotes
│   │   ├── MahnungenPage.tsx      # Reminders
│   │   ├── RechnungenPage.tsx     # Invoices
│   │   ├── StornoPage.tsx         # Cancellations
│   │   └── RechnungDetailPage.tsx
│   ├── products/           # Product pages (legacy)
│   ├── stammdaten/
│   │   ├── artikel/
│   │   │   ├── ArtikelPage.tsx     # Article list
│   │   │   ├── ArtikelDetailPage.tsx
│   │   │   ├── ArtikelEditPage.tsx
│   │   │   └── ArtikelNewPage.tsx
│   │   ├── kunden/
│   │   │   ├── KundenPage.tsx      # Customer list
│   │   │   └── KundenEditPage.tsx  # Customer edit
│   │   └── warengruppen/
│   │       └── WarengruppenPage.tsx # Product groups
│   └── templates/         # Document templates
├── App.tsx                 # Root component, routing
└── main.tsx               # Entry point
```

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `backend/app/routers/` | API endpoint definitions |
| `backend/app/models/` | Database ORM models |
| `frontend/src/pages/` | Page components (route targets) |
| `frontend/src/components/` | Reusable UI components |
| `frontend/src/api/` | HTTP client configuration |
