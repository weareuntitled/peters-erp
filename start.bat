@echo off
REM GSWIN ERP - Build and Start All Services
REM Usage: just run this script

echo ============================================
echo GSWIN ERP - Starting All Services
echo ============================================

echo.
echo Building and starting services...
docker-compose up --build -d

echo.
echo ============================================
echo Services Started!
echo ============================================
echo Frontend:   http://localhost:5174
echo Backend:    http://localhost:8000
echo API Docs:   http://localhost:8000/docs
echo.
echo To stop: docker-compose down
echo To rebuild: docker-compose up --build -d
echo.
echo ============================================
