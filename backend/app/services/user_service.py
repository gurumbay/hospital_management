from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_password_hash
from app.core.exceptions import UserNotFoundException


class UserService:
    """Service for user management."""
    
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
    
    def get_user(self, user_id: int) -> UserResponse:
        """Get a user by ID."""
        user = self.user_repo.get(user_id)
        if not user:
            raise UserNotFoundException(user_id)
        return UserResponse.model_validate(user)
    
    def get_users(self, skip: int = 0, limit: int = 100, **filters) -> List[UserResponse]:
        """Get multiple users."""
        users = self.user_repo.get_multi(skip=skip, limit=limit, **filters)
        return [UserResponse.model_validate(user) for user in users]
    
    def create_user(self, user_data: UserCreate) -> UserResponse:
        """Create a new user."""
        # Check if username exists
        if self.user_repo.get_by_username(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        
        # Check if email exists
        if self.user_repo.get_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Hash password and create user
        user_dict = user_data.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        
        db_user = self.user_repo.create(user_dict)
        return UserResponse.model_validate(db_user)
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> UserResponse:
        """Update a user."""
        user = self.user_repo.get(user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        # If password is being updated, hash it
        update_data = user_data.model_dump(exclude_unset=True)
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        updated_user = self.user_repo.update(user, update_data)
        return UserResponse.model_validate(updated_user)
    
    def delete_user(self, user_id: int) -> None:
        """Delete a user."""
        user = self.user_repo.get(user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        self.user_repo.delete(user_id)