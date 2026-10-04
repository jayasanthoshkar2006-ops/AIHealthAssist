import json
import google.generativeai as genai
from typing import Dict, Any, List, Optional
from app.config import settings
from app.ai.provider import BaseAIProvider
from app.ai.local_heuristic import LocalHeuristicProvider

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.fallback = LocalHeuristicProvider()

    def analyze_lifestyle_resources(self, profile: Dict[str, Any], resources: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = f"""
            Analyze the following user profile and available resources to generate a realistic lifestyle recommendation.
            User Profile: {json.dumps(profile)}
            Environment Resources: {json.dumps(resources)}
            
            Return JSON format with keys:
            lifestyle_constraints (list of str),
            recommended_activities (list of str),
            realistic_workout_possibilities (list of str),
            realistic_meal_possibilities (list of str),
            available_time_slots (list of str),
            possible_conflicts (list of str),
            personalized_recommendations (list of str).
            """
            response = self.model.generate_content(prompt)
            # Clean markdown code block if present
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            # Fallback gracefully to local heuristic
            return self.fallback.analyze_lifestyle_resources(profile, resources)

    def generate_daily_plan(self, profile: Dict[str, Any], schedule: Dict[str, Any], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            prompt = f"""
            Generate a personalized daily schedule plan for a user.
            Profile: {json.dumps(profile)}
            Schedule parameters: {json.dumps(schedule)}
            Goals: {json.dumps(goals)}
            
            Return JSON format with keys:
            date (str YYYY-MM-DD),
            timeline (list of objects with time, activity, category [sleep/meal/work/workout/journal/rest], duration_minutes),
            ai_insights (str),
            recommendations (list of str).
            """
            response = self.model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception:
            return self.fallback.generate_daily_plan(profile, schedule, goals)

    def adjust_schedule(self, current_schedule: List[Dict[str, Any]], user_command: str) -> List[Dict[str, Any]]:
        try:
            prompt = f"""
            Modify this schedule timeline based on the user's natural language command: '{user_command}'.
            Current timeline: {json.dumps(current_schedule)}
            
            Return ONLY the updated JSON list of schedule objects.
            """
            response = self.model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception:
            return self.fallback.adjust_schedule(current_schedule, user_command)

    def predict_performance(self, exercise_name: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.predict_performance(exercise_name, history)

    def analyze_food_image(self, image_base64: str, meal_type: str, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        try:
            if "," in image_base64 and image_base64.startswith("data:"):
                image_base64 = image_base64.split(",", 1)[1]
            prompt = f"""
            Analyze this food photograph for a wellness nutrition tracker.
            Meal type: {meal_type}.
            Identify the visible food and estimate one visible serving.
            Return ONLY valid JSON with:
            food_name (string), estimated_serving (string),
            calories (number), protein_g (number), carbs_g (number),
            fat_g (number), confidence_percentage (number).
            Do not invent hidden ingredients. These are approximate estimates.
            """
            response = self.model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_base64}
            ])
            text = response.text.replace("```json", "").replace("```", "").strip()
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
        except Exception:
            return self.fallback.analyze_food_image(image_base64, meal_type, mime_type)

    def analyze_sleep_patterns(self, sleep_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self.fallback.analyze_sleep_patterns(sleep_logs)

    def chat_response(self, message: str, context: Dict[str, Any], use_internet: bool = False, language: str = "en") -> Dict[str, Any]:
        try:
            prompt = f"""
            You are an AI Personal Health & Wellness Assistant.
            User Message: {message}
            Language: {language}
            Context: {json.dumps(context)}
            
            Provide a helpful, friendly response.
            Do NOT provide medical diagnosis.
            """
            response = self.model.generate_content(prompt)
            return {
                "response": response.text,
                "source_type": "GEMINI_AI",
                "tool_executed": None,
                "disclaimer": "This tool provides lifestyle wellness information and is not a substitute for professional medical advice."
            }
        except Exception:
            return self.fallback.chat_response(message, context, use_internet, language)
