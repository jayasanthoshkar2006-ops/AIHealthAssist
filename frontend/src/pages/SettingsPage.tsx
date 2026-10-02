import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Settings, Lock, Download, Trash2, Globe, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { language, setLanguagePreference, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/pin/set', {
        method: 'POST',
        body: JSON.stringify({ pin_code: pin })
      });
      setMsg('App Lock PIN configured successfully!');
      setPin('');
    } catch (err: any) {
      alert(err.message || 'Failed to set PIN');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      setMsg('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      alert(err.message || 'Password update failed');
    }
  };

  const handleExport = async () => {
    try {
      const data = await apiRequest('/auth/export-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'personal_healthassist_export.json';
      a.click();
    } catch (err: any) {
      alert('Export failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account and all stored health data?')) {
      try {
        await apiRequest('/auth/delete-account', { method: 'DELETE' });
        logout();
      } catch (err: any) {
        alert('Account deletion failed');
      }
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" /> Account Settings & Controls
        </h2>
        <p className="text-xs text-slate-400">Security, PIN lock, data export, language preferences & account controls</p>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Lock PIN */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" /> Setup App Lock PIN
          </h3>

          <form onSubmit={handleSetPin} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">4-6 Digit Security PIN</label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700"
            >
              Set PIN Code
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Change Password</h3>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Data Ownership & Account Controls */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Data Ownership & Privacy Export</h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500 font-bold text-xs text-sky-400 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export All Personal Data (JSON)
            </button>

            <button
              onClick={handleDeleteAccount}
              className="flex-1 px-4 py-3 rounded-2xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 font-bold text-xs text-red-400 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Account & Records Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
