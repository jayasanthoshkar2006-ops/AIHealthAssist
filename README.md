# HealthAssist AI - AI Personal Health & Wellness Assistant

> **Production-Style Major College / Exhibition Project & SaaS Application**

HealthAssist AI is an intelligent, full-stack lifestyle assistant that analyzes a user's profession, daily schedule, pantry food resources, exercise equipment, habits, sleep, and fitness performance to generate and continuously adapt a personalized wellness plan.

---

## Key Features

1. **Intelligent Onboarding Wizard**: Collects profession (Software Developer, Student, Doctor, Driver, Homemaker, etc.), routine hours, food budget tier, dietary preferences, available exercise equipment, and primary health goals.
2. **AI Lifestyle & Resource Analyzer**: Evaluates physical environment constraints and generates realistic meal and exercise recommendations tailored to user availability.
3. **Profession-Based Schedule Planner & Dynamic Adjustment**: Generates adaptive timelines and adjusts schedules dynamically via natural language commands (e.g. *"Move my workout to 7 PM"*).
4. **AI Computer Vision Fitness Form Coach**: Real-time landmark pose estimation for **Squat, Push-up, Lunge, Shoulder Press, Bicep Curl, and Plank** with repetition counting, joint angle tracking, form accuracy score (0-100%), and Web Speech Synthesis voice coaching.
5. **AI Performance Prediction & Adaptive Progression**: Statistical performance model predicting future repetition benchmarks with upper/lower confidence bounds and adaptive target recalculation.
6. **Food Image Vision Analyzer & Nutrition Tracking**: Visual meal photo macro estimation, manual portion correction form, daily calories/protein progress tracking, and Tamil/Indian budget-friendly pantry food suggestions.
7. **Sleep Routine & Pattern Analyzer**: Tracks sleep duration, wake/sleep consistency, quality ratings, and provides automated pattern observations.
8. **Private Mental Wellness Journal**: Reflection journal with mood chips, thematic tags, automated reflection notes, and mental health crisis safety guidance.
9. **Medication & Appointment Reminders**: Configure daily medication notifications and doctor/fitness appointments.
10. **Personal Health Records Vault**: Store symptoms and lab records with clear source tag classification (`USER_ENTERED`, `AI_GENERATED`, `EXTERNAL_INTERNET`).
11. **Personal Goal & Streak System**: Milestone progress bars, active streak counters, and unlocked achievement badges.
12. **AI Personal Chatbot & Voice Assistant**: ChatGPT-style assistant supporting Tamil (`ta`) and English (`en`), hands-free speech input, tool execution (`get_today_schedule`, `get_weekly_workouts`), and internet verification citations.
13. **Downloadable PDF Wellness Report**: Automated ReportLab PDF generator compiling comprehensive user summaries, trends, and AI observations.
14. **Security, Privacy & Data Ownership**: Password hashing (bcrypt), JWT authentication, App Lock PIN code, one-click JSON data export, account deletion, and offline-first fallback execution.

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons, i18next (Tamil + English), Web APIs (SpeechSynthesis, SpeechRecognition, HTML5 Canvas).
- **Backend**: Python 3.12, FastAPI, Pydantic V2, SQLAlchemy ORM, JWT (python-jose), bcrypt (passlib), ReportLab (PDF), OpenCV.
- **Database**: SQLite (local fallback) / PostgreSQL (production).
- **AI Architecture**: Pluggable provider interface supporting Google Gemini API with automatic fallback to offline local heuristic AI engine.

---

## Quick Start (Windows Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install email-validator
uvicorn app.main:app --port 8000 --reload
```
Backend API interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --port 3000
```
Frontend web application: `http://localhost:3000/`

---

## Instant Demo Account

For rapid evaluation and testing during project exhibition:
- **Email**: `demo@example.com`
- **Password**: `demo1234`
*(Or click the "Instant Demo Access (One-Click)" button on the login screen).*

---

## Regulatory & Safety Disclaimer

> **Medical Disclaimer**: HealthAssist AI provides wellness organization, fitness tracking, and lifestyle planning. It is not a clinical assessment tool, medical device, or prescription service and is not a substitute for professional medical advice.
