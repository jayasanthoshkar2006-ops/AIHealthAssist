from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain_models import User, UserProfile, UserSchedule, Workout, DailyPlan
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    start_of_today = datetime.combine(today, datetime.min.time())
    start_of_next_day = start_of_today + timedelta(days=1)

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    schedule = db.query(UserSchedule).filter(UserSchedule.user_id == current_user.id).first()

    today_workouts = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.created_at >= start_of_today,
            Workout.created_at < start_of_next_day,
        )
        .all()
    )

    workout_count = len(today_workouts)
    total_reps = sum(w.total_reps or 0 for w in today_workouts)
    workout_duration = sum(w.duration_minutes or 0 for w in today_workouts)
    form_scores = [float(w.avg_form_score) for w in today_workouts if w.avg_form_score is not None and float(w.avg_form_score) > 0]
    average_form = round(sum(form_scores) / len(form_scores), 1) if form_scores else 0.0
    calories_burned = sum(w.calories_burned or 0 for w in today_workouts)

    today_plan = db.query(DailyPlan).filter(
        DailyPlan.user_id == current_user.id,
        DailyPlan.plan_date == today,
    ).first()

    bmi = None
    if profile and profile.height and profile.weight and profile.height > 0:
        height_m = profile.height / 100
        bmi = round(profile.weight / (height_m * height_m), 1)

    trend_start = today - timedelta(days=6)
    workouts_7_days = db.query(Workout).filter(
        Workout.user_id == current_user.id,
        Workout.created_at >= datetime.combine(trend_start, datetime.min.time()),
        Workout.created_at < start_of_next_day,
    ).all()

    workout_trend = []
    for day_offset in range(7):
        trend_day = trend_start + timedelta(days=day_offset)
        day_workouts = [
            w for w in workouts_7_days
            if w.created_at is not None and w.created_at.date() == trend_day
        ]
        day_reps = sum(w.total_reps or 0 for w in day_workouts)
        day_forms = [float(w.avg_form_score) for w in day_workouts if w.avg_form_score is not None and float(w.avg_form_score) > 0]
        workout_trend.append({
            "day": trend_day.strftime("%a"),
            "date": str(trend_day),
            "reps": day_reps if day_workouts else None,
            "form": round(sum(day_forms) / len(day_forms), 1) if day_forms else None,
        })

    insights = []
    if average_form > 0:
        if average_form >= 90:
            insights.append("Your workout form is looking strong.")
        elif average_form >= 75:
            insights.append("Your workout form is improving. Focus on controlled movements.")
        else:
            insights.append("Focus on maintaining proper form during your exercises.")
    if workout_count == 0:
        insights.append("Complete a workout to start building your activity history.")
    if not insights:
        insights.append("Keep recording workouts to receive personalized insights.")

    if current_user.is_demo:
        demo_values = [(40, 88), (45, 90), (50, 92), (35, 87), (60, 94), (55, 93), (65, 95)]
        demo_trend = []
        for index, (reps, form) in enumerate(demo_values):
            graph_day = today - timedelta(days=6 - index)
            demo_trend.append({"day": graph_day.strftime("%a"), "date": str(graph_day), "reps": reps, "form": form})

        return {
            "is_demo": True,
            "demo_notice": "Demo Mode: This account contains sample data for demonstrating HealthAssist AI. It is not real health information.",
            "user_name": "Hari",
            "profession": "Software Developer",
            "profile": {
                "name": "Hari", "age": 24, "gender": "Male", "height": 175.0, "weight": 70.0,
                "profession": "Software Developer", "fitness_level": "Intermediate",
                "gym_available": False, "home_workout": True, "stress_rating": 4, "preferred_language": "en",
            },
            "schedule": {"wake_time": "06:30", "sleep_time": "23:00", "work_start": "09:00", "work_end": "17:30"},
            "bmi": 22.9,
            "today": {"workout_count": 2, "total_reps": 65, "workout_duration": 42, "average_form": 95, "calories_burned": 320},
            "today_plan": {"id": 1, "plan_date": str(today)},
            "workout_trend": demo_trend,
            "ai_insights": [
                "Your workout consistency has been strong this week.",
                "Your average workout form is improving.",
            ],
            "disclaimer": "Wellness tracking and organization only. Not medical advice.",
        }

    return {
        "is_demo": False,
        "demo_notice": None,
        "user_name": profile.name if profile and profile.name else current_user.email.split("@")[0],
        "profession": profile.profession if profile and profile.profession else None,
        "profile": (
            {
                "name": profile.name, "age": profile.age, "gender": profile.gender,
                "height": profile.height, "weight": profile.weight, "profession": profile.profession,
                "fitness_level": profile.fitness_level, "gym_available": profile.gym_available,
                "home_workout": profile.home_workout, "stress_rating": profile.stress_rating,
                "preferred_language": profile.preferred_language,
            }
            if profile else None
        ),
        "schedule": (
            {"wake_time": schedule.wake_time, "sleep_time": schedule.sleep_time,
             "work_start": schedule.work_start, "work_end": schedule.work_end}
            if schedule else None
        ),
        "bmi": bmi,
        "today": {
            "workout_count": workout_count, "total_reps": total_reps,
            "workout_duration": workout_duration, "average_form": average_form,
            "calories_burned": calories_burned,
        },
        "today_plan": {"id": today_plan.id, "plan_date": str(today_plan.plan_date)} if today_plan else None,
        "workout_trend": workout_trend,
        "ai_insights": insights,
        "disclaimer": "Wellness tracking and organization only. Not medical advice.",
    }
