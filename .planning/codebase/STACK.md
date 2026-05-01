# Technology Stack

## Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | FastAPI | 0.109+ |
| Language | Python | 3.11+ |
| ORM | SQLAlchemy | 2.0+ |
| Database | PostgreSQL (implied) | - |
| Auth | JWT via python-jose | - |
| Validation | Pydantic | 2.0+ |
| CORS | FastAPI CORS middleware | - |

### Key Backend Dependencies
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - ORM
- `python-jose` - JWT handling
- `passlib` - Password hashing
- `pydantic` - Data validation
- `python-multipart` - Form data parsing

## Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 18+ |
| Language | TypeScript | 5+ |
| Build Tool | Vite | 4.5+ |
| Routing | React Router | 6+ |
| State/Fetching | TanStack Query | 5+ |
| Styling | Tailwind CSS | 3+ |
| Icons | Heroicons | - |
| HTTP Client | Axios (via apiClient) | - |
| Forms | Native FormData | - |

### Key Frontend Dependencies
- `@tanstack/react-query` - Server state management
- `react-router-dom` - Client-side routing
- `@heroicons/react` - Icon library
- `axios` - HTTP client
- `tailwindcss` - CSS framework

## Infrastructure

| Component | Technology |
|-----------|-----------|
| DevOps | Docker (implied) |
| Package Manager (BE) | pip |
| Package Manager (FE) | npm |
