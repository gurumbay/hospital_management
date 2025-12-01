import enum
from typing import Optional
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class UserRole(enum.StrEnum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str]
    first_name: Mapped[str]
    last_name: Mapped[str]
    father_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    role: Mapped[UserRole] = mapped_column(default=UserRole.DOCTOR)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    def __repr__(self) -> str:
        return f"<User {self.username}>"