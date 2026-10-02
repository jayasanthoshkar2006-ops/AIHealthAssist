from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, JournalEntry
from app.schemas.domain_schemas import JournalEntryCreate, JournalResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/journal", tags=["Mental Wellness Journal"])

@router.post("", response_model=JournalResponse)
def create_journal_entry(data: JournalEntryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    summary = f"Reflected on day with mood '{data.mood}'."
    themes = ["Work routine", "Personal time"] if "work" in data.content.lower() else ["General wellness"]

    entry = JournalEntry(
        user_id=current_user.id,
        entry_date=date.today(),
        mood=data.mood,
        content=data.content,
        tags_json=data.tags,
        ai_summary=summary,
        recurring_themes_json=themes
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@router.get("/summary")
def get_journal_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entries = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).order_by(JournalEntry.entry_date.desc()).all()
    
    moods = [e.mood for e in entries]
    most_common_mood = max(set(moods), key=moods.count) if moods else "Calm"

    return {
        "total_entries": len(entries),
        "dominant_mood": most_common_mood,
        "recent_entries": entries[:5],
        "safety_disclaimer": "This journal provides mood reflections and organization tools. It is not a mental health assessment or clinical tool."
    }
