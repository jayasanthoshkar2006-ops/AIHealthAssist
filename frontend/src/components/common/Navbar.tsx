import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { Lock, LogOut, Sparkles } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { userEmail, logout, lockApp } = useAuth();

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
          <Sparkles className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            HealthAssist AI
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            AI Personal Health & Lifestyle Assistant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={lockApp}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          title="Lock App"
          aria-label="Lock App"
        >
          <Lock className="w-4 h-4" />
        </button>

        <NotificationCenter />

        <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
          <div className="w-8 h-8 rounded-full bg-sky-900/60 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
