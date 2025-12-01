from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_admin, get_current_active_user
from app.schemas.ward import WardResponse, WardCreate, WardUpdate
from app.services.ward_service import WardService
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[WardResponse])
def get_wards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    diagnosis_id: int = Query(None)
):
    """Get all wards."""
    filters = {}
    if diagnosis_id:
        filters["diagnosis_id"] = diagnosis_id
    
    ward_service = WardService(db)
    return ward_service.get_wards(skip=skip, limit=limit, **filters)


@router.get("/available", response_model=List[WardResponse])
def get_available_wards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get wards with available beds."""
    ward_service = WardService(db)
    return ward_service.get_available_wards()


@router.get("/{ward_id}", response_model=WardResponse)
def get_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get ward by ID."""
    ward_service = WardService(db)
    return ward_service.get_ward(ward_id)


@router.post("/", response_model=WardResponse, status_code=status.HTTP_201_CREATED)
def create_ward(
    ward_data: WardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new ward (admin only)."""
    ward_service = WardService(db)
    return ward_service.create_ward(ward_data)


@router.put("/{ward_id}", response_model=WardResponse)
def update_ward(
    ward_id: int,
    ward_data: WardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update ward (admin only)."""
    ward_service = WardService(db)
    return ward_service.update_ward(ward_id, ward_data)


@router.delete("/{ward_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete ward (admin only)."""
    ward_service = WardService(db)
    ward_service.delete_ward(ward_id)