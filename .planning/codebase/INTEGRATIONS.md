# Integrations

## Backend Integrations

### Database
- **PostgreSQL** via SQLAlchemy 2.0+ async engine
- Connection pooling via `create_async_engine`
- Session management via `AsyncSession`

### Authentication
- **JWT Tokens** via `python-jose`
- Password hashing via `passlib` with bcrypt

### External Services
- No third-party API integrations identified
- Email sending likely via SMTP (not implemented)

## Frontend Integrations

### API Layer
- **Axios-based apiClient** (`src/api/apiClient.ts`)
- Centralized HTTP client with interceptors
- Base URL configured for backend (port 8000)

### Routing
- **React Router v6** for SPA navigation
- Nested routes for dashboard, documents, stammdaten

### State Management
- **TanStack Query** for server state (queries, mutations, cache)
- URL-based state for pagination/filters

## Data Flow
```
Frontend (React) → API Client (Axios) → FastAPI Backend → SQLAlchemy → PostgreSQL
```
