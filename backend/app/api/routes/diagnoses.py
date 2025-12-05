from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin, get_current_active_user
from app.schemas.diagnosis import DiagnosisResponse, DiagnosisCreate, DiagnosisUpdate
from app.services.diagnosis_service import DiagnosisService
from app.models.user import User

router = APIRouter(prefix="/diagnoses", tags=["diagnoses"])


@router.get("/", response_model=List[DiagnosisResponse])
def get_diagnoses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all diagnoses."""
    diagnosis_service = DiagnosisService(db)
    return diagnosis_service.get_diagnoses(skip=skip, limit=limit)


@router.get("/{diagnosis_id}", response_model=DiagnosisResponse)
def get_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get diagnosis by ID."""
    diagnosis_service = DiagnosisService(db)
    return diagnosis_service.get_diagnosis(diagnosis_id)


@router.post("/", response_model=DiagnosisResponse, status_code=status.HTTP_201_CREATED)
def create_diagnosis(
    diagnosis_data: DiagnosisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new diagnosis (admin only)."""
    diagnosis_service = DiagnosisService(db)
    return diagnosis_service.create_diagnosis(diagnosis_data)


@router.put("/{diagnosis_id}", response_model=DiagnosisResponse)
def update_diagnosis(
    diagnosis_id: int,
    diagnosis_data: DiagnosisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update diagnosis (admin only)."""
    diagnosis_service = DiagnosisService(db)
    return diagnosis_service.update_diagnosis(diagnosis_id, diagnosis_data)


@router.delete("/{diagnosis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete diagnosis (admin only)."""
    diagnosis_service = DiagnosisService(db)
    diagnosis_service.delete_diagnosis(diagnosis_id)