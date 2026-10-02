import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Dumbbell, Video, TrendingUp, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export const WorkoutPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [exercise, setExercise] = useState('Squat');
  const [loadingPred, setLoadingPred] = useState(false);

  useEffect(() => {
    apiRequest('/workouts/history')
      .then((res: any) => setHistory(res))
      .catch((err) => console.error(err));
  }, []);

  const handlePredict = async () => {
    setLoadingPred(true);
    try {
      const res = await apiRequest(`/fitness/predict?exercise_name=${exercise}`, { method: 'POST' });
      setPrediction(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingPred(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-sky-400" /> Workout Analytics & Adaptive Engine
          </h2>
          <p className="text-xs text-slate-400">Historical sessions, predictive performance target models & adaptive progression</p>
        </div>

        <Link
          to="/workout/live"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center gap-2"
        >
          <Video className="w-4 h-4" /> Start Live Camera Session
        </Link>
      </div>

      {/* AI Performance Prediction Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">AI Performance Predictor</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
            >
              <option value="Squat">Squat</option>
              <option value="Push-up">Push-up</option>
              <option value="Bicep curl">Bicep Curl</option>
              <option value="Lunge">Lunge</option>
            </select>

            <button
              onClick={handlePredict}
              disabled={loadingPred}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPred ? 'animate-spin' : ''}`} />
              Generate Prediction
            </button>
          </div>
        </div>

        {prediction && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Target Exercise: <strong className="text-slate-200">{prediction.exercise_name}</strong></span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                {prediction.confidence_label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">Lower Confidence</p>
                <p className="text-lg font-bold text-slate-200">{prediction.confidence_lower} reps</p>
              </div>
              <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-500/30">
                <p className="text-[10px] text-sky-300 uppercase font-semibold">Suggested Target</p>
                <p className="text-xl font-extrabold text-sky-400">{prediction.suggested_target} reps</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">Upper Limit</p>
                <p className="text-lg font-bold text-slate-200">{prediction.confidence_upper} reps</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Notes:</strong> {prediction.notes}
            </p>
          </div>
        )}
      </div>

      {/* Workout History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-100">Workout History</h3>

        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">{item.title}</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">{item.date} • Muscle: {item.target_muscle}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-extrabold text-sky-400">{item.total_reps} reps</p>
                  <p className="text-emerald-400 font-semibold">{item.avg_form_score}% Form</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              No historical workouts logged yet. Complete a live camera session to record your first set!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
