from sqlalchemy.orm import Session
from app.models.diagnosis import Diagnosis
from app.repositories.base import BaseRepository


class DiagnosisRepository(BaseRepository[Diagnosis]):
    """Repository for Diagnosis model."""
    
    def __init__(self, db: Session):
        super().__init__(Diagnosis, db)
    
    def get_by_name(self, name: str):
        """Get diagnosis by name."""
        return self.db.query(Diagnosis).filter(Diagnosis.name == name).first()