# HealthAssist AI - Database Entity Specification

The database uses SQLAlchemy ORM supporting both SQLite (local development) and PostgreSQL (production deployment).

## Entity Schema Summary

1. `users`: Authentication records, email, password hash, PIN code, language preference.
2. `profiles`: User demographic profile, profession, food preference, budget, available equipment, fitness level.
3. `schedules`: Wake time, sleep time, work start/end parameters.
4. `daily_plans`: Date-stamped timeline JSON events and AI insights.
5. `workouts`: Workout logs, total reps, average form score, calories burned.
6. `workout_sessions`: Exercise set details, target reps vs actual reps, form accuracy.
7. `exercise_records`: Personal best records (max reps, best form score).
8. `nutrition_logs`: Logged meals, meal type, estimated calories, protein, carbs, fat, image URL.
9. `sleep_records`: Sleep duration, quality rating (1-10), interruptions, notes.
10. `journal_entries`: Private journal reflections, mood tags, recurring themes.
11. `medications`: Medication name, dosage, frequency, reminder time.
12. `appointments`: Doctor and fitness appointment schedule.
13. `health_records`: User health records classified by source type (`USER_ENTERED`, `AI_GENERATED`, `EXTERNAL_INTERNET`).
14. `goals`: Target milestones, current progress, deadline.
15. `streaks`: Active streak counts across workout, journal, sleep categories.
16. `achievements`: Unlocked milestone badges.
17. `notifications`: Scheduled and triggered reminder alerts.
18. `chat_messages`: Conversation history between user and AI assistant.
19. `environment_resources`: Equipment lists, pantry items, budget tier.
