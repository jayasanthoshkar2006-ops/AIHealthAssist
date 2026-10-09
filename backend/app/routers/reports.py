import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain_models import (
    User, UserProfile, Workout, ExerciseRecord, NutritionLog, SleepRecord,
    HabitRecord, JournalEntry, Medication, Appointment, HealthRecord, Goal,
    Achievement, Streak, UserSchedule, DailyPlan, UserPreference, EnvironmentResource,
)
from app.routers.auth import get_current_user
from app.ai.reports.pdf_generator import PDFReportGenerator

router = APIRouter(prefix="/reports", tags=["Wellness Reports"])


def _value(value):
    if value is None or value == "":
        return "Not recorded"
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, default=str)
    return value


def _entry(label, **fields):
    useful = [(key.replace("_", " ").title(), _value(value)) for key, value in fields.items() if value is not None and value != ""]
    details = "; ".join(f"{key}: {value}" for key, value in useful) or "No details recorded"
    return (f"{label}", details)


@router.get("/wellness/generate")
def generate_pdf_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Scope every query to the authenticated user; never include sample or other-user data.
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    workouts = db.query(Workout).filter(Workout.user_id == current_user.id).order_by(Workout.created_at.desc()).all()
    exercise_records = db.query(ExerciseRecord).filter(ExerciseRecord.user_id == current_user.id).order_by(ExerciseRecord.record_date.desc()).all()
    nutrition_logs = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id).order_by(NutritionLog.log_date.desc()).all()
    sleep_records = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id).order_by(SleepRecord.sleep_date.desc()).all()
    habits = db.query(HabitRecord).filter(HabitRecord.user_id == current_user.id).order_by(HabitRecord.completed_date.desc()).all()
    journals = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id).order_by(JournalEntry.entry_date.desc()).all()
    medications = db.query(Medication).filter(Medication.user_id == current_user.id).order_by(Medication.created_at.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.user_id == current_user.id).order_by(Appointment.date_time.desc()).all()
    health_records = db.query(HealthRecord).filter(HealthRecord.user_id == current_user.id).order_by(HealthRecord.record_date.desc()).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()).all()
    achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).order_by(Achievement.unlocked_at.desc()).all()
    streaks = db.query(Streak).filter(Streak.user_id == current_user.id).order_by(Streak.category.asc()).all()
    schedules = db.query(UserSchedule).filter(UserSchedule.user_id == current_user.id).order_by(UserSchedule.schedule_date.desc()).all()
    plans = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id).order_by(DailyPlan.plan_date.desc()).all()
    preference = db.query(UserPreference).filter(UserPreference.user_id == current_user.id).first()
    resources = db.query(EnvironmentResource).filter(EnvironmentResource.user_id == current_user.id).first()

    profile_data = {}
    if profile:
        for field in ("age", "gender", "height", "weight", "profession", "fitness_level",
                      "food_preference", "allergies", "normal_sleep_hours", "stress_rating", "updated_at"):
            profile_data[field] = _value(getattr(profile, field, None))
    bmi = None
    if profile and profile.height and profile.weight and profile.height > 0 and profile.weight > 0:
        bmi = round(float(profile.weight) / ((float(profile.height) / 100) ** 2), 1)

    data = {
        "email": current_user.email,
        "profile": profile_data,
        "bmi": bmi,
        "overview": {
            "health_records": len(health_records), "workouts": len(workouts),
            "nutrition_logs": len(nutrition_logs), "sleep_records": len(sleep_records),
            "journal_entries": len(journals), "medications": len(medications),
            "appointments": len(appointments), "goals": len(goals),
        },
        "health_records": [_entry(f"{r.record_date} — {r.title}", category=r.category, source=r.source_type,
                                  metrics=r.metrics_json, notes=r.notes) for r in health_records],
        "workouts": [
            _entry(f"{w.created_at} — {w.title}", target_muscle=w.target_muscle,
                   duration_minutes=w.duration_minutes, total_reps=w.total_reps,
                   average_form_score_percent=w.avg_form_score, calories_burned=w.calories_burned,
                   notes=w.notes, exercise_sessions=[{
                       "exercise": s.exercise_name, "sets": s.sets_completed,
                       "target_reps": s.target_reps, "actual_reps": s.actual_reps,
                       "form_accuracy_percent": s.form_accuracy, "feedback": s.feedback_notes,
                       "timestamp": s.timestamp.isoformat() if s.timestamp else None,
                   } for s in w.sessions]) for w in workouts
        ],
        "exercise_records": [_entry(f"{r.record_date} — {r.exercise_name}", max_weight_kg=r.max_weight_kg,
                                    max_reps=r.max_reps, best_form_score_percent=r.best_form_score) for r in exercise_records],
        "nutrition_logs": [_entry(f"{r.log_date} — {r.food_name}", meal_type=r.meal_type, portion=r.portion,
                                  calories=r.calories, protein_g=r.protein_g, carbs_g=r.carbs_g,
                                  fat_g=r.fat_g, ai_estimated=r.is_ai_estimated) for r in nutrition_logs],
        "sleep_records": [_entry(str(r.sleep_date), sleep_time=r.sleep_time, wake_time=r.wake_time,
                                 duration_hours=r.duration_hours, quality_score_1_to_10=r.quality_score,
                                 interruptions=r.interruptions, notes=r.notes) for r in sleep_records],
        "medications": [_entry(m.name, dosage=m.dosage, frequency=m.frequency, reminder_time=m.reminder_time,
                               active=m.is_active, notes=m.notes, added_on=m.created_at) for m in medications],
        "appointments": [_entry(f"{a.date_time} — {a.title}", category=a.category, location=a.location,
                                reminder_enabled=a.reminder_enabled, notes=a.notes) for a in appointments],
        "journal_entries": [_entry(f"{j.entry_date} — Mood: {j.mood}", entry=j.content, tags=j.tags_json,
                                   ai_summary=j.ai_summary, themes=j.recurring_themes_json) for j in journals],
        "habits": [_entry(f"{h.completed_date} — {h.habit_name}", category=h.category,
                          target_frequency=h.target_frequency, completed=h.is_completed,
                          streak_count=h.streak_count) for h in habits],
        "goals": [_entry(g.title, category=g.category, current_value=g.current_value,
                         target_value=g.target_value, unit=g.unit, deadline=g.deadline,
                         completed=g.is_completed, created_at=g.created_at) for g in goals],
        "streaks_achievements": (
            [_entry(f"Streak — {s.category}", current_streak=s.current_streak,
                    longest_streak=s.longest_streak, last_activity_date=s.last_activity_date) for s in streaks]
            + [_entry(f"Achievement — {a.title}", description=a.description, unlocked_at=a.unlocked_at) for a in achievements]
        ),
        "plans": {
            "schedules": [
                {
                    "date": str(s.schedule_date) if s.schedule_date else "Not recorded",
                    "wake_time": s.wake_time,
                    "sleep_time": s.sleep_time,
                    "work_start": s.work_start,
                    "work_end": s.work_end,
                    "timeline": s.schedule_data,
                }
                for s in schedules
            ],
            "daily_plans": [
                {
                    "date": str(p.plan_date) if p.plan_date else "Not recorded",
                    "timeline": p.timeline_json,
                    "recommendations": p.recommendations_json,
                    "ai_insights": p.ai_insights,
                }
                for p in plans
            ],
        },
        "preferences": [("Food and activity preferences", {
            "profession": profile_data.get("profession", "Not recorded"),
            "food preference": profile_data.get("food_preference", "Not recorded"),
            "fitness level": profile_data.get("fitness_level", "Not recorded"),
            "environment resources": {
                "equipment": resources.equipment_list if resources else None,
                "pantry foods": resources.pantry_foods if resources else None,
                "cooking access": resources.cooking_access if resources else None,
                "budget tier": resources.budget_tier if resources else None,
            },
            "app preferences": {
                "language": preference.language if preference else None,
                "theme": preference.theme if preference else None,
                "voice feedback enabled": preference.voice_feedback_enabled if preference else None,
            },
        })],
        "ai_observations": (
            f"This export includes {len(health_records)} health records, {len(workouts)} workouts, "
            f"{len(nutrition_logs)} nutrition logs, {len(sleep_records)} sleep logs, and "
            f"{len(medications)} medication entries saved in your account at generation time. "
            "These counts describe saved records only and are not a clinical interpretation."
        ),
    }
    user_name = profile.name if profile and profile.name else current_user.email.split("@")[0]
    pdf_bytes = PDFReportGenerator.generate_report(user_name, data)
    safe_filename = "".join(c if c.isalnum() or c in " _-" else "_" for c in str(user_name)).strip() or "User"
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="HealthAssist_Complete_Health_Report_{safe_filename}.pdf"'})
