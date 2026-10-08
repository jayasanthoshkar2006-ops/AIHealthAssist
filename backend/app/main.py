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
    journal,
    reminders,
    appointments,
    health,
    assistant,
    reports,
    dashboard
)
from app.auth.security import get_password_hash

# Create tables automatically for SQLite local fallback or Postgres
Base.metadata.create_all(bind=engine)

# Add columns introduced after the initial database schema.
# This keeps existing SQLite and PostgreSQL deployments compatible.
from sqlalchemy import inspect, text

user_columns = {column["name"] for column in inspect(engine).get_columns("users")}

with engine.begin() as connection:
    if "language" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en'"))
    if "is_demo" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE"))

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
app.include_router(journal.router, prefix=v1_prefix)
app.include_router(reminders.router, prefix=v1_prefix)
app.include_router(appointments.router, prefix=v1_prefix)
app.include_router(health.router, prefix=v1_prefix)
app.include_router(assistant.router, prefix=v1_prefix)
app.include_router(reports.router, prefix=v1_prefix)
app.include_router(dashboard.router, prefix=v1_prefix)

@app.on_event("startup")
def seed_demo_user():
    """Create or repair the built-in demo account so Instant Demo always works."""
    db = SessionLocal()
    try:
        demo = (
            db.query(domain_models.User)
            .filter(domain_models.User.email == "demo@example.com")
            .first()
        )

        if not demo:
            demo = domain_models.User(
                email="demo@example.com",
                hashed_password=get_password_hash("demo1234"),
                language="en",
                is_demo=True,
            )
            db.add(demo)
            db.flush()
        else:
            # The demo account may already exist in a persistent Render database
            # with an old password/hash. Always repair the demo credentials.
            demo.hashed_password = get_password_hash("demo1234")
            demo.language = "en"
            demo.is_demo = True
            demo.is_active = True

        db.commit()
        db.refresh(demo)

        # Seed demo profile if it does not already exist.
        prof = (
            db.query(domain_models.UserProfile)
            .filter(domain_models.UserProfile.user_id == demo.id)
            .first()
        )
        if not prof:
            prof = domain_models.UserProfile(
                user_id=demo.id,
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
                preferred_language="en",
            )
            db.add(prof)

        # Seed demo schedule if it does not already exist.
        sched = (
            db.query(domain_models.UserSchedule)
            .filter(domain_models.UserSchedule.user_id == demo.id)
            .first()
        )
        if not sched:
            sched = domain_models.UserSchedule(
                user_id=demo.id,
                wake_time="06:30",
                sleep_time="23:00",
                work_start="09:00",
                work_end="17:30",
            )
            db.add(sched)

        db.commit()
        print("Demo account ready: demo@example.com / demo1234")
    except Exception as e:
        db.rollback()
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
