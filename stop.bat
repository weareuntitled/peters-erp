@echo off
REM GSWIN ERP - Stop All Services

echo Stopping GSWIN ERP services...
docker-compose down

echo.
echo All services stopped.
