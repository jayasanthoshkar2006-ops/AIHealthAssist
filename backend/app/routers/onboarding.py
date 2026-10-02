import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, UserProfile, UserSchedule, EnvironmentResource, Goal
from app.schemas.domain_schemas import OnboardingData, ProfileResponse
from app.routers.auth import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="/onboarding", tags=["Onboarding & Profile"])

@router.post("", response_model=ProfileResponse)
def submit_onboarding(data: OnboardingData, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if profile already exists
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    equip_str = ", ".join(data.available_equipment) if data.available_equipment else "Bodyweight"
    foods_str = ", ".join(data.available_foods) if data.available_foods else "Standard Pantry"

    if existing_profile:
        profile = existing_profile
        profile.name = data.name
        profile.age = data.age
        profile.gender = data.gender
        profile.height = data.height
        profile.weight = data.weight
        profile.location = data.location
        profile.preferred_language = data.preferred_language
        profile.profession = data.profession
        profile.food_preference = data.food_preference
        profile.food_budget = data.food_budget
        profile.cooking_availability = data.cooking_availability
        profile.eating_out_frequency = data.eating_out_frequency
        profile.allergies = data.allergies
        profile.available_foods = foods_str
        profile.gym_available = data.gym_available
        profile.home_workout = data.home_workout
        profile.available_equipment = equip_str
        profile.outdoor_access = data.outdoor_access
        profile.fitness_level = data.fitness_level
        profile.work_hours_per_day = data.work_hours_per_day
        profile.normal_sleep_hours = data.normal_sleep_hours
        profile.stress_rating = data.stress_rating
    else:
        profile = UserProfile(
            user_id=current_user.id,
            name=data.name,
            age=data.age,
            gender=data.gender,
            height=data.height,
            weight=data.weight,
            location=data.location,
            preferred_language=data.preferred_language,
            profession=data.profession,
            food_preference=data.food_preference,
            food_budget=data.food_budget,
            cooking_availability=data.cooking_availability,
            eating_out_frequency=data.eating_out_frequency,
            allergies=data.allergies,
            available_foods=foods_str,
            gym_available=data.gym_available,
            home_workout=data.home_workout,
            available_equipment=equip_str,
            outdoor_access=data.outdoor_access,
            fitness_level=data.fitness_level,
            work_hours_per_day=data.work_hours_per_day,
            normal_sleep_hours=data.normal_sleep_hours,
            stress_rating=data.stress_rating
        )
        db.add(profile)

    # Save user schedule
    existing_sched = db.query(UserSchedule).filter(UserSchedule.user_id == current_user.id).first()
    if not existing_sched:
        sched = UserSchedule(
            user_id=current_user.id,
            wake_time=data.wake_time,
            sleep_time=data.sleep_time,
            work_start=data.work_start,
            work_end=data.work_end
        )
        db.add(sched)

    # Save environment resources
    existing_res = db.query(EnvironmentResource).filter(EnvironmentResource.user_id == current_user.id).first()
    if not existing_res:
        res = EnvironmentResource(
            user_id=current_user.id,
            equipment_list=data.available_equipment or [],
            pantry_foods=data.available_foods or [],
            cooking_access=data.cooking_availability,
            budget_tier=data.food_budget
        )
        db.add(res)

    # Save initial goals
    if data.primary_goals:
        for g_title in data.primary_goals:
            goal = Goal(
                user_id=current_user.id,
                title=g_title.title(),
                category="fitness" if "fit" in g_title or "weight" in g_title else "wellness",
                target_value=100.0,
                current_value=25.0,
                unit="%"
            )
            db.add(goal)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not onboarded yet")
    return profile
