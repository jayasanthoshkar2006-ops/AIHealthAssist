from app.config import settings
from app.ai.provider import BaseAIProvider
from app.ai.local_heuristic import LocalHeuristicProvider
from app.ai.gemini import GeminiProvider
from app.ai.groq import GroqProvider

def get_ai_provider() -> BaseAIProvider:
    provider_type = settings.AI_PROVIDER.lower()

    if provider_type == "groq":
        if settings.GROQ_API_KEY:
            return GroqProvider(api_key=settings.GROQ_API_KEY)
        return LocalHeuristicProvider()

    if provider_type == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY)

    if provider_type == "auto":
        if settings.GROQ_API_KEY:
            return GroqProvider(api_key=settings.GROQ_API_KEY)
        if settings.GEMINI_API_KEY:
            return GeminiProvider(api_key=settings.GEMINI_API_KEY)

    return LocalHeuristicProvider()
