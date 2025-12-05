"""
API routers package.
"""

from app.api.routes import auth, users, diagnoses, wards, patients, health, reports

health_routers = [health.router]

# List of all routers
api_routers = [
    auth.router,
    users.router,
    diagnoses.router,
    wards.router,
    patients.router,
    reports.router,
]

__all__ = ["health_routers", "api_routers"]