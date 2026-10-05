import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Settings, Lock, Download, Upload, Trash2 } from 'lucide-react';
import { clearLocalAccountData, exportLocalData, importLocalData, getLocalStorageEstimate } from '../storage/localDb';

export const SettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [localStorageInfo, setLocalStorageInfo] = useState('Local IndexedDB storage is active.');
  const [appLockEnabled, setAppLockEnabled] = useState(
    localStorage.getItem('appLockEnabled') === 'true'
  );

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/pin/set', {
        method: 'POST',
        body: JSON.stringify({ pin_code: pin })
      });
      localStorage.setItem('appLockEnabled', 'true');
      setAppLockEnabled(true);
      setMsg('App Lock enabled. The app will require your PIN when reopened.');
      setPin('');
    } catch (err: any) {
      alert(err.message || 'Failed to set PIN');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportLocalData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'personal_healthassist_export.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg('All locally stored application data was exported.');
    } catch (err: any) {
      alert(err.message || 'Local export failed');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const count = await importLocalData(payload);
      setMsg(count + ' local data records imported. Refresh the page to use restored data.');
    } catch (err: any) {
      alert(err.message || 'Import failed. Please select a valid HealthAssist backup.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account and all stored health data?')) {
      try {
        await apiRequest('/auth/delete-account', { method: 'DELETE' });
        await clearLocalAccountData();
        logout();
      } catch (err: any) {
        alert('Account deletion failed');
      }
    }
  };

  React.useEffect(() => {
    getLocalStorageEstimate().then(({ usage, quota }) => {
      if (usage && quota) {
        const usedMb = (usage / 1024 / 1024).toFixed(1);
        const quotaMb = (quota / 1024 / 1024).toFixed(0);
        setLocalStorageInfo('Local IndexedDB storage: ' + usedMb + ' MB used of about ' + quotaMb + ' MB available.');
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" /> Account Settings & Controls
        </h2>
        <p className="text-xs text-slate-400">Security, PIN lock, local data storage, backup & account controls</p>
        <p className="text-[11px] text-emerald-400">✓ {localStorageInfo}</p>
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

          <div className="flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-4 py-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">App Lock Status</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {appLockEnabled ? 'Enabled — PIN required when the app is reopened.' : 'Disabled'}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${appLockEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              {appLockEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

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
              {appLockEnabled ? 'Change PIN & Keep Lock Enabled' : 'Set PIN & Enable App Lock'}
            </button>
          </form>
          {appLockEnabled && (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('appLockEnabled');
                setAppLockEnabled(false);
                setMsg('App Lock disabled.');
              }}
              className="w-full py-2 rounded-xl bg-red-950/30 hover:bg-red-950/50 text-red-400 font-semibold text-xs border border-red-500/20"
            >
              Disable App Lock
            </button>
          )}
        </div>

        {/* Data Ownership & Account Controls */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Data Ownership & Privacy Export</h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500 font-bold text-xs text-sky-400 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export All Local Personal Data (JSON)
            </button>

            <label className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500 font-bold text-xs text-emerald-400 flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" /> Import Local Backup
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>

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
