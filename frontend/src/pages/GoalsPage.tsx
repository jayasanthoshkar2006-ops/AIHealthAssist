import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Target, Zap, Award, Plus, CheckCircle2 } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('workout');
  const [targetVal, setTargetVal] = useState(100);
  const [unit, setUnit] = useState('%');

  const fetchGoals = () => {
    apiRequest('/goals')
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await apiRequest('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          target_value: Number(targetVal),
          unit
        })
      });
      setTitle('');
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to add goal');
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-400" /> Personal Goal System & Streak Milestones
        </h2>
        <p className="text-xs text-slate-400">Track target progression, streak achievements, and unlock wellness badges</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Goal Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Create Goal Target</h3>

          <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Goal Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 12 Workouts Completed"
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              >
                <option value="workout">Workout & Strength</option>
                <option value="nutrition">Nutrition & Diet</option>
                <option value="sleep">Sleep Routine</option>
                <option value="habit">Habit Building</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Goal Target
            </button>
          </form>
        </div>

        {/* Goals & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Streaks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(data?.streaks || []).map((s: any, idx: number) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                  <span>{s.category}</span>
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-2xl font-extrabold text-slate-100">{s.current_streak} days</p>
                <p className="text-[10px] text-slate-400">Longest: {s.longest_streak} days</p>
              </div>
            ))}
          </div>

          {/* Active Goals List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Active Personal Goals</h3>

            <div className="space-y-3 text-xs">
              {(data?.goals || []).map((g: any) => (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{g.title}</span>
                    <span className="text-emerald-400 font-semibold">{g.current_value} / {g.target_value} {g.unit}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all"
                      style={{ width: `${Math.min(100, (g.current_value / g.target_value) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
