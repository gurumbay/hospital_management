from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserCreate, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token
from app.config import settings


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user by username and password."""
        user = self.user_repo.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def login(self, login_data: LoginRequest) -> Token:
        """Login user and return JWT token."""
        user = self.authenticate_user(login_data.username, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )
        
        return Token(access_token=access_token, token_type="bearer")
    
    def register(self, register_data: RegisterRequest) -> UserResponse:
        """Register a new user."""
        # Check if username already exists
        if self.user_repo.get_by_username(register_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        
        # Check if email already exists
        if self.user_repo.get_by_email(register_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Create user data
        user_data = UserCreate(
            email=register_data.email,
            username=register_data.username,
            password=register_data.password,
            first_name=register_data.first_name,
            last_name=register_data.last_name,
            father_name=register_data.father_name,
            role="doctor"  # Default role for new users
        )
        
        # Hash password and create user
        user_dict = user_data.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        
        db_user = self.user_repo.create(user_dict)
        return UserResponse.model_validate(db_user)
    
    def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from JWT token."""
        from app.core.security import decode_access_token
        
        payload = decode_access_token(token)
        if payload is None:
            return None
        
        username: str = payload.get("sub")
        if username is None:
            return None
        
        return self.user_repo.get_by_username(username)