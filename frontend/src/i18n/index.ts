import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      appName: "HealthAssist AI",
      tagline: "AI Personal Health & Lifestyle Assistant",
      dashboard: "Dashboard",
      aiAssistant: "AI Assistant",
      dailyPlan: "Today's Plan",
      workout: "AI Workout",
      liveWorkout: "Live Pose Coach",
      nutrition: "Nutrition & Food AI",
      sleep: "Sleep Analysis",
      journal: "Wellness Journal",
      goals: "Goals & Streaks",
      reminders: "Medications & Appointments",
      healthRecords: "Health Records",
      reports: "Wellness Reports",
      settings: "Settings",
      privacy: "Privacy Policy",
      logout: "Logout",
      login: "Sign In",
      register: "Get Started",
      goodMorning: "Good Morning",
      goodAfternoon: "Good Afternoon",
      goodEvening: "Good Evening",
      welcomeBack: "Welcome back to your personalized wellness overview.",
      tryDemo: "Instant Demo Login",
      disclaimerText: "Notice: HealthAssist AI provides wellness organization and tracking. It is not a substitute for professional medical advice or clinical assessment.",
      adjustSchedule: "Adjust Schedule",
      startWorkout: "Start Live Workout",
      analyzeFood: "Analyze Food Photo",
      downloadReport: "Download PDF Report",
      languageName: "English"
    }
  },
  ta: {
    translation: {
      appName: "ஹெல்த்அசிஸ்ட் AI",
      tagline: "AI தனிப்பட்ட நல்வாழ்வு மற்றும் வாழ்க்கை முறை உதவியாளர்",
      dashboard: "முகப்பு",
      aiAssistant: "AI உதவியாளர்",
      dailyPlan: "இன்றைய திட்டம்",
      workout: "உடற்பயிற்சி",
      liveWorkout: "கேமரா உடற்பயிற்சி",
      nutrition: "உணவு & ஊட்டச்சத்து",
      sleep: "தூக்க பகுப்பாய்வு",
      journal: "மனநல குறிப்பேடு",
      goals: "இலக்குகள் & தொடர்ச்சிகள்",
      reminders: "மருந்துகள் & சந்திப்புகள்",
      healthRecords: "சுகாதார பதிவுகள்",
      reports: "அறிக்கைகள்",
      settings: "அமைப்புகள்",
      privacy: "தனியுரிமை கொள்கை",
      logout: "வெளியேறு",
      login: "உள்நுழை",
      register: "தொடங்கவும்",
      goodMorning: "காலை வணக்கம்",
      goodAfternoon: "மதிய வணக்கம்",
      goodEvening: "மாலை வணக்கம்",
      welcomeBack: "உங்கள் நல்வாழ்வு மேலோட்டத்திற்கு மீண்டும் வருக.",
      tryDemo: "உடனடி டெமோ உள்நுழைவு",
      disclaimerText: "அறிவிப்பு: ஹெல்த்அசிஸ்ட் AI உடல்நல அமைப்பை வழங்குகிறது. இது மருத்துவ ஆலோசனைகளுக்கு மாற்றாகாது.",
      adjustSchedule: "அட்டவணையை மாற்று",
      startWorkout: "உடற்பயிற்சியை தொடங்கு",
      analyzeFood: "உணவை பகுப்பாய்வு செய்",
      downloadReport: "PDF அறிக்கை பதிவிறக்கு",
      languageName: "தமிழ்"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
