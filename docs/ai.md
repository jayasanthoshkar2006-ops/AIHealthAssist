# HealthAssist AI - AI Architecture & Provider Specifications

## Overview

HealthAssist AI integrates multiple AI categories:
- **Generative AI & LLM Assistant**: Natural language conversation, Tamil + English support, internet citation verification.
- **Tool Calling Execution**: Controlled tool execution framework (`get_today_schedule`, `get_weekly_workouts`, `update_schedule`, `get_food_suggestion`).
- **Computer Vision & Pose Estimation**: Joint angle calculation for Squats, Push-ups, Lunges, Shoulder Press, Bicep Curls, and Planks.
- **Predictive Analytics**: Performance prediction with upper/lower confidence intervals and adaptive retry adjustment.
- **Food Vision Estimation**: Visual meal identification & macro approximation with user manual correction.
- **ReportLab PDF Engine**: Automated generation of downloadable PDF Wellness Reports.

## Provider Abstraction

The AI engine uses an abstraction pattern:
- Set `AI_PROVIDER=gemini` and `GEMINI_API_KEY=your_key` to activate Google Gemini 1.5 Flash.
- If no key is set, the system automatically falls back to `LocalHeuristicProvider` to ensure zero API key dependencies and full offline operation.
