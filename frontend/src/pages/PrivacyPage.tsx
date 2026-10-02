import React from 'react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { ShieldCheck, Lock, HardDrive, EyeOff } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-100">Privacy Policy & Offline Architecture</h2>
            <p className="text-xs text-slate-400">Data ownership, privacy controls, and local-first execution model</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 border-t border-slate-800 pt-6 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" /> 1. Offline-First Architecture
            </h3>
            <p className="text-slate-400">
              HealthAssist AI is engineered with an offline-first architecture. Essential features including schedule timeline viewing, exercise logging, sleep tracking, journal entries, and local heuristic AI inference run locally on your system without requiring external internet connections.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" /> 2. Security & Credentials
            </h3>
            <p className="text-slate-400">
              All passwords are standardly salted and hashed using bcrypt. API keys and secret tokens are strictly secured inside backend environment variables (`.env`) and are never exposed to client-side code.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400" /> 3. Data Ownership & Deletion Rights
            </h3>
            <p className="text-slate-400">
              You retain 100% ownership over your personal data. You can export your full records in standard JSON format at any time or execute a permanent account deletion request that purges all database entities instantly.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-800 pt-4">
            <h3 className="font-bold text-sm text-slate-100">4. Medical & Regulatory Disclaimer</h3>
            <p className="text-slate-400">
              This application is designed as a college major project / personal wellness assistant. It provides lifestyle organization, fitness tracking, and heuristic educational suggestions. It is not a medical device, clinical diagnostic engine, or prescription tool.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
