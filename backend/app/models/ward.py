from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class Ward(Base):
    __tablename__ = "wards"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    max_capacity: Mapped[int] = mapped_column(default=10)
    current_occupancy: Mapped[int] = mapped_column(default=0)
    diagnosis_id: Mapped[int] = mapped_column(ForeignKey("diagnoses.id"), nullable=True)
    
    @property
    def available_beds(self) -> int:
        return self.max_capacity - self.current_occupancy
    
    def __repr__(self) -> str:
        return f"<Ward {self.name}>"