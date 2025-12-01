from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    
    def __repr__(self) -> str:
        return f"<Diagnosis {self.name}>"