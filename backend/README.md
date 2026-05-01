# GSWIN ERP - Backend Structure

This directory contains the backend application structure for the GSWIN ERP system.

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   └── models.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── query_params.py
│   │   ├── responses.py
│   │   ├── kunden.py
│   │   ├── artikel.py
│   │   ├── dokumente.py
│   │   └── zahlungen.py
│   └── routers/
│       ├── __init__.py
│       ├── kunden.py
│       ├── artikel.py
│       ├── dokumente.py
│       └── zahlungen.py
├── data/
│   └── gswin_modern.db
├── Dockerfile
├── requirements.txt
└── README.md
```

## Files

### Main Application Entry Point
`app/main.py` - FastAPI application initialization and routing

### Database Configuration
`app/database.py` - Database connection setup with WAL mode

### Authentication
`app/auth/router.py` - JWT authentication endpoints
`app/auth/models.py` - Auth-related models

### Models
`app/models/query_params.py` - Query parameter models for pagination and sorting
`app/models/responses.py` - Generic response models
`app/models/kunden.py` - Kunde entity model
`app/models/artikel.py` - Artikel entity model
`app/models/dokumente.py` - Dokument entity model
`app/models/zahlungen.py` - Zahlung entity model

### Routers
`app/routers/kunden.py` - Kunde API endpoints
`app/routers/artikel.py` - Artikel API endpoints
`app/routers/dokumente.py` - Dokument API endpoints
`app/routers/zahlungen.py` - Zahlung API endpoints

## Implementation Status

This directory structure is ready for implementation of Phase 2: CRUD API with pagination, filtering, and sorting capabilities.