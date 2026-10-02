from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, HealthRecord
from app.schemas.domain_schemas import HealthRecordCreate
from app.routers.auth import get_current_user

router = APIRouter(prefix="/health", tags=["Personal Health Records"])

@router.post("/records")
def add_health_record(data: HealthRecordCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = HealthRecord(
        user_id=current_user.id,
        record_date=data.record_date,
        title=data.title,
        category=data.category,
        source_type="USER_ENTERED",
        metrics_json=data.metrics,
        notes=data.notes
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"message": "Health record saved", "id": rec.id}

@router.get("/records")
def get_health_records(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(HealthRecord).filter(HealthRecord.user_id == current_user.id).order_by(HealthRecord.record_date.desc()).all()
    return [
        {
            "id": r.id,
            "date": str(r.record_date),
            "title": r.title,
            "category": r.category,
            "source_type": r.source_type, # USER_ENTERED / AI_GENERATED / EXTERNAL_INTERNET
            "metrics": r.metrics_json,
            "notes": r.notes
        } for r in records
    ]

@router.get("/summary")
def get_health_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(HealthRecord).filter(HealthRecord.user_id == current_user.id).all()
    user_records_count = sum(1 for r in records if r.source_type == "USER_ENTERED")
    
    return {
        "summary": f"Over the past 30 days, you have stored {user_records_count} user-entered health records.",
        "disclaimer": "This summary displays user-entered records for organization purposes. It is not a clinical assessment."
    }
