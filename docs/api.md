# HealthAssist AI - API Endpoint Specification

All endpoints are prefixed with `/api/v1`.

## Authentication & Security
- `POST /auth/register` - Create user account
- `POST /auth/login` - Authenticate & obtain JWT access token
- `POST /auth/change-password` - Change account password
- `POST /auth/pin/set` - Configure App Lock PIN
- `POST /auth/pin/verify` - Validate App Lock PIN
- `GET /auth/export-data` - Export user data as JSON
- `DELETE /auth/delete-account` - Permanently delete account and all health records

## Onboarding & Profile
- `POST /onboarding` - Submit initial wizard preferences (Profession, Routine, Food, Equipment, Goals)
- `GET /onboarding/profile` - Retrieve current user profile

## Daily Plan & Dynamic Schedule
- `GET /daily-plan` - Retrieve today's profession-tailored plan
- `POST /daily-plan/generate` - Trigger AI daily plan generation
- `PUT /schedule` - Update schedule timeline events
- `POST /schedule/adjust` - Process natural language schedule adjustments (e.g. "Move workout to 7 PM")

## Workouts & Fitness CV
- `POST /workouts/analyze` - Perform live joint angle & pose feedback analysis
- `POST /workouts` - Log completed workout session & sets
- `GET /workouts/history` - Retrieve historical workouts
- `POST /fitness/predict` - Generate performance target prediction with confidence intervals
- `POST /fitness/adapt` - Recalculate progressive workout targets

## Nutrition & Food Vision
- `POST /nutrition/analyze-image` - Estimate nutrition macros from food photo
- `POST /nutrition/meals` - Log meal entry
- `GET /nutrition/summary` - Retrieve daily calories & protein summary
- `GET /nutrition/suggestions` - Get practical pantry food suggestions

## Sleep & Mental Journal
- `POST /sleep` - Log sleep entry
- `GET /sleep/analysis` - Get sleep pattern consistency analysis
- `POST /journal` - Log private mental wellness reflection
- `GET /journal/summary` - Retrieve mood trends & thematic reflections

## Reminders & Appointments
- `POST /medications` - Save medication reminder
- `GET /medications` - List active medication reminders
- `POST /appointments` - Create doctor/fitness appointment
- `GET /appointments` - List scheduled appointments

## Personal Health Records & Reports
- `POST /health/records` - Store personal health record
- `GET /health/records` - List personal health records with source classification
- `GET /reports/wellness/generate` - Download compiled PDF Wellness Report

## AI Assistant & Dashboard
- `POST /assistant/chat` - Chat with AI assistant (Tool execution & citations)
- `GET /dashboard` - Retrieve central SaaS overview metrics & AI insights
