"""
Central import for all Pydantic schemas.
"""

from app.schemas.base import BaseSchema, IDSchema, TimestampSchema
from app.schemas.auth import Token, TokenData, LoginRequest, RegisterRequest
from app.schemas.user import UserBase, UserCreate, UserUpdate, UserResponse, UserInDB
from app.schemas.diagnosis import DiagnosisBase, DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse
from app.schemas.ward import WardBase, WardCreate, WardUpdate, WardResponse
from app.schemas.patient import PatientBase, PatientCreate, PatientUpdate, PatientResponse

__all__ = [
    # Base
    "BaseSchema",
    "IDSchema",
    "TimestampSchema",
    
    # Auth
    "Token",
    "TokenData",
    "LoginRequest",
    "RegisterRequest",
    
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserInDB",
    
    # Diagnosis
    "DiagnosisBase",
    "DiagnosisCreate",
    "DiagnosisUpdate",
    "DiagnosisResponse",
    
    # Ward
    "WardBase",
    "WardCreate",
    "WardUpdate",
    "WardResponse",
    
    # Patient
    "PatientBase",
    "PatientCreate",
    "PatientUpdate",
    "PatientResponse",
]