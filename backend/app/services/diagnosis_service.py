from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.diagnosis_repository import DiagnosisRepository
from app.schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse
from app.core.exceptions import DiagnosisNotFoundException


class DiagnosisService:
    """Service for diagnosis management."""
    
    def __init__(self, db: Session):
        self.diagnosis_repo = DiagnosisRepository(db)
    
    def get_diagnosis(self, diagnosis_id: int) -> DiagnosisResponse:
        """Get a diagnosis by ID."""
        diagnosis = self.diagnosis_repo.get(diagnosis_id)
        if not diagnosis:
            raise DiagnosisNotFoundException(diagnosis_id)
        return DiagnosisResponse.model_validate(diagnosis)
    
    def get_diagnoses(self, skip: int = 0, limit: int = 100) -> List[DiagnosisResponse]:
        """Get multiple diagnoses."""
        diagnoses = self.diagnosis_repo.get_multi(skip=skip, limit=limit)
        return [DiagnosisResponse.model_validate(d) for d in diagnoses]
    
    def create_diagnosis(self, diagnosis_data: DiagnosisCreate) -> DiagnosisResponse:
        """Create a new diagnosis."""
        # Check if diagnosis name already exists
        existing = self.diagnosis_repo.get_by_name(diagnosis_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Diagnosis with this name already exists",
            )
        
        db_diagnosis = self.diagnosis_repo.create(diagnosis_data.model_dump())
        return DiagnosisResponse.model_validate(db_diagnosis)
    
    def update_diagnosis(self, diagnosis_id: int, diagnosis_data: DiagnosisUpdate) -> DiagnosisResponse:
        """Update a diagnosis."""
        diagnosis = self.diagnosis_repo.get(diagnosis_id)
        if not diagnosis:
            raise DiagnosisNotFoundException(diagnosis_id)
        
        updated_diagnosis = self.diagnosis_repo.update(
            diagnosis, 
            diagnosis_data.model_dump(exclude_unset=True)
        )
        return DiagnosisResponse.model_validate(updated_diagnosis)
    
    def delete_diagnosis(self, diagnosis_id: int) -> None:
        """Delete a diagnosis."""
        diagnosis = self.diagnosis_repo.get(diagnosis_id)
        if not diagnosis:
            raise DiagnosisNotFoundException(diagnosis_id)
        
        self.diagnosis_repo.delete(diagnosis_id)