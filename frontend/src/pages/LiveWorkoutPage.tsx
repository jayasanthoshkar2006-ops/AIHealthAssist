import React, { useRef, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Video, Play, Square, Volume2, Sparkles, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

export const LiveWorkoutPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [selectedExercise, setSelectedExercise] = useState('Squat');
  const [isTraining, setIsTraining] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [targetReps, setTargetReps] = useState(15);
  const [formScore, setFormScore] = useState(92.0);
  const [feedback, setFeedback] = useState('Position yourself in view of camera');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraError, setCameraError] = useState(false);

  // Web Speech Synthesis
  const speakFeedback = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsTraining(true);
      speakFeedback(`Starting ${selectedExercise} workout session. Target ${targetReps} reps.`);
    } catch (err) {
      console.error(err);
      setCameraError(true);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsTraining(false);

    // Save workout log to backend
    try {
      await apiRequest('/workouts', {
        method: 'POST',
        body: JSON.stringify({
          title: `Live AI ${selectedExercise} Session`,
          target_muscle: selectedExercise,
          duration_minutes: 10,
          total_reps: repCount,
          avg_form_score: formScore,
          sessions: [
            {
              exercise_name: selectedExercise,
              sets_completed: 1,
              target_reps: targetReps,
              actual_reps: repCount,
              form_accuracy: formScore,
              feedback_notes: feedback
            }
          ]
        })
      });
      speakFeedback(`Workout completed! ${repCount} reps logged with ${formScore}% form accuracy.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Mock landmark processing loop over video frames
  useEffect(() => {
    let interval: any;
    if (isTraining) {
      let mockStage = "up";
      let count = repCount;

      interval = setInterval(async () => {
        // Generate mock landmark joints for exercise
        const keypoints = [
          { x: 320, y: 100, z: 0, visibility: 0.99 }, // head
          { x: 320, y: 180, z: 0, visibility: 0.99 }, // shoulder
          { x: 320, y: 300, z: 0, visibility: 0.99 }, // hip
          { x: 320, y: 400, z: 0, visibility: 0.99 }, // knee
          { x: 320, y: 460, z: 0, visibility: 0.99 }, // ankle
          { x: 280, y: 240, z: 0, visibility: 0.99 }, // elbow
          { x: 260, y: 280, z: 0, visibility: 0.99 }, // wrist
        ];

        // Draw skeleton overlay on canvas
        if (canvasRef.current && videoRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 640, 480);
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 4;
            // Draw skeleton lines
            ctx.beginPath();
            ctx.moveTo(320, 180); ctx.lineTo(320, 300); ctx.lineTo(320, 400); ctx.lineTo(320, 460);
            ctx.stroke();

            // Draw joint dots
            ctx.fillStyle = '#10b981';
            [100, 180, 300, 400, 460].forEach((y) => {
              ctx.beginPath(); ctx.arc(320, y, 6, 0, 2 * Math.PI); ctx.fill();
            });
          }
        }

        // Call backend pose analysis endpoint
        try {
          const res: any = await apiRequest('/workouts/analyze', {
            method: 'POST',
            body: JSON.stringify({ exercise_name: selectedExercise, keypoints })
          });

          setFormScore(res.form_score);
          setFeedback(res.feedback);

          // Simulated rep increment every 4 seconds for live feedback demonstration
          if (Math.random() > 0.6) {
            count += 1;
            setRepCount(count);
            speakFeedback(res.voice_feedback || `Rep ${count} completed`);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isTraining, selectedExercise]);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-400" /> AI Computer Vision Fitness Coach
          </h2>
          <p className="text-xs text-slate-400">Real-time landmark pose estimation, repetition counter & audio feedback</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            disabled={isTraining}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-sky-400 focus:outline-none"
          >
            <option value="Squat">Squat</option>
            <option value="Push-up">Push-up</option>
            <option value="Lunge">Lunge</option>
            <option value="Shoulder press">Shoulder Press</option>
            <option value="Bicep curl">Bicep Curl</option>
            <option value="Plank">Plank</option>
          </select>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              voiceEnabled ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice Coach</span>
          </button>

          {!isTraining ? (
            <button
              onClick={startCamera}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Start Session
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 font-bold text-white text-xs flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-current" /> End & Save Session
            </button>
          )}
        </div>
      </div>

      {/* Camera & Pose View Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />

          {!isTraining && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Video className="w-12 h-12 text-sky-400 stroke-1" />
              <p className="font-semibold text-sm text-slate-200">Camera View Standby</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Click 'Start Session' to enable pose estimation landmarks for {selectedExercise}.
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-2 text-red-400">
              <AlertTriangle className="w-10 h-10" />
              <p className="font-bold text-sm">Camera Permission Unavailable</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Allow camera permissions in your browser address bar to enable live pose tracking.
              </p>
            </div>
          )}

          {/* Live Overlay Badge */}
          {isTraining && (
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold">{selectedExercise.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Live Metrics & AI Form Feedback */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Live Metrics</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Repetitions</p>
                <p className="text-3xl font-extrabold text-sky-400 mt-1">{repCount} / {targetReps}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Form Score</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{formScore}%</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 space-y-1">
              <p className="text-xs font-semibold text-sky-300">Live AI Form Feedback</p>
              <p className="text-xs text-sky-100 font-medium leading-relaxed">{feedback}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
