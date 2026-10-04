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
    tags=["Dashboard"],
)


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    start_of_today = datetime.combine(
        today,
        datetime.min.time(),
    )

    start_of_next_day = start_of_today + timedelta(days=1)

    # ============================================================
    # DEMO USER CHECK
    # ============================================================

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
            1,
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
            SleepRecord.id.desc(),
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
            False,
        )
    )

    total_habits = len(habits)

    habit_completion = (
        round(
            (completed_habits / total_habits) * 100,
            1,
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
            0,
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
                1,
            )

    # ============================================================
    # DEMO DATA
    # ============================================================
    #
    # Fake values are returned ONLY for:
    # demo@example.com
    #
    # Normal users continue using their real database data.
    # ============================================================

    if is_demo_user:

        # --------------------------------------------------------
        # DEMO PROFILE
        # --------------------------------------------------------

        demo_profile = {
            "name": "Hari",
            "age": 24,
            "gender": "Male",
            "height": 175.0,
            "weight": 70.0,
            "profession": "Software Developer",
            "fitness_level": "Intermediate",
            "food_preference": "Vegetarian",
            "food_budget": "Moderate",
            "cooking_availability": "Daily",
            "gym_available": False,
            "home_workout": True,
            "stress_rating": 4,
            "preferred_language": "en",
        }

        # --------------------------------------------------------
        # DEMO SCHEDULE
        # --------------------------------------------------------

        demo_schedule = {
            "wake_time": "06:30",
            "sleep_time": "23:00",
            "work_start": "09:00",
            "work_end": "17:30",
        }

        # --------------------------------------------------------
        # DEMO BMI
        # --------------------------------------------------------

        demo_height_m = 175.0 / 100

        demo_bmi = round(
            70.0 / (
                demo_height_m * demo_height_m
            ),
            1,
        )

        # --------------------------------------------------------
        # DEMO TODAY
        # --------------------------------------------------------

        demo_today = {
            "workout_count": 2,
            "total_reps": 65,
            "workout_duration": 42,
            "average_form": 95,
            "calories_burned": 320,
            "calories_consumed": 2180,
            "protein_consumed": 96,
            "carbs_consumed": 285,
            "fat_consumed": 68,
            "sleep_hours": 7.6,
            "sleep_quality": 92,
            "habit_completion": 80,
        }

        # --------------------------------------------------------
        # DEMO HABITS
        # --------------------------------------------------------

        demo_habits = {
            "completed": 4,
            "total": 5,
            "completion_percentage": 80,
        }

        # --------------------------------------------------------
        # DEMO GOALS
        # --------------------------------------------------------

        demo_goals = [
            {
                "id": 1,
                "title": "Build Healthy Lifestyle",
                "description": (
                    "Maintain a consistent healthy "
                    "daily routine."
                ),
                "target_value": 100,
                "current_value": 78,
                "status": "In Progress",
            },
            {
                "id": 2,
                "title": "Improve Fitness",
                "description": (
                    "Complete regular workouts "
                    "and improve exercise form."
                ),
                "target_value": 30,
                "current_value": 22,
                "status": "In Progress",
            },
            {
                "id": 3,
                "title": "Maintain Sleep Routine",
                "description": (
                    "Maintain a consistent sleep "
                    "schedule."
                ),
                "target_value": 30,
                "current_value": 26,
                "status": "In Progress",
            },
        ]

        # --------------------------------------------------------
        # DEMO STREAK
        # --------------------------------------------------------

        demo_streak = {
            "current": 12,
        }

        # --------------------------------------------------------
        # DEMO TODAY'S PLAN
        # --------------------------------------------------------

        demo_today_plan = {
            "id": 1,
            "plan_date": str(today),
        }

        # --------------------------------------------------------
        # DEMO WORKOUT GRAPH
        # --------------------------------------------------------

        demo_workout_values = [
            (40, 88),
            (45, 90),
            (50, 92),
            (35, 87),
            (60, 94),
            (55, 93),
            (65, 95),
        ]

        workout_trend = []

        for index, (reps, form) in enumerate(
            demo_workout_values
        ):
            graph_day = today - timedelta(
                days=6 - index
            )

            workout_trend.append(
                {
                    "day": graph_day.strftime("%a"),
                    "date": str(graph_day),
                    "reps": reps,
                    "form": form,
                }
            )

        # --------------------------------------------------------
        # DEMO SLEEP GRAPH
        # --------------------------------------------------------

        demo_sleep_values = [
            7.2,
            7.5,
            6.8,
            7.8,
            7.4,
            8.1,
            7.6,
        ]

        sleep_trend = []

        for index, hours in enumerate(
            demo_sleep_values
        ):
            graph_day = today - timedelta(
                days=6 - index
            )

            sleep_trend.append(
                {
                    "day": graph_day.strftime("%a"),
                    "date": str(graph_day),
                    "hours": hours,
                }
            )

        # --------------------------------------------------------
        # DEMO AI INSIGHTS
        # --------------------------------------------------------

        demo_insights = [
            "Your workout consistency has been strong this week.",
            "Your recorded sleep pattern is consistent.",
            "Your average workout form is improving.",
            "You have completed 80% of your daily habits.",
        ]

        # --------------------------------------------------------
        # RETURN COMPLETE DEMO DASHBOARD
        # --------------------------------------------------------

        return {
            "profile": demo_profile,
            "schedule": demo_schedule,
            "bmi": demo_bmi,
            "today": demo_today,
            "habits": demo_habits,
            "goals": demo_goals,
            "streak": demo_streak,
            "today_plan": demo_today_plan,
            "workout_trend": workout_trend,
            "sleep_trend": sleep_trend,
            "ai_insights": demo_insights,
        }

    # ============================================================
    # REAL USER DATA
    # ============================================================

    # ============================================================
    # 7-DAY REAL WORKOUT TREND
    # ============================================================

    trend_start = today - timedelta(days=6)

    workouts_7_days = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.created_at >= datetime.combine(
                trend_start,
                datetime.min.time(),
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
                1,
            )
            if day_form_scores
            else None
        )

        workout_trend.append(
            {
                "day": trend_day.strftime("%a"),
                "date": str(trend_day),
                "reps": (
                    day_reps
                    if day_workouts
                    else None
                ),
                "form": day_form,
            }
        )

    # ============================================================
    # 7-DAY REAL SLEEP TREND
    # ============================================================

    sleep_records_7_days = (
        db.query(SleepRecord)
        .filter(
            SleepRecord.user_id == current_user.id,
            SleepRecord.sleep_date >= trend_start,
            SleepRecord.sleep_date <= today,
        )
        .order_by(
            SleepRecord.sleep_date.asc(),
            SleepRecord.id.asc(),
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
    # REAL USER AI INSIGHTS
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
    # RETURN REAL USER DASHBOARD
    # ============================================================

    return {
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

        "bmi": bmi,

        "today": {
            "workout_count": workout_count,
            "total_reps": total_reps,
            "workout_duration": workout_duration,
            "average_form": average_form,
            "calories_burned": calories_burned,
            "calories_consumed": calories_consumed,
            "protein_consumed": protein_consumed,
            "carbs_consumed": carbs_consumed,
            "fat_consumed": fat_consumed,
            "sleep_hours": sleep_hours,
            "sleep_quality": sleep_quality,
            "habit_completion": habit_completion,
        },

        "habits": {
            "completed": completed_habits,
            "total": total_habits,
            "completion_percentage": habit_completion,
        },

        "goals": [
            {
                "id": goal.id,
                "title": getattr(
                    goal,
                    "title",
                    None,
                ),
                "description": getattr(
                    goal,
                    "description",
                    None,
                ),
                "target_value": getattr(
                    goal,
                    "target_value",
                    None,
                ),
                "current_value": getattr(
                    goal,
                    "current_value",
                    None,
                ),
                "status": getattr(
                    goal,
                    "status",
                    None,
                ),
            }
            for goal in goals
        ],

        "streak": {
            "current": current_streak,
        },

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

        "workout_trend": workout_trend,

        "sleep_trend": sleep_trend,

        "ai_insights": insights,
    }
