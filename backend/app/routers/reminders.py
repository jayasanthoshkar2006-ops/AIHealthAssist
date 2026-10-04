from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, Medication, Notification
from app.schemas.domain_schemas import MedicationCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="", tags=["Medications & Reminders"])

@router.post("/medications")
def add_medication(data: MedicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    med = Medication(
        user_id=current_user.id,
        name=data.name,
        dosage=data.dosage,
        frequency=data.frequency,
        reminder_time=data.reminder_time,
        notes=data.notes
    )
    db.add(med)
    db.commit()
    db.refresh(med)

    # Add notification reminder entry
    notif = Notification(
        user_id=current_user.id,
        title=f"Medication Reminder: {data.name}",
        message=f"Time to take {data.name} ({data.dosage}) at {data.reminder_time}",
        category="Medication"
    )
    db.add(notif)
    db.commit()

    return {"message": "Medication reminder saved successfully", "id": med.id, "disclaimer": "This is a reminder log tool only. Do not alter prescribed dosages without consulting a doctor."}

@router.get("/medications")
def get_medications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meds = db.query(Medication).filter(Medication.user_id == current_user.id, Medication.is_active == True).all()
    return meds


@router.put("/medications/{medication_id}")
def update_medication(
    medication_id: int,
    data: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    med = (
        db.query(Medication)
        .filter(
            Medication.id == medication_id,
            Medication.user_id == current_user.id,
            Medication.is_active == True,
        )
        .first()
    )
    if not med:
        raise HTTPException(status_code=404, detail="Medication reminder not found")

    med.name = data.name
    med.dosage = data.dosage
    med.frequency = data.frequency
    med.reminder_time = data.reminder_time
    med.notes = data.notes

    # Keep the latest notification entry aligned with the edited reminder.
    notif = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.category == "Medication",
            Notification.title.like("Medication Reminder:%"),
        )
        .order_by(Notification.id.desc())
        .first()
    )
    if notif:
        notif.title = f"Medication Reminder: {data.name}"
        notif.message = f"Time to take {data.name} ({data.dosage}) at {data.reminder_time}"

    db.commit()
    db.refresh(med)
    return {
        "message": "Medication reminder updated successfully",
        "id": med.id,
        "disclaimer": "This is a reminder log tool only. Do not alter prescribed dosages without consulting a doctor.",
    }
