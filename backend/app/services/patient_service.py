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
            
            # Check if ward already contains patients with different diagnosis
            existing_patients = self.patient_repo.get_by_ward(patient_data.ward_id)
            if existing_patients:
                existing_diagnosis = existing_patients[0].diagnosis_id
                if existing_diagnosis != patient_data.diagnosis_id:
                    raise WardCapacityException(
                        f"Ward {ward.name} contains patients with different diagnosis"
                    )
        
        # Create patient data
        patient_dict = patient_data.model_dump()
        
        # Auto-assign to ward if not specified
        if not patient_data.ward_id:
            ward = self._find_available_ward(patient_data.diagnosis_id)
            if ward:
                patient_dict["ward_id"] = ward.id
                
                # If ward has no diagnosis assigned yet, assign it
                if ward.diagnosis_id is None:
                    self.ward_repo.update(ward, {"diagnosis_id": patient_data.diagnosis_id})
        
        # Create patient; DB triggers will enforce capacity and update ward occupancy
        db_patient = self.patient_repo.create(patient_dict)
        return PatientResponse.model_validate(db_patient)
    
    def update_patient(self, patient_id: int, patient_data: PatientUpdate) -> PatientResponse:
        """Update a patient."""
        patient = self.patient_repo.get(patient_id)
        if not patient:
            raise PatientNotFoundException(patient_id)
        
        # Get only the fields that were explicitly set in the request
        update_data = patient_data.model_dump(exclude_unset=True)
        
        # Handle ward change (includes setting to None/"unassigned")
        if "ward_id" in update_data:
            old_ward_id = patient.ward_id
            new_ward_id = update_data["ward_id"]
            
            # Only validate if assigning to a new ward (not clearing)
            if new_ward_id:
                new_ward = self.ward_repo.get(new_ward_id)
                if not new_ward:
                    raise WardNotFoundException(new_ward_id)
                
                if new_ward.current_occupancy >= new_ward.max_capacity:
                    raise WardCapacityException(new_ward.name)
                
                # Check if ward already contains patients with different diagnosis
                existing_patients = self.patient_repo.get_by_ward(new_ward_id)
                if existing_patients:
                    existing_diagnosis = existing_patients[0].diagnosis_id
                    # Allow only if patient has same diagnosis
                    if patient.diagnosis_id != existing_diagnosis:
                        raise WardCapacityException(
                            f"Ward {new_ward.name} contains patients with different diagnosis"
                        )
        
        # Handle diagnosis change - will be caught by trigger to clear ward
        if "diagnosis_id" in update_data:
            if not self.diagnosis_repo.get(update_data["diagnosis_id"]):
                raise DiagnosisNotFoundException(update_data["diagnosis_id"])

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
        """Find an available ward for a diagnosis following distribution rules.
        
        Algorithm:
        1. Only assign patients with the same diagnosis to the same ward
        2. Minimize the number of wards used (prefer filling existing wards)
        3. Balance occupancy evenly across wards with the same diagnosis
        
        Returns:
            Ward instance or None if no suitable ward found
        """
        # Get all wards assigned to this diagnosis
        wards_for_diagnosis = self.ward_repo.get_wards_by_diagnosis(diagnosis_id)
        
        # Filter wards that have available capacity and only this diagnosis
        suitable_wards = []
        for ward in wards_for_diagnosis:
            # Check if ward has capacity
            if ward.current_occupancy >= ward.max_capacity:
                continue
            
            # Check if all patients in the ward have the same diagnosis
            patients_in_ward = self.patient_repo.get_by_ward(ward.id)
            if patients_in_ward and any(p.diagnosis_id != diagnosis_id for p in patients_in_ward):
                # Ward contains patients with different diagnoses - cannot use
                continue
            
            suitable_wards.append(ward)
        
        if suitable_wards:
            # Among suitable wards, return the one with lowest occupancy (balance evenly)
            return min(suitable_wards, key=lambda w: w.current_occupancy)
        
        # No suitable ward found for this diagnosis
        # Try to find an empty ward (not assigned to any diagnosis yet)
        empty_wards = [w for w in self.ward_repo.get_available_wards() 
                       if w.diagnosis_id is None and w.current_occupancy == 0]
        
        if empty_wards:
            # Return the first empty ward (will become assigned to this diagnosis)
            return empty_wards[0]
        
        # No available ward for this diagnosis
        return None