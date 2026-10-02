# HealthAssist AI - System Architecture

## Architecture Overview

HealthAssist AI is designed with a modern, decoupled full-stack architecture combining an offline-first strategy, computer vision pose estimation, voice coaching, predictive analytics, dynamic schedule solvers, and multi-provider AI abstractions.

```
+-----------------------------------------------------------------------+
|                              FRONTEND                                 |
|   React (Vite + TS) | Tailwind CSS | Recharts | i18next (Tamil/EN)   |
|   Web APIs: SpeechRecognition, SpeechSynthesis, HTML5 Canvas Pose      |
+-----------------------------------------------------------------------+
                                  |
                           REST API (HTTP)
                                  v
+-----------------------------------------------------------------------+
|                               BACKEND                                 |
|   FastAPI (Python) | Pydantic V2 | SQLAlchemy ORM | JWT Security      |
+-----------------------------------------------------------------------+
        |                         |                         |
        v                         v                         v
+---------------+       +------------------+       +------------------+
| DATABASE LAYER|       |    AI ENGINE     |       | PDF REPORT GEN   |
| SQLite / Postg|       | Gemini / Local   |       | ReportLab Engine |
+---------------+       +------------------+       +------------------+
```

## Key Layers

1. **Frontend Presentation**:
   - Single Page Application (SPA) powered by React 18, Vite, TypeScript, and Tailwind CSS.
   - Internationalization (i18n) supporting English and Tamil (`ta`).
   - Browser Web APIs for Speech Synthesis (voice coaching) and Speech Recognition (hands-free query input).

2. **API & Service Layer**:
   - FastAPI REST API providing documented routes at `/docs` and `/redoc`.
   - Security layer supporting JWT Bearer authentication, bcrypt password hashing, and local PIN application lock.

3. **AI Provider Abstraction**:
   - `BaseAIProvider` interface supporting pluggable backends:
     - `GeminiProvider`: Google Gemini Generative AI API integration.
     - `LocalHeuristicProvider`: Offline, deterministic heuristic engine ensuring 100% functionality without external API keys or internet connection.

4. **Computer Vision & Pose Engine**:
   - `PoseCoach` module for calculating 2D joint angles (Hip-Knee-Ankle, Shoulder-Elbow-Wrist), rep counting, stage tracking (up/down), and posture form quality score (0-100%).
