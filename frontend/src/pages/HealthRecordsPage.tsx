import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { FileText, Plus, ShieldAlert, Tag } from 'lucide-react';

export const HealthRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [notes, setNotes] = useState('');

  const fetchRecords = () => {
    apiRequest('/health/records')
      .then((res: any) => setRecords(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await apiRequest('/health/records', {
        method: 'POST',
        body: JSON.stringify({
          record_date: new Date().toISOString().split('T')[0],
          title,
          category,
          notes
        })
      });
      setTitle('');
      setNotes('');
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to add record');
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" /> Personal Health Records Vault
        </h2>
        <p className="text-xs text-slate-400">
          Store personal symptoms, measurements, and records. Clear classification of data sources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Add Health Record</h3>

          <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title / Event</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Blood Pressure Measurement / Lab Note"
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
                <option value="General">General Wellness</option>
                <option value="Symptoms">Symptom Note</option>
                <option value="Vitals">Vitals / Measurements</option>
                <option value="Lab Test">Lab Test Result</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Save Record
            </button>
          </form>
        </div>

        {/* Records list with source badges */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Stored Personal Records</h3>

          <div className="space-y-3 text-xs">
            {records.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">{r.title}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono font-bold text-[10px]">
                    {r.source_type}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">Date: {r.date} • Category: {r.category}</p>
                {r.notes && <p className="text-slate-300 leading-relaxed pt-1 border-t border-slate-900">{r.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
