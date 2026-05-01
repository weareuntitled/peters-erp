# Architecture

## Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Vite + TanStack Query + React Router + TailwindCSS)   │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────┐
│                   FastAPI Backend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Routers   │  │   Models    │  │    Schemas      │ │
│  │ (API paths) │  │  (SQLAlchemy)│  │   (Pydantic)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│         │                │                              │
│         └────────────────┼──────────────────────────────│
│                          │                              │
│              ┌───────────▼───────────┐                  │
│              │   Database Layer      │                  │
│              │   (PostgreSQL)        │                  │
│              └───────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Frontend Layers
1. **Pages** (`src/pages/`) - Route components, page-level logic
2. **Components** (`src/components/`) - Reusable UI components
3. **API Client** (`src/api/`) - HTTP communication layer
4. **Hooks** (`src/hooks/`) - Shared logic (auth, translation)

### Backend Layers
1. **Routers** (`app/routers/`) - API endpoint definitions, request handling
2. **Models** (`app/models/`) - SQLAlchemy ORM models, database schema
3. **Schemas** (`app/models/`) - Pydantic models for request/response validation
4. **Main App** (`app/main.py`) - FastAPI app factory, CORS, routing assembly

## Key Patterns

### API Design
- RESTful endpoints: `GET/POST/PUT/DELETE /ressource`
- Pagination: `?skip=X&limit=Y`
- Search: `?bezeichnung=search` (filter param)
- JWT Bearer token authentication

### Frontend Patterns
- TanStack Query for all server data (queries + mutations)
- Query key factory pattern: `['entity', id, ...params]`
- Optimistic updates via `queryClient.setQueryData`
- Form handling via FormData + native HTML forms

### Backend Patterns
- Pydantic schemas for I/O validation
- SQLAlchemy async for database operations
- Dependency injection via FastAPI `Depends()`
- `HTTPException` for error responses

## Security
- JWT-based stateless authentication
- CORS configured for frontend origin
- Password hashing with bcrypt
- Input validation via Pydantic
