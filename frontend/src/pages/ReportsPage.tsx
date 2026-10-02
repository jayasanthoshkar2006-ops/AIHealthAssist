import React, { useState } from 'react';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { FileText, Download, Sparkles, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/reports/wellness/generate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI_Personal_Wellness_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-glow">
            <FileText className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-100">AI Personal Wellness Report</h2>
            <p className="text-xs text-slate-400">Periodic comprehensive PDF summary & observation export</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 border-t border-b border-slate-800 py-4">
          <p className="font-bold text-slate-200">Included Sections:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Executive AI Observations
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Workout & Form Quality
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Nutrition & Macros Breakdown
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sleep Consistency Analysis
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Goal & Streak Milestones
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Regulatory Safety Disclaimer
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Compiling PDF Report...' : 'Download Full PDF Wellness Report'}
        </button>
      </div>
    </div>
  );
};
