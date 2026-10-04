from datetime import datetime, date, time
from typing import Optional
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Time, Text, ForeignKey, JSON
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    pin_code = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True)
    # True only for the built-in sample/demo account. Never set this for normal users.
    is_demo = Column(Boolean, default=False, nullable=False, index=True)
    language = Column(String(10), default="en")  # 'en' or 'ta'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    schedules = relationship("UserSchedule", back_populates="user", cascade="all, delete-orphan")
    daily_plans = relationship("DailyPlan", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    exercise_records = relationship("ExerciseRecord", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("NutritionLog", back_populates="user", cascade="all, delete-orphan")
    sleep_records = relationship("SleepRecord", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("HabitRecord", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    health_records = relationship("HealthRecord", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    streaks = relationship("Streak", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resources = relationship("EnvironmentResource", back_populates="user", uselist=False, cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    height = Column(Float, nullable=True) # cm
    weight = Column(Float, nullable=True) # kg
    location = Column(String(100), nullable=True)
    preferred_language = Column(String(10), default="en")

    # Profession & Environment
    profession = Column(String(100), default="Office Employee")
    food_preference = Column(String(50), default="Vegetarian")
    food_budget = Column(String(50), default="Moderate")
    cooking_availability = Column(String(50), default="Daily")
    eating_out_frequency = Column(String(50), default="Rarely")
    allergies = Column(Text, nullable=True)
    available_foods = Column(Text, nullable=True) # JSON or CSV string

    # Exercise environment
    gym_available = Column(Boolean, default=False)
    home_workout = Column(Boolean, default=True)
    available_equipment = Column(Text, nullable=True) # dumbbells, resistance bands, etc.
    outdoor_access = Column(Boolean, default=True)
    fitness_level = Column(String(50), default="Intermediate")

    # Lifestyle
    work_hours_per_day = Column(Float, default=8.0)
    normal_sleep_hours = Column(Float, default=7.5)
    stress_rating = Column(Integer, default=5) # 1-10

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False) # workout, nutrition, sleep, habit, productivity, weight
    target_value = Column(Float, nullable=True)
    current_value = Column(Float, default=0.0)
    unit = Column(String(50), nullable=True)
    deadline = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")


class UserSchedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule_date = Column(Date, default=date.today, index=True)
    wake_time = Column(String(10), default="06:30")
    sleep_time = Column(String(10), default="23:00")
    work_start = Column(String(10), default="09:00")
    work_end = Column(String(10), default="17:30")
    schedule_data = Column(JSON, nullable=True) # Full list of timeline events
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="schedules")


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_date = Column(Date, default=date.today, index=True)
    timeline_json = Column(JSON, nullable=False)
    recommendations_json = Column(JSON, nullable=True)
    ai_insights = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="daily_plans")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    target_muscle = Column(String(100), nullable=True)
    duration_minutes = Column(Integer, default=30)
    total_reps = Column(Integer, default=0)
    avg_form_score = Column(Float, default=0.0)
    calories_burned = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="workouts")
    sessions = relationship("WorkoutSession", back_populates="workout", cascade="all, delete-orphan")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_name = Column(String(100), nullable=False)
    sets_completed = Column(Integer, default=0)
    target_reps = Column(Integer, default=10)
    actual_reps = Column(Integer, default=0)
    form_accuracy = Column(Float, default=0.0) # Percentage 0-100%
    feedback_notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    workout = relationship("Workout", back_populates="sessions")


class ExerciseRecord(Base):
    __tablename__ = "exercise_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_name = Column(String(100), nullable=False)
    max_weight_kg = Column(Float, default=0.0)
    max_reps = Column(Integer, default=0)
    best_form_score = Column(Float, default=0.0)
    record_date = Column(Date, default=date.today)

    user = relationship("User", back_populates="exercise_records")


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, default=date.today, index=True)
    meal_type = Column(String(50), default="Breakfast") # Breakfast, Lunch, Dinner, Snack
    food_name = Column(String(200), nullable=False)
    portion = Column(String(100), default="1 serving")
    calories = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    is_ai_estimated = Column(Boolean, default=False)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="nutrition_logs")


class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sleep_date = Column(Date, default=date.today, index=True)
    sleep_time = Column(String(10), nullable=False) # e.g. "23:00"
    wake_time = Column(String(10), nullable=False)  # e.g. "07:00"
    duration_hours = Column(Float, nullable=False)
    quality_score = Column(Integer, default=7) # 1-10
    interruptions = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sleep_records")


class HabitRecord(Base):
    __tablename__ = "habit_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    habit_name = Column(String(150), nullable=False)
    category = Column(String(50), default="Wellness")
    target_frequency = Column(String(50), default="Daily")
    completed_date = Column(Date, default=date.today)
    is_completed = Column(Boolean, default=True)
    streak_count = Column(Integer, default=1)

    user = relationship("User", back_populates="habits")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_date = Column(Date, default=date.today, index=True)
    mood = Column(String(50), default="Calm") # Happy, Stressed, Tired, Productive, Calm, Anxious
    content = Column(Text, nullable=False)
    tags_json = Column(JSON, nullable=True)
    ai_summary = Column(Text, nullable=True)
    recurring_themes_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="journal_entries")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    dosage = Column(String(100), default="1 tablet")
    frequency = Column(String(100), default="Daily")
    reminder_time = Column(String(10), default="08:00")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="medications")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(50), default="Doctor") # Doctor, Fitness, Wellness, Personal
    date_time = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    reminder_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="appointments")


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    record_date = Column(Date, default=date.today)
    title = Column(String(200), nullable=False)
    category = Column(String(50), default="General") # Symptoms, Vitals, Lab Test, Personal Record
    source_type = Column(String(50), default="USER_ENTERED") # USER_ENTERED, AI_GENERATED, EXTERNAL_INTERNET
    metrics_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="health_records")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=False)
    badge_icon = Column(String(50), default="award")
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="achievements")


class Streak(Base):
    __tablename__ = "streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False) # Workout, Journal, Sleep, Habit
    current_streak = Column(Integer, default=1)
    longest_streak = Column(Integer, default=1)
    last_activity_date = Column(Date, default=date.today)

    user = relationship("User", back_populates="streaks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="General") # Workout, Meal, Medication, Appointment, System
    is_read = Column(Boolean, default=False)
    scheduled_for = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    tool_calls_json = Column(JSON, nullable=True)
    source_type = Column(String(50), default="LOCAL_DATA") # LOCAL_DATA, INTERNET_VERIFIED, AI_HEURISTIC
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String(20), default="dark") # dark, light
    voice_feedback_enabled = Column(Boolean, default=True)
    language = Column(String(10), default="en") # en, ta
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")


class EnvironmentResource(Base):
    __tablename__ = "environment_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    equipment_list = Column(JSON, default=list) # e.g. ["Dumbbells", "Resistance Band", "Yoga Mat"]
    pantry_foods = Column(JSON, default=list) # e.g. ["Rice", "Eggs", "Curd", "Banana"]
    cooking_access = Column(String(50), default="Full Kitchen")
    budget_tier = Column(String(50), default="Budget-Friendly")
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resources")
