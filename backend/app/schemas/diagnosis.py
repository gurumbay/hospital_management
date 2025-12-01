from typing import Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class DiagnosisBase(BaseSchema):
    """Base diagnosis schema."""
    name: str = Field(..., min_length=2, max_length=100)


class DiagnosisCreate(DiagnosisBase):
    """Schema for creating a diagnosis."""
    pass


class DiagnosisUpdate(BaseSchema):
    """Schema for updating a diagnosis."""
    name: Optional[str] = None


class DiagnosisResponse(DiagnosisBase):
    """Schema for diagnosis responses."""
    id: int