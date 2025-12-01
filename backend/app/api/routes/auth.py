from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login user and get access token."""
    auth_service = AuthService(db)
    return auth_service.login(login_data)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    auth_service = AuthService(db)
    return auth_service.register(register_data)


@router.get("/me")
def get_current_user_info(
    current_user = Depends(get_current_active_user)
):
    """Get current user information."""
    return UserResponse.model_validate(current_user)