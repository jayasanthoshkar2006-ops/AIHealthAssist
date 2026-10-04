from datetime import date
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, NutritionLog, UserProfile, EnvironmentResource, Goal
from app.schemas.domain_schemas import FoodImageAnalyzeRequest, FoodAnalysisResponse, NutritionLogCreate
from app.routers.auth import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter(prefix="/nutrition", tags=["Nutrition AI & Meal Tracking"])

def calculate_daily_calorie_target(profile: UserProfile, goals: list[Goal] | None = None):
    """Estimate a daily calorie target from the user's saved profile and goals."""
    if not profile or not profile.age or not profile.height or not profile.weight:
        return None, "Complete age, height and weight in your profile to calculate a personalized target."

    gender = (profile.gender or "").strip().lower()
    if gender in {"male", "m", "man"}:
        bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
    elif gender in {"female", "f", "woman"}:
        bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161
    else:
        return None, "Add sex/gender in your profile to calculate a personalized calorie target."

    profession = (profile.profession or "").lower()
    if any(k in profession for k in ["athlete", "player", "sport", "trainer", "farmer", "labor", "construction"]):
        activity_factor = 1.725
    elif any(k in profession for k in ["nurse", "doctor", "teacher", "student", "retail", "sales"]):
        activity_factor = 1.55
    elif any(k in profession for k in ["office", "software", "developer", "computer", "desk", "accountant"]):
        activity_factor = 1.375
    else:
        activity_factor = 1.375 if (profile.work_hours_per_day or 8) <= 8 else 1.2

    target = bmr * activity_factor
    goal_text = " ".join((g.title or "") for g in (goals or [])).lower()
    if any(k in goal_text for k in ["gain", "muscle", "weight gain", "bulk"]):
        target += 250
        goal = "gain"
    elif any(k in goal_text for k in ["lose", "fat loss", "weight loss", "cut"]):
        target -= 250
        goal = "lose"
    else:
        goal = "maintain"

    target = max(1200, min(4000, target))
    return int(round(target / 50) * 50), goal


@router.post("/analyze-image", response_model=FoodAnalysisResponse)
def analyze_food_image(data: FoodImageAnalyzeRequest):
    if not data.image_base64 or len(data.image_base64) < 100:
        raise HTTPException(status_code=400, detail="A real food image is required.")
    if len(data.image_base64) > 12_000_000:
        raise HTTPException(status_code=413, detail="Image is too large. Please use an image smaller than 8 MB.")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Food vision AI is not configured on the server. Add GEMINI_API_KEY to the Render backend environment, then redeploy."
        )

    ai = get_ai_provider()
    try:
        res = ai.analyze_food_image(data.image_base64, data.meal_type or "Lunch", data.mime_type or "image/jpeg")
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Food vision AI could not analyze this image. Please try a clearer photo or check the server vision configuration."
        ) from exc

    return FoodAnalysisResponse(
        food_name=res["food_name"],
        estimated_serving=res["estimated_serving"],
        calories=res["calories"],
        protein_g=res["protein_g"],
        carbs_g=res["carbs_g"],
        fat_g=res["fat_g"],
        confidence_percentage=res["confidence_percentage"],
        is_estimate=res["is_estimate"],
        disclaimer=res["disclaimer"]
    )

@router.post("/meals")
def create_meal_log(data: NutritionLogCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = NutritionLog(
        user_id=current_user.id,
        log_date=data.log_date or date.today(),
        meal_type=data.meal_type,
        food_name=data.food_name,
        portion=data.portion,
        calories=data.calories,
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        is_ai_estimated=data.is_ai_estimated,
        image_url=data.image_url
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": "Meal logged successfully", "id": log.id}

@router.get("/summary")
def get_nutrition_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(NutritionLog).filter(NutritionLog.user_id == current_user.id, NutritionLog.log_date == date.today()).all()
    
    total_cal = sum(l.calories for l in logs)
    total_p = sum(l.protein_g for l in logs)
    total_c = sum(l.carbs_g for l in logs)
    total_f = sum(l.fat_g for l in logs)

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    calorie_target, target_goal = calculate_daily_calorie_target(profile, goals)

    return {
        "date": str(date.today()),
        "total_calories": total_cal,
        "total_protein_g": total_p,
        "total_carbs_g": total_c,
        "total_fat_g": total_f,
        "calorie_target": calorie_target,
        "calorie_target_goal": target_goal,
        "calorie_target_source": "personalized_profile" if calorie_target else "profile_incomplete",
        "calorie_target_message": None if calorie_target else "Complete your age, sex, height and weight in your profile.",
        "meal_count": len(logs),
        "meals": [
            {
                "id": l.id,
                "meal_type": l.meal_type,
                "food_name": l.food_name,
                "portion": l.portion,
                "calories": l.calories,
                "protein_g": l.protein_g,
                "carbs_g": l.carbs_g,
                "fat_g": l.fat_g,
                "is_ai_estimated": l.is_ai_estimated
            } for l in logs
        ]
    }

@router.get("/suggestions")
def get_food_suggestions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    res = db.query(EnvironmentResource).filter(EnvironmentResource.user_id == current_user.id).first()

    pref = profile.food_preference if profile else "Vegetarian"
    foods = res.pantry_foods if res else ["Rice", "Egg", "Curd", "Banana"]

    if "Vegetarian" in pref:
        suggestions = [
            {"title": "Pantry Special Dal Tadka & Brown Rice", "description": "High fiber, nutritious lentil curry using your local kitchen resources.", "calories": 420, "protein": "16g"},
            {"title": "Paneer / Tofu Stir-Fry with Steamed Veggies", "description": "Quick 15-minute high-protein dinner.", "calories": 380, "protein": "22g"},
            {"title": "Curd Rice with Banana & Roasted Nuts", "description": "Easy digestion meal ideal after work.", "calories": 310, "protein": "9g"}
        ]
    else:
        suggestions = [
            {"title": "Scrambled Eggs with Toast & Fruit", "description": "Quick breakfast using basic pantry items.", "calories": 350, "protein": "20g"},
            {"title": "Chicken / Egg Curry with Steamed Rice", "description": "Balanced high protein meal fit for your evening recovery.", "calories": 480, "protein": "32g"},
            {"title": "Greek Yogurt / Curd Dip with Fresh Veggie Sticks", "description": "Low calorie evening snack.", "calories": 180, "protein": "12g"}
        ]

    return {
        "food_preference": pref,
        "available_pantry_items": foods,
        "suggestions": suggestions,
        "disclaimer": "Suggestions are generated based on your recorded pantry availability and dietary preferences."
    }
