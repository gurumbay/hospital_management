from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.patient_repository import PatientRepository
from app.repositories.diagnosis_repository import DiagnosisRepository
from app.repositories.ward_repository import WardRepository
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.core.exceptions import PatientNotFoundException, DiagnosisNotFoundException, WardNotFoundException, WardCapacityException


class PatientService:
    """Service for patient management."""
    
    def __init__(self, db: Session):
        self.patient_repo = PatientRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
        self.ward_repo = WardRepository(db)
    
    def get_patient(self, patient_id: int) -> PatientResponse:
        """Get a patient by ID."""
        patient = self.patient_repo.get(patient_id)
        if not patient:
            raise PatientNotFoundException(patient_id)
        return PatientResponse.model_validate(patient)
    
    def get_patients(self, skip: int = 0, limit: int = 100, **filters) -> List[PatientResponse]:
        """Get multiple patients."""
        patients = self.patient_repo.get_multi(skip=skip, limit=limit, **filters)
        return [PatientResponse.model_validate(p) for p in patients]
    
    def create_patient(self, patient_data: PatientCreate, user_id: Optional[int] = None) -> PatientResponse:
        """Create a new patient."""
        # Check if diagnosis exists
        if not self.diagnosis_repo.get(patient_data.diagnosis_id):
            raise DiagnosisNotFoundException(patient_data.diagnosis_id)
        
        # Check if ward exists and has capacity
        if patient_data.ward_id:
            ward = self.ward_repo.get(patient_data.ward_id)
            if not ward:
                raise WardNotFoundException(patient_data.ward_id)
            
            if ward.current_occupancy >= ward.max_capacity:
                raise WardCapacityException(ward.name)
        
        # Create patient data
        patient_dict = patient_data.model_dump()
        
        # Auto-assign to ward if not specified
        if not patient_data.ward_id:
            ward = self._find_available_ward(patient_data.diagnosis_id)
            if ward:
                patient_dict["ward_id"] = ward.id
        
        # Create patient; DB triggers will enforce capacity and update ward occupancy
        db_patient = self.patient_repo.create(patient_dict)
        return PatientResponse.model_validate(db_patient)
    
    def update_patient(self, patient_id: int, patient_data: PatientUpdate) -> PatientResponse:
        """Update a patient."""
        patient = self.patient_repo.get(patient_id)
        if not patient:
            raise PatientNotFoundException(patient_id)
        
        # Handle ward change
        old_ward_id = patient.ward_id
        new_ward_id = patient_data.ward_id
        
        update_data = patient_data.model_dump(exclude_unset=True)
        
        # If ward is being changed
        if "ward_id" in update_data and old_ward_id != new_ward_id:
            # Check new ward exists and has capacity
            if new_ward_id:
                new_ward = self.ward_repo.get(new_ward_id)
                if not new_ward:
                    raise WardNotFoundException(new_ward_id)
                
                if new_ward.current_occupancy >= new_ward.max_capacity:
                    raise WardCapacityException(new_ward.name)
            
            # Update occupancies
            # Note: occupancy is managed by DB triggers; just perform the update
            pass

        updated_patient = self.patient_repo.update(patient, update_data)
        return PatientResponse.model_validate(updated_patient)
    
    def delete_patient(self, patient_id: int) -> None:
        """Delete a patient."""
        patient = self.patient_repo.get(patient_id)
        if not patient:
            raise PatientNotFoundException(patient_id)
        
        # Deletion will be handled by DB triggers (they should adjust occupancy)
        self.patient_repo.delete(patient_id)
    
    def search_patients_by_name(self, name_query: str) -> List[PatientResponse]:
        """Search patients by name."""
        patients = self.patient_repo.search_by_name(name_query)
        return [PatientResponse.model_validate(p) for p in patients]
    
    def get_patients_by_diagnosis(self, diagnosis_id: int) -> List[PatientResponse]:
        """Get patients by diagnosis."""
        patients = self.patient_repo.get_by_diagnosis(diagnosis_id)
        return [PatientResponse.model_validate(p) for p in patients]
    
    def get_patients_by_ward(self, ward_id: int) -> List[PatientResponse]:
        """Get patients in a ward."""
        patients = self.patient_repo.get_by_ward(ward_id)
        return [PatientResponse.model_validate(p) for p in patients]
    
    def _find_available_ward(self, diagnosis_id: int) -> Optional[PatientResponse]:
        """Find an available ward for a diagnosis."""
        # 1. Try wards with same diagnosis and available capacity
        wards = self.ward_repo.get_wards_with_capacity_by_diagnosis(diagnosis_id)
        if wards:
            return wards[0]
        
        # 2. Try any available ward
        available_wards = self.ward_repo.get_available_wards()
        if available_wards:
            return available_wards[0]
        
        return None