from fastapi import HTTPException, status


class HospitalException(HTTPException):
    """Base exception for hospital application."""
    pass


class NotFoundException(HospitalException):
    """Resource not found."""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail
        )


class BadRequestException(HospitalException):
    """Bad request."""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class UnauthorizedException(HospitalException):
    """Unauthorized access."""
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(HospitalException):
    """Forbidden access."""
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


# Specific exceptions
class PatientNotFoundException(NotFoundException):
    def __init__(self, patient_id: int):
        super().__init__(f"Patient with id {patient_id} not found")


class WardNotFoundException(NotFoundException):
    def __init__(self, ward_id: int):
        super().__init__(f"Ward with id {ward_id} not found")


class DiagnosisNotFoundException(NotFoundException):
    def __init__(self, diagnosis_id: int):
        super().__init__(f"Diagnosis with id {diagnosis_id} not found")


class UserNotFoundException(NotFoundException):
    def __init__(self, user_id: int):
        super().__init__(f"User with id {user_id} not found")


class WardCapacityException(BadRequestException):
    def __init__(self, ward_name: str):
        super().__init__(f"Ward '{ward_name}' has reached maximum capacity")