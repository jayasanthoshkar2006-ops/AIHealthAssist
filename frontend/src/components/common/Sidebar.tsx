import React from 'react';
import { NavLink } from 'react-router-dom';
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
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { to: '/schedule', label: "Today's Plan", icon: Calendar },
    { to: '/workout', label: 'AI Workout', icon: Dumbbell },
    { to: '/workout/live', label: 'Live Pose Coach', icon: Video, highlight: true },
    { to: '/journal', label: 'Wellness Journal', icon: BookOpen },
    { to: '/medications', label: 'Medications & Appointments', icon: Pill },
    { to: '/health-records', label: 'Health Records', icon: FileText },
    { to: '/reports', label: 'Wellness Reports', icon: PieChart },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
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
                }`}
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
          <p className="font-semibold text-slate-300">Cloud Data & Privacy</p>
          <p className="text-slate-500 text-[10px]">
            Personal data is protected by authenticated server access and encrypted transport.
          </p>
        </div>
      </div>
    </aside>
  );
};
