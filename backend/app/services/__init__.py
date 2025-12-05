"""
Central import for all services.
"""

from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.diagnosis_service import DiagnosisService
from app.services.ward_service import WardService
from app.services.patient_service import PatientService
from app.services.report_service import ReportService

__all__ = [
    "AuthService",
    "UserService",
    "DiagnosisService",
    "WardService",
    "PatientService",
    "ReportService",
]