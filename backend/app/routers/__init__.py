from fastapi import APIRouter

# Import routers
from .kunden import router as kunden_router
from .artikel import router as artikel_router
from .dokumente import router as dokumente_router
from .zahlungen import router as zahlungen_router
from .vorlagen import router as vorlagen_router
from .positionen import router as positionen_router
from .firmen_einstellungen import router as firmen_einstellungen_router

# Create a collection of all routers
router = APIRouter()

# Include all routers
router.include_router(kunden_router)
router.include_router(artikel_router)
router.include_router(dokumente_router)
router.include_router(zahlungen_router)
router.include_router(vorlagen_router)
router.include_router(positionen_router)
router.include_router(firmen_einstellungen_router)

# Export all routers
__all__ = [
    "kunden_router",
    "artikel_router",
    "dokumente_router",
    "zahlungen_router",
    "vorlagen_router",
    "positionen_router",
    "firmen_einstellungen_router",
    "router"
]
