from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Hospital Management System API",
        "version": settings.VERSION,
        "docs": "/docs",
        "api_base": settings.API_V1_STR,
    }


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "hospital-api",
        "database": "postgresql",
        "version": settings.VERSION
    }