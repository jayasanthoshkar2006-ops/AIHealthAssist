from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import (
    User,
    Goal,
    Streak,
    Achievement,
    Workout,
    JournalEntry,
    SleepRecord,
)
from app.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/goals", tags=["Goals & Habits"])


class GoalCreate(BaseModel):
    title: str
    category: str
    target_value: float
    unit: str


def _longest_streak(activity_dates: set[date]) -> int:
    if not activity_dates:
        return 0

    longest = 0
    for day in sorted(activity_dates):
        if day - timedelta(days=1) not in activity_dates:
            length = 1
            cursor = day + timedelta(days=1)
            while cursor in activity_dates:
                length += 1
                cursor += timedelta(days=1)
            longest = max(longest, length)
    return longest


def _current_streak(activity_dates: set[date]) -> int:
    if not activity_dates:
        return 0

    today = date.today()
    # A streak is active if the user was active today. If there is no
    # activity today, yesterday keeps the streak alive until today ends.
    cursor = today if today in activity_dates else today - timedelta(days=1)

    if cursor not in activity_dates:
        return 0

    streak = 0
    while cursor in activity_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _make_streak(category: str, activity_dates: set[date]) -> dict:
    return {
        "category": category,
        "current_streak": _current_streak(activity_dates),
        "longest_streak": _longest_streak(activity_dates),
    }


@router.post("")
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = Goal(
        user_id=current_user.id,
        title=data.title,
        category=data.category,
        target_value=data.target_value,
        current_value=0.0,
        unit=data.unit,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("")
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    stored_streaks = (
        db.query(Streak)
        .filter(Streak.user_id == current_user.id)
        .all()
    )
    achievements = (
        db.query(Achievement)
        .filter(Achievement.user_id == current_user.id)
        .all()
    )

    # The built-in demo account intentionally gets sample milestone data.
    # Normal users must never receive fabricated streaks or achievements.
    if current_user.is_demo:
        streaks = stored_streaks or [
            {"category": "Workout Streak", "current_streak": 5, "longest_streak": 12},
            {"category": "Journal Consistency", "current_streak": 7, "longest_streak": 14},
            {"category": "Sleep Routine", "current_streak": 4, "longest_streak": 9},
        ]
        demo_achievements = achievements or [
            {
                "title": "First Workout Complete",
                "description": "Completed your first live AI coached session",
                "badge_icon": "award",
            },
            {
                "title": "7-Day Consistency Master",
                "description": "Maintained daily plan check-ins for a full week",
                "badge_icon": "zap",
            },
        ]
        return {
            "goals": goals,
            "streaks": streaks,
            "achievements": demo_achievements,
            "is_demo": True,
        }

    # Calculate real streaks from the user's actual activity history.
    workout_dates = {
        item.created_at.date()
        for item in db.query(Workout).filter(Workout.user_id == current_user.id).all()
        if item.created_at
    }
    journal_dates = {
        item.entry_date
        for item in db.query(JournalEntry)
        .filter(JournalEntry.user_id == current_user.id)
        .all()
        if item.entry_date
    }
    sleep_dates = {
        item.sleep_date
        for item in db.query(SleepRecord)
        .filter(SleepRecord.user_id == current_user.id)
        .all()
        if item.sleep_date
    }

    streaks = [
        _make_streak("Workout Streak", workout_dates),
        _make_streak("Journal Consistency", journal_dates),
        _make_streak("Sleep Routine", sleep_dates),
    ]

    return {
        "goals": goals,
        "streaks": streaks,
        "achievements": achievements,
        "is_demo": False,
    }
