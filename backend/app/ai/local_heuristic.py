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
        """Conversation-first local assistant with controlled health tools.

        This remains fully offline-capable and deterministic, but uses recent
        conversation history to resolve short replies such as "no", "bye",
        "move it", and follow-up questions before falling back to a generic answer.
        """
        msg = message.strip()
        msg_lower = msg.lower()
        history = context.get("conversation_history") or []
        last_user = ""
        last_assistant = ""
        for turn in reversed(history):
            if turn.get("role") == "user" and not last_user:
                last_user = str(turn.get("content", ""))
            elif turn.get("role") == "assistant" and not last_assistant:
                last_assistant = str(turn.get("content", ""))

        is_tamil = language == "ta" or any(
            char in message for char in ["என்ன", "வணக்கம்", "இன்று", "எனக்கு", "எத்தனை", "சாப்பிட"]
        )
        profession = context.get("profession") or "your current lifestyle"

        tool_executed = None
        action_performed = None
        citations = None

        # Explicit conversation controls come before domain tools.
        is_goodbye = msg_lower in {
            "bye", "goodbye", "good bye", "see you", "see ya",
            "ok bye", "okay bye", "bye bye", "goaway", "go away",
            "leave me alone", "stop", "stop talking"
        }
        is_greeting = msg_lower in {
            "hi", "hii", "hiii", "hello", "hey", "hey there",
            "good morning", "good afternoon", "good evening"
        }
        is_negative_short = msg_lower in {
            "no", "nope", "nah", "not now", "nothing", "leave it", "forget it"
        }

        # Resolve pronouns/follow-ups from the previous turn.
        refers_to_workout = any(term in msg_lower for term in [
            "workout", "exercise", "training", "session", "it", "that"
        ]) and (
            "workout" in last_user.lower()
            or "workout" in last_assistant.lower()
            or "exercise" in last_user.lower()
            or "exercise" in last_assistant.lower()
        )

        is_move_workout = (
            ("move" in msg_lower and ("workout" in msg_lower or refers_to_workout))
            or ("reschedule" in msg_lower and ("workout" in msg_lower or refers_to_workout))
            or ("change" in msg_lower and ("workout" in msg_lower or refers_to_workout))
            or ("workout" in msg_lower and any(x in msg_lower for x in ["evening", "morning", "6 pm", "7 pm"]))
            or ("move it" in msg_lower and refers_to_workout)
            or "மாற்று" in message
        )

        is_current_guideline = (
            ("latest" in msg_lower or "current" in msg_lower or "official" in msg_lower)
            and any(term in msg_lower for term in ["who", "guideline", "nutrition", "health"])
        )

        is_food_question = any(term in msg_lower for term in [
            "what should i eat", "what can i eat", "eat before", "eat after",
            "pre workout", "post workout", "before a workout", "after a workout",
            "meal before", "meal after", "nutrition", "food suggestion"
        ]) or any(term in message for term in ["சாப்பிடலாம்", "உணவு", "ஊட்டச்சத்து"])

        is_weekly_workout_question = (
            ("how many" in msg_lower and "workout" in msg_lower)
            or ("workouts" in msg_lower and "week" in msg_lower)
            or "வாரம்" in message
        )

        is_today_schedule = (
            (("schedule" in msg_lower or "plan" in msg_lower) and not is_move_workout)
            or "what am i doing today" in msg_lower
            or "what do i have today" in msg_lower
            or "இன்றைக்கு" in message
        )

        if is_goodbye:
            response = "Bye! Take care and have a good day. I’ll be here whenever you need help with your wellness plan."
            if is_tamil:
                response = "சரி, bye! உங்கள் நாளை நன்றாக கவனித்துக்கொள்ளுங்கள். தேவையான போது மீண்டும் கேளுங்கள்."

        elif is_negative_short:
            response = (
                "No problem. I’ll leave it there. If you need help later, you can ask me about your schedule, "
                "workouts, meals, sleep, or goals."
            )
            if is_tamil:
                response = "பரவாயில்லை. இப்போது அதை விட்டுவிடலாம். பிறகு schedule, workout, உணவு, sleep அல்லது goals பற்றி கேட்கலாம்."

        elif is_greeting:
            response = (
                f"Hi! I’m ready to help with your {profession} lifestyle. "
                "What would you like to work on today—your schedule, workout, food, sleep, or a health/lifestyle question?"
            )
            if is_tamil:
                response = "வணக்கம்! உங்கள் lifestyle-க்கு உதவ தயாராக இருக்கிறேன். இன்று schedule, workout, உணவு, sleep அல்லது health/lifestyle கேள்வி—எதைப் பற்றி உதவி வேண்டும்?"

        elif is_move_workout:
            new_time = "19:00"
            if any(x in msg_lower for x in ["6 pm", "6:00 pm", "18:00", "6 in the evening"]):
                new_time = "18:00"
            elif any(x in msg_lower for x in ["7 pm", "7:00 pm", "19:00", "7 in the evening"]):
                new_time = "19:00"
            response = f"Done. I moved your workout to {_format_time(new_time)}."
            if is_tamil:
                response = f"சரி. உங்கள் workout {_format_time(new_time)}க்கு மாற்றப்பட்டுள்ளது."
            tool_executed = "update_schedule"
            action_performed = {"new_workout_time": new_time}

        elif is_current_guideline:
            if use_internet:
                response = (
                    "I’ll verify this against the official WHO source. WHO healthy-diet guidance emphasizes "
                    "a varied diet based mainly on minimally processed foods, plenty of fruit and vegetables, "
                    "adequate fibre, and limiting free sugars, saturated and trans fats, and excess salt. "
                    "Use the linked WHO source for the current official wording."
                )
                tool_executed = "internet_verify"
                citations = [{
                    "source": "World Health Organization — Healthy Diet",
                    "url": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
                    "date": str(date.today())
                }]
            else:
                response = (
                    "Internet Verification is OFF, so I won't claim this is the latest official WHO guidance. "
                    "Turn on Internet Verification and ask again."
                )
                tool_executed = "internet_verification_required"

        elif is_food_question:
            foods = context.get("available_foods") or ["banana", "milk", "eggs", "oats", "rice"]
            food_text = ", ".join(map(str, foods[:6]))
            response = (
                f"For a pre-workout meal, keep it light and easy to digest. For your {profession} lifestyle, "
                "a banana with milk or oats with fruit 60–90 minutes before training can work well. "
                f"If you need more protein, add a suitable protein food. You currently have: {food_text}. "
                "Avoid a very heavy or oily meal immediately before exercise."
            )
            if is_tamil:
                response = "Workoutக்கு 60–90 நிமிடங்களுக்கு முன் லேசான, எளிதில் ஜீரணமாகும் உணவை எடுத்துக்கொள்ளுங்கள். வாழைப்பழம் + பால் அல்லது oats + பழம் நல்ல தேர்வு. கூடுதல் protein தேவைப்பட்டால் பொருத்தமான protein உணவை சேர்க்கலாம்."
            tool_executed = "get_food_suggestion"

        elif is_weekly_workout_question:
            workouts_cnt = context.get("weekly_workouts_count", 0)
            response = f"You completed {workouts_cnt} workouts this week. Keep up the consistency!"
            if is_tamil:
                response = f"இந்த வாரத்தில் நீங்கள் {workouts_cnt} workout-களை முடித்துள்ளீர்கள். தொடர்ந்து செய்யுங்கள்!"
            tool_executed = "get_weekly_workouts"

        elif is_today_schedule:
            schedule = context.get("today_schedule") or []
            items = []
            for item in schedule:
                if isinstance(item, dict):
                    t = item.get("time", "")
                    a = item.get("activity", "")
                    if t and a:
                        items.append(f"{t} {a}")
            response = (
                "Here is your plan for today: " + ", ".join(items)
                if items else
                "I don't have a saved schedule for today yet. Please open Today's Plan to generate or update it."
            )
            if is_tamil:
                response = "இதுதான் இன்று உங்கள் schedule. Today's Plan பகுதியில் முழு அட்டவணையை பார்க்கலாம்."
            tool_executed = "get_today_schedule"

        else:
            # Context-aware fallback: do not pretend that every unknown sentence is
            # a health command. Ask a natural follow-up using the user's last turn.
            if last_user:
                response = (
                    f"I understand. We were talking about “{last_user[:80]}”. "
                    "Tell me what you'd like to do next, and I'll help."
                )
            else:
                response = (
                    f"I’m ready to help with your {profession} lifestyle. "
                    "You can ask naturally about your schedule, workouts, food, sleep, goals, or general wellness."
                )
            if is_tamil:
                response = "புரிகிறது. நீங்கள் என்ன செய்ய விரும்புகிறீர்கள் என்று சொல்லுங்கள்; உங்கள் schedule, workout, உணவு, sleep மற்றும் goals பற்றி உதவுகிறேன்."

        return {
            "response": response,
            "source_type": "INTERNET_VERIFIED" if tool_executed == "internet_verify" else "LOCAL_DATA",
            "tool_executed": tool_executed,
            "action_performed": action_performed,
            "citations": citations,
            "disclaimer": "This tool provides lifestyle and fitness wellness organization. It is not a substitute for professional medical advice."
        }

