export interface User {
  user_id: number;
  email: string;
  has_profile: boolean;
}

export interface Profile {
  id: number;
  user_id: number;
  name: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  profession: string;
  food_preference: string;
  food_budget: string;
  cooking_availability: string;
  gym_available: boolean;
  home_workout: boolean;
  available_equipment?: string;
  fitness_level: string;
  stress_rating: number;
  preferred_language: string;
}

export interface ScheduleEvent {
  time: string;
  activity: string;
  category: 'sleep' | 'meal' | 'work' | 'workout' | 'journal' | 'rest';
  duration_minutes: number;
  is_completed?: boolean;
}

export interface DailyPlan {
  id: number;
  date: string;
  timeline: ScheduleEvent[];
  ai_insights: string;
  recommendations: string[];
}

export interface WorkoutHistoryItem {
  id: number;
  title: string;
  target_muscle: string;
  duration_minutes: number;
  total_reps: number;
  avg_form_score: number;
  calories_burned: number;
  date: string;
}

export interface NutritionLogItem {
  id: number;
  meal_type: string;
  food_name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_ai_estimated: boolean;
}

export interface SleepRecord {
  id: number;
  date: string;
  duration_hours: number;
  quality_score: number;
  sleep_time: string;
  wake_time: string;
}

export interface JournalEntry {
  id: number;
  entry_date: string;
  mood: string;
  content: string;
  tags_json?: string[];
  ai_summary?: string;
  recurring_themes_json?: string[];
}

export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  notes?: string;
}

export interface Appointment {
  id: number;
  title: string;
  category: string;
  date_time: string;
  location?: string;
  notes?: string;
}

export interface HealthRecord {
  id: number;
  date: string;
  title: string;
  category: string;
  source_type: 'USER_ENTERED' | 'AI_GENERATED' | 'EXTERNAL_INTERNET';
  metrics?: Record<string, any>;
  notes?: string;
}

export interface Goal {
  id: number;
  title: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  source_type?: string;
  citations?: Array<{ source: string; url: string; date?: string }>;
  disclaimer?: string;
  timestamp?: string;
}
