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
    tags=["Dashboard Overview"]
)


@router.get("")
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()

    # ============================================================
    # USER PROFILE
    # ============================================================

    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )

    user_name = profile.name if profile else "Friend"
    profession = profile.profession if profile else None

    # ============================================================
    # TODAY'S SCHEDULE
    # ============================================================

    schedule = (
        db.query(UserSchedule)
        .filter(
            UserSchedule.user_id == current_user.id,
            UserSchedule.schedule_date == today
        )
        .order_by(UserSchedule.id.desc())
        .first()
    )

    # ============================================================
    # TODAY'S DAILY PLAN
    # ============================================================

    plan = (
        db.query(DailyPlan)
        .filter(
            DailyPlan.user_id == current_user.id,
            DailyPlan.plan_date == today
        )
        .order_by(DailyPlan.id.desc())
        .first()
    )

    # ============================================================
    # TODAY'S WORKOUTS
    # ============================================================

    start_of_day = datetime.combine(today, datetime.min.time())
    start_of_next_day = start_of_day + timedelta(days=1)

    workouts_today = (
        db.query(Workout)
        .filter(
            Workout.user_id == current_user.id,
            Workout.created_at >= start_of_day,
            Workout.created_at < start_of_next_day
        )
        .all()
    )

    workout_count = len(workouts_today)

    total_workout_minutes = sum(
        workout.duration_minutes or 0
        for workout in workouts_today
    )

    total_reps = sum(
        workout.total_reps or 0
        for workout in workouts_today
    )

    calories_burned = sum(
        workout.calories_burned or 0
        for workout in workouts_today
    )

    # Only calculate form when an actual form score exists.
    form_scores = [
        workout.avg_form_score
        for workout in workouts_today
        if workout.avg_form_score is not None
        and workout.avg_form_score > 0
    ]

    avg_form_score = (
        round(sum(form_scores) / len(form_scores), 1)
        if form_scores
        else None
    )

    # ============================================================
    # TODAY'S NUTRITION
    # ============================================================

    nutrition_today = (
        db.query(NutritionLog)
        .filter(
            NutritionLog.user_id == current_user.id,
            NutritionLog.log_date == today
        )
        .all()
    )

    nutrition_count = len(nutrition_today)

    total_calories = sum(
        nutrition.calories or 0
        for nutrition in nutrition_today
    )

    total_protein = sum(
        nutrition.protein_g or 0
        for nutrition in nutrition_today
    )

    total_carbs = sum(
        nutrition.carbs_g or 0
        for nutrition in nutrition_today
    )

    total_fat = sum(
        nutrition.fat_g or 0
        for nutrition in nutrition_today
    )

    # ============================================================
    # SLEEP
    # ============================================================

    sleep_latest = (
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

    sleep_duration = (
        sleep_latest.duration_hours
        if sleep_latest
        else None
    )

    sleep_quality = (
        sleep_latest.quality_score
        if sleep_latest
        else None
    )

    # ============================================================
    # TODAY'S HABITS
    # ============================================================

    habits_today = (
        db.query(HabitRecord)
        .filter(
            HabitRecord.user_id == current_user.id,
            HabitRecord.completed_date == today
        )
        .all()
    )

    habits_total = len(habits_today)

    habits_completed = sum(
        1
        for habit in habits_today
        if habit.is_completed
    )

    # ============================================================
    # REAL STREAK
    # ============================================================

    streaks = (
        db.query(Streak)
        .filter(
            Streak.user_id == current_user.id
        )
        .all()
    )

    streak_days = 0

    if streaks:
        streak_days = max(
            (streak.current_streak or 0)
            for streak in streaks
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

    goal_data = []

    for goal in goals:
        goal_data.append({
            "id": goal.id,
            "title": goal.title,
            "category": goal.category,
            "current_value": goal.current_value,
            "target_value": goal.target_value,
            "unit": goal.unit,
            "deadline": (
                str(goal.deadline)
                if goal.deadline
                else None
            ),
            "is_completed": goal.is_completed,
        })

    # ============================================================
    # DAILY PERFORMANCE
    #
    # The score only uses activities that can actually be measured.
    #
    # Workout  = 25%
    # Nutrition = 25%
    # Sleep     = 25%
    # Habits    = 25%
    #
    # If there is no data at all, score is None.
    # ============================================================

    performance_components = {}

    # ----------------------------
    # Workout performance
    # ----------------------------

    workout_score = None

    if workout_count > 0:
        workout_score = 100

    performance_components["workout"] = workout_score

    # ----------------------------
    # Nutrition performance
    # ----------------------------

    nutrition_score = None

    if nutrition_count > 0:
        # Recording meals is measurable.
        # We don't assume a specific calorie target
        # without a proper personalized target.
        nutrition_score = 100

    performance_components["nutrition"] = nutrition_score

    # ----------------------------
    # Sleep performance
    # ----------------------------

    sleep_score = None

    if sleep_latest:
        # Use recorded sleep quality when available.
        if sleep_quality is not None:
            sleep_score = min(
                100,
                max(
                    0,
                    round((sleep_quality / 10) * 100)
                )
            )
        else:
            sleep_score = 100

    performance_components["sleep"] = sleep_score

    # ----------------------------
    # Habit performance
    # ----------------------------

    habit_score = None

    if habits_total > 0:
        habit_score = round(
            (habits_completed / habits_total) * 100
        )

    performance_components["habits"] = habit_score

    # ============================================================
    # FINAL DAILY PERFORMANCE
    #
    # Only components with real data are included.
    # ============================================================

    available_scores = [
        score
        for score in performance_components.values()
        if score is not None
    ]

    daily_performance = (
        round(sum(available_scores) / len(available_scores))
        if available_scores
        else None
    )

    # ============================================================
    # PERFORMANCE STATUS
    # ============================================================

    if daily_performance is None:
        performance_status = "No data yet"
    elif daily_performance >= 80:
        performance_status = "Strong activity recorded"
    elif daily_performance >= 60:
        performance_status = "Good progress"
    elif daily_performance >= 40:
        performance_status = "Some activity recorded"
    else:
        performance_status = "Getting started"

    # ============================================================
    # AI INSIGHTS
    #
    # These are generated from REAL data only.
    # ============================================================

    ai_insights = []

    if workout_count == 0:
        ai_insights.append(
            "No workout recorded today yet."
        )
    else:
        ai_insights.append(
            f"You completed {workout_count} workout"
            f"{'s' if workout_count != 1 else ''} today."
        )

    if nutrition_count == 0:
        ai_insights.append(
            "No nutrition records have been added today."
        )
    else:
        ai_insights.append(
            f"You recorded {nutrition_count} meal"
            f"{'s' if nutrition_count != 1 else ''} today."
        )

    if sleep_latest is None:
        ai_insights.append(
            "No sleep record has been added yet."
        )
    else:
        ai_insights.append(
            f"Latest recorded sleep duration: "
            f"{sleep_duration:.1f} hours."
        )

    if habits_total > 0:
        ai_insights.append(
            f"You completed {habits_completed} of "
            f"{habits_total} recorded habits today."
        )

    # ============================================================
    # TODAY'S PLAN INFORMATION
    # ============================================================

    today_plan = None

    if plan:
        today_plan = {
            "plan_date": str(plan.plan_date),
            "timeline": plan.timeline_json,
            "recommendations": plan.recommendations_json,
            "ai_insights": plan.ai_insights,
        }

    # ============================================================
    # REAL WEIGHT INFORMATION
    # ============================================================

    current_weight = (
        profile.weight
        if profile and profile.weight is not None
        else None
    )

    height = (
        profile.height
        if profile and profile.height is not None
        else None
    )

    bmi = None

    if current_weight is not None and height and height > 0:
        height_m = height / 100

        bmi = round(
            current_weight / (height_m * height_m),
            1
        )

    # ============================================================
    # RETURN DASHBOARD
    # ============================================================

    return {
        "user_name": user_name,
        "profession": profession,
        "today_date": str(today),

        "profile": {
            "height_cm": height,
            "weight_kg": current_weight,
            "bmi": bmi,
        },

        "schedule": (
            {
                "wake_time": schedule.wake_time,
                "sleep_time": schedule.sleep_time,
                "work_start": schedule.work_start,
                "work_end": schedule.work_end,
                "schedule_data": schedule.schedule_data,
            }
            if schedule
            else None
        ),

        "today_plan": today_plan,

        "metrics": {
            "workouts_completed": workout_count,
            "total_workout_minutes": total_workout_minutes,
            "total_reps": total_reps,
            "calories_burned": calories_burned,
            "avg_form_score": avg_form_score,

            "nutrition_entries": nutrition_count,
            "today_calories": (
                total_calories
                if nutrition_count > 0
                else None
            ),
            "today_protein_g": (
                total_protein
                if nutrition_count > 0
                else None
            ),
            "today_carbs_g": (
                total_carbs
                if nutrition_count > 0
                else None
            ),
            "today_fat_g": (
                total_fat
                if nutrition_count > 0
                else None
            ),

            "sleep_duration_hours": sleep_duration,
            "sleep_quality_score": sleep_quality,

            "habits_total": habits_total,
            "habits_completed": habits_completed,

            "streak_days": streak_days,
        },

        "daily_performance": {
            "score": daily_performance,
            "status": performance_status,
            "components": {
                "workout": workout_score,
                "nutrition": nutrition_score,
                "sleep": sleep_score,
                "habits": habit_score,
            },
            "has_data": daily_performance is not None,
        },

        "goals": goal_data,

        "ai_insights": ai_insights,

        "data_status": {
            "has_workout_data": workout_count > 0,
            "has_nutrition_data": nutrition_count > 0,
            "has_sleep_data": sleep_latest is not None,
            "has_habit_data": habits_total > 0,
            "has_plan": plan is not None,
        },

        "disclaimer": (
            "This dashboard organizes user-recorded wellness "
            "information and calculated activity summaries. "
            "It is not a clinical assessment or diagnosis."
        ),
    }
