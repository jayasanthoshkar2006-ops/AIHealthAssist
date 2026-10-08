from datetime import date, datetime, timedelta
import json
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain_models import (
    User,
    UserProfile,
    UserSchedule,
    Workout,
    ChatMessage,
    DailyPlan,
    EnvironmentResource,
)
from app.schemas.domain_schemas import ChatRequest, ChatResponse
from app.routers.auth import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="/assistant", tags=["AI Chatbot & Voice Assistant"])


def _parse_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        return [item.strip() for item in value.split(",") if item.strip()]
    return []


def _format_time(value: str) -> str:
    try:
        hour, minute = [int(x) for x in value.split(":")[:2]]
        suffix = "AM" if hour < 12 else "PM"
        display_hour = hour % 12 or 12
        return f"{display_hour}:{minute:02d} {suffix}"
    except Exception:
        return value


@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Everything below is scoped to the authenticated user. No demo/fallback
    # health data is injected into normal accounts.
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    today = date.today()
    week_start = today - timedelta(days=6)

    workouts = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.created_at >= datetime.combine(week_start, datetime.min.time()),
        )
        .order_by(Workout.created_at.asc())
        .all()
    )

    plan = (
        db.query(DailyPlan)
        .filter(
            DailyPlan.user_id == current_user.id,
            DailyPlan.plan_date == today,
        )
        .first()
    )

    user_schedule = (
        db.query(UserSchedule)
        .filter(UserSchedule.user_id == current_user.id)
        .order_by(UserSchedule.schedule_date.desc())
        .first()
    )

    resources = (
        db.query(EnvironmentResource)
        .filter(EnvironmentResource.user_id == current_user.id)
        .first()
    )

    profile_dict = {
        "user_name": profile.name if profile else None,
        "age": profile.age if profile else None,
        "gender": profile.gender if profile else None,
        "height_cm": profile.height if profile else None,
        "weight_kg": profile.weight if profile else None,
        "profession": profile.profession if profile else None,
        "food_preference": profile.food_preference if profile else None,
        "food_budget": profile.food_budget if profile else None,
        "cooking_availability": profile.cooking_availability if profile else None,
        "eating_out_frequency": profile.eating_out_frequency if profile else None,
        "allergies": profile.allergies if profile else None,
        "available_foods": _parse_list(profile.available_foods if profile else None),
        "gym_available": profile.gym_available if profile else None,
        "home_workout": profile.home_workout if profile else None,
        "available_equipment": _parse_list(profile.available_equipment if profile else None),
        "outdoor_access": profile.outdoor_access if profile else None,
        "fitness_level": profile.fitness_level if profile else None,
        "work_hours_per_day": profile.work_hours_per_day if profile else None,
        "normal_sleep_hours": profile.normal_sleep_hours if profile else None,
        "stress_rating": profile.stress_rating if profile else None,
    }

    schedule_dict = {
        "wake_time": user_schedule.wake_time if user_schedule else None,
        "sleep_time": user_schedule.sleep_time if user_schedule else None,
        "work_start": user_schedule.work_start if user_schedule else None,
        "work_end": user_schedule.work_end if user_schedule else None,
    }

    today_schedule = plan.timeline_json if plan else (
        user_schedule.schedule_data if user_schedule else []
    )

    workout_average_form = (
        round(sum((w.avg_form_score or 0) for w in workouts) / len(workouts), 1)
        if workouts else 0
    )

    context = {
        **profile_dict,
        "weekly_workouts_count": len(workouts),
        "weekly_average_form_score": workout_average_form,
        "today_schedule": today_schedule or [],
        "schedule": schedule_dict,
        "environment": {
            "equipment": resources.equipment_list if resources else [],
            "pantry_foods": resources.pantry_foods if resources else [],
            "cooking_access": resources.cooking_access if resources else None,
            "budget_tier": resources.budget_tier if resources else None,
        },
    }

    # Load a small same-user conversation window so the local brain can resolve
    # follow-ups such as "move it", "no", and short conversational replies.
    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
        .all()
    )
    recent_messages.reverse()
    conversation_history = [
        {"role": item.role, "content": item.content}
        for item in recent_messages
        if item.role in ("user", "assistant")
    ]
    context["conversation_history"] = conversation_history

    # Save the user's message only after collecting the same-user context.
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=data.message,
        source_type="LOCAL_DATA",
    )
    db.add(user_msg)
    db.commit()

    ai = get_ai_provider()
    res = ai.chat_response(
        message=data.message,
        context=context,
        use_internet=data.use_internet,
        language="en",
    )

    # Persist schedule-changing assistant commands instead of merely returning
    # action_performed. The UI will therefore see the same change after refresh.
    if res.get("tool_executed") == "update_schedule":
        instruction = data.message
        current_timeline = list(today_schedule or [])
        updated_timeline = ai.adjust_schedule(current_timeline, instruction)

        if updated_timeline != current_timeline:
            if plan:
                plan.timeline_json = updated_timeline
            else:
                plan = DailyPlan(
                    user_id=current_user.id,
                    plan_date=today,
                    timeline_json=updated_timeline,
                    recommendations_json=[],
                    ai_insights="Updated from the user's AI Assistant command.",
                )
                db.add(plan)

            if user_schedule:
                user_schedule.schedule_data = updated_timeline

            db.commit()

            res["action_performed"] = {
                **(res.get("action_performed") or {}),
                "saved": True,
                "plan_date": str(today),
            }

            # Keep the response tied to the persisted timeline without confusing
            # an added workout with an existing workout.
            operation = (res.get("action_performed") or {}).get("operation")
            if operation == "add":
                added_time = None
                added_activity = None
                if updated_timeline:
                    before_keys = {(str(i.get("time")), str(i.get("activity"))) for i in current_timeline if isinstance(i, dict)}
                    for item in updated_timeline:
                        if isinstance(item, dict) and (str(item.get("time")), str(item.get("activity"))) not in before_keys:
                            added_time = item.get("time")
                            added_activity = item.get("activity")
                            break
                if added_time:
                    res["response"] = (
                        f"Done. I added {added_activity or 'the activity'} at {_format_time(added_time)}. "
                        "Your Today's Plan has been updated."
                    )
            elif operation == "delete":
                res["response"] = "Done. I removed that item from your schedule. Your Today's Plan has been updated."
            else:
                saved_time = (res.get("action_performed") or {}).get("new_workout_time")
                if saved_time:
                    res["response"] = (
                        f"Done. I moved your workout to {_format_time(saved_time)}. "
                        "Your Today's Plan has been updated."
                    )

    # Store tool/action metadata with the assistant message as well.
    ai_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=res["response"],
        source_type=res.get("source_type", "LOCAL_DATA"),
        tool_calls_json={
            "tool_executed": res.get("tool_executed"),
            "action_performed": res.get("action_performed"),
        },
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(
        response=res["response"],
        source_type=res.get("source_type", "LOCAL_DATA"),
        tool_executed=res.get("tool_executed"),
        action_performed=res.get("action_performed"),
        citations=res.get("citations"),
        disclaimer=res.get("disclaimer"),
    )
