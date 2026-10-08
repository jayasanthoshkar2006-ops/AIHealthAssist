import json
import re
from typing import Dict, Any, List
import requests

from app.ai.provider import BaseAIProvider
from app.ai.local_heuristic import LocalHeuristicProvider
from app.config import settings


class GroqProvider(BaseAIProvider):
    """GroqCloud conversational AI with deterministic cloud-data/schedule tools."""

    WHO_PHYSICAL_ACTIVITY_URL = (
        "https://www.who.int/news-room/fact-sheets/detail/physical-activity"
    )

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

    def _is_schedule_tool(self, result: Dict[str, Any]) -> bool:
        return result.get("tool_executed") == "update_schedule"

    def _is_cloud_data_tool(self, result: Dict[str, Any]) -> bool:
        return result.get("tool_executed") in {
            "get_today_schedule",
            "get_weekly_workouts",
        }

    def _is_current_info_request(self, message: str) -> bool:
        low = message.lower()
        return (
            ("latest" in low or "current" in low or "official" in low)
            and any(term in low for term in ["who", "guideline", "physical activity"])
        )

    def _is_personal_data_request(self, message: str) -> bool:
        low = message.lower()
        personal_terms = [
            "my ", "mine", "i have", "i did", "i completed", "i logged",
            "schedule", "workout", "exercise", "journal", "mood", "medication",
            "medicine", "appointment", "health record", "health records",
            "goal", "goals", "streak", "notification", "sleep", "food",
            "nutrition", "profile", "weight", "height", "profession",
            "reminder", "report", "today's plan", "today plan",
        ]
        return any(term in low for term in personal_terms)

    def _cloud_context_answer(self, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        safe_context = {
            "profile": context.get("profile") or {},
            "schedule": context.get("schedule") or {},
            "today_schedule": context.get("today_schedule") or [],
            "workouts_last_7_days": context.get("workouts_last_7_days") or [],
            "weekly_workouts_count": context.get("weekly_workouts_count", 0),
            "exercise_records": context.get("exercise_records") or [],
            "journal_entries": context.get("journal_entries") or [],
            "medications": context.get("medications") or [],
            "appointments": context.get("appointments") or [],
            "health_records": context.get("health_records") or [],
            "goals": context.get("goals") or [],
            "notifications": context.get("notifications") or [],
            "sleep_records": context.get("sleep_records") or [],
            "nutrition_logs": context.get("nutrition_logs") or [],
            "environment": context.get("environment") or {},
            "conversation_history": (context.get("conversation_history") or [])[-10:],
        }
        system = """You are HealthAssist AI with authorized read access to the authenticated user's
HealthAssist cloud account. Answer personal-data questions from the supplied cloud snapshot.
Never invent, merge, or substitute another user's information. Use exact records when available
and clearly say when the requested data is empty or unavailable. You may summarize wellness data,
but do not diagnose or prescribe. Medication information is for reminders/organization only.
The application, not the model, performs database-changing actions. Answer in English only."""
        prompt = (
            "AUTHENTICATED USER CLOUD DATA:\n"
            f"{json.dumps(safe_context, ensure_ascii=False)}\n\n"
            f"USER QUESTION:\n{message}"
        )
        answer = self._chat(
            [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return {
            "response": answer,
            "source_type": "CLOUD_DATA",
            "tool_executed": "cloud_data_query",
            "action_performed": None,
            "citations": None,
            "disclaimer": (
                "This tool provides lifestyle and wellness organization. "
                "It is not a substitute for professional medical advice."
            ),
        }

    def _verify_who_physical_activity(self, message: str) -> Dict[str, Any]:
        """Fetch the current official WHO physical-activity page, then ask Groq to summarize it."""
        page = requests.get(self.WHO_PHYSICAL_ACTIVITY_URL, timeout=20)
        page.raise_for_status()

        text_content = re.sub(r"<[^>]+>", " ", page.text)
        text_content = re.sub(r"\s+", " ", text_content).strip()
        source_excerpt = text_content[:12000]

        system = """You are HealthAssist AI.
Summarize the supplied official WHO physical-activity source accurately.
Answer the user's question directly. Do not invent facts or medical advice.
Mention that the information is from WHO and keep the answer concise."""
        prompt = (
            f"OFFICIAL WHO SOURCE URL: {self.WHO_PHYSICAL_ACTIVITY_URL}\n"
            f"WHO PAGE CONTENT:\n{source_excerpt}\n\n"
            f"USER QUESTION:\n{message}"
        )
        answer = self._chat(
            [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return {
            "response": answer,
            "source_type": "INTERNET_VERIFIED",
            "tool_executed": "internet_verify",
            "action_performed": None,
            "citations": [{
                "source": "World Health Organization — Physical activity",
                "url": self.WHO_PHYSICAL_ACTIVITY_URL,
            }],
            "disclaimer": (
                "This tool provides lifestyle and fitness wellness organization. "
                "It is not a substitute for professional medical advice."
            ),
        }

    def chat_response(
        self,
        message: str,
        context: Dict[str, Any],
        use_internet: bool = True,
        language: str = "en",
    ) -> Dict[str, Any]:
        local_result = self.fallback.chat_response(
            message, context, use_internet=False, language="en"
        )

        if self._is_schedule_tool(local_result):
            return {
                **local_result,
                "source_type": "CLOUD_DATA",
            }

        if self._is_cloud_data_tool(local_result):
            return {
                **local_result,
                "source_type": "CLOUD_DATA",
            }

        if self._is_personal_data_request(message):
            try:
                return self._cloud_context_answer(message, context)
            except Exception:
                pass

        if use_internet and self._is_current_info_request(message):
            try:
                return self._verify_who_physical_activity(message)
            except Exception:
                pass

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
            "workouts_last_7_days": context.get("workouts_last_7_days") or [],
            "exercise_records": context.get("exercise_records") or [],
            "journal_entries": context.get("journal_entries") or [],
            "medications": context.get("medications") or [],
            "appointments": context.get("appointments") or [],
            "health_records": context.get("health_records") or [],
            "goals": context.get("goals") or [],
            "notifications": context.get("notifications") or [],
            "sleep_records": context.get("sleep_records") or [],
            "nutrition_logs": context.get("nutrition_logs") or [],
            "environment": context.get("environment"),
            "conversation_history": (context.get("conversation_history") or [])[-8:],
        }

        system = """You are HealthAssist AI, a personal wellness and lifestyle assistant.
Answer in English only. Use the supplied authenticated user's cloud data to personalize
answers. Never invent user data. Do not diagnose diseases or prescribe medication.
For medical concerns, recommend appropriate professional care. Be concise, practical,
friendly, and answer the user's actual question. The application, not the model,
performs schedule/database actions."""
        prompt = (
            "AUTHENTICATED USER CLOUD CONTEXT:\n"
            f"{json.dumps(safe_context, ensure_ascii=False)}\n\n"
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
                "disclaimer": (
                    "This tool provides lifestyle and fitness wellness organization. "
                    "It is not a substitute for professional medical advice."
                ),
            }
        except Exception:
            return {
                **local_result,
                "source_type": "GROQ_AI_FALLBACK",
                "tool_executed": None,
                "action_performed": None,
                "citations": None,
            }
