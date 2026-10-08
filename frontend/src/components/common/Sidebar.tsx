import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Bot,
  Calendar,
  Dumbbell,
  Video,
  BookOpen,
  Pill,
  FileText,
  PieChart,
  Settings,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/ai-assistant', label: t('aiAssistant'), icon: Bot },
    { to: '/schedule', label: t('dailyPlan'), icon: Calendar },
    { to: '/workout', label: t('workout'), icon: Dumbbell },
    { to: '/workout/live', label: t('liveWorkout'), icon: Video, highlight: true },
    { to: '/journal', label: t('journal'), icon: BookOpen },
    { to: '/medications', label: t('reminders'), icon: Pill },
    { to: '/health-records', label: t('healthRecords'), icon: FileText },
    { to: '/reports', label: t('reports'), icon: PieChart },
    { to: '/settings', label: t('settings'), icon: Settings },
    { to: '/privacy', label: t('privacy'), icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/20 to-emerald-500/10 text-sky-400 border border-sky-500/30'
                    : item.highlight
                    ? 'text-emerald-400 hover:bg-slate-800/80 bg-emerald-950/20 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono uppercase">
                  Live
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Offline & Privacy Ready</p>
          <p className="text-slate-500 text-[10px]">
            Personal data stored on local instance. Encrypted transport layer.
          </p>
        </div>
      </div>
    </aside>
  );
};
