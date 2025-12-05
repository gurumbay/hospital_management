from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ward import Ward
from app.repositories.base import BaseRepository


class WardRepository(BaseRepository[Ward]):
    """Repository for Ward model."""
    
    def __init__(self, db: Session):
        super().__init__(Ward, db)
    
    def get_by_name(self, name: str):
        """Get ward by name."""
        return self.db.query(Ward).filter(Ward.name == name).first()
    
    def get_available_wards(self) -> List[Ward]:
        """Get wards with available beds."""
        return self.db.query(Ward).filter(
            Ward.current_occupancy < Ward.max_capacity
        ).all()
    
    def get_wards_by_diagnosis(self, diagnosis_id: int) -> List[Ward]:
        """Get wards by diagnosis."""
        return self.db.query(Ward).filter(
            Ward.diagnosis_id == diagnosis_id
        ).all()
    
    def get_wards_with_capacity_by_diagnosis(self, diagnosis_id: int) -> List[Ward]:
        """Get wards with available beds for a specific diagnosis."""
        return self.db.query(Ward).filter(
            Ward.diagnosis_id == diagnosis_id,
            Ward.current_occupancy < Ward.max_capacity
        ).all()
    
    def update_occupancy(self, ward_id: int, increment: bool = True, commit: bool = True) -> Optional[Ward]:
        """Update ward occupancy.

        Args:
            ward_id: id of ward to update
            increment: True to increment, False to decrement
            commit: whether to commit the transaction (default True)
        """
        ward = self.get(ward_id)
        if not ward:
            return None

        if increment:
            ward.current_occupancy += 1
        else:
            ward.current_occupancy = max(0, ward.current_occupancy - 1)

        if commit:
            self.db.commit()
            self.db.refresh(ward)
        else:
            self.db.flush()
        return ward