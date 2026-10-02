from datetime import date
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, Workout, WorkoutSession, ExerciseRecord
from app.schemas.domain_schemas import PoseAnalysisRequest, PoseAnalysisResponse, WorkoutLogCreate, PerformancePredictionResponse, AdaptiveWorkoutResponse
from app.routers.auth import get_current_user
from app.ai.fitness.pose_coach import PoseCoach
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="", tags=["Workouts & Fitness AI"])
pose_coach = PoseCoach()

@router.post("/workouts/analyze", response_model=PoseAnalysisResponse)
def analyze_pose(data: PoseAnalysisRequest):
    res = pose_coach.analyze_pose(
        exercise_name=data.exercise_name,
        keypoints=data.keypoints
    )
    return PoseAnalysisResponse(
        exercise_name=res["exercise_name"],
        rep_count=res["rep_count"],
        stage=res["stage"],
        form_score=res["form_score"],
        current_angle=res["current_angle"],
        feedback=res["feedback"],
        voice_feedback=res["voice_feedback"]
    )

@router.post("/workouts")
def create_workout_log(data: WorkoutLogCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workout = Workout(
        user_id=current_user.id,
        title=data.title,
        target_muscle=data.target_muscle,
        duration_minutes=data.duration_minutes,
        total_reps=data.total_reps,
        avg_form_score=data.avg_form_score,
        calories_burned=data.calories_burned,
        notes=data.notes
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)

    for sess_item in data.sessions:
        session_obj = WorkoutSession(
            workout_id=workout.id,
            exercise_name=sess_item.get("exercise_name", "Squat"),
            sets_completed=sess_item.get("sets_completed", 1),
            target_reps=sess_item.get("target_reps", 10),
            actual_reps=sess_item.get("actual_reps", 10),
            form_accuracy=sess_item.get("form_accuracy", 90.0),
            feedback_notes=sess_item.get("feedback_notes", "Good set")
        )
        db.add(session_obj)

        # Update Personal Best Exercise Records
        rec = db.query(ExerciseRecord).filter(
            ExerciseRecord.user_id == current_user.id,
            ExerciseRecord.exercise_name == sess_item.get("exercise_name")
        ).first()

        if rec:
            if sess_item.get("actual_reps", 0) > rec.max_reps:
                rec.max_reps = sess_item.get("actual_reps")
            if sess_item.get("form_accuracy", 0) > rec.best_form_score:
                rec.best_form_score = sess_item.get("form_accuracy")
        else:
            rec = ExerciseRecord(
                user_id=current_user.id,
                exercise_name=sess_item.get("exercise_name", "Squat"),
                max_reps=sess_item.get("actual_reps", 10),
                best_form_score=sess_item.get("form_accuracy", 90.0)
            )
            db.add(rec)

    db.commit()
    return {"message": "Workout saved successfully", "workout_id": workout.id}

@router.get("/workouts/history")
def get_workout_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workouts = db.query(Workout).filter(Workout.user_id == current_user.id).order_by(Workout.created_at.desc()).all()
    return [
        {
            "id": w.id,
            "title": w.title,
            "target_muscle": w.target_muscle,
            "duration_minutes": w.duration_minutes,
            "total_reps": w.total_reps,
            "avg_form_score": w.avg_form_score,
            "calories_burned": w.calories_burned,
            "date": w.created_at.strftime("%Y-%m-%d %H:%M")
        } for w in workouts
    ]

@router.post("/fitness/predict", response_model=PerformancePredictionResponse)
def predict_fitness_performance(exercise_name: str = "Squat", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(WorkoutSession).join(Workout).filter(
        Workout.user_id == current_user.id,
        WorkoutSession.exercise_name.ilike(f"%{exercise_name}%")
    ).all()

    history = [{"actual_reps": s.actual_reps, "form_accuracy": s.form_accuracy} for s in sessions]
    
    ai = get_ai_provider()
    res = ai.predict_performance(exercise_name, history)
    
    return PerformancePredictionResponse(
        exercise_name=res["exercise_name"],
        expected_reps=res["expected_reps"],
        confidence_lower=res["confidence_lower"],
        confidence_upper=res["confidence_upper"],
        suggested_target=res["suggested_target"],
        confidence_label=res["confidence_label"],
        notes=res["notes"],
        disclaimer=res["disclaimer"]
    )

@router.post("/fitness/adapt", response_model=AdaptiveWorkoutResponse)
def adapt_workout_plan(exercise_name: str = "Squat", last_actual_reps: int = 12, target_reps: int = 15, current_user: User = Depends(get_current_user)):
    is_below = last_actual_reps < target_reps
    
    if is_below:
        reasoning = f"Your last effort reached {last_actual_reps} reps vs target {target_reps}. We have adapted the target down slightly to 13 reps with a emphasis on perfect form."
        new_target = max(1, last_actual_reps + 1)
    else:
        reasoning = f"Great performance! You hit target {last_actual_reps} reps. Progressing target to {last_actual_reps + 2} reps for next set."
        new_target = last_actual_reps + 2

    return AdaptiveWorkoutResponse(
        workout_title=f"Adaptive {exercise_name} Progressive Routine",
        difficulty="Moderate" if is_below else "Challenging",
        exercises=[
            {"name": "Dynamic Warm-up & Mobility", "sets": 1, "reps": 10, "rest_seconds": 30},
            {"name": exercise_name, "sets": 3, "reps": new_target, "rest_seconds": 60},
            {"name": "Bodyweight Cool-down Stretch", "sets": 1, "reps": 5, "rest_seconds": 45}
        ],
        adaptation_reasoning=reasoning
    )
