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

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

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

  const metrics = data?.metrics || {};
  const performance = data?.daily_performance || {};
  const components = performance?.components || {};
  const dataStatus = data?.data_status || {};

  const hasWorkoutData = dataStatus.has_workout_data;
  const hasNutritionData = dataStatus.has_nutrition_data;
  const hasSleepData = dataStatus.has_sleep_data;
  const hasHabitData = dataStatus.has_habit_data;

  const schedule = data?.schedule;
  const profile = data?.profile;

  return (
    <div className="space-y-6">

      <DisclaimerBanner />

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 p-6 rounded-3xl border border-slate-800">

        <div>

          <div className="flex items-center gap-2 flex-wrap">

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              AI Lifestyle Engine Active
            </span>

            {data?.profession && (
              <span className="text-xs text-slate-400">
                • Profession:{' '}
                <strong className="text-slate-200">
                  {data.profession}
                </strong>
              </span>
            )}

          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 mt-2">

            {t('goodMorning')},{' '}

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


      {/* ===================================================== */}
      {/* DAILY PERFORMANCE */}
      {/* ===================================================== */}

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

          {performance.has_data ? (
            <div className="text-3xl font-extrabold text-sky-400">
              {performance.score}%
            </div>
          ) : (
            <div className="text-sm font-semibold text-slate-400">
              No data yet
            </div>
          )}

        </div>


        {!performance.has_data ? (

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
              value={components.workout}
              icon={<Dumbbell className="w-4 h-4" />}
            />

            <PerformanceItem
              title="Nutrition"
              value={components.nutrition}
              icon={<Utensils className="w-4 h-4" />}
            />

            <PerformanceItem
              title="Sleep"
              value={components.sleep}
              icon={<Moon className="w-4 h-4" />}
            />

            <PerformanceItem
              title="Habits"
              value={components.habits}
              icon={<CheckCircle2 className="w-4 h-4" />}
            />

          </div>

        )}

      </div>


      {/* ===================================================== */}
      {/* METRICS */}
      {/* ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Workout */}

        <MetricCard
          icon={<Dumbbell className="w-5 h-5" />}
          title="Workouts"
          value={
            hasWorkoutData
              ? `${metrics.workouts_completed}`
              : 'No data'
          }
          suffix={
            hasWorkoutData
              ? `session${metrics.workouts_completed === 1 ? '' : 's'}`
              : ''
          }
          footer={
            hasWorkoutData
              ? `Form: ${metrics.avg_form_score ?? 'Not measured'}${
                  metrics.avg_form_score != null ? '%' : ''
                }`
              : 'Complete a workout to start tracking'
          }
        />

        {/* Nutrition */}

        <MetricCard
          icon={<Utensils className="w-5 h-5" />}
          title="Nutrition Today"
          value={
            hasNutritionData
              ? `${Math.round(metrics.today_calories || 0)}`
              : 'No data'
          }
          suffix={hasNutritionData ? 'kcal' : ''}
          footer={
            hasNutritionData
              ? `Protein: ${Math.round(metrics.today_protein_g || 0)}g`
              : 'Record a meal to start tracking'
          }
        />

        {/* Sleep */}

        <MetricCard
          icon={<Moon className="w-5 h-5" />}
          title="Sleep Routine"
          value={
            hasSleepData
              ? `${metrics.sleep_duration_hours}`
              : 'No data'
          }
          suffix={hasSleepData ? 'hrs' : ''}
          footer={
            hasSleepData
              ? `Quality: ${metrics.sleep_quality_score ?? 'Not measured'}/10`
              : 'Record sleep to start tracking'
          }
        />

        {/* Streak */}

        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          title="Consistency"
          value={`${metrics.streak_days || 0}`}
          suffix="days"
          footer={
            metrics.streak_days > 0
              ? 'Active milestone streak'
              : 'Your streak starts with activity'
          }
        />

      </div>


      {/* ===================================================== */}
      {/* PROFILE / BMI */}
      {/* ===================================================== */}

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
                profile.height_cm != null
                  ? `${profile.height_cm} cm`
                  : 'No data'
              }
            />

            <ProfileValue
              title="Weight"
              value={
                profile.weight_kg != null
                  ? `${profile.weight_kg} kg`
                  : 'No data'
              }
            />

            <ProfileValue
              title="BMI"
              value={
                profile.bmi != null
                  ? `${profile.bmi}`
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


      {/* ===================================================== */}
      {/* TODAY'S SCHEDULE */}
      {/* ===================================================== */}

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


        {/* ================================================= */}
        {/* AI INSIGHTS */}
        {/* ================================================= */}

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

          </div>

        </div>

      </div>


      {/* ===================================================== */}
      {/* REAL DATA GRAPHS */}
      {/* ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Workout */}

        <DataPanel
          title="Workout Progress"
          hasData={hasWorkoutData}
          icon={<Dumbbell className="w-5 h-5" />}
        >

          <div className="grid grid-cols-3 gap-3">

            <SmallStat
              label="Sessions"
              value={metrics.workouts_completed}
            />

            <SmallStat
              label="Minutes"
              value={metrics.total_workout_minutes}
            />

            <SmallStat
              label="Reps"
              value={metrics.total_reps}
            />

          </div>

          {metrics.calories_burned > 0 && (
            <p className="text-xs text-slate-400 mt-4">
              Calories burned: {Math.round(metrics.calories_burned)} kcal
            </p>
          )}

        </DataPanel>


        {/* Sleep */}

        <DataPanel
          title="Sleep Tracking"
          hasData={hasSleepData}
          icon={<Moon className="w-5 h-5" />}
        >

          {hasSleepData ? (

            <div className="grid grid-cols-2 gap-4">

              <SmallStat
                label="Duration"
                value={`${metrics.sleep_duration_hours} hrs`}
              />

              <SmallStat
                label="Quality"
                value={`${metrics.sleep_quality_score}/10`}
              />

            </div>

          ) : null}

        </DataPanel>

      </div>


      {/* ===================================================== */}
      {/* HABITS */}
      {/* ===================================================== */}

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
              value={metrics.habits_total}
            />

            <SmallStat
              label="Completed"
              value={metrics.habits_completed}
            />

            <SmallStat
              label="Remaining"
              value={
                Math.max(
                  0,
                  (metrics.habits_total || 0) -
                    (metrics.habits_completed || 0)
                )
              }
            />

            <SmallStat
              label="Performance"
              value={`${components.habits ?? 0}%`}
            />

          </div>

        </div>

      )}


      {/* ===================================================== */}
      {/* GOALS */}
      {/* ===================================================== */}

      {data?.goals?.length > 0 && (

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

          <h3 className="text-lg font-bold text-slate-100 mb-4">
            Your Goals
          </h3>

          <div className="space-y-3">

            {data.goals.map((goal: any) => (

              <div
                key={goal.id}
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


      {/* ===================================================== */}
      {/* DISCLAIMER */}
      {/* ===================================================== */}

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


interface DataPanelProps {
  title: string;
  hasData: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DataPanel: React.FC<DataPanelProps> = ({
  title,
  hasData,
  icon,
  children,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">

      <div className="flex items-center gap-2 mb-5">

        {icon}

        <h3 className="text-lg font-bold text-slate-100">
          {title}
        </h3>

      </div>

      {!hasData ? (

        <div className="border border-dashed border-slate-700 rounded-2xl p-8 text-center">

          <p className="text-sm text-slate-400">
            No data yet
          </p>

          <p className="text-xs text-slate-600 mt-1">
            Real records will appear here automatically.
          </p>

        </div>

      ) : (

        children

      )}

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
