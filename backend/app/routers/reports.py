from statistics import mean

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain_models import User, UserProfile, Workout
from app.routers.auth import get_current_user
from app.ai.reports.pdf_generator import PDFReportGenerator

router = APIRouter(prefix="/reports", tags=["Wellness Reports"])


@router.get("/wellness/generate")
def generate_pdf_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    user_name = profile.name if profile and profile.name else "User"

    if current_user.is_demo:
        report_data = {
            "workouts_completed": 8,
            "avg_form_score": 91.5,
            "ai_observations": "This is sample demonstration data for HealthAssist AI. It is not real health information.",
            "next_suggested_focus": "Keep building consistent workout activity and review your schedule regularly.",
        }
    else:
        workouts = db.query(Workout).filter(Workout.user_id == current_user.id).all()
        form_scores = [float(w.avg_form_score) for w in workouts if w.avg_form_score is not None and float(w.avg_form_score) > 0]
        workout_count = len(workouts)
        avg_form = round(mean(form_scores), 1) if form_scores else 0.0

        if workout_count == 0:
            observation = "No workout activity has been recorded yet. Complete your first workout to build your personal report."
            focus = "Complete and record your first workout so HealthAssist AI can calculate your real progress."
        else:
            observation = f"You have recorded {workout_count} workout session{'s' if workout_count != 1 else ''}. Your average recorded form score is {avg_form}%."
            focus = "Keep logging workouts consistently so future reports can show meaningful progress."

        report_data = {
            "workouts_completed": workout_count,
            "avg_form_score": avg_form,
            "ai_observations": observation,
            "next_suggested_focus": focus,
        }

    pdf_bytes = PDFReportGenerator.generate_report(user_name, report_data)
    safe_filename = "".join(char if char.isalnum() or char in " _-" else "_" for char in str(user_name)).strip() or "User"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="AI_Wellness_Report_{safe_filename}.pdf"'},
    )
