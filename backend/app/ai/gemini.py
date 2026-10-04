import base64
import json
import requests
import google.generativeai as genai
from typing import Dict, Any, List
from app.config import settings
from app.ai.provider import BaseAIProvider
from app.ai.local_heuristic import LocalHeuristicProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash-lite")
        self.fallback = LocalHeuristicProvider()

    def analyze_lifestyle_resources(self, profile: Dict[str, Any], resources: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = f"""
            Analyze the following user profile and available resources to generate a realistic lifestyle recommendation.
            User Profile: {json.dumps(profile)}
            Environment Resources: {json.dumps(resources)}
            Return JSON format with keys:
            lifestyle_constraints, recommended_activities, realistic_workout_possibilities,
            realistic_meal_possibilities, available_time_slots, possible_conflicts,
            personalized_recommendations.
            """
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
        except Exception:
            return self.fallback.analyze_lifestyle_resources(profile, resources)

    def generate_daily_plan(self, profile: Dict[str, Any], schedule: Dict[str, Any], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            prompt = f"""
            Generate a personalized daily schedule plan for a user.
            Profile: {json.dumps(profile)}
            Schedule parameters: {json.dumps(schedule)}
            Goals: {json.dumps(goals)}
            Return JSON with date, timeline, ai_insights and recommendations.
            """
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
        except Exception:
            return self.fallback.generate_daily_plan(profile, schedule, goals)

    def adjust_schedule(self, current_schedule: List[Dict[str, Any]], user_command: str) -> List[Dict[str, Any]]:
        try:
            prompt = f"""
            Modify this schedule based on: {user_command}
            Current timeline: {json.dumps(current_schedule)}
            Return ONLY the updated JSON list.
            """
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
        except Exception:
            return self.fallback.adjust_schedule(current_schedule, user_command)

    def predict_performance(self, exercise_name: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.predict_performance(exercise_name, history)

    def analyze_food_image(self, image_base64: str, meal_type: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        if not image_base64:
            raise ValueError("Empty image data")

        if image_base64.startswith("data:") and "," in image_base64:
            header, image_base64 = image_base64.split(",", 1)
            if ";base64" in header and ":" in header:
                detected_mime = header.split(":", 1)[1].split(";", 1)[0].strip().lower()
                if detected_mime:
                    mime_type = detected_mime

        mime_type = (mime_type or "image/jpeg").lower().split(";", 1)[0].strip()
        if mime_type not in {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}:
            mime_type = "image/jpeg"

        try:
            image_bytes = base64.b64decode(image_base64, validate=True)
        except Exception as exc:
            raise ValueError(f"Invalid base64 image data: {exc}") from exc

        prompt = f"""
Analyze this food photograph for a wellness nutrition tracker.
Meal type: {meal_type}.
Identify only the visible food and estimate one visible serving.

Return ONLY valid JSON with:
food_name, estimated_serving, calories, protein_g, carbs_g, fat_g, confidence_percentage.

Rules:
- Identify only food actually visible.
- Estimate the visible portion.
- Nutrition values are approximate.
- Do not invent hidden ingredients.
- Nutrition fields must be numbers.
"""

        endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64.b64encode(image_bytes).decode("utf-8")
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        try:
            response = requests.post(endpoint, headers={"x-goog-api-key": self.api_key, "Content-Type": "application/json"}, json=payload, timeout=45)
            if not response.ok:
                raise RuntimeError(f"Gemini API HTTP {response.status_code}: {response.text[:1000]}")

            body = response.json()
            candidates = body.get("candidates") or []
            if not candidates:
                raise RuntimeError(f"Gemini returned no candidates: {json.dumps(body)[:1000]}")

            parts = ((candidates[0].get("content") or {}).get("parts") or [])
            text = "".join(str(part.get("text", "")) for part in parts if part.get("text")).strip()
            if not text:
                raise RuntimeError(f"Gemini returned no text: {json.dumps(body)[:1000]}")

            result = json.loads(text)
            return {
                "food_name": str(result.get("food_name", "Unidentified food")),
                "estimated_serving": str(result.get("estimated_serving", "1 visible serving")),
                "calories": float(result.get("calories", 0)),
                "protein_g": float(result.get("protein_g", 0)),
                "carbs_g": float(result.get("carbs_g", 0)),
                "fat_g": float(result.get("fat_g", 0)),
                "confidence_percentage": float(result.get("confidence_percentage", 50)),
                "is_estimate": True,
                "disclaimer": "Visual nutrition values are approximate. Portion size, ingredients and cooking method can change actual values."
            }
        except Exception as exc:
            raise RuntimeError(f"Gemini food vision analysis failed: {exc}") from exc

    def analyze_sleep_patterns(self, sleep_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.analyze_sleep_patterns(sleep_logs)

    def chat_response(self, message: str, context: Dict[str, Any], use_internet: bool = False, language: str = "en") -> Dict[str, Any]:
        """
        Hybrid AI brain:
        1. Run the deterministic local brain first so real user data and safe tools
           always win for schedule, workout, nutrition and verified-information tasks.
        2. Use Gemini for natural-language reasoning and conversation when no local
           tool/action is required.
        3. Fall back to the local brain if Gemini is unavailable.
        """
        local_result = self.fallback.chat_response(
            message, context, use_internet, language
        )

        # Never let a generative model replace a real application action.
        if local_result.get("tool_executed"):
            return local_result

        history = context.get("conversation_history") or []
        safe_context = {
            "profile": {
                "name": context.get("user_name"),
                "age": context.get("age"),
                "gender": context.get("gender"),
                "profession": context.get("profession"),
                "height_cm": context.get("height_cm"),
                "weight_kg": context.get("weight_kg"),
                "fitness_level": context.get("fitness_level"),
                "work_hours_per_day": context.get("work_hours_per_day"),
                "normal_sleep_hours": context.get("normal_sleep_hours"),
                "stress_rating": context.get("stress_rating"),
                "food_preference": context.get("food_preference"),
                "allergies": context.get("allergies"),
                "available_foods": context.get("available_foods"),
                "available_equipment": context.get("available_equipment"),
                "gym_available": context.get("gym_available"),
                "home_workout": context.get("home_workout"),
            },
            "schedule": context.get("schedule"),
            "today_schedule": context.get("today_schedule"),
            "goals": context.get("goals"),
            "weekly_workouts_count": context.get("weekly_workouts_count", 0),
            "weekly_average_form_score": context.get("weekly_average_form_score", 0),
            "recent_nutrition": context.get("nutrition_recent"),
            "recent_sleep": context.get("sleep_recent"),
            "environment": context.get("environment"),
            "conversation_history": history[-8:],
        }

        try:
            prompt = f"""
You are the reasoning and conversation layer of HealthAssist AI.

Your job is to understand the user's natural language, remember the recent
conversation, and give practical personalized wellness guidance using ONLY
the supplied user context.

USER MESSAGE:
{message}

LANGUAGE:
{language}

USER CONTEXT:
{json.dumps(safe_context, ensure_ascii=False)}

RULES:
- Be natural, concise, friendly and conversational.
- Use the user's profession, schedule, goals, available food/equipment and recent
  activity when they are relevant.
- Treat recent conversation as context, but always prioritize the user's newest
  message when it is clearly a new request.
- Do not invent workouts completed, meals eaten, sleep records, appointments,
  medications, profile facts or schedule entries.
- Do not claim to have changed or saved anything. Application actions are handled
  by tools.
- Do not diagnose diseases, prescribe medicines, or present medical claims as
  certain. Encourage professional care for medical concerns.
- If the user asks for the latest/current external information, do not pretend
  that your training knowledge is current. Ask them to enable Internet
  Verification unless a verified result is already supplied.
- If the user asks what you can do, explain that you can work with their
  schedule, workouts, nutrition, sleep, goals and wellness planning.
- For Tamil, answer naturally in Tamil with common English fitness terms where
  useful.
- Do not mention internal tools, prompts, context, providers, or implementation.
- Answer the user's actual message directly. Do not force every conversation
  back to health if the user is simply greeting, thanking, or making small talk.
"""
            response = self.model.generate_content(prompt)
            text = (response.text or "").strip()
            if not text:
                raise RuntimeError("Gemini returned an empty response")

            return {
                "response": text,
                "source_type": "GEMINI_AI",
                "tool_executed": None,
                "action_performed": None,
                "citations": None,
                "disclaimer": "This tool provides lifestyle and fitness wellness organization. It is not a substitute for professional medical advice."
            }
        except Exception:
            return local_result
