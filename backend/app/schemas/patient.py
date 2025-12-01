from typing import Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class PatientBase(BaseSchema):
    """Base patient schema."""
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    father_name: Optional[str] = Field(None, max_length=50)
    diagnosis_id: int
    ward_id: Optional[int] = None


class PatientCreate(PatientBase):
    """Schema for creating a patient."""
    pass


class PatientUpdate(BaseSchema):
    """Schema for updating a patient."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    father_name: Optional[str] = None
    diagnosis_id: Optional[int] = None
    ward_id: Optional[int] = None


class PatientResponse(PatientBase):
    """Schema for patient responses."""
    id: int