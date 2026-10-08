import json
from typing import Dict, Any, List
import requests

from app.ai.provider import BaseAIProvider
from app.ai.local_heuristic import LocalHeuristicProvider
from app.config import settings


class GroqProvider(BaseAIProvider):
    """GroqCloud reasoning provider with the existing local action brain as a safety layer."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.model_name = settings.GROQ_MODEL
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self.fallback = LocalHeuristicProvider()

    def _chat(self, messages: List[Dict[str, str]], temperature: float = 0.4) -> str:
        response = requests.post(
            self.endpoint,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model_name,
                "messages": messages,
                "temperature": temperature,
            },
            timeout=45,
        )
        if not response.ok:
            raise RuntimeError(
                f"Groq API HTTP {response.status_code}: {response.text[:1000]}"
            )
        body = response.json()
        choices = body.get("choices") or []
        if not choices:
            raise RuntimeError(f"Groq returned no choices: {json.dumps(body)[:1000]}")
        content = ((choices[0].get("message") or {}).get("content") or "").strip()
        if not content:
            raise RuntimeError(f"Groq returned empty content: {json.dumps(body)[:1000]}")
        return content

    def analyze_lifestyle_resources(self, profile: Dict[str, Any], resources: Dict[str, Any]) -> Dict[str, Any]:
        return self.fallback.analyze_lifestyle_resources(profile, resources)

    def generate_daily_plan(self, profile: Dict[str, Any], schedule: Dict[str, Any], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.generate_daily_plan(profile, schedule, goals)

    def adjust_schedule(self, current_schedule: List[Dict[str, Any]], user_command: str) -> List[Dict[str, Any]]:
        return self.fallback.adjust_schedule(current_schedule, user_command)

    def predict_performance(self, exercise_name: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.predict_performance(exercise_name, history)

    def analyze_food_image(self, image_base64: str, meal_type: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        return self.fallback.analyze_food_image(image_base64, meal_type)

    def analyze_sleep_patterns(self, sleep_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.analyze_sleep_patterns(sleep_logs)

    def chat_response(
        self,
        message: str,
        context: Dict[str, Any],
        use_internet: bool = True,
        language: str = "en",
    ) -> Dict[str, Any]:
        # Keep deterministic application actions ahead of the LLM.
        local_result = self.fallback.chat_response(
            message, context, use_internet=True, language="en"
        )
        if local_result.get("tool_executed"):
            return local_result

        safe_context = {
            "profile": {
                "name": context.get("user_name"),
                "age": context.get("age"),
                "gender": context.get("gender"),
                "height_cm": context.get("height_cm"),
                "weight_kg": context.get("weight_kg"),
                "profession": context.get("profession"),
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
            "weekly_workouts_count": context.get("weekly_workouts_count", 0),
            "weekly_average_form_score": context.get("weekly_average_form_score", 0),
            "environment": context.get("environment"),
            "conversation_history": (context.get("conversation_history") or [])[-8:],
        }

        system = """You are HealthAssist AI, a personal wellness and lifestyle assistant.
Answer in English only. Use the supplied authenticated user's context to personalize
answers. Never invent user data. Do not diagnose diseases or prescribe medication.
For medical concerns, recommend appropriate professional care. Be concise, practical,
friendly, and answer the user's actual question. The application, not the model,
performs schedule/database actions."""
        prompt = (
            f"USER CONTEXT:\n{json.dumps(safe_context, ensure_ascii=False)}\n\n"
            f"USER MESSAGE:\n{message}"
        )

        try:
            answer = self._chat(
                [{"role": "system", "content": system}, {"role": "user", "content": prompt}]
            )
            return {
                "response": answer,
                "source_type": "GROQ_AI",
                "tool_executed": None,
                "action_performed": None,
                "citations": None,
                "disclaimer": "This tool provides lifestyle and fitness wellness organization. It is not a substitute for professional medical advice.",
            }
        except Exception:
            return local_result
