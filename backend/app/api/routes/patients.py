from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user, require_doctor
from app.schemas.patient import PatientResponse, PatientCreate, PatientUpdate
from app.services.patient_service import PatientService
from app.models.user import User

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=List[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    diagnosis_id: int = Query(None),
    ward_id: int = Query(None)
):
    """Get all patients."""
    filters = {}
    if diagnosis_id:
        filters["diagnosis_id"] = diagnosis_id
    if ward_id:
        filters["ward_id"] = ward_id
    
    patient_service = PatientService(db)
    return patient_service.get_patients(skip=skip, limit=limit, **filters)


@router.get("/search", response_model=List[PatientResponse])
def search_patients(
    query: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search patients by name."""
    patient_service = PatientService(db)
    return patient_service.search_patients_by_name(query)


@router.get("/diagnosis/{diagnosis_id}", response_model=List[PatientResponse])
def get_patients_by_diagnosis(
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get patients by diagnosis."""
    patient_service = PatientService(db)
    return patient_service.get_patients_by_diagnosis(diagnosis_id)


@router.get("/ward/{ward_id}", response_model=List[PatientResponse])
def get_patients_by_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get patients in a ward."""
    patient_service = PatientService(db)
    return patient_service.get_patients_by_ward(ward_id)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get patient by ID."""
    patient_service = PatientService(db)
    return patient_service.get_patient(patient_id)


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Create a new patient (doctor only)."""
    patient_service = PatientService(db)
    return patient_service.create_patient(patient_data, current_user.id)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Update patient (doctor only)."""
    patient_service = PatientService(db)
    return patient_service.update_patient(patient_id, patient_data)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    """Delete patient (doctor only)."""
    patient_service = PatientService(db)
    patient_service.delete_patient(patient_id)