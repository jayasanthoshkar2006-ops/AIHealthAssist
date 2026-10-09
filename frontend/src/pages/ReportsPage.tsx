import React, { useState } from 'react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { FileText, Download, CheckCircle2, ShieldCheck } from 'lucide-react';

const API_BASE_URL = 'https://aihealthassist-backend.onrender.com/api/v1';

const includedSections = [
  'Patient profile and recorded measurements',
  'Medical records, vitals and test notes',
  'Workout history, exercise sessions and form scores',
  'Personal bests and exercise records',
  'Food logs and recorded nutrition values',
  'Sleep history and quality entries',
  'Medications, doses and reminders',
  'Appointments and visit notes',
  'Wellness journal and self-reported mood',
  'Habits, goals, streaks and achievements',
  'Schedules, daily plans and lifestyle preferences',
  'Record counts, data gaps and medical disclaimer',
];

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in again before downloading your report.');

      const response = await fetch(API_BASE_URL + '/reports/wellness/generate', {
        method: 'GET',
        headers: { Accept: 'application/pdf', Authorization: 'Bearer ' + token },
      });

      if (!response.ok) {
        let message = 'Unable to generate the PDF (HTTP ' + response.status + ').';
        try {
          const errorData = await response.json();
          if (errorData?.detail) message = errorData.detail;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      if (!blob.size || (blob.type && !blob.type.includes('application/pdf'))) {
        throw new Error('The server did not return a valid PDF file.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'HealthAssist_Complete_Health_Report_' + new Date().toISOString().slice(0, 10) + '.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate the health report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 max-w-4xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
            <FileText className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-100">Complete Personal Health Report</h2>
            <p className="text-sm text-slate-400 mt-1">A multi-page PDF compiled from the signed-in account's cloud records.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-900/70 bg-sky-950/30 p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Private and account-specific</p>
            <p className="mt-1">The report is generated when you request it and includes records belonging to your authenticated account. It does not use sample statistics. Missing values are marked as not recorded.</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-b border-slate-800 py-5">
          <p className="font-bold text-slate-100">Report contents</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
            {includedSections.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs leading-5 text-slate-400">
          <p><strong className="text-slate-300">Before sharing:</strong> the PDF may contain sensitive health details and journal notes. Store and share it carefully.</p>
          <p className="mt-2">This report organizes recorded information for personal reference and discussion with a healthcare professional. It is not a diagnosis, prescription, or substitute for medical care. AI-generated observations are informational and are not independently clinically verified.</p>
        </div>

        <button onClick={handleDownloadPDF} disabled={downloading} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-sm shadow-glow flex items-center gap-2 disabled:opacity-50">
          <Download className="w-4 h-4" />
          {downloading ? 'Compiling your health report…' : 'Download Complete Health Report PDF'}
        </button>
      </div>
    </div>
  );
};
