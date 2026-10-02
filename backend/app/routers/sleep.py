from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, SleepRecord
from app.schemas.domain_schemas import SleepRecordCreate
from app.routers.auth import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="", tags=["Sleep Analysis"])

@router.post("/sleep")
def log_sleep(data: SleepRecordCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = SleepRecord(
        user_id=current_user.id,
        sleep_date=data.sleep_date,
        sleep_time=data.sleep_time,
        wake_time=data.wake_time,
        duration_hours=data.duration_hours,
        quality_score=data.quality_score,
        interruptions=data.interruptions,
        notes=data.notes
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return {"message": "Sleep record logged successfully", "id": rec.id}

@router.get("/sleep/analysis")
def get_sleep_analysis(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id).order_by(SleepRecord.sleep_date.desc()).limit(14).all()
    
    logs_dict = [{"duration_hours": s.duration_hours, "quality_score": s.quality_score, "sleep_time": s.sleep_time} for s in logs]
    
    ai = get_ai_provider()
    analysis = ai.analyze_sleep_patterns(logs_dict)

    return {
        "recent_logs": [
            {
                "id": s.id,
                "date": str(s.sleep_date),
                "duration_hours": s.duration_hours,
                "quality_score": s.quality_score,
                "sleep_time": s.sleep_time,
                "wake_time": s.wake_time
            } for s in logs
        ],
        "analysis": analysis
    }
