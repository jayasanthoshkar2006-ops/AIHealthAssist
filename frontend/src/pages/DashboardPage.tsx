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
  Video,
  FileText,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const isDemo = data?.is_demo === true;

  useEffect(() => {
    apiRequest('/dashboard')
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
        <p className="text-sm">Loading AI Wellness Dashboard...</p>
      </div>
    );
  }

  // The dashboard API returns a normalized payload with today's values
  // under "today". Keep the UI mapped to that contract so real users
  // don't incorrectly see "No data" when records/profile exist.
  const today = data?.today || {};
  const metrics = {
    workouts_completed: today.workout_count ?? 0,
    avg_form_score: today.average_form ?? 0,
    today_calories: today.calories_consumed ?? 0,
    today_protein_g: today.protein_consumed ?? 0,
    sleep_duration_hours: today.sleep_hours ?? 0,
    sleep_quality_score: today.sleep_quality ?? 0,
    streak_days: data?.streak?.current ?? 0,
    habits_total: data?.habits?.total ?? 0,
    habits_completed: data?.habits?.completed ?? 0,
  };

  const components = {
    workout: metrics.workouts_completed > 0 ? Math.min(100, metrics.avg_form_score || 0) : null,
    nutrition: metrics.today_calories > 0 ? 100 : null,
    sleep: metrics.sleep_duration_hours > 0 ? Math.min(100, Math.round((metrics.sleep_duration_hours / 8) * 100)) : null,
    habits: data?.habits?.completion_percentage ?? null,
  };

  const hasWorkoutData = isDemo || metrics.workouts_completed > 0;
  const hasNutritionData = isDemo || metrics.today_calories > 0;
  const hasSleepData = isDemo || metrics.sleep_duration_hours > 0;
  const hasHabitData = isDemo || (data?.habits?.total ?? 0) > 0;
  const hasPerformanceData = isDemo || hasWorkoutData || hasNutritionData || hasSleepData || hasHabitData;

  /*
   * DEMO MODE
   *
   * The backend sends:
   *
   * is_demo: true
   *
   * for demo@example.com
   */
  /*
   * REAL USER DATA STATUS
   *
   * Demo users always display the complete demo dashboard.
   * Normal users only display information that actually exists.
   */
  const schedule = data?.schedule;
  const profile = data?.profile;

  /*
   * ============================================================
   * DEMO GRAPH DATA
   * ============================================================
   *
   * These values are ONLY used for the demo account.
   *
   * Normal users never receive these values.
   */

  const demoWorkoutTrendData = [
    { day: 'Mon', reps: 40, form: 88 },
    { day: 'Tue', reps: 45, form: 90 },
    { day: 'Wed', reps: 50, form: 92 },
    { day: 'Thu', reps: 35, form: 87 },
    { day: 'Fri', reps: 60, form: 94 },
    { day: 'Sat', reps: 55, form: 93 },
    { day: 'Sun', reps: 65, form: 95 },
  ];

  const demoSleepTrendData = [
    { day: 'Mon', hours: 7.2 },
    { day: 'Tue', hours: 7.5 },
    { day: 'Wed', hours: 6.8 },
    { day: 'Thu', hours: 7.8 },
    { day: 'Fri', hours: 7.4 },
    { day: 'Sat', hours: 8.1 },
    { day: 'Sun', hours: 7.6 },
  ];

  /*
   * ============================================================
   * WORKOUT GRAPH
   * ============================================================
   */

  const workoutTrendData = isDemo
    ? demoWorkoutTrendData
    : Array.isArray(data?.workout_trend) &&
      data.workout_trend.length > 0
    ? data.workout_trend
    : [
        { day: 'Mon', reps: null, form: null },
        { day: 'Tue', reps: null, form: null },
        { day: 'Wed', reps: null, form: null },
        { day: 'Thu', reps: null, form: null },
        { day: 'Fri', reps: null, form: null },
        { day: 'Sat', reps: null, form: null },
        { day: 'Sun', reps: null, form: null },
      ];

  /*
   * ============================================================
   * SLEEP GRAPH
   * ============================================================
   */

  const sleepTrendData = isDemo
    ? demoSleepTrendData
    : Array.isArray(data?.sleep_trend) &&
      data.sleep_trend.length > 0
    ? data.sleep_trend
    : [
        { day: 'Mon', hours: null },
        { day: 'Tue', hours: null },
        { day: 'Wed', hours: null },
        { day: 'Thu', hours: null },
        { day: 'Fri', hours: null },
        { day: 'Sat', hours: null },
        { day: 'Sun', hours: null },
      ];

  return (
    <div className="space-y-6">

      <DisclaimerBanner />

      {isDemo && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">Demo Mode</p>
          <p className="text-xs text-slate-300 mt-1">
            {data?.demo_notice || "This account contains sample data for demonstrating HealthAssist AI. It is not real health information."}
          </p>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-6 rounded-3xl border border-slate-800">

        <div>

          <div className="flex items-center gap-2 flex-wrap">

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              AI Lifestyle Engine Active
            </span>

            {isDemo && (
              <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                Demo Mode · Sample Data
              </span>
            )}

            {data?.profession && (
              <span className="text-xs text-slate-400">
                • Profession:{' '}
                <strong className="text-slate-200">
                  {data.profession || profile?.profession}
                </strong>
              </span>
            )}

          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 mt-2">

            {t('goodMorning')}{' '}

            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              {data?.user_name || 'Friend'}
            </span>

          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {t('welcomeBack')}
          </p>

        </div>

        <div className="flex items-center gap-3 flex-wrap">

          <Link
            to="/workout/live"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition"
          >
            <Video className="w-4 h-4" />
            Start Live Workout
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </Link>

        </div>

      </div>

      {/* =====================================================
          DAILY PERFORMANCE
      ===================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>

            <div className="flex items-center gap-2">

              <Activity className="w-5 h-5 text-sky-400" />

              <h3 className="text-lg font-bold text-slate-100">
                Today's Performance
              </h3>

            </div>

            <p className="text-xs text-slate-400 mt-1">
              Calculated from your actual recorded activity
            </p>

          </div>

          {hasPerformanceData ? (
            <div className="text-3xl font-extrabold text-sky-400">
              {isDemo ? 95 : Math.round(
                ((components.workout ?? 0) + (components.nutrition ?? 0) + (components.sleep ?? 0) + (components.habits ?? 0)) /
                [components.workout, components.nutrition, components.sleep, components.habits].filter((v) => v != null).length
              )}%
            </div>
          ) : (
            <div className="text-sm font-semibold text-slate-400">
              No data yet
            </div>
          )}

        </div>

        {!hasPerformanceData ? (

          <div className="border border-dashed border-slate-700 rounded-2xl p-6 text-center">

            <Sparkles className="w-8 h-8 mx-auto text-slate-500 mb-2" />

            <p className="text-sm text-slate-300">
              Start recording your daily activities.
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Your performance will be calculated automatically.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <PerformanceItem
              title="Workout"
              value={components.workout ?? (isDemo ? 95 : null)}
              icon={<Dumbbell className="w-4 h-4" />}
            />

            <PerformanceItem
              title="Nutrition"
              value={components.nutrition ?? (isDemo ? 90 : null)}
              icon={<Utensils className="w-4 h-4" />}
            />

            <PerformanceItem
              title="Sleep"
              value={components.sleep ?? (isDemo ? 92 : null)}
              icon={<Moon className="w-4 h-4" />}
            />

            <PerformanceItem
              title="Habits"
              value={components.habits ?? (isDemo ? 80 : null)}
              icon={<CheckCircle2 className="w-4 h-4" />}
            />

          </div>

        )}

      </div>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <MetricCard
          icon={<Dumbbell className="w-5 h-5" />}
          title="Workouts"
          value={
            hasWorkoutData
              ? `${metrics.workouts_completed ?? 2}`
              : 'No data'
          }
          suffix={
            hasWorkoutData
              ? `session${
                  (metrics.workouts_completed ?? 2) === 1
                    ? ''
                    : 's'
                }`
              : ''
          }
          footer={
            hasWorkoutData
              ? `Form: ${
                  metrics.avg_form_score ?? (isDemo ? 95 : 'Not measured')
                }${
                  metrics.avg_form_score != null || isDemo
                    ? '%'
                    : ''
                }`
              : 'Complete a workout to start tracking'
          }
        />

        <MetricCard
          icon={<Utensils className="w-5 h-5" />}
          title="Nutrition Today"
          value={
            hasNutritionData
              ? `${Math.round(metrics.today_calories ?? (isDemo ? 2180 : 0))}`
              : 'No data'
          }
          suffix={hasNutritionData ? 'kcal' : ''}
          footer={
            hasNutritionData
              ? `Protein: ${Math.round(
                  metrics.today_protein_g ?? (isDemo ? 96 : 0)
                )}g`
              : 'Record a meal to start tracking'
          }
        />

        <MetricCard
          icon={<Moon className="w-5 h-5" />}
          title="Sleep Routine"
          value={
            hasSleepData
              ? `${metrics.sleep_duration_hours ?? (isDemo ? 7.6 : 0)}`
              : 'No data'
          }
          suffix={hasSleepData ? 'hrs' : ''}
          footer={
            hasSleepData
              ? `Quality: ${
                  metrics.sleep_quality_score ??
                  (isDemo ? 92 : 'Not measured')
                }/10`
              : 'Record sleep to start tracking'
          }
        />

        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          title="Consistency"
          value={`${metrics.streak_days ?? (isDemo ? 12 : 0)}`}
          suffix="days"
          footer={
            (metrics.streak_days ?? (isDemo ? 12 : 0)) > 0
              ? 'Active milestone streak'
              : 'Your streak starts with activity'
          }
        />

      </div>

      {/* =====================================================
          PROFILE / BMI
      ===================================================== */}

      {profile && (

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <div className="flex items-center gap-2 mb-4">

            <TrendingUp className="w-5 h-5 text-emerald-400" />

            <h3 className="text-lg font-bold text-slate-100">
              Your Current Profile
            </h3>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            <ProfileValue
              title="Height"
              value={
                profile.height != null
                  ? `${profile.height} cm`
                  : 'No data'
              }
            />

            <ProfileValue
              title="Weight"
              value={
                profile.weight != null
                  ? `${profile.weight} kg`
                  : 'No data'
              }
            />

            <ProfileValue
              title="BMI"
              value={
                data?.bmi != null
                  ? `${data.bmi}`
                  : 'No data'
              }
            />

          </div>

          <p className="text-xs text-slate-500 mt-4">
            BMI is shown as a calculated measurement from your entered height
            and weight. It is not a medical diagnosis.
          </p>

        </div>

      )}

      {/* =====================================================
          TODAY'S SCHEDULE
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="text-lg font-bold text-slate-100">
                Today's Schedule
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Based on your recorded schedule
              </p>

            </div>

          </div>

          {!schedule ? (

            <div className="border border-dashed border-slate-700 rounded-2xl p-6 text-center">

              <p className="text-sm text-slate-400">
                No schedule data yet.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              <ScheduleItem
                label="Wake"
                value={schedule.wake_time}
              />

              <ScheduleItem
                label="Work starts"
                value={schedule.work_start}
              />

              <ScheduleItem
                label="Work ends"
                value={schedule.work_end}
              />

              <ScheduleItem
                label="Sleep target"
                value={schedule.sleep_time}
              />

            </div>

          )}

        </div>

        {/* =================================================
            AI INSIGHTS
        ================================================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <div className="flex items-center gap-2 mb-5">

            <Sparkles className="w-5 h-5 text-sky-400" />

            <h3 className="text-lg font-bold text-slate-100">
              AI Insights & Adaptive Focus
            </h3>

          </div>

          <div className="space-y-3">

            {(data?.ai_insights || []).map(
              (insight: string, index: number) => (

                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800"
                >

                  <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />

                  <p className="text-sm text-slate-300">
                    {insight}
                  </p>

                </div>

              )
            )}

            {isDemo &&
              (!data?.ai_insights ||
                data.ai_insights.length === 0) && (
                <>
                  <Insight text="Your activity consistency is strong this week." />
                  <Insight text="Your sleep routine is within a healthy target range." />
                  <Insight text="Keep your nutrition balanced and stay consistent with your routine." />
                </>
              )}

            {!isDemo &&
              (!data?.ai_insights ||
                data.ai_insights.length === 0) && (
                <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
                  <p className="text-sm text-slate-400">
                    AI insights will appear after you record some activity.
                  </p>
                </div>
              )}

          </div>

        </div>

      </div>

      {/* =====================================================
          WORKOUT + SLEEP GRAPHS
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* =================================================
            WORKOUT GRAPH
        ================================================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-2">

              <Dumbbell className="w-5 h-5 text-sky-400" />

              <div>

                <h3 className="text-lg font-bold text-slate-100">
                  Workout Progress
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Reps and form accuracy
                </p>

              </div>

            </div>

          </div>

          <div className="h-64 w-full">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={workoutTrendData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  tick={{
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />

                <YAxis
                  stroke="#64748b"
                  tick={{
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="reps"
                  name="Reps"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.12}
                  connectNulls={false}
                />

                <Area
                  type="monotone"
                  dataKey="form"
                  name="Form %"
                  stroke="#34d399"
                  fill="#34d399"
                  fillOpacity={0.08}
                  connectNulls={false}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

          {!isDemo &&
            !data?.workout_trend?.some(
              (item: any) =>
                item.reps != null || item.form != null
            ) && (
              <p className="text-center text-xs text-slate-500 mt-2">
                No workout records yet.
              </p>
            )}

        </div>

        {/* =================================================
            SLEEP GRAPH
        ================================================= */}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-2">

              <Moon className="w-5 h-5 text-sky-400" />

              <div>

                <h3 className="text-lg font-bold text-slate-100">
                  Sleep Trend
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Sleep duration over the last 7 days
                </p>

              </div>

            </div>

          </div>

          <div className="h-64 w-full">

            <ResponsiveContainer width="100%" height="100%">

              <BarChart data={sleepTrendData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  tick={{
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />

                <YAxis
                  stroke="#64748b"
                  tick={{
                    fill: '#94a3b8',
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />

                <Bar
                  dataKey="hours"
                  name="Sleep Hours"
                  fill="#38bdf8"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

          {!isDemo &&
            !data?.sleep_trend?.some(
              (item: any) => item.hours != null
            ) && (
              <p className="text-center text-xs text-slate-500 mt-2">
                No sleep records yet.
              </p>
            )}

        </div>

      </div>

      {/* =====================================================
          HABITS
      ===================================================== */}

      {hasHabitData && (

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <div className="flex items-center gap-2 mb-4">

            <CheckCircle2 className="w-5 h-5 text-emerald-400" />

            <h3 className="text-lg font-bold text-slate-100">
              Today's Habits
            </h3>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <SmallStat
              label="Total"
              value={
                metrics.habits_total ??
                (isDemo ? 5 : 'No data')
              }
            />

            <SmallStat
              label="Completed"
              value={
                metrics.habits_completed ??
                (isDemo ? 4 : 'No data')
              }
            />

            <SmallStat
              label="Remaining"
              value={
                isDemo
                  ? Math.max(
                      0,
                      (metrics.habits_total ?? 5) -
                        (metrics.habits_completed ?? 4)
                    )
                  : Math.max(
                      0,
                      (metrics.habits_total || 0) -
                        (metrics.habits_completed || 0)
                    )
              }
            />

            <SmallStat
              label="Performance"
              value={
                components.habits ??
                (isDemo ? '80%' : 'No data')
              }
            />

          </div>

        </div>

      )}

      {/* =====================================================
          GOALS
      ===================================================== */}

      {data?.goals?.length > 0 && (

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h3 className="text-lg font-bold text-slate-100 mb-4">
            Your Goals
          </h3>

          <div className="space-y-3">

            {data.goals.map((goal: any, index: number) => (

              <div
                key={goal.id ?? index}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800"
              >

                <div>

                  <p className="text-sm font-semibold text-slate-200">
                    {goal.title}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {goal.category}
                  </p>

                </div>

                <div className="text-right">

                  {goal.target_value != null ? (

                    <p className="text-sm text-sky-400 font-semibold">
                      {goal.current_value ?? 0} / {goal.target_value}{' '}
                      {goal.unit || ''}
                    </p>

                  ) : (

                    <p className="text-xs text-slate-400">
                      No target set
                    </p>

                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* =====================================================
          DISCLAIMER
      ===================================================== */}

      <div className="text-xs text-slate-500 text-center pb-6">
        {data?.disclaimer}
      </div>

    </div>
  );
};

/* =============================================================
   COMPONENTS
============================================================= */

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  suffix?: string;
  footer: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  suffix,
  footer,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

      <div className="flex items-center gap-2 text-slate-400 mb-3">

        {icon}

        <span className="text-xs font-semibold">
          {title}
        </span>

      </div>

      <div className="flex items-baseline gap-2">

        <span className="text-2xl font-extrabold text-slate-100">
          {value}
        </span>

        {suffix && (
          <span className="text-xs text-slate-500">
            {suffix}
          </span>
        )}

      </div>

      <p className="text-xs text-slate-500 mt-2">
        {footer}
      </p>

    </div>
  );
};

interface PerformanceItemProps {
  title: string;
  value: number | null | undefined;
  icon: React.ReactNode;
}

const PerformanceItem: React.FC<PerformanceItemProps> = ({
  title,
  value,
  icon,
}) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

      <div className="flex items-center gap-2 text-slate-400 mb-2">

        {icon}

        <span className="text-xs">
          {title}
        </span>

      </div>

      <div className="text-lg font-bold text-slate-100">

        {value != null
          ? `${value}%`
          : 'No data'}

      </div>

    </div>
  );
};

interface ProfileValueProps {
  title: string;
  value: string;
}

const ProfileValue: React.FC<ProfileValueProps> = ({
  title,
  value,
}) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p className="text-lg font-bold text-slate-100 mt-1">
        {value}
      </p>

    </div>
  );
};

interface ScheduleItemProps {
  label: string;
  value?: string | null;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({
  label,
  value,
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">

      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-200">
        {value || 'Not set'}
      </span>

    </div>
  );
};

interface SmallStatProps {
  label: string;
  value: string | number | null | undefined;
}

const SmallStat: React.FC<SmallStatProps> = ({
  label,
  value,
}) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="text-lg font-bold text-slate-100 mt-1">
        {value ?? 'No data'}
      </p>

    </div>
  );
};

interface InsightProps {
  text: string;
}

const Insight: React.FC<InsightProps> = ({ text }) => {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">

      <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />

      <p className="text-sm text-slate-300">
        {text}
      </p>

    </div>
  );
};
