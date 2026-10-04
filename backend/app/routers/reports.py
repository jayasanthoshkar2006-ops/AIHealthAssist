from datetime import date
from statistics import mean

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain_models import (
    User,
    UserProfile,
    Workout,
    NutritionLog,
    SleepRecord,
    Goal,
    Streak,
)
from app.routers.auth import get_current_user
from app.ai.reports.pdf_generator import PDFReportGenerator

router = APIRouter(prefix="/reports", tags=["Wellness Reports"])


@router.get("/wellness/generate")
def generate_pdf_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    user_name = profile.name if profile and profile.name else "User"

    # Demo account intentionally keeps realistic sample values.
    if current_user.is_demo:
        report_data = {
            "workouts_completed": 8,
            "avg_form_score": 91.5,
            "avg_daily_calories": 2150,
            "avg_daily_protein": 78,
            "avg_sleep_duration": 7.4,
            "sleep_consistency": "88%",
            "goal_summary": "Demo sample progress",
            "ai_observations": "This is sample demonstration data for HealthAssist AI. It is not real health information.",
            "next_suggested_focus": "Explore the workout, nutrition, sleep, and goal features using the demo data.",
        }
    else:
        workouts = (
            db.query(Workout)
            .filter(Workout.user_id == current_user.id)
            .all()
        )
        nutrition = (
            db.query(NutritionLog)
            .filter(NutritionLog.user_id == current_user.id)
            .all()
        )
        sleep_records = (
            db.query(SleepRecord)
            .filter(SleepRecord.user_id == current_user.id)
            .all()
        )
        goals = (
            db.query(Goal)
            .filter(Goal.user_id == current_user.id)
            .all()
        )
        streaks = (
            db.query(Streak)
            .filter(Streak.user_id == current_user.id)
            .all()
        )

        workout_count = len(workouts)
        form_scores = [
            float(w.avg_form_score)
            for w in workouts
            if w.avg_form_score is not None and float(w.avg_form_score) > 0
        ]
        avg_form = round(mean(form_scores), 1) if form_scores else 0.0

        calories = [float(n.calories or 0) for n in nutrition]
        proteins = [float(n.protein_g or 0) for n in nutrition]

        nutrition_dates = sorted(
            {n.log_date for n in nutrition if n.log_date is not None}
        )
        avg_daily_calories = (
            round(sum(calories) / len(nutrition_dates), 1)
            if nutrition_dates
            else 0
        )
        avg_daily_protein = (
            round(sum(proteins) / len(nutrition_dates), 1)
            if nutrition_dates
            else 0
        )

        sleep_durations = [
            float(s.duration_hours)
            for s in sleep_records
            if s.duration_hours is not None
        ]
        avg_sleep = round(mean(sleep_durations), 1) if sleep_durations else 0.0

        sleep_dates = sorted(
            {s.sleep_date for s in sleep_records if s.sleep_date is not None}
        )
        if sleep_dates:
            consistency = round(
                min(100.0, (len(sleep_dates) / max(len(sleep_dates), 7)) * 100),
                0,
            )
        else:
            consistency = 0

        completed_goals = sum(1 for g in goals if g.is_completed)
        total_goals = len(goals)
        active_streak = max(
            [int(s.current_streak or 0) for s in streaks],
            default=0,
        )

        if workout_count == 0 and not nutrition and not sleep_records:
            observation = (
                "No wellness activity has been recorded yet. "
                "Start logging workouts, meals, and sleep to build your personal report."
            )
            focus = (
                "Add your first workout, nutrition entry, or sleep record so "
                "HealthAssist AI can calculate your real progress."
            )
        else:
            observation_parts = []
            if workout_count:
                observation_parts.append(
                    f"You have recorded {workout_count} workout session"
                    f"{'s' if workout_count != 1 else ''}."
                )
            if nutrition:
                observation_parts.append(
                    f"Nutrition logs contain {len(nutrition)} meal entr"
                    f"{'ies' if len(nutrition) != 1 else 'y'}."
                )
            if sleep_records:
                observation_parts.append(
                    f"Sleep records contain {len(sleep_records)} night"
                    f"{'s' if len(sleep_records) != 1 else ''}."
                )
            observation = " ".join(observation_parts)

            focus = (
                "Keep logging consistently so future reports can show meaningful "
                "trends and personalized progress."
            )

        report_data = {
            "workouts_completed": workout_count,
            "avg_form_score": avg_form,
            "avg_daily_calories": avg_daily_calories,
            "avg_daily_protein": avg_daily_protein,
            "avg_sleep_duration": avg_sleep,
            "sleep_consistency": f"{int(consistency)}%",
            "goal_summary": f"{completed_goals}/{total_goals} goals completed; active streak {active_streak} days",
            "ai_observations": observation,
            "next_suggested_focus": focus,
        }

    pdf_bytes = PDFReportGenerator.generate_report(user_name, report_data)

    safe_filename = "".join(
        char if char.isalnum() or char in " _-" else "_"
        for char in str(user_name)
    ).strip() or "User"

    headers = {
        "Content-Disposition": f'attachment; filename="AI_Wellness_Report_{safe_filename}.pdf"'
    }

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers=headers,
    )
