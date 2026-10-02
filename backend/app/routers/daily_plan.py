from datetime import date
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, UserProfile, UserSchedule, DailyPlan, Goal
from app.schemas.domain_schemas import UpdateScheduleRequest, DynamicScheduleAdjustmentRequest
from app.routers.auth import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="", tags=["Schedule & Daily Plan"])

@router.get("/daily-plan")
def get_daily_plan(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id, DailyPlan.plan_date == date.today()).first()
    if not plan:
        # Generate plan on the fly if not exists
        return generate_daily_plan(current_user=current_user, db=db)
    return {
        "id": plan.id,
        "date": str(plan.plan_date),
        "timeline": plan.timeline_json,
        "ai_insights": plan.ai_insights,
        "recommendations": plan.recommendations_json
    }

@router.post("/daily-plan/generate")
def generate_daily_plan(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    schedule = db.query(UserSchedule).filter(UserSchedule.user_id == current_user.id).first()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    
    profile_dict = {
        "name": profile.name if profile else "User",
        "profession": profile.profession if profile else "Office Employee",
        "gym_available": profile.gym_available if profile else False,
        "available_equipment": profile.available_equipment if profile else "Dumbbells",
        "food_preference": profile.food_preference if profile else "Vegetarian"
    } if profile else {}

    schedule_dict = {
        "wake_time": schedule.wake_time if schedule else "06:30",
        "sleep_time": schedule.sleep_time if schedule else "23:00",
        "work_start": schedule.work_start if schedule else "09:00",
        "work_end": schedule.work_end if schedule else "17:30"
    }

    goals_list = [{"title": g.title, "category": g.category} for g in goals]

    ai = get_ai_provider()
    result = ai.generate_daily_plan(profile_dict, schedule_dict, goals_list)

    # Save to database
    existing_plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id, DailyPlan.plan_date == date.today()).first()
    if existing_plan:
        existing_plan.timeline_json = result["timeline"]
        existing_plan.ai_insights = result["ai_insights"]
        existing_plan.recommendations_json = result["recommendations"]
        db.commit()
        db.refresh(existing_plan)
        saved_plan = existing_plan
    else:
        saved_plan = DailyPlan(
            user_id=current_user.id,
            plan_date=date.today(),
            timeline_json=result["timeline"],
            ai_insights=result["ai_insights"],
            recommendations_json=result["recommendations"]
        )
        db.add(saved_plan)
        db.commit()
        db.refresh(saved_plan)

    return {
        "id": saved_plan.id,
        "date": str(saved_plan.plan_date),
        "timeline": saved_plan.timeline_json,
        "ai_insights": saved_plan.ai_insights,
        "recommendations": saved_plan.recommendations_json
    }

@router.put("/schedule")
def update_schedule(data: UpdateScheduleRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id, DailyPlan.plan_date == date.today()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found for today. Generate daily plan first.")
    
    ai = get_ai_provider()
    updated_timeline = ai.adjust_schedule(plan.timeline_json, data.custom_instruction or "Adjust workout timing")
    
    plan.timeline_json = updated_timeline
    db.commit()
    return {"message": "Schedule updated successfully", "timeline": updated_timeline}

@router.post("/schedule/adjust")
def adjust_schedule_dynamic(data: DynamicScheduleAdjustmentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id, DailyPlan.plan_date == date.today()).first()
    if not plan:
        generate_daily_plan(current_user=current_user, db=db)
        plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id, DailyPlan.plan_date == date.today()).first()

    ai = get_ai_provider()
    updated_timeline = ai.adjust_schedule(plan.timeline_json, data.user_command)
    
    plan.timeline_json = updated_timeline
    db.commit()
    return {
        "status": "success",
        "command_processed": data.user_command,
        "updated_timeline": updated_timeline,
        "ai_message": f"Updated today's plan according to: '{data.user_command}'"
    }
