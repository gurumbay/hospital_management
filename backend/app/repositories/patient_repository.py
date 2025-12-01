from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.patient import Patient
from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository[Patient]):
    """Repository for Patient model."""
    
    def __init__(self, db: Session):
        super().__init__(Patient, db)
    
    def get_by_diagnosis(self, diagnosis_id: int) -> List[Patient]:
        """Get patients by diagnosis."""
        return self.db.query(Patient).filter(
            Patient.diagnosis_id == diagnosis_id
        ).all()
    
    def get_by_ward(self, ward_id: int) -> List[Patient]:
        """Get patients in a ward."""
        return self.db.query(Patient).filter(
            Patient.ward_id == ward_id
        ).all()
    
    def get_without_ward(self) -> List[Patient]:
        """Get patients without ward assignment."""
        return self.db.query(Patient).filter(
            Patient.ward_id.is_(None)
        ).all()
    
    def search_by_name(self, name_query: str) -> List[Patient]:
        """Search patients by name."""
        search = f"%{name_query}%"
        return self.db.query(Patient).filter(
            or_(
                Patient.first_name.ilike(search),
                Patient.last_name.ilike(search),
                Patient.father_name.ilike(search)
            )
        ).all()