import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-sky-950/40 border border-sky-500/20 rounded-xl p-3 flex items-start gap-3 mb-6 text-xs text-sky-200">
      <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sky-300">Safety & Regulatory Disclaimer</p>
        <p className="text-sky-200/80 mt-0.5 leading-relaxed">
          Notice: HealthAssist AI provides wellness organization and tracking. It is not a substitute for professional medical advice or clinical assessment.
        </p>
      </div>
    </div>
  );
};
