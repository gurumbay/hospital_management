from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import verify_password
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model."""
    
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        return self.db.query(User).filter(User.username == username).first()
    
    def authenticate(self, username: str, password: str) -> Optional[User]:
        """Authenticate user by username and password."""        
        user = self.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user