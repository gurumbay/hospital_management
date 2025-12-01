from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with CRUD operations."""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: int) -> Optional[ModelType]:
        """Get a single record by ID."""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        **filters
    ) -> List[ModelType]:
        """Get multiple records with optional filtering."""
        query = self.db.query(self.model)
        
        # Apply filters
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                query = query.filter(getattr(self.model, field) == value)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, obj_in: Dict[str, Any]) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def update(self, db_obj: ModelType, obj_in: Dict[str, Any]) -> ModelType:
        """Update an existing record."""
        obj_data = jsonable_encoder(db_obj)
        
        for field in obj_data:
            if field in obj_in:
                setattr(db_obj, field, obj_in[field])
        
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: int) -> ModelType:
        """Delete a record."""
        obj = self.db.query(self.model).filter(self.model.id == id).first()
        self.db.delete(obj)
        self.db.commit()
        return obj
    
    def count(self, **filters) -> int:
        """Count records with optional filtering."""
        query = self.db.query(self.model)
        
        for field, value in filters.items():
            if hasattr(self.model, field) and value is not None:
                query = query.filter(getattr(self.model, field) == value)
        
        return query.count()