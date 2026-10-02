from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, Appointment
from app.schemas.domain_schemas import AppointmentCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("")
def add_appointment(data: AppointmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    app = Appointment(
        user_id=current_user.id,
        title=data.title,
        category=data.category,
        date_time=data.date_time,
        location=data.location,
        notes=data.notes,
        reminder_enabled=data.reminder_enabled
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return {"message": "Appointment created", "id": app.id}

@router.get("")
def get_appointments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Appointment).filter(Appointment.user_id == current_user.id).order_by(Appointment.date_time.asc()).all()
