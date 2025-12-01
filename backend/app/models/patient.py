from typing import Optional
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class Patient(Base):
    __tablename__ = "patients"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str]
    last_name: Mapped[str]
    father_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    diagnosis_id: Mapped[int] = mapped_column(ForeignKey("diagnoses.id"))
    ward_id: Mapped[Optional[int]] = mapped_column(ForeignKey("wards.id"), nullable=True)
    
    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.last_name]
        if self.father_name:
            parts.insert(1, self.father_name)
        return " ".join(parts)
    
    def __repr__(self) -> str:
        return f"<Patient {self.full_name}>"