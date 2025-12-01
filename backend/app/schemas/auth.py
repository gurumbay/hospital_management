from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    """Schema for authentication token."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload."""
    username: str


class LoginRequest(BaseModel):
    """Schema for login request."""
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class RegisterRequest(BaseModel):
    """Schema for registration request."""
    email: str = Field(..., min_length=3)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=2)
    last_name: str = Field(..., min_length=2)
    father_name: Optional[str] = None