# GSWIN ERP - Phase 1: Infrastructure & Auth

## Goal
Set up Docker orchestration, FastAPI backend with SQLModel, and full JWT authentication system for the GSWIN ERP.

## Status
- [x] Project initialized with GSD workflow
- [ ] Docker Compose setup (backend, frontend, n8n, ollama)
- [ ] FastAPI backend scaffold with SQLModel classes
- [ ] JWT authentication system (access/refresh tokens)
- [ ] Database connection to gswin_modern.db

## Tasks
1. Create Dockerfile for backend
2. Create requirements.txt
3. Implement SQLModel classes for users, kunden, artikel, dokumente, positionen
4. Implement JWT auth system (login, register, refresh, logout)
5. Create database connection with WAL mode
6. Write main.py FastAPI app
7. Set up .env file with secrets

## Notes
- The auth system will support full refresh token rotation for security
- Users table will be added to the existing database
- All models will be compatible with existing database schema
