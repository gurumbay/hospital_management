"""
Central import for all repositories.
"""

from app.repositories.base import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.diagnosis_repository import DiagnosisRepository
from app.repositories.ward_repository import WardRepository
from app.repositories.patient_repository import PatientRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "DiagnosisRepository",
    "WardRepository",
    "PatientRepository",
]