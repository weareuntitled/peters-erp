# GSWIN ERP - Phase 1: Infrastructure & Auth

## Research

### Tech Stack Review
- **FastAPI + SQLModel**: Single class = DB model + Pydantic schema. Perfect for rapid API development with type safety
- **JWT Authentication**: Standard for web APIs. We'll use `python-jose` for encoding/decoding and `passlib` for password hashing
- **SQLite + WAL Mode**: Existing database. WAL allows concurrent reads for n8n workflow
- **Docker Compose**: For local development and deployment orchestration

### Security Considerations
- Passwords must be hashed with bcrypt (passlib)
- JWT tokens should have short expiration (30min access, 7d refresh)
- Refresh tokens must be stored securely and invalidated on logout
- All API routes should be protected by auth middleware

### Database Design
The existing `gswin_modern.db` has:
- 11 tables: kunden, artikel, dokumente, dokument_positionen, etc.
- 17,000+ records
- No foreign key constraints (Paradox 7 format)
- We'll add a new `users` table for authentication

## Plan

### Task 1: Docker Setup
Create `Dockerfile` for Python backend with system dependencies
Create `docker-compose.yml` to orchestrate:
- FastAPI backend (port 8000)
- React frontend (port 5173)
- n8n (port 5678)
- Ollama (port 11434)

### Task 2: Backend Structure
Create `backend/` directory with:
- `main.py` - FastAPI app initialization
- `database.py` - SQLModel engine + session management
- `config.py` - Settings via pydantic-settings
- `auth/` - JWT auth logic
- `models/` - SQLModel classes for all tables
- `routers/` - REST endpoints (will be added in later phases)

### Task 3: SQLModel Classes
Implement all 11 existing tables as SQLModel classes:
- `users` (new)
- `kunden` (existing)
- `artikel` (existing)
- `warengruppen` (existing)
- `dokumente` (existing)
- `dokument_positionen` (existing)
- `zahlungen` (existing)
- `vorlagen` (existing)
- `formeln` (existing)
- `nummernkreise` (existing)
- `steuersaetze` (existing)

### Task 4: Authentication System
- User model with password hash
- JWT token generation/verification
- Access/refresh token rotation
- Registration endpoint (admin-only)
- Login endpoint (returns tokens)
- Refresh endpoint
- Logout endpoint (invalidate refresh token)
- Auth dependency for protected routes

### Task 5: Database Connection
- Connect to existing `gswin_modern.db`
- Enable WAL mode for concurrent access
- Add `users` table with proper constraints
- Implement session management for FastAPI

### Task 6: Configuration
- `.env` file with secrets
- Settings class for environment variables
- Debug mode toggle

### Task 7: API Documentation
- Auto-generated Swagger/OpenAPI docs
- Ready for n8n integration

## Next Steps

1. Create Dockerfile and docker-compose.yml
2. Set up FastAPI project structure
3. Implement SQLModel classes
4. Build authentication system
5. Configure database connection
6. Test basic endpoints