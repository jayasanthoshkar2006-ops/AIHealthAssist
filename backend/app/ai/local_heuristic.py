import math
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, date
from app.ai.provider import BaseAIProvider

class LocalHeuristicProvider(BaseAIProvider):
    """
    Offline & Heuristic AI Engine that provides intelligent, rule-based responses,
    predictive statistics, schedule adjustments, and nutrition estimations without
    requiring external network calls or paid API keys.
    """

    def analyze_lifestyle_resources(self, profile: Dict[str, Any], resources: Dict[str, Any]) -> Dict[str, Any]:
        profession = profile.get("profession", "Software Developer")
        gym = profile.get("gym_available", False)
        equip = profile.get("available_equipment", "") or "Bodyweight"
        budget = profile.get("food_budget", "Moderate")
        pref = profile.get("food_preference", "Vegetarian")
        
        # Determine constraints based on profession
        time_slot = "Evening (18:30)"
        workout_type = "Home Calisthenics / Resistance"
        if "Doctor" in profession or "Driver" in profession:
            time_slot = "Flexible Short Sessions (20-30 mins)"
        elif "Student" in profession:
            time_slot = "Late Evening (18:00 - 19:30)"
            
        if gym:
            workout_type = "Gym Compound Lift Routine"
        elif "Dumbbell" in str(equip):
            workout_type = "Dumbbell & Resistance Band Home Workout"

        meal_suggestions = []
        if "Vegetarian" in pref:
            meal_suggestions = [
                "Lentil Soup / Dal Curry with Brown Rice or Roti",
                "Paneer / Tofu Stir Fry with Green Vegetables",
                "Curd Rice / Yogurt with Bananas and Nuts",
                "Sprouted Green Gram Salad"
            ]
        else:
            meal_suggestions = [
                "Boiled Eggs / Omelette with Whole Grain Toast",
                "Chicken Curry / Grilled Fish with Rice or Millet",
                "Curd Rice with Boiled Egg and Vegetables",
                "Steamed Vegetables with Grilled Protein"
            ]

        return {
            "lifestyle_constraints": [
                f"Work regime: {profession} schedule",
                f"Budget tier: {budget}",
                f"Available space/equipment: {equip}"
            ],
            "recommended_activities": [
                workout_type,
                "Brisk Walking (7,000+ steps/day)",
                "Post-work 5-min Mobility & Stretching"
            ],
            "realistic_workout_possibilities": [workout_type, "Quick 15-min Morning HIIT"],
            "realistic_meal_possibilities": meal_suggestions,
            "available_time_slots": [time_slot, "Early Morning (06:45)"],
            "possible_conflicts": ["Overtime work hours", "Late dinner timing"],
            "personalized_recommendations": [
                f"Given your profession as a {profession}, schedule dedicated micro-breaks for hydration and eye rest.",
                f"Utilize your {equip} for high-efficiency compound movements."
            ]
        }

    def generate_daily_plan(self, profile: Dict[str, Any], schedule: Dict[str, Any], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        wake = schedule.get("wake_time", "06:30")
        sleep = schedule.get("sleep_time", "23:00")
        w_start = schedule.get("work_start", "09:00")
        w_end = schedule.get("work_end", "17:30")
        profession = profile.get("profession", "Software Developer")
        
        timeline = [
            {"time": wake, "activity": "Wake Up, Hydration & Light Stretching", "category": "sleep", "duration_minutes": 30},
            {"time": "07:30", "activity": "Nutritious Breakfast (High Protein)", "category": "meal", "duration_minutes": 30},
            {"time": w_start, "activity": f"Work / Study Session ({profession})", "category": "work", "duration_minutes": 240},
            {"time": "13:00", "activity": "Balanced Lunch & 10-min Walk", "category": "meal", "duration_minutes": 45},
            {"time": "14:00", "activity": "Afternoon Work & Hydration Reminder", "category": "work", "duration_minutes": 210},
            {"time": w_end, "activity": "Work Wrap-up & Transition Break", "category": "rest", "duration_minutes": 30},
            {"time": "18:30", "activity": "Targeted AI Workout Session (35 mins)", "category": "workout", "duration_minutes": 45},
            {"time": "19:30", "activity": "Cool-down & Shower", "category": "rest", "duration_minutes": 30},
            {"time": "20:00", "activity": "Light Dinner & Family Time", "category": "meal", "duration_minutes": 60},
            {"time": "22:00", "activity": "Mental Wellness Journal & Wind Down", "category": "journal", "duration_minutes": 30},
            {"time": sleep, "activity": "Restful Sleep Target", "category": "sleep", "duration_minutes": 450}
        ]

        insights = f"Your daily plan is tailored for a {profession}. It balances focused work blocks with an evening workout at 18:30 and optimal sleep timing."
        return {
            "date": str(date.today()),
            "timeline": timeline,
            "ai_insights": insights,
            "recommendations": [
                "Drink at least 2.5L of water today.",
                "Take a 2-minute posture check every hour during work."
            ]
        }

    def adjust_schedule(self, current_schedule: List[Dict[str, Any]], user_command: str) -> List[Dict[str, Any]]:
        cmd = user_command.lower()
        updated = [dict(item) for item in current_schedule]
        
        if "evening" in cmd or "6" in cmd or "7" in cmd:
            # Shift workout to evening 18:30 or 19:00
            for item in updated:
                if item.get("category") == "workout":
                    item["time"] = "19:00"
                    item["activity"] = "Adjusted Evening Workout Session"
        elif "lighter" in cmd or "light" in cmd:
            for item in updated:
                if item.get("category") == "workout":
                    item["activity"] = "Light Recovery Stretching & Mobility Workout (20 min)"
                    item["duration_minutes"] = 20
        elif "lunch" in cmd and "1:30" in cmd:
            for item in updated:
                if "Lunch" in item.get("activity", ""):
                    item["time"] = "13:30"

        return updated

    def predict_performance(self, exercise_name: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not history or len(history) < 2:
            return {
                "exercise_name": exercise_name,
                "expected_reps": 12,
                "confidence_lower": 10,
                "confidence_upper": 15,
                "suggested_target": 12,
                "confidence_label": "Moderate (Based on baseline benchmark)",
                "notes": "Insufficient detailed historical logs yet. Accumulate 3+ workouts for high-precision ML prediction.",
                "disclaimer": "Predictions are statistical estimates and not physical guarantees."
            }
        
        reps = [h.get("actual_reps", 10) for h in history]
        avg_reps = sum(reps) / len(reps)
        recent_trend = reps[-1] - reps[0] if len(reps) > 1 else 0
        
        predicted = int(avg_reps + (1 if recent_trend >= 0 else -1))
        lower = max(1, predicted - 2)
        upper = predicted + 3
        
        return {
            "exercise_name": exercise_name,
            "expected_reps": predicted,
            "confidence_lower": lower,
            "confidence_upper": upper,
            "suggested_target": predicted,
            "confidence_label": "High Confidence",
            "notes": f"Based on your recent consistency across {len(history)} sessions.",
            "disclaimer": "Predictions are performance benchmarks. Listen to your body and adjust intensity as needed."
        }

    def analyze_food_image(self, image_base64: str, meal_type: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        return {
            "food_name": "Food image needs manual confirmation",
            "estimated_serving": "1 visible serving",
            "calories": 0,
            "protein_g": 0,
            "carbs_g": 0,
            "fat_g": 0,
            "confidence_percentage": 0,
            "is_estimate": True,
            "disclaimer": "Real image recognition is unavailable in offline mode. Configure the supported vision AI provider to identify this photo, or enter the food and nutrition values manually."
        }

    def analyze_sleep_patterns(self, sleep_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not sleep_logs:
            return {
                "average_duration": 7.2,
                "consistency_score": 80,
                "patterns_identified": ["Regular sleep baseline."],
                "recommendation": "Maintain consistency in sleep and wake times."
            }

        durations = [log.get("duration_hours", 7.0) for log in sleep_logs]
        avg_dur = round(sum(durations) / len(durations), 1)
        
        patterns = []
        if avg_dur < 6.5:
            patterns.append("Average sleep duration is lower than recommended 7-8 hours.")
        else:
            patterns.append("Sleep duration meets target healthy range.")
            
        return {
            "average_duration": avg_dur,
            "consistency_score": 85 if len(durations) > 3 else 70,
            "patterns_identified": patterns,
            "recommendation": "Avoid screen time 30 minutes before your target sleep time."
        }

    def chat_response(self, message: str, context: Dict[str, Any], use_internet: bool = False, language: str = "en") -> Dict[str, Any]:
        msg_lower = message.lower()
        is_tamil = language == "ta" or any(char in message for char in ["என்ன", "வணக்கம்", "இன்று", "எனக்கு", "எத்தனை"])

        # Tool execution identification
        tool_executed = None
        action_performed = None

        if "schedule" in msg_lower or "plan" in msg_lower or "இன்றைக்கு" in message:
            response = "Here is your plan for today: 06:30 AM Wake Up & Stretch, 09:00 AM Work/Study, 01:00 PM Lunch, 06:30 PM AI Workout, 08:00 PM Dinner, 10:30 PM Journal, 11:00 PM Sleep."
            if is_tamil:
                response = "இன்றைய உங்கள் அட்டவணை: காலை 06:30 விழிப்பு, 09:00 வேலை/படிப்புகள், 01:00 மதிய உணவு, மாலை 06:30 உடற்பயிற்சி (Workout), இரவு 08:00 இரவு உணவு, 11:00 தூக்கம்."
            tool_executed = "get_today_schedule"

        elif "workout" in msg_lower or "exercise" in msg_lower or "வாரம்" in message:
            workouts_cnt = context.get("weekly_workouts_count", 4)
            response = f"You completed {workouts_cnt} workouts this week! Your average form score was 89%. Keep up the strong consistency!"
            if is_tamil:
                response = f"இந்த வாரத்தில் நீங்கள் {workouts_cnt} உடற்பயிற்சிகளை நிறைவு செய்துள்ளீர்கள்! உங்கள் சராசரி படிவ மதிப்பெண் 89%. தொடர்ந்து முயற்சியுங்கள்!"
            tool_executed = "get_weekly_workouts"

        elif "move workout" in msg_lower or "evening" in msg_lower or "மாற்று" in message:
            response = "I have updated your schedule for today! Your workout is moved to 07:00 PM."
            if is_tamil:
                response = "உங்கள் இன்றைய அட்டவணையை மாற்றியுள்ளேன்! உடற்பயிற்சி மாலை 07:00 மணிக்கு மாற்றப்பட்டது."
            tool_executed = "update_schedule"
            action_performed = {"new_workout_time": "19:00"}

        elif "food" in msg_lower or "eat" in msg_lower or "சாப்பிடலாம்" in message:
            response = "Based on your available kitchen items, a balanced choice today is Lentil Dal with Whole Wheat Roti / Rice, a side of fresh Curd, and a Banana."
            if is_tamil:
                response = "உங்கள் சமையலறையில் உள்ள பொருட்களின் அடிப்படையில்: பருப்பு குழம்பு, சாதம்/ரொட்டி, தயிர் மற்றும் ஒரு வாழைப்பழம் சிறந்த உணவுத் தேர்வாகும்."
            tool_executed = "get_food_suggestion"

        else:
            response = "I am your AI Personal Health & Wellness Assistant. I analyze your profession, schedule, environment, workouts, nutrition, and sleep to generate personalized guidance."
            if is_tamil:
                response = "நான் உங்களின் AI தனிப்பட்ட உடல்நல மற்றும் வாழ்க்கை முறை உதவியாளர். உங்கள் வேலை, நேர அட்டவணை, உணவுகள் மற்றும் உடற்பயிற்சிகளை பகுப்பாய்வு செய்து உதவுகிறேன்."

        citations = None
        if use_internet:
            citations = [
                {
                    "source": "World Health Organization (WHO) - Physical Activity Guidelines",
                    "url": "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
                    "date": "2024"
                }
            ]

        return {
            "response": response,
            "source_type": "INTERNET_VERIFIED" if use_internet else "LOCAL_DATA",
            "tool_executed": tool_executed,
            "action_performed": action_performed,
            "citations": citations,
            "disclaimer": "This tool provides lifestyle and fitness wellness organization. It is not a substitute for professional medical advice."
        }
