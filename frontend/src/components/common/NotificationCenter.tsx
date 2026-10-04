import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Calendar, Dumbbell, Utensils, Moon, Target, Pill, Info } from 'lucide-react';
import { apiRequest } from '../../api/client';

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [dashboard, plan, goals, medications, appointments] = await Promise.all([
        apiRequest<any>('/dashboard').catch(() => null),
        apiRequest<any>('/daily-plan').catch(() => null),
        apiRequest<any>('/goals').catch(() => null),
        apiRequest<any[]>('/medications').catch(() => []),
        apiRequest<any[]>('/appointments').catch(() => []),
      ]);
      const next:any[] = [];
      for (const x of plan?.timeline || []) if (x?.time && x?.activity) next.push({id:`plan-${x.time}-${x.activity}`,title:`${x.time} · ${x.category || 'Daily Plan'}`,body:x.activity,icon:<Calendar className="w-4 h-4 text-sky-400"/>,category:'Schedule'});
      if ((dashboard?.today?.workout_count ?? 0) === 0) next.push({id:'workout',title:'Workout reminder',body:'No workout is recorded today.',icon:<Dumbbell className="w-4 h-4 text-emerald-400"/>,category:'Workout'});
      if ((dashboard?.today?.calories_consumed ?? 0) === 0) next.push({id:'nutrition',title:'Nutrition reminder',body:'No nutrition activity is recorded today.',icon:<Utensils className="w-4 h-4 text-amber-400"/>,category:'Nutrition'});
      if ((dashboard?.today?.sleep_hours ?? 0) === 0) next.push({id:'sleep',title:'Sleep tracking reminder',body:'Record your sleep to update your wellness trends.',icon:<Moon className="w-4 h-4 text-indigo-400"/>,category:'Sleep'});
      for (const s of goals?.streaks || []) if ((s.current_streak ?? 0) > 0) next.push({id:`streak-${s.category}`,title:`${s.category} · ${s.current_streak} day streak`,body:`Longest: ${s.longest_streak ?? 0} days.`,icon:<Target className="w-4 h-4 text-fuchsia-400"/>,category:'Goals'});
      for (const m of medications || []) next.push({id:`med-${m.id}`,title:'Medication reminder',body:`${m.name} · ${m.reminder_time || 'scheduled'}`,icon:<Pill className="w-4 h-4 text-rose-400"/>,category:'Medication'});
      for (const a of appointments || []) next.push({id:`appointment-${a.id}`,title:'Appointment',body:`${a.title} · ${a.date_time || 'scheduled'}`,icon:<Calendar className="w-4 h-4 text-orange-400"/>,category:'Appointment'});
      if (!next.length) next.push({id:'ready',title:'HealthAssist AI is ready',body:'Notifications for your wellness activities will appear here.',icon:<Info className="w-4 h-4 text-sky-400"/>,category:'System'});
      setItems(next.slice(0,12));
    } finally { setLoading(false); }
  }

  useEffect(() => { if (open) void load(); }, [open]);

  return <div className="relative">
    <button onClick={() => setOpen(v => !v)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white relative transition-all" title="Notifications" aria-label="Open notifications">
      <Bell className="w-4 h-4" />
      {items.length > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-emerald-400 text-[9px] font-bold text-slate-950 flex items-center justify-center">{items.length > 9 ? '9+' : items.length}</span>}
    </button>
    {open && <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-slate-800"><h3 className="text-sm font-bold text-slate-100">All Notifications</h3><p className="text-[10px] text-slate-500">Workout, nutrition, sleep, goals, schedule, medication and appointments</p></div>
      <div className="max-h-[420px] overflow-y-auto p-2">
        {loading ? <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div> : items.map(x => <div key={x.id} className="p-3 rounded-xl hover:bg-slate-800/70 flex gap-3"><div>{x.icon}</div><div><p className="text-xs font-semibold text-slate-200">{x.title}</p><p className="text-[11px] text-slate-400 mt-0.5">{x.body}</p><span className="text-[9px] uppercase text-slate-600">{x.category}</span></div></div>)}
      </div>
      <div className="p-3 border-t border-slate-800"><Link to="/medications" onClick={() => setOpen(false)} className="block text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400">Manage Reminders & Notifications</Link></div>
    </div>}
  </div>;
};
