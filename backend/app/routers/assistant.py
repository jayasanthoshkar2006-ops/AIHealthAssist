from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, UserProfile, UserSchedule, Workout, ChatMessage, DailyPlan
from app.schemas.domain_schemas import ChatRequest, ChatResponse
from app.routers.auth import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="/assistant", tags=["AI Chatbot & Voice Assistant"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(data: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Save user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=data.message,
        source_type="LOCAL_DATA"
    )
    db.add(user_msg)
    db.commit()

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    workouts_count = db.query(Workout).filter(Workout.user_id == current_user.id).count()
    plan = db.query(DailyPlan).filter(DailyPlan.user_id == current_user.id).first()

    context = {
        "user_name": profile.name if profile else "Friend",
        "profession": profile.profession if profile else "Software Developer",
        "weekly_workouts_count": workouts_count if workouts_count > 0 else 4,
        "today_schedule": plan.timeline_json if plan else []
    }

    ai = get_ai_provider()
    res = ai.chat_response(
        message=data.message,
        context=context,
        use_internet=data.use_internet,
        language=data.language
    )

    # Save assistant response
    ai_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=res["response"],
        source_type=res["source_type"]
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(
        response=res["response"],
        source_type=res["source_type"],
        tool_executed=res.get("tool_executed"),
        action_performed=res.get("action_performed"),
        citations=res.get("citations"),
        disclaimer=res.get("disclaimer")
    )
