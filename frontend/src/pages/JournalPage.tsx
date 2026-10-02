import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { BookOpen, Smile, AlertTriangle, Plus, Tag } from 'lucide-react';

export const JournalPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [mood, setMood] = useState('Calm');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchJournal = () => {
    apiRequest('/journal/summary')
      .then((res) => setSummary(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchJournal();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await apiRequest('/journal', {
        method: 'POST',
        body: JSON.stringify({ mood, content, tags: ['daily-reflection'] })
      });
      setContent('');
      fetchJournal();
    } catch (err: any) {
      alert(err.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const moods = ['Calm', 'Productive', 'Happy', 'Tired', 'Stressed', 'Anxious'];

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" /> Private Mental Wellness Journal
        </h2>
        <p className="text-xs text-slate-400">
          Reflect on your daily thoughts, track mood trends, and view recurring thematic reflections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Journal Entry */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">New Reflection Entry</h3>

          <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Select Current Mood</label>
              <div className="flex flex-wrap gap-2">
                {moods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      mood === m ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Journal Thoughts</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your private daily reflection here..."
                rows={5}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Private Entry'}
            </button>
          </form>
        </div>

        {/* Journal Entries & Themes */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100">Recent Reflections & Dominant Mood</h3>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold">
              Mood: {summary?.dominant_mood || 'Calm'}
            </span>
          </div>

          <div className="space-y-3">
            {summary?.recent_entries?.map((entry: any) => (
              <div key={entry.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-sky-300">{entry.entry_date}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-medium">
                    {entry.mood}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{entry.content}</p>
                {entry.ai_summary && (
                  <p className="text-[11px] text-slate-500 italic border-t border-slate-900 pt-2">
                    AI Reflection Note: {entry.ai_summary}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Mental Health Crisis Safety Guidance Note */}
          <div className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-300 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Mental Health Safety Guidance</span>
            </div>
            <p className="text-red-200/80 leading-relaxed">
              If you are experiencing severe distress, please contact a professional healthcare provider or crisis helpline (Tamil Nadu Health Helpline: 104 / National Emergency: 112).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
