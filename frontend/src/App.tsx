import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchedulePage } from './pages/SchedulePage';
import { WorkoutPage } from './pages/WorkoutPage';
import { LiveWorkoutPage } from './pages/LiveWorkoutPage';
import { NutritionPage } from './pages/NutritionPage';
import { SleepPage } from './pages/SleepPage';
import { JournalPage } from './pages/JournalPage';
import { GoalsPage } from './pages/GoalsPage';
import { RemindersPage } from './pages/RemindersPage';
import { HealthRecordsPage } from './pages/HealthRecordsPage';
import { AssistantPage } from './pages/AssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotificationScheduler } from './components/common/NotificationScheduler';

const ProtectedLayout: React.FC = () => {
  const { token, hasProfile, isLocked, unlockApp } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!hasProfile && window.location.hash !== '#/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <h2 className="font-extrabold text-lg text-slate-100">App Locked</h2>
          <p className="text-xs text-slate-400">Enter PIN code to unlock HealthAssist AI</p>
          <input
            id="app-lock-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter PIN"
            maxLength={6}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-bold text-lg text-slate-100 focus:outline-none"
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                const input = e.currentTarget;
                try {
                  const result = await fetch('https://aihealthassist-backend.onrender.com/api/v1/auth/pin/verify', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ pin_code: input.value }),
                  });
                  const data = await result.json();
                  if (result.ok && data.valid) {
                    unlockApp();
                  } else {
                    input.value = '';
                    input.focus();
                    alert('Incorrect PIN');
                  }
                } catch {
                  alert('Unable to verify PIN. Please try again.');
                }
              }
            }}
          />
          <button
            onClick={async () => {
              const input = document.getElementById('app-lock-pin') as HTMLInputElement | null;
              const pinValue = input?.value || '';
              if (!/^\d{4,6}$/.test(pinValue)) {
                alert('Enter your 4-6 digit PIN');
                input?.focus();
                return;
              }
              try {
                const result = await fetch('https://aihealthassist-backend.onrender.com/api/v1/auth/pin/verify', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ pin_code: pinValue }),
                });
                const data = await result.json();
                if (result.ok && data.valid) {
                  unlockApp();
                } else {
                  if (input) input.value = '';
                  input?.focus();
                  alert('Incorrect PIN');
                }
              } catch {
                alert('Unable to verify PIN. Please try again.');
              }
            }
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow"
          >
            Unlock Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationScheduler />
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/workout/live" element={<LiveWorkoutPage />} />
            <Route path="/food" element={<NutritionPage />} />
            <Route path="/sleep" element={<SleepPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/medications" element={<RemindersPage />} />
            <Route path="/health-records" element={<HealthRecordsPage />} />
            <Route path="/ai-assistant" element={<AssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};
