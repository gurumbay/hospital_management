from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api import health_routers, api_routers
from fastapi import Request
from fastapi.responses import JSONResponse
import sqlalchemy
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette import status
import logging


def create_application() -> FastAPI:
    """Create and configure FastAPI application."""
    
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        """Handle application startup and shutdown events."""
        await on_startup()
        yield
        await on_shutdown()
    
    # Create FastAPI app with lifespan
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )
    
    configure_middleware(app)
    
    register_routers(app)
    _register_exception_handlers(app)
    
    return app


async def on_startup():
    """Run on application startup."""
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"Database: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    create_default_admin()


async def on_shutdown():
    """Run on application shutdown."""
    print("Shutting down...")


def configure_middleware(app: FastAPI):
    """Configure application middleware."""
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def register_routers(app: FastAPI):
    """Register all API routers."""
    # Health routers (no prefix)
    for router in health_routers:
        app.include_router(router)

    # API routers (with /api/v1 prefix)
    for router in api_routers:
        app.include_router(router, prefix=settings.API_V1_STR)


def _register_exception_handlers(app: FastAPI):
    """Register DB-related exception handlers to return friendly HTTP responses."""

    async def _handle_integrity_error(request: Request, exc: IntegrityError):
        # Try to extract DB-specific message
        orig = getattr(exc, 'orig', None)
        msg = str(orig) if orig is not None else str(exc)

        # Map trigger raised messages to 400
        if 'is full' in msg.lower() or 'ward' in msg.lower() and 'full' in msg.lower():
            return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": msg})

        # Generic integrity error (FK/unique constraint)
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": msg})

    async def _handle_sqlalchemy_error(request: Request, exc: SQLAlchemyError):
        orig = getattr(exc, 'orig', None)
        msg = str(orig) if orig is not None else str(exc)
        # Map trigger "Ward ... is full" to 400 Bad Request
        if 'is full' in msg.lower() or ('ward' in msg.lower() and 'full' in msg.lower()):
            return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": msg})

        # Do not leak full SQL or stack traces; return a concise message
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Database error"})

    app.add_exception_handler(IntegrityError, _handle_integrity_error)
    app.add_exception_handler(SQLAlchemyError, _handle_sqlalchemy_error)

    async def _handle_unhandled_exception(request: Request, exc: Exception):
        # Generic fallback: log exception and return minimal response
        logging.exception('Unhandled exception during request processing')
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Internal server error"})

    app.add_exception_handler(Exception, _handle_unhandled_exception)


def create_default_admin():
    from app.database.connection import SessionLocal
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    from sqlalchemy import select
    
    with SessionLocal() as session:
        result = session.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@gmail.com",
                hashed_password=get_password_hash("admin123"),
                first_name="Администратор",
                last_name="Системы",
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(admin)
            session.commit()


app = create_application()