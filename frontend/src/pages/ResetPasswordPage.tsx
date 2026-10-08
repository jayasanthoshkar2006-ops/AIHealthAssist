import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useMemo(() => {
    const query = window.location.hash.split('?')[1] || '';
    return new URLSearchParams(query).get('token') || '';
  }, []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMsg('This password reset link is invalid.');
      return;
    }
    if (password.length < 6) {
      setMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setMsg('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const result = await apiRequest<{ message: string }>('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password }),
      });
      setMsg(result.message);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err: any) {
      setMsg(err.message || 'Unable to reset your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <KeyRound className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="text-xl font-extrabold">Reset Password</h1>
        <p className="text-xs text-slate-400 mt-2">
          Create a new password for your HealthAssist AI account.
        </p>

        {!token ? (
          <div className="mt-6 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
            This reset link is missing or invalid.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
              <input
                type="password"
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold text-xs disabled:opacity-50"
            >
              {saving ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {msg && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            {msg}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Reset links expire after 60 minutes and can only be used once.
        </div>

        <Link to="/login" className="block text-center text-xs text-sky-400 hover:text-sky-300 mt-5">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};
