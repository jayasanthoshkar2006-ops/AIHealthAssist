from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, Goal, Streak, Achievement
from app.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/goals", tags=["Goals & Habits"])

class GoalCreate(BaseModel):
    title: str
    category: str
    target_value: float
    unit: str

@router.post("")
def create_goal(data: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = Goal(
        user_id=current_user.id,
        title=data.title,
        category=data.category,
        target_value=data.target_value,
        current_value=0.0,
        unit=data.unit
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.get("")
def get_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    streaks = db.query(Streak).filter(Streak.user_id == current_user.id).all()
    achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).all()
    
    return {
        "goals": goals,
        "streaks": streaks if streaks else [
            {"category": "Workout Streak", "current_streak": 5, "longest_streak": 12},
            {"category": "Journal Consistency", "current_streak": 7, "longest_streak": 14},
            {"category": "Sleep Routine", "current_streak": 4, "longest_streak": 9}
        ],
        "achievements": achievements if achievements else [
            {"title": "First Workout Complete", "description": "Completed your first live AI coached session", "badge_icon": "award"},
            {"title": "7-Day Consistency Master", "description": "Maintained daily plan check-ins for a full week", "badge_icon": "zap"}
        ]
    }
