from typing import Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class WardBase(BaseSchema):
    """Base ward schema."""
    name: str = Field(..., min_length=2, max_length=50)
    max_capacity: int = Field(..., gt=0, le=100)
    diagnosis_id: Optional[int] = None


class WardCreate(WardBase):
    """Schema for creating a ward."""
    pass


class WardUpdate(BaseSchema):
    """Schema for updating a ward."""
    name: Optional[str] = None
    max_capacity: Optional[int] = None
    diagnosis_id: Optional[int] = None


class WardResponse(WardBase):
    """Schema for ward responses."""
    id: int
    current_occupancy: int = 0