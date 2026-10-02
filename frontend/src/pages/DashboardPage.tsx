import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Dumbbell,
  Utensils,
  Moon,
  Zap,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Video,
  FileText,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    apiRequest('/dashboard')
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const workoutTrendData = [
    { day: 'Mon', reps: 40, form: 88 },
    { day: 'Tue', reps: 45, form: 90 },
    { day: 'Wed', reps: 50, form: 92 },
    { day: 'Thu', reps: 35, form: 87 },
    { day: 'Fri', reps: 60, form: 94 },
    { day: 'Sat', reps: 55, form: 93 },
    { day: 'Sun', reps: 65, form: 95 }
  ];

  const sleepTrendData = [
    { day: 'Mon', hours: 7.2 },
    { day: 'Tue', hours: 7.5 },
    { day: 'Wed', hours: 6.8 },
    { day: 'Thu', hours: 7.8 },
    { day: 'Fri', hours: 7.4 },
    { day: 'Sat', hours: 8.1 },
    { day: 'Sun', hours: 7.6 }
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
        <p className="text-sm">Loading AI Wellness Dashboard...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              AI Lifestyle Engine Active
            </span>
            <span className="text-xs text-slate-400">• Profession: <strong className="text-slate-200">{data?.profession}</strong></span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 mt-2">
            {t('goodMorning')}, <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">{data?.user_name || 'Hari'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('welcomeBack')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/workout/live"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-slate-950 font-bold text-xs shadow-glow flex items-center gap-2 transition-all"
          >
            <Video className="w-4 h-4" />
            {t('startWorkout')}
          </Link>

          <Link
            to="/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            {t('downloadReport')}
          </Link>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workouts Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Workouts</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            {metrics.workouts_completed || 12} <span className="text-xs text-slate-400 font-normal">sessions</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Avg Form: {metrics.avg_form_score || 91.5}%</span>
          </div>
        </div>

        {/* Nutrition Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Nutrition Today</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            {metrics.today_calories || 1850} <span className="text-xs text-slate-400 font-normal">kcal</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Protein: <strong className="text-slate-200">{metrics.today_protein_g || 72}g</strong>
          </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sleep Routine</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            {metrics.sleep_duration_hours || 7.5} <span className="text-xs text-slate-400 font-normal">hrs</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Quality: <strong className="text-emerald-400">{metrics.sleep_quality_score || 8}/10</strong>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Consistency</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-100">
            {metrics.streak_days || 7} <span className="text-xs text-slate-400 font-normal">days streak</span>
          </div>
          <div className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
            <span>🔥 Active Milestone Streak</span>
          </div>
        </div>
      </div>

      {/* Main Grid: AI Daily Schedule Card + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's AI Schedule Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-sm">Today's Profession-Tailored Schedule</h3>
            </div>
            <Link to="/schedule" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
              {t('adjustSchedule')} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { time: '06:30', activity: 'Wake Up, Hydration & Mobility Stretching', category: 'sleep' },
              { time: '07:30', activity: 'Nutritious High Protein Breakfast', category: 'meal' },
              { time: '09:00', activity: `Focused Work Session (${data?.profession})`, category: 'work' },
              { time: '13:00', activity: 'Balanced Lunch & 10-min Walk', category: 'meal' },
              { time: '18:30', activity: 'AI Live Pose Workout Session (35 mins)', category: 'workout', active: true },
              { time: '20:00', activity: 'Dinner & Family Wind Down', category: 'meal' },
              { time: '23:00', activity: 'Restful Sleep Target', category: 'sleep' }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                  item.active
                    ? 'bg-sky-950/60 border-sky-500/50 text-sky-200'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sky-400 font-bold w-12">{item.time}</span>
                  <span>{item.activity}</span>
                </div>
                {item.active && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Upcoming
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight Feed & Goal Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">AI Insights & Adaptive Focus</h3>
          </div>

          <div className="space-y-3">
            {(data?.ai_insights || [
              `As a ${data?.profession}, your routine fits best with an 18:30 evening workout.`,
              'Form accuracy has increased +4.5% across your last 3 sessions.',
              'Optimal sleep duration maintained at 7.5 hours.'
            ]).map((insight: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workout Reps & Form Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm">Workout Volume & Form Accuracy (%)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workoutTrendData}>
                <defs>
                  <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Area type="monotone" dataKey="reps" stroke="#0284c7" fillOpacity={1} fill="url(#colorReps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm">Weekly Sleep Duration (Hours)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepTrendData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Bar dataKey="hours" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
};
