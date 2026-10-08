import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Dumbbell, Sparkles, Video, FileText, TrendingUp, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [timeGreeting, setTimeGreeting] = useState(getTimeGreeting);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateGreeting = () => setTimeGreeting(getTimeGreeting());
    updateGreeting();
    const interval = window.setInterval(updateGreeting, 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    apiRequest('/dashboard')
      .then(setData)
      .catch((err) => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
        <p className="text-sm">Loading AI Wellness Dashboard...</p>
      </div>
    );
  }

  const isDemo = data?.is_demo === true;
  const profile = data?.profile;
  const schedule = data?.schedule;
  const today = data?.today || {};
  const workoutsCompleted = today.workout_count ?? 0;
  const averageForm = today.average_form ?? 0;
  const workoutTrend = Array.isArray(data?.workout_trend) && data.workout_trend.length
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

  const hasWorkoutData = isDemo || workoutsCompleted > 0;

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {isDemo && (
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">Demo Mode</p>
          <p className="text-xs text-slate-300 mt-1">
            {data?.demo_notice || 'This account contains sample data for demonstrating HealthAssist AI. It is not real health information.'}
          </p>
        </div>
      )}

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
                • Profession: <strong className="text-slate-200">{data.profession}</strong>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-100 mt-2">
            {timeGreeting}{' '}
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              {data?.user_name || 'Friend'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Welcome back</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/workout/live" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition">
            <Video className="w-4 h-4" /> Start Live Workout
          </Link>
          <Link to="/reports" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition">
            <FileText className="w-4 h-4" /> Download PDF Report
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-slate-100">Today's Performance</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Calculated from your recorded workout activity</p>
          </div>
          {hasWorkoutData ? (
            <div className="text-3xl font-extrabold text-sky-400">{isDemo ? 95 : Math.round(averageForm || 0)}%</div>
          ) : (
            <div className="text-sm font-semibold text-slate-400">No data yet</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PerformanceItem title="Workout" value={hasWorkoutData ? (isDemo ? 95 : averageForm) : null} icon={<Dumbbell className="w-4 h-4" />} />
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500">Complete workouts to build your personal performance history.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Dumbbell className="w-5 h-5" />}
          title="Workouts"
          value={hasWorkoutData ? String(isDemo ? 2 : workoutsCompleted) : 'No data'}
          suffix={hasWorkoutData ? 'session' + ((isDemo ? 2 : workoutsCompleted) === 1 ? '' : 's') : ''}
          footer={hasWorkoutData ? 'Form: ' + (isDemo ? '95%' : (averageForm ? String(averageForm) + '%' : 'Not measured')) : 'Complete a workout to start tracking'}
        />
      </div>

      {profile && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-slate-100">Your Current Profile</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ProfileValue title="Height" value={profile.height != null ? String(profile.height) + ' cm' : 'No data'} />
            <ProfileValue title="Weight" value={profile.weight != null ? String(profile.weight) + ' kg' : 'No data'} />
            <ProfileValue title="BMI" value={data?.bmi != null ? String(data.bmi) : 'No data'} />
          </div>
          <p className="text-xs text-slate-500 mt-4">BMI is shown as a calculated measurement from your entered height and weight. It is not a medical diagnosis.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-slate-100">Today's Schedule</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">Based on your recorded schedule</p>
          {!schedule ? (
            <div className="border border-dashed border-slate-700 rounded-2xl p-6 text-center">
              <p className="text-sm text-slate-400">No schedule data yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ScheduleItem label="Wake" value={schedule.wake_time} />
              <ScheduleItem label="Work starts" value={schedule.work_start} />
              <ScheduleItem label="Work ends" value={schedule.work_end} />
              <ScheduleItem label="Sleep target" value={schedule.sleep_time} />
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-slate-100">AI Insights & Adaptive Focus</h3>
          </div>
          <div className="space-y-3">
            {(data?.ai_insights || []).map((insight: string, index: number) => (
              <div key={index} className="flex gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <Sparkles className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
            {(!data?.ai_insights || data.ai_insights.length === 0) && (
              <div className="border border-dashed border-slate-700 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400">AI insights will appear after you record some activity.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Dumbbell className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-lg font-bold text-slate-100">Workout Progress</h3>
            <p className="text-xs text-slate-400 mt-1">Reps and form accuracy over the last 7 days</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workoutTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="reps" name="Reps" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.12} connectNulls={false} />
              <Area type="monotone" dataKey="form" name="Form %" stroke="#34d399" fill="#34d399" fillOpacity={0.08} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!isDemo && !data?.workout_trend?.some((item: any) => item.reps != null || item.form != null) && (
          <p className="text-center text-xs text-slate-500 mt-2">No workout records yet.</p>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center pb-6">{data?.disclaimer}</div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  suffix?: string;
  footer: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, suffix, footer }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
    <div className="flex items-center gap-2 text-slate-400 mb-3">{icon}<span className="text-xs font-semibold">{title}</span></div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-extrabold text-slate-100">{value}</span>
      {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
    </div>
    <p className="text-xs text-slate-500 mt-2">{footer}</p>
  </div>
);

const PerformanceItem: React.FC<{ title: string; value: number | null | undefined; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <div className="flex items-center gap-2 text-slate-400 mb-2">{icon}<span className="text-xs">{title}</span></div>
    <span className="text-2xl font-extrabold text-slate-100">{value != null ? String(value) + '%' : 'No data'}</span>
  </div>
);

const ProfileValue: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <p className="text-xs text-slate-500">{title}</p>
    <p className="text-lg font-bold text-slate-100 mt-1">{value}</p>
  </div>
);

const ScheduleItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
    <span className="text-sm text-slate-400">{label}</span>
    <span className="text-sm font-semibold text-slate-100">{value || 'Not set'}</span>
  </div>
);
