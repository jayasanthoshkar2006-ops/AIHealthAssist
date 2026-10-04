import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { useTranslation } from 'react-i18next';
import { Globe, Lock, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

export const Navbar: React.FC = () => {
  const { userEmail, language, setLanguagePreference, logout, lockApp } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
          <Sparkles className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            {t('appName')}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {t('tagline')}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button
          onClick={() => setLanguagePreference(language === 'en' ? 'ta' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-sky-400 transition-all"
          title="Switch Language"
        >
          <Globe className="w-4 h-4" />
          <span className="font-semibold">{language === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
        </button>

        {/* Lock PIN button */}
        <button
          onClick={lockApp}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          title="Lock App"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
          <div className="w-8 h-8 rounded-full bg-sky-900/60 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
