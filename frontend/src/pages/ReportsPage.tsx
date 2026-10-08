import React, { useState } from 'react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { FileText, Download, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'https://aihealthassist-backend.onrender.com/api/v1';

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in again before downloading the report.');

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
      if (!blob.size || blob.type !== 'application/pdf') throw new Error('The server did not return a valid PDF file.');

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'AI_Personal_Wellness_Report_' + new Date().toISOString().slice(0, 10) + '.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate PDF report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
            <FileText className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-100">AI Personal Wellness Report</h2>
            <p className="text-xs text-slate-400">Workout-focused PDF summary and activity export</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 border-t border-b border-slate-800 py-4">
          <p className="font-bold text-slate-200">Included Sections:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {['Executive AI Observations', 'Workout & Form Quality', 'Activity Summary', 'Regulatory Safety Disclaimer'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {item}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleDownloadPDF} disabled={downloading} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center gap-2 disabled:opacity-50">
          <Download className="w-4 h-4" />
          {downloading ? 'Compiling PDF Report...' : 'Download Workout Report'}
        </button>
      </div>
    </div>
  );
};
