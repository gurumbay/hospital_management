from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.ward_repository import WardRepository
from app.repositories.diagnosis_repository import DiagnosisRepository
from app.schemas.ward import WardCreate, WardUpdate, WardResponse
from app.core.exceptions import WardNotFoundException, DiagnosisNotFoundException


class WardService:
    """Service for ward management."""
    
    def __init__(self, db: Session):
        self.ward_repo = WardRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
    
    def get_ward(self, ward_id: int) -> WardResponse:
        """Get a ward by ID."""
        ward = self.ward_repo.get(ward_id)
        if not ward:
            raise WardNotFoundException(ward_id)
        return WardResponse.model_validate(ward)
    
    def get_wards(self, skip: int = 0, limit: int = 100, **filters) -> List[WardResponse]:
        """Get multiple wards."""
        wards = self.ward_repo.get_multi(skip=skip, limit=limit, **filters)
        return [WardResponse.model_validate(ward) for ward in wards]
    
    def create_ward(self, ward_data: WardCreate) -> WardResponse:
        """Create a new ward."""
        # Check if diagnosis exists
        if ward_data.diagnosis_id and not self.diagnosis_repo.get(ward_data.diagnosis_id):
            raise DiagnosisNotFoundException(ward_data.diagnosis_id)
        
        # Check if ward name already exists
        existing = self.ward_repo.get_by_name(ward_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ward with this name already exists",
            )
        
        db_ward = self.ward_repo.create(ward_data.model_dump())
        return WardResponse.model_validate(db_ward)
    
    def update_ward(self, ward_id: int, ward_data: WardUpdate) -> WardResponse:
        """Update a ward."""
        ward = self.ward_repo.get(ward_id)
        if not ward:
            raise WardNotFoundException(ward_id)
        
        # Check if diagnosis exists
        if ward_data.diagnosis_id and not self.diagnosis_repo.get(ward_data.diagnosis_id):
            raise DiagnosisNotFoundException(ward_data.diagnosis_id)
        
        updated_ward = self.ward_repo.update(
            ward, 
            ward_data.model_dump(exclude_unset=True)
        )
        return WardResponse.model_validate(updated_ward)
    
    def delete_ward(self, ward_id: int) -> None:
        """Delete a ward."""
        ward = self.ward_repo.get(ward_id)
        if not ward:
            raise WardNotFoundException(ward_id)
        
        self.ward_repo.delete(ward_id)
    
    def get_available_wards(self) -> List[WardResponse]:
        """Get wards with available beds."""
        wards = self.ward_repo.get_available_wards()
        return [WardResponse.model_validate(ward) for ward in wards]
    
    def update_ward_occupancy(self, ward_id: int, increment: bool = True) -> Optional[WardResponse]:
        """Update ward occupancy."""
        ward = self.ward_repo.update_occupancy(ward_id, increment)
        if not ward:
            return None
        return WardResponse.model_validate(ward)