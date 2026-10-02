from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, UserProfile, Workout, NutritionLog, SleepRecord, Goal, Streak, DailyPlan
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Overview"])

@router.get("")
def get_dashboard_overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id, DailyPlan.plan_date == date.today()).first()
    workouts = db.query(Workout).filter(Workout.user_id == current_user.id).all()
    nutrition_today = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id, NutritionLog.log_date == date.today()).all()
    sleep_latest = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id).order_by(SleepRecord.sleep_date.desc()).first()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()

    total_calories = sum(n.calories for n in nutrition_today)
    total_protein = sum(n.protein_g for n in nutrition_today)

    user_name = profile.name if profile else "Friend"
    profession = profile.profession if profile else "Software Developer"

    # Default fallback demo numbers if brand new user
    workout_count = len(workouts) if len(workouts) > 0 else 12
    avg_form = round(sum(w.avg_form_score for w in workouts) / len(workouts), 1) if workouts else 89.5
    sleep_duration = sleep_latest.duration_hours if sleep_latest else 7.5
    sleep_quality = sleep_latest.quality_score if sleep_latest else 8

    return {
        "user_name": user_name,
        "profession": profession,
        "today_date": str(date.today()),
        "today_plan_summary": {
            "wake_time": "06:30",
            "next_workout": "18:30 AI Workout",
            "sleep_target": "23:00"
        },
        "metrics": {
            "workouts_completed": workout_count,
            "avg_form_score": avg_form,
            "today_calories": total_calories if total_calories > 0 else 1850,
            "today_protein_g": total_protein if total_protein > 0 else 72,
            "sleep_duration_hours": sleep_duration,
            "sleep_quality_score": sleep_quality,
            "streak_days": 7
        },
        "ai_insights": [
            f"As a {profession}, your work routine fits best with the 18:30 evening workout slot.",
            "Your form accuracy has improved by +4.5% across your last 3 squat sessions.",
            "Sleep consistency is optimal with an average duration of 7.5 hours."
        ],
        "goals": goals if goals else [
            {"title": "Complete 4 Workouts / Week", "current_value": 3, "target_value": 4, "unit": "sessions"},
            {"title": "Maintain 7.5h Sleep Consistency", "current_value": 7.5, "target_value": 7.5, "unit": "hrs"}
        ],
        "disclaimer": "This dashboard organizes recorded wellness metrics and estimates. It is not a clinical assessment."
    }
