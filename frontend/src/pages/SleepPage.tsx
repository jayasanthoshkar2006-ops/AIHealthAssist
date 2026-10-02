import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Moon, Clock, Sparkles, Plus } from 'lucide-react';

export const SleepPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [sleepDate, setSleepDate] = useState(new Date().toISOString().split('T')[0]);
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [duration, setDuration] = useState(8.0);
  const [quality, setQuality] = useState(8);

  const fetchSleep = () => {
    apiRequest('/sleep/analysis')
      .then((res) => setData(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSleep();
  }, []);

  const handleLogSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/sleep', {
        method: 'POST',
        body: JSON.stringify({
          sleep_date: sleepDate,
          sleep_time: sleepTime,
          wake_time: wakeTime,
          duration_hours: Number(duration),
          quality_score: Number(quality)
        })
      });
      fetchSleep();
    } catch (err: any) {
      alert(err.message || 'Failed to log sleep');
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-400" /> Sleep Routine & Pattern Analyzer
        </h2>
        <p className="text-xs text-slate-400">
          Track sleep duration, timing consistency, and receive AI pattern observations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Sleep Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Log Sleep Entry</h3>

          <form onSubmit={handleLogSleep} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Date</label>
              <input
                type="date"
                value={sleepDate}
                onChange={(e) => setSleepDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sleep Time</label>
                <input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.1"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quality Rating (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Save Sleep Record
            </button>
          </form>
        </div>

        {/* AI Pattern Analysis Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-100">AI Pattern Observations</h3>
          </div>

          {data?.analysis && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="text-slate-400">Average Sleep Duration</p>
                <p className="text-2xl font-bold text-indigo-400">{data.analysis.average_duration} hours</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <p className="font-semibold text-indigo-300">Identified Patterns</p>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  {data.analysis.patterns_identified?.map((pat: string, idx: number) => (
                    <li key={idx}>{pat}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300">
                <strong>Recommendation:</strong> {data.analysis.recommendation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
