from typing import TypeVar, Generic
from app.repositories.base import BaseRepository

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")
ResponseSchemaType = TypeVar("ResponseSchemaType")


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType, ResponseSchemaType]):
    """Base service with common CRUD operations."""
    
    def __init__(self, repository: BaseRepository):
        self.repository = repository
    
    def get(self, id: int):
        """Get a single item by ID."""
        return self.repository.get(id)
    
    def get_multi(self, skip: int = 0, limit: int = 100, **filters):
        """Get multiple items."""
        return self.repository.get_multi(skip=skip, limit=limit, **filters)
    
    def create(self, obj_in: CreateSchemaType, **extra_data):
        """Create a new item."""
        obj_dict = obj_in.model_dump()
        obj_dict.update(extra_data)
        return self.repository.create(obj_dict)
    
    def update(self, id: int, obj_in: UpdateSchemaType):
        """Update an existing item."""
        db_obj = self.repository.get(id)
        if not db_obj:
            return None
        return self.repository.update(db_obj, obj_in.model_dump(exclude_unset=True))
    
    def delete(self, id: int):
        """Delete an item."""
        return self.repository.delete(id)