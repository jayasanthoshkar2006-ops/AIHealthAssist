import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Calendar, Clock, Sparkles, Send, CheckCircle2 } from 'lucide-react';

export const SchedulePage: React.FC = () => {
  const [plan, setPlan] = useState<any>(null);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPlan = () => {
    apiRequest('/daily-plan')
      .then((res) => setPlan(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    try {
      const res: any = await apiRequest('/schedule/adjust', {
        method: 'POST',
        body: JSON.stringify({ user_command: command }),
      });
      setPlan((prev: any) => ({ ...prev, timeline: res.updated_timeline }));
      setCommand('');
    } catch (err: any) {
      alert(err.message || 'Schedule adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100">Profession-Based AI Schedule Planner</h2>
              <p className="text-xs text-slate-400">Dynamic AI timeline adaptation based on real-time availability</p>
            </div>
          </div>
        </div>

        {/* Dynamic Command Input */}
        <form onSubmit={handleAdjust} className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g. 'Move my workout to 7 PM' or 'I have college until 6 PM today'"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-none text-xs text-slate-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-glow flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Adjusting...' : 'Adjust Schedule'} <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Timeline View */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Today's Adaptive Timeline
        </h3>

        <div className="space-y-3">
          {(plan?.timeline || []).map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sky-400 font-bold text-sm w-16">{item.time}</span>
                <span className="font-medium">{item.activity}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
