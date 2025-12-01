from typing import Optional
from pydantic import EmailStr, Field
from app.schemas.base import BaseSchema
from app.models.user import UserRole


class UserBase(BaseSchema):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    father_name: Optional[str] = Field(None, max_length=50)
    role: UserRole = UserRole.DOCTOR
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=6)


class UserUpdate(BaseSchema):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    father_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user responses."""
    id: int


class UserInDB(UserResponse):
    """Schema for user in database (internal use)."""
    hashed_password: str