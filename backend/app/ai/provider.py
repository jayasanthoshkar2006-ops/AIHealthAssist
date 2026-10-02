from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAIProvider(ABC):
    
    @abstractmethod
    def analyze_lifestyle_resources(self, profile: Dict[str, Any], resources: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def generate_daily_plan(self, profile: Dict[str, Any], schedule: Dict[str, Any], goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def adjust_schedule(self, current_schedule: List[Dict[str, Any]], user_command: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def predict_performance(self, exercise_name: str, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def analyze_food_image(self, image_base64: str, meal_type: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def analyze_sleep_patterns(self, sleep_logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def chat_response(self, message: str, context: Dict[str, Any], use_internet: bool = False, language: str = "en") -> Dict[str, Any]:
        pass
