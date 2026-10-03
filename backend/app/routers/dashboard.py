from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain_models import (
    User,
    UserProfile,
    UserSchedule,
    Workout,
    NutritionLog,
    SleepRecord,
    HabitRecord,
    Goal,
    Streak,
    DailyPlan,
)
from app.routers.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    start_of_today = datetime.combine(
        today,
        datetime.min.time()
    )

    start_of_next_day = start_of_today + timedelta(days=1)

    # ============================================================
    # DEMO USER
    # ============================================================

    # Fake/sample graph data is allowed ONLY for the demo account.
    # Normal registered users will always receive real database data.
    is_demo_user = current_user.email == "demo@example.com"

    # ============================================================
    # USER PROFILE
    # ============================================================

    profile = (
        db.query(UserProfile)
        .filter(
            UserProfile.user_id == current_user.id
        )
        .first()
    )

    # ============================================================
    # USER SCHEDULE
    # ============================================================

    schedule = (
        db.query(UserSchedule)
        .filter(
            UserSchedule.user_id == current_user.id
        )
        .first()
    )

    # ============================================================
    # TODAY'S WORKOUTS
    # ============================================================

    today_workouts = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.created_at >= start_of_today,
            Workout.created_at < start_of_next_day,
        )
        .all()
    )

    workout_count = len(today_workouts)

    total_reps = sum(
        workout.total_reps or 0
        for workout in today_workouts
    )

    workout_duration = sum(
        workout.duration_minutes or 0
        for workout in today_workouts
    )

    form_scores = [
        workout.avg_form_score
        for workout in today_workouts
        if workout.avg_form_score is not None
    ]

    average_form = (
        round(
            sum(form_scores) / len(form_scores),
            1
        )
        if form_scores
        else 0
    )

    calories_burned = sum(
        workout.calories_burned or 0
        for workout in today_workouts
    )

    # ============================================================
    # TODAY'S NUTRITION
    # ============================================================

    nutrition_logs = (
        db.query(NutritionLog)
        .filter(
            NutritionLog.user_id == current_user.id,
            NutritionLog.log_date == today,
        )
        .all()
    )

    calories_consumed = sum(
        item.calories or 0
        for item in nutrition_logs
    )

    protein_consumed = sum(
        item.protein_g or 0
        for item in nutrition_logs
    )

    carbs_consumed = sum(
        item.carbs_g or 0
        for item in nutrition_logs
    )

    fat_consumed = sum(
        item.fat_g or 0
        for item in nutrition_logs
    )

    # ============================================================
    # LATEST SLEEP
    # ============================================================

    latest_sleep = (
        db.query(SleepRecord)
        .filter(
            SleepRecord.user_id == current_user.id
        )
        .order_by(
            SleepRecord.sleep_date.desc(),
            SleepRecord.id.desc()
        )
        .first()
    )

    sleep_hours = (
        latest_sleep.duration_hours
        if (
            latest_sleep
            and latest_sleep.duration_hours is not None
        )
        else 0
    )

    sleep_quality = (
        latest_sleep.quality_score
        if (
            latest_sleep
            and latest_sleep.quality_score is not None
        )
        else 0
    )

    # ============================================================
    # HABITS
    # ============================================================

    habits = (
        db.query(HabitRecord)
        .filter(
            HabitRecord.user_id == current_user.id
        )
        .all()
    )

    completed_habits = sum(
        1
        for habit in habits
        if getattr(
            habit,
            "completed",
            False
        )
    )

    total_habits = len(habits)

    habit_completion = (
        round(
            (completed_habits / total_habits) * 100,
            1
        )
        if total_habits > 0
        else 0
    )

    # ============================================================
    # GOALS
    # ============================================================

    goals = (
        db.query(Goal)
        .filter(
            Goal.user_id == current_user.id
        )
        .all()
    )

    # ============================================================
    # STREAK
    # ============================================================

    streak = (
        db.query(Streak)
        .filter(
            Streak.user_id == current_user.id
        )
        .first()
    )

    current_streak = (
        getattr(
            streak,
            "current_streak",
            0
        )
        if streak
        else 0
    )

    # ============================================================
    # TODAY'S PLAN
    # ============================================================

    today_plan = (
        db.query(DailyPlan)
        .filter(
            DailyPlan.user_id == current_user.id,
            DailyPlan.plan_date == today,
        )
        .first()
    )

    # ============================================================
    # BMI
    # ============================================================

    bmi = None

    if profile:
        height = profile.height
        weight = profile.weight

        if (
            height
            and weight
            and height > 0
        ):
            height_m = height / 100

            bmi = round(
                weight / (height_m * height_m),
                1
            )

    # ============================================================
    # 7-DAY WORKOUT TREND
    # ============================================================

    trend_start = today - timedelta(days=6)

    if is_demo_user:

        # --------------------------------------------------------
        # DEMO GRAPH DATA
        # --------------------------------------------------------
        # These values are intentionally sample values for the
        # public demo account only.
        # --------------------------------------------------------

        workout_trend = [
            {
                "day": "Mon",
                "date": str(
                    today - timedelta(days=6)
                ),
                "reps": 40,
                "form": 88,
            },
            {
                "day": "Tue",
                "date": str(
                    today - timedelta(days=5)
                ),
                "reps": 45,
                "form": 90,
            },
            {
                "day": "Wed",
                "date": str(
                    today - timedelta(days=4)
                ),
                "reps": 50,
                "form": 92,
            },
            {
                "day": "Thu",
                "date": str(
                    today - timedelta(days=3)
                ),
                "reps": 35,
                "form": 87,
            },
            {
                "day": "Fri",
                "date": str(
                    today - timedelta(days=2)
                ),
                "reps": 60,
                "form": 94,
            },
            {
                "day": "Sat",
                "date": str(
                    today - timedelta(days=1)
                ),
                "reps": 55,
                "form": 93,
            },
            {
                "day": "Sun",
                "date": str(today),
                "reps": 65,
                "form": 95,
            },
        ]

    else:

        # --------------------------------------------------------
        # REAL USER DATA
        # --------------------------------------------------------

        workouts_7_days = (
            db.query(Workout)
            .filter(
                Workout.user_id == current_user.id,
                Workout.created_at >= datetime.combine(
                    trend_start,
                    datetime.min.time()
                ),
                Workout.created_at < start_of_next_day,
            )
            .all()
        )

        workout_trend = []

        for day_offset in range(7):

            trend_day = (
                trend_start
                + timedelta(days=day_offset)
            )

            day_workouts = [
                workout
                for workout in workouts_7_days
                if (
                    workout.created_at is not None
                    and workout.created_at.date()
                    == trend_day
                )
            ]

            day_reps = sum(
                workout.total_reps or 0
                for workout in day_workouts
            )

            day_form_scores = [
                workout.avg_form_score
                for workout in day_workouts
                if (
                    workout.avg_form_score is not None
                    and workout.avg_form_score > 0
                )
            ]

            day_form = (
                round(
                    sum(day_form_scores)
                    / len(day_form_scores),
                    1
                )
                if day_form_scores
                else None
            )

            workout_trend.append(
                {
                    "day": trend_day.strftime("%a"),
                    "date": str(trend_day),

                    # No workout = no fake value
                    "reps": (
                        day_reps
                        if day_workouts
                        else None
                    ),

                    "form": day_form,
                }
            )

    # ============================================================
    # 7-DAY SLEEP TREND
    # ============================================================

    if is_demo_user:

        # --------------------------------------------------------
        # DEMO GRAPH DATA
        # --------------------------------------------------------
        # Sample sleep values for demo account only.
        # --------------------------------------------------------

        sleep_trend = [
            {
                "day": "Mon",
                "date": str(
                    today - timedelta(days=6)
                ),
                "hours": 7.2,
            },
            {
                "day": "Tue",
                "date": str(
                    today - timedelta(days=5)
                ),
                "hours": 7.5,
            },
            {
                "day": "Wed",
                "date": str(
                    today - timedelta(days=4)
                ),
                "hours": 6.8,
            },
            {
                "day": "Thu",
                "date": str(
                    today - timedelta(days=3)
                ),
                "hours": 7.8,
            },
            {
                "day": "Fri",
                "date": str(
                    today - timedelta(days=2)
                ),
                "hours": 7.4,
            },
            {
                "day": "Sat",
                "date": str(
                    today - timedelta(days=1)
                ),
                "hours": 8.1,
            },
            {
                "day": "Sun",
                "date": str(today),
                "hours": 7.6,
            },
        ]

    else:

        # --------------------------------------------------------
        # REAL USER DATA
        # --------------------------------------------------------

        sleep_records_7_days = (
            db.query(SleepRecord)
            .filter(
                SleepRecord.user_id == current_user.id,
                SleepRecord.sleep_date >= trend_start,
                SleepRecord.sleep_date <= today,
            )
            .order_by(
                SleepRecord.sleep_date.asc(),
                SleepRecord.id.asc()
            )
            .all()
        )

        sleep_by_day = {}

        for record in sleep_records_7_days:

            if record.sleep_date is not None:
                sleep_by_day[
                    record.sleep_date
                ] = record

        sleep_trend = []

        for day_offset in range(7):

            trend_day = (
                trend_start
                + timedelta(days=day_offset)
            )

            record = sleep_by_day.get(
                trend_day
            )

            sleep_trend.append(
                {
                    "day": trend_day.strftime("%a"),
                    "date": str(trend_day),

                    # No sleep record = no fake value
                    "hours": (
                        record.duration_hours
                        if (
                            record
                            and record.duration_hours
                            is not None
                        )
                        else None
                    ),
                }
            )

    # ============================================================
    # AI INSIGHTS
    # ============================================================

    insights = []

    if average_form > 0:

        if average_form >= 90:

            insights.append(
                "Your workout form is looking strong."
            )

        elif average_form >= 75:

            insights.append(
                "Your workout form is improving. "
                "Focus on controlled movements."
            )

        else:

            insights.append(
                "Focus on maintaining proper form "
                "during your exercises."
            )

    if sleep_hours > 0:

        if sleep_hours >= 7:

            insights.append(
                "Your recorded sleep duration is "
                "within a commonly recommended range."
            )

        else:

            insights.append(
                "Your recorded sleep duration is "
                "below 7 hours."
            )

    if not insights:

        insights.append(
            "Start recording workouts and sleep "
            "to receive personalized insights."
        )

    # ============================================================
    # RETURN DASHBOARD
    # ============================================================

    return {

        # ========================================================
        # PROFILE
        # ========================================================

        "profile": (
            {
                "name": profile.name,
                "age": profile.age,
                "gender": profile.gender,
                "height": profile.height,
                "weight": profile.weight,
                "profession": profile.profession,
                "fitness_level": profile.fitness_level,
                "food_preference": (
                    profile.food_preference
                ),
                "food_budget": (
                    profile.food_budget
                ),
                "cooking_availability": (
                    profile.cooking_availability
                ),
                "gym_available": (
                    profile.gym_available
                ),
                "home_workout": (
                    profile.home_workout
                ),
                "stress_rating": (
                    profile.stress_rating
                ),
                "preferred_language": (
                    profile.preferred_language
                ),
            }
            if profile
            else None
        ),

        # ========================================================
        # SCHEDULE
        # ========================================================

        "schedule": (
            {
                "wake_time": schedule.wake_time,
                "sleep_time": schedule.sleep_time,
                "work_start": schedule.work_start,
                "work_end": schedule.work_end,
            }
            if schedule
            else None
        ),

        # ========================================================
        # BMI
        # ========================================================

        "bmi": bmi,

        # ========================================================
        # TODAY
        # ========================================================

        "today": {

            "workout_count": workout_count,

            "total_reps": total_reps,

            "workout_duration": (
                workout_duration
            ),

            "average_form": average_form,

            "calories_burned": (
                calories_burned
            ),

            "calories_consumed": (
                calories_consumed
            ),

            "protein_consumed": (
                protein_consumed
            ),

            "carbs_consumed": (
                carbs_consumed
            ),

            "fat_consumed": (
                fat_consumed
            ),

            "sleep_hours": sleep_hours,

            "sleep_quality": sleep_quality,

            "habit_completion": (
                habit_completion
            ),
        },

        # ========================================================
        # HABITS
        # ========================================================

        "habits": {

            "completed": (
                completed_habits
            ),

            "total": total_habits,

            "completion_percentage": (
                habit_completion
            ),
        },

        # ========================================================
        # GOALS
        # ========================================================

        "goals": [

            {
                "id": goal.id,

                "title": getattr(
                    goal,
                    "title",
                    None
                ),

                "description": getattr(
                    goal,
                    "description",
                    None
                ),

                "target_value": getattr(
                    goal,
                    "target_value",
                    None
                ),

                "current_value": getattr(
                    goal,
                    "current_value",
                    None
                ),

                "status": getattr(
                    goal,
                    "status",
                    None
                ),
            }

            for goal in goals
        ],

        # ========================================================
        # STREAK
        # ========================================================

        "streak": {

            "current": current_streak,

        },

        # ========================================================
        # TODAY'S PLAN
        # ========================================================

        "today_plan": (

            {
                "id": today_plan.id,

                "plan_date": str(
                    today_plan.plan_date
                ),
            }

            if today_plan

            else None
        ),

        # ========================================================
        # GRAPH DATA
        # ========================================================

        "workout_trend": workout_trend,

        "sleep_trend": sleep_trend,

        # ========================================================
        # AI INSIGHTS
        # ========================================================

        "ai_insights": insights,
    }
