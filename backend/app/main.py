import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import domain_models
from app.routers import (
    auth,
    onboarding,
    daily_plan,
    workouts,
    nutrition,
    sleep,
    journal,
    reminders,
    appointments,
    health,
    goals,
    assistant,
    reports,
    dashboard
)
from app.auth.security import get_password_hash

# Create tables automatically for SQLite local fallback or Postgres
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-style AI Personal Health & Wellness Assistant API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under API_V1_STR
v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=v1_prefix)
app.include_router(onboarding.router, prefix=v1_prefix)
app.include_router(daily_plan.router, prefix=v1_prefix)
app.include_router(workouts.router, prefix=v1_prefix)
app.include_router(nutrition.router, prefix=v1_prefix)
app.include_router(sleep.router, prefix=v1_prefix)
app.include_router(journal.router, prefix=v1_prefix)
app.include_router(reminders.router, prefix=v1_prefix)
app.include_router(appointments.router, prefix=v1_prefix)
app.include_router(health.router, prefix=v1_prefix)
app.include_router(goals.router, prefix=v1_prefix)
app.include_router(assistant.router, prefix=v1_prefix)
app.include_router(reports.router, prefix=v1_prefix)
app.include_router(dashboard.router, prefix=v1_prefix)

@app.on_event("startup")
def seed_demo_user():
    """Seeds a demo account demo@example.com for instant testing/demoing."""
    db = SessionLocal()
    try:
        demo = db.query(domain_models.User).filter(domain_models.User.email == "demo@example.com").first()
        if not demo:
            demo_user = domain_models.User(
                email="demo@example.com",
                hashed_password=get_password_hash("demo1234"),
                language="en"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Seed demo profile
            prof = domain_models.UserProfile(
                user_id=demo_user.id,
                name="Hari",
                age=24,
                gender="Male",
                height=175.0,
                weight=70.0,
                location="India",
                profession="Software Developer",
                food_preference="Vegetarian",
                food_budget="Moderate",
                cooking_availability="Daily",
                gym_available=False,
                home_workout=True,
                available_equipment="Dumbbells, Yoga Mat",
                fitness_level="Intermediate",
                stress_rating=4,
                preferred_language="en"
            )
            db.add(prof)

            # Seed demo schedule
            sched = domain_models.UserSchedule(
                user_id=demo_user.id,
                wake_time="06:30",
                sleep_time="23:00",
                work_start="09:00",
                work_end="17:30"
            )
            db.add(sched)
            db.commit()
    except Exception as e:
        print("Demo seed info:", e)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }
