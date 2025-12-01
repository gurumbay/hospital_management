"""
API routes package.
"""

from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.diagnoses import router as diagnoses_router
from app.api.routes.wards import router as wards_router
from app.api.routes.patients import router as patients_router
from app.api.routes.health import router as health_router

__all__ = [
    "health_router",
    "auth_router",
    "users_router",
    "diagnoses_router",
    "wards_router",
    "patients_router",
]