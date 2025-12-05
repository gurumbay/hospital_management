from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api import health_routers, api_routers


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
        allow_origins=["http://localhost:3000", "http://localhost:8000"],
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