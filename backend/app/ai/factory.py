from app.config import settings
from app.ai.provider import BaseAIProvider
from app.ai.local_heuristic import LocalHeuristicProvider
from app.ai.gemini import GeminiProvider

def get_ai_provider() -> BaseAIProvider:
    provider_type = settings.AI_PROVIDER.lower()
    
    if provider_type == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    elif provider_type == "auto" and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)
    else:
        # Default offline local heuristic engine
        return LocalHeuristicProvider()
