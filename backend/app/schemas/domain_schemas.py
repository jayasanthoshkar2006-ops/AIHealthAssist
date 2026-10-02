from datetime import datetime, date, time
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    language: Optional[str] = "en"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    has_profile: bool

class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class SetPinCode(BaseModel):
    pin_code: str = Field(..., min_length=4, max_length=6)

class VerifyPinCode(BaseModel):
    pin_code: str

# Profile & Onboarding Schemas
class OnboardingData(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    location: Optional[str] = None
    preferred_language: str = "en"
    
    profession: str = "Software Developer"
    
    # Routine
    wake_time: str = "06:30"
    sleep_time: str = "23:00"
    work_start: str = "09:00"
    work_end: str = "17:30"
    meal_times: Optional[List[str]] = ["08:00", "13:00", "20:00"]
    preferred_workout_time: Optional[str] = "18:30"
    
    # Food environment
    food_preference: str = "Vegetarian"
    food_budget: str = "Moderate"
    cooking_availability: str = "Daily"
    eating_out_frequency: str = "Rarely"
    allergies: Optional[str] = None
    available_foods: Optional[List[str]] = ["Rice", "Egg", "Curd", "Banana", "Vegetables"]
    
    # Exercise environment
    gym_available: bool = False
    home_workout: bool = True
    available_equipment: Optional[List[str]] = ["Dumbbells", "Resistance Band", "Yoga Mat"]
    outdoor_access: bool = True
    fitness_level: str = "Intermediate"
    
    # Lifestyle & Goals
    work_hours_per_day: float = 8.0
    normal_sleep_hours: float = 7.5
    stress_rating: int = 5
    primary_goals: Optional[List[str]] = ["weight management", "general fitness", "sleep consistency"]

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    age: Optional[int]
    gender: Optional[str]
    height: Optional[float]
    weight: Optional[float]
    profession: str
    food_preference: str
    food_budget: str
    cooking_availability: str
    gym_available: bool
    home_workout: bool
    available_equipment: Optional[str]
    fitness_level: str
    stress_rating: int
    preferred_language: str
    created_at: datetime

    class Config:
        from_attributes = True

# Schedule Schemas
class ScheduleEvent(BaseModel):
    time: str # "07:00"
    activity: str # "Wake up & Hydrate"
    category: str # "sleep", "meal", "work", "workout", "journal", "rest"
    duration_minutes: int = 30
    is_completed: bool = False

class UpdateScheduleRequest(BaseModel):
    date_str: Optional[str] = None
    custom_instruction: Optional[str] = None # e.g., "Move workout to 7 PM"
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    work_start: Optional[str] = None
    work_end: Optional[str] = None

class DynamicScheduleAdjustmentRequest(BaseModel):
    user_command: str # e.g. "I have college until 6 PM today"

# Workout & Vision Schemas
class PoseAnalysisRequest(BaseModel):
    exercise_name: str # Squat, Push-up, Lunge, Shoulder press, Bicep curl, Plank
    keypoints: List[Dict[str, float]] # [{x: float, y: float, z: float, visibility: float}]
    frame_width: int = 640
    frame_height: int = 480

class PoseAnalysisResponse(BaseModel):
    exercise_name: str
    rep_count: int
    stage: str # "up", "down", "holding"
    form_score: float # 0 - 100
    current_angle: float
    feedback: str # e.g. "Keep your back straighter"
    voice_feedback: str

class WorkoutLogCreate(BaseModel):
    title: str
    target_muscle: Optional[str] = "Full Body"
    duration_minutes: int
    total_reps: int
    avg_form_score: float
    calories_burned: float = 0.0
    notes: Optional[str] = None
    sessions: List[Dict[str, Any]] = []

# Nutrition Schemas
class NutritionLogCreate(BaseModel):
    log_date: Optional[date] = None
    meal_type: str = "Breakfast"
    food_name: str
    portion: str = "1 serving"
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    is_ai_estimated: bool = False
    image_url: Optional[str] = None

class FoodImageAnalyzeRequest(BaseModel):
    image_base64: str
    meal_type: Optional[str] = "Lunch"

class FoodAnalysisResponse(BaseModel):
    food_name: str
    estimated_serving: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence_percentage: float
    is_estimate: bool = True
    disclaimer: str

# Sleep Schemas
class SleepRecordCreate(BaseModel):
    sleep_date: date
    sleep_time: str
    wake_time: str
    duration_hours: float
    quality_score: int = 7
    interruptions: int = 0
    notes: Optional[str] = None

# Mental Journal Schemas
class JournalEntryCreate(BaseModel):
    mood: str
    content: str
    tags: List[str] = []

class JournalResponse(BaseModel):
    id: int
    entry_date: date
    mood: str
    content: str
    tags_json: Optional[List[str]]
    ai_summary: Optional[str]
    recurring_themes_json: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True

# Reminders & Appointments
class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    reminder_time: str
    notes: Optional[str] = None

class AppointmentCreate(BaseModel):
    title: str
    category: str = "Doctor"
    date_time: datetime
    location: Optional[str] = None
    notes: Optional[str] = None
    reminder_enabled: bool = True

# Health Records
class HealthRecordCreate(BaseModel):
    record_date: date
    title: str
    category: str = "General"
    metrics: Dict[str, Any] = {}
    notes: Optional[str] = None

# Assistant Chat
class ChatRequest(BaseModel):
    message: str
    use_internet: bool = False
    language: str = "en" # en, ta

class ChatResponse(BaseModel):
    response: str
    source_type: str # LOCAL_DATA, INTERNET_VERIFIED, AI_HEURISTIC
    tool_executed: Optional[str] = None
    action_performed: Optional[Dict[str, Any]] = None
    citations: Optional[List[Dict[str, str]]] = None
    disclaimer: Optional[str] = None

# Predictions & Adaptation
class PerformancePredictionResponse(BaseModel):
    exercise_name: str
    expected_reps: int
    confidence_lower: int
    confidence_upper: int
    suggested_target: int
    confidence_label: str # High, Moderate, Low / Insufficient Data
    notes: str
    disclaimer: str

class AdaptiveWorkoutResponse(BaseModel):
    workout_title: str
    difficulty: str
    exercises: List[Dict[str, Any]]
    adaptation_reasoning: str
