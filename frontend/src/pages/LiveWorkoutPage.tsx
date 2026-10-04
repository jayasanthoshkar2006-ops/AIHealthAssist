import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Video, Play, Square, Volume2, Sparkles, AlertTriangle, RotateCcw } from 'lucide-react';

type Landmark = NormalizedLandmark;

type ExerciseConfig = {
  name: string;
  category: string;
  muscles: string;
  minAngle: number;
  maxAngle: number;
  downText: string;
  upText: string;
  targetByLevel: Record<string, number>;
};

const EXERCISES: ExerciseConfig[] = [
  { name: 'Squat', category: 'Lower Body', muscles: 'Quads • Glutes', minAngle: 80, maxAngle: 165, downText: 'Lower into the squat', upText: 'Stand tall', targetByLevel: { Beginner: 8, Intermediate: 12, Advanced: 15 } },
  { name: 'Reverse Lunge', category: 'Lower Body', muscles: 'Quads • Glutes', minAngle: 80, maxAngle: 165, downText: 'Lower with control', upText: 'Drive back up', targetByLevel: { Beginner: 6, Intermediate: 10, Advanced: 12 } },
  { name: 'Side Lunge', category: 'Lower Body', muscles: 'Glutes • Adductors', minAngle: 75, maxAngle: 165, downText: 'Sit into the side', upText: 'Push back to center', targetByLevel: { Beginner: 6, Intermediate: 10, Advanced: 12 } },
  { name: 'Glute Bridge', category: 'Lower Body', muscles: 'Glutes • Hamstrings', minAngle: 125, maxAngle: 175, downText: 'Lower your hips', upText: 'Squeeze and lift', targetByLevel: { Beginner: 10, Intermediate: 15, Advanced: 20 } },
  { name: 'Calf Raise', category: 'Lower Body', muscles: 'Calves', minAngle: 145, maxAngle: 175, downText: 'Lower your heels', upText: 'Rise onto your toes', targetByLevel: { Beginner: 10, Intermediate: 15, Advanced: 20 } },
  { name: 'Push-up', category: 'Upper Body', muscles: 'Chest • Triceps', minAngle: 70, maxAngle: 165, downText: 'Lower your chest', upText: 'Push the floor away', targetByLevel: { Beginner: 5, Intermediate: 10, Advanced: 15 } },
  { name: 'Bicep Curl', category: 'Upper Body', muscles: 'Biceps', minAngle: 45, maxAngle: 155, downText: 'Curl the weight', upText: 'Lower with control', targetByLevel: { Beginner: 8, Intermediate: 12, Advanced: 15 } },
  { name: 'Shoulder Press', category: 'Upper Body', muscles: 'Shoulders • Triceps', minAngle: 55, maxAngle: 165, downText: 'Press upward', upText: 'Lower under control', targetByLevel: { Beginner: 6, Intermediate: 10, Advanced: 12 } },
  { name: 'Lateral Raise', category: 'Upper Body', muscles: 'Shoulders', minAngle: 50, maxAngle: 105, downText: 'Raise your arms', upText: 'Lower slowly', targetByLevel: { Beginner: 8, Intermediate: 12, Advanced: 15 } },
  { name: 'Mountain Climber', category: 'Full Body', muscles: 'Core • Legs', minAngle: 55, maxAngle: 120, downText: 'Drive the knee in', upText: 'Extend the leg', targetByLevel: { Beginner: 10, Intermediate: 20, Advanced: 30 } },
  { name: 'Jumping Jack', category: 'Full Body', muscles: 'Full Body', minAngle: 35, maxAngle: 165, downText: 'Jump feet together', upText: 'Jump feet apart', targetByLevel: { Beginner: 10, Intermediate: 20, Advanced: 30 } },
  { name: 'Plank', category: 'Core', muscles: 'Core • Shoulders', minAngle: 155, maxAngle: 180, downText: 'Keep a straight line', upText: 'Hold steady', targetByLevel: { Beginner: 20, Intermediate: 30, Advanced: 45 } },
  { name: 'Leg Raise', category: 'Core', muscles: 'Lower Abs • Hip Flexors', minAngle: 25, maxAngle: 100, downText: 'Raise your legs', upText: 'Lower slowly', targetByLevel: { Beginner: 6, Intermediate: 10, Advanced: 15 } },
  { name: 'Side Plank', category: 'Core', muscles: 'Obliques • Core', minAngle: 155, maxAngle: 180, downText: 'Keep your body aligned', upText: 'Hold the position', targetByLevel: { Beginner: 15, Intermediate: 25, Advanced: 40 } },
];

const PROFESSION_PLANS: Record<string, string[]> = {
  'software developer': ['Shoulder Press', 'Lateral Raise', 'Squat', 'Glute Bridge', 'Plank', 'Side Plank'],
  'software engineer': ['Shoulder Press', 'Lateral Raise', 'Squat', 'Glute Bridge', 'Plank', 'Side Plank'],
  'it professional': ['Shoulder Press', 'Lateral Raise', 'Squat', 'Glute Bridge', 'Plank', 'Side Plank'],
  'office employee': ['Squat', 'Glute Bridge', 'Push-up', 'Lateral Raise', 'Plank', 'Reverse Lunge'],
  'student': ['Squat', 'Push-up', 'Reverse Lunge', 'Glute Bridge', 'Mountain Climber', 'Plank'],
  'college student': ['Squat', 'Push-up', 'Reverse Lunge', 'Glute Bridge', 'Mountain Climber', 'Plank'],
  'teacher': ['Squat', 'Reverse Lunge', 'Calf Raise', 'Shoulder Press', 'Glute Bridge', 'Plank'],
  'driver': ['Glute Bridge', 'Squat', 'Reverse Lunge', 'Lateral Raise', 'Side Plank', 'Calf Raise'],
  'athlete': ['Squat', 'Reverse Lunge', 'Push-up', 'Mountain Climber', 'Jumping Jack', 'Plank'],
  'sports player': ['Squat', 'Reverse Lunge', 'Push-up', 'Mountain Climber', 'Jumping Jack', 'Plank'],
  'manual worker': ['Glute Bridge', 'Squat', 'Calf Raise', 'Side Plank', 'Shoulder Press', 'Reverse Lunge'],
};

const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (!mag) return 180;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI;
}

function avgVisibility(points: Landmark[], ids: number[]) {
  return ids.reduce((sum, id) => sum + (points[id]?.visibility ?? 0), 0) / ids.length;
}

function exerciseMeasurement(name: string, p: Landmark[]) {
  // MediaPipe Pose indices: shoulders 11/12, elbows 13/14, wrists 15/16,
  // hips 23/24, knees 25/26, ankles 27/28, feet 31/32.
  const left = () => ({
    squat: angle(p[23], p[25], p[27]),
    arm: angle(p[11], p[13], p[15]),
    shoulder: angle(p[13], p[11], p[23]),
    hip: angle(p[11], p[23], p[25]),
    knee: angle(p[23], p[25], p[27]),
  });
  const right = () => ({
    squat: angle(p[24], p[26], p[28]),
    arm: angle(p[12], p[14], p[16]),
    shoulder: angle(p[14], p[12], p[24]),
    hip: angle(p[12], p[24], p[26]),
    knee: angle(p[24], p[26], p[28]),
  });
  const l = left(), r = right();
  const both = (a: number, b: number) => (a + b) / 2;

  switch (name) {
    case 'Squat': return both(l.squat, r.squat);
    case 'Reverse Lunge': return Math.min(l.knee, r.knee);
    case 'Side Lunge': return Math.min(l.squat, r.squat);
    case 'Glute Bridge': return both(l.hip, r.hip);
    case 'Calf Raise': return both(l.knee, r.knee);
    case 'Push-up': return both(l.arm, r.arm);
    case 'Bicep Curl': return both(l.arm, r.arm);
    case 'Shoulder Press': return both(l.arm, r.arm);
    case 'Lateral Raise': return both(l.shoulder, r.shoulder);
    case 'Plank': return both(l.hip, r.hip);
    case 'Side Plank': return both(l.hip, r.hip);
    case 'Leg Raise': return both(l.hip, r.hip);
    case 'Mountain Climber': return Math.min(l.hip, r.hip);
    case 'Jumping Jack': return both(l.shoulder, r.shoulder);
    default: return both(l.squat, r.squat);
  }
}

function formFeedback(name: string, p: Landmark[], measurement: number) {
  const visibility = avgVisibility(p, [11, 12, 23, 24, 25, 26, 27, 28]);
  if (visibility < 0.55) return { score: 0, feedback: 'Move back so your shoulders, hips, knees and ankles are visible.' };
  let score = 90;
  let feedback = 'Good control. Keep the movement steady.';
  if (name === 'Squat' || name === 'Reverse Lunge' || name === 'Side Lunge') {
    const torso = angle(p[11], p[23], p[25]);
    if (torso < 55) { score -= 15; feedback = 'Keep your chest more upright.'; }
    else if (measurement < 75) { score -= 8; feedback = 'Use a comfortable depth and keep your knees controlled.'; }
  } else if (name === 'Push-up') {
    const line = angle(p[11], p[23], p[27]);
    if (line < 155) { score -= 18; feedback = 'Keep your hips aligned with your shoulders and ankles.'; }
    else if (measurement > 155) feedback = 'Lower your chest with control.';
  } else if (name === 'Plank' || name === 'Side Plank') {
    if (measurement < 155) { score -= 18; feedback = 'Keep your body in a straighter line.'; }
  } else if (name === 'Bicep Curl') {
    if (measurement > 150) feedback = 'Keep your elbow stable and curl through the full range.';
  }
  return { score: Math.max(0, Math.min(100, score)), feedback };
}

function exerciseState(name: string, measurement: number, previous: string) {
  const cfg = EXERCISES.find(e => e.name === name)!;
  if (name === 'Plank' || name === 'Side Plank') return measurement >= cfg.minAngle ? 'hold' : 'reset';
  const mid = (cfg.minAngle + cfg.maxAngle) / 2;
  if (measurement <= cfg.minAngle + 8) return 'down';
  if (measurement >= cfg.maxAngle - 8) return 'up';
  return previous;
}

function targetFor(profile: any, exercise: ExerciseConfig) {
  const level = profile?.fitness_level || 'Intermediate';
  return exercise.targetByLevel[level] || exercise.targetByLevel.Intermediate;
}

function professionExercises(profession: string) {
  const key = (profession || '').toLowerCase().trim();
  const names = Object.entries(PROFESSION_PLANS).find(([k]) => key.includes(k))?.[1]
    || ['Squat', 'Push-up', 'Reverse Lunge', 'Glute Bridge', 'Plank'];
  return names.map(name => EXERCISES.find(e => e.name === name)!).filter(Boolean);
}

export const LiveWorkoutPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef('up');
  const repRef = useRef(0);
  const lastSpokenRef = useRef('');
  const lastFrameRef = useRef(-1);

  const [profile, setProfile] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState('Squat');
  const [isTraining, setIsTraining] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [targetReps, setTargetReps] = useState(12);
  const [formScore, setFormScore] = useState(0);
  const [feedback, setFeedback] = useState('Start the camera and stand fully inside the frame.');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [modelLoading, setModelLoading] = useState(false);
  const [suggested, setSuggested] = useState<ExerciseConfig[]>([]);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const exercise = EXERCISES.find(e => e.name === selectedExercise) || EXERCISES[0];

  const speakFeedback = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window) || text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    window.speechSynthesis.speak(u);
  }, [voiceEnabled]);

  useEffect(() => {
    apiRequest<any>('/dashboard')
      .then(data => {
        const p = data?.profile || data;
        setProfile(p);
        const list = professionExercises(p?.profession);
        setSuggested(list);
        if (list[0]) setSelectedExercise(list[0].name);
        setTargetReps(targetFor(p, list[0] || EXERCISES[0]));
      })
      .catch(() => {
        const list = professionExercises('');
        setSuggested(list);
      });
  }, []);

  useEffect(() => {
    setTargetReps(targetFor(profile, exercise));
  }, [profile, selectedExercise]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isTraining) return;
    const timer = window.setInterval(() => setSessionSeconds(s => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isTraining]);

  const drawPose = useCallback((points: Landmark[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width = video.videoWidth || 640;
    const h = canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, w, h);
    const connections = [
      [11,12],[11,13],[13,15],[12,14],[14,16],
      [11,23],[12,24],[23,24],[23,25],[25,27],
      [24,26],[26,28],[27,31],[28,32]
    ];
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    for (const [a,b] of connections) {
      if (!points[a] || !points[b]) continue;
      ctx.beginPath(); ctx.moveTo(points[a].x*w, points[a].y*h); ctx.lineTo(points[b].x*w, points[b].y*h); ctx.stroke();
    }
    ctx.fillStyle = '#34d399';
    points.forEach(pt => {
      if ((pt.visibility ?? 0) < 0.45) return;
      ctx.beginPath(); ctx.arc(pt.x*w, pt.y*h, 5, 0, Math.PI*2); ctx.fill();
    });
  }, []);

  const processFrame = useCallback(() => {
    if (!isTraining || !poseRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    const timestamp = performance.now();
    if (Math.floor(timestamp / 1000) !== lastFrameRef.current) {
      lastFrameRef.current = Math.floor(timestamp / 1000);
      const result = poseRef.current.detectForVideo(video, timestamp);
      const points = result.landmarks?.[0];
      if (points) {
        drawPose(points);
        const measurement = exerciseMeasurement(selectedExercise, points);
        const form = formFeedback(selectedExercise, points, measurement);
        setFormScore(Math.round(form.score));
        setFeedback(form.feedback);
        const nextStage = exerciseState(selectedExercise, measurement, stageRef.current);
        if (nextStage === 'down' && stageRef.current === 'up') {
          stageRef.current = 'down';
        } else if (nextStage === 'up' && stageRef.current === 'down') {
          stageRef.current = 'up';
          repRef.current += 1;
          setRepCount(repRef.current);
          speakFeedback(form.feedback || `Rep ${repRef.current} complete`);
        }
      }
    }
    rafRef.current = requestAnimationFrame(processFrame);
  }, [drawPose, exercise, isTraining, selectedExercise, speakFeedback]);

  const startCamera = async () => {
    setCameraError('');
    setModelLoading(true);
    try {
      if (!poseRef.current) {
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
        try {
          poseRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch (gpuError) {
          console.warn('MediaPipe GPU initialization failed; retrying with CPU.', gpuError);
          poseRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not available in this browser or page context.');
      }
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      if (!videoRef.current) throw new Error('Camera view is unavailable.');
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play();
      repRef.current = 0;
      stageRef.current = 'up';
      lastSpokenRef.current = '';
      setRepCount(0);
      setFormScore(0);
      setSessionSeconds(0);
      setIsTraining(true);
      speakFeedback(`Starting real AI ${selectedExercise} coaching. ${targetReps} reps target.`);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message.toLowerCase() : '';
      if (message.includes('permission') || message.includes('notallowed') || message.includes('denied')) {
        setCameraError('Camera permission was blocked. Allow camera access for this site, then click Start Real Session again.');
      } else if (message.includes('network') || message.includes('fetch') || message.includes('load') || message.includes('wasm') || message.includes('model')) {
        setCameraError('The AI pose model could not be downloaded. Check your internet connection, refresh the page, and try again.');
      } else {
        setCameraError('Live AI could not start. Check camera permission and internet access, then try again.');
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    } finally {
      setModelLoading(false);
    }
  };

  useEffect(() => {
    if (isTraining) {
      rafRef.current = requestAnimationFrame(processFrame);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [isTraining, processFrame]);

  const stopCamera = async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsTraining(false);
    if (videoRef.current) videoRef.current.srcObject = null;
    if (repRef.current === 0) {
      speakFeedback('Session ended. No completed repetitions were detected.');
      return;
    }
    try {
      await apiRequest('/workouts', {
        method: 'POST',
        body: JSON.stringify({
          title: `Live AI ${selectedExercise} Session`,
          target_muscle: exercise.muscles,
          duration_minutes: Math.max(1, Math.round(sessionSeconds / 60)),
          total_reps: repRef.current,
          avg_form_score: formScore,
          sessions: [{
            exercise_name: selectedExercise,
            sets_completed: 1,
            target_reps: targetReps,
            actual_reps: repRef.current,
            form_accuracy: formScore,
            feedback_notes: feedback
          }]
        })
      });
      speakFeedback(`Workout completed. ${repRef.current} real repetitions recorded.`);
    } catch (err) {
      console.error(err);
      setCameraError('The workout was detected but could not be saved. Please try again.');
    }
  };

  const resetSession = () => {
    repRef.current = 0;
    stageRef.current = 'up';
    setRepCount(0);
    setFormScore(0);
    setFeedback('Session reset. Stand fully inside the camera frame.');
    lastSpokenRef.current = '';
  };

  const minutes = Math.floor(sessionSeconds / 60);
  const seconds = sessionSeconds % 60;

  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Video className="w-5 h-5 text-sky-400" /> Real AI Live Workout Coach
            </h2>
            <p className="text-xs text-slate-400">
              Real camera pose landmarks • real-time reps • exercise-specific form feedback
            </p>
            {profile?.profession && (
              <p className="text-xs text-emerald-400 mt-2">
                Profession plan: <strong>{profile.profession}</strong> • Fitness: {profile.fitness_level || 'Intermediate'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedExercise}
              onChange={e => { setSelectedExercise(e.target.value); resetSession(); }}
              disabled={isTraining}
              className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-sky-400"
            >
              {suggested.length > 0 && <optgroup label="Recommended for your profession">{suggested.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}</optgroup>}
              <optgroup label="All supported exercises">{EXERCISES.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}</optgroup>
            </select>
            <button onClick={() => setVoiceEnabled(v => !v)} className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${voiceEnabled ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
              <Volume2 className="w-4 h-4" /> Voice
            </button>
            {!isTraining ? (
              <button onClick={startCamera} disabled={modelLoading} className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs flex items-center gap-2 disabled:opacity-50">
                <Play className="w-4 h-4 fill-current" /> {modelLoading ? 'Loading AI Model…' : 'Start Real Session'}
              </button>
            ) : (
              <button onClick={stopCamera} className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 font-bold text-white text-xs flex items-center gap-2">
                <Square className="w-4 h-4 fill-current" /> End & Save
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          {!isTraining && (
            <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Video className="w-12 h-12 text-sky-400 stroke-1" />
              <p className="font-semibold text-sm text-slate-200">Camera View Standby</p>
              <p className="text-xs text-slate-400 max-w-md">Start a session to run real MediaPipe pose detection. Your browser needs internet for the first AI model download.</p>
            </div>
          )}
          {cameraError && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 border border-red-500/30 p-3 rounded-xl text-xs text-red-200 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {cameraError}
            </div>
          )}
          {isTraining && (
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> REAL AI • {selectedExercise.toUpperCase()}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Live Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Real Reps</p>
                <p className="text-3xl font-extrabold text-sky-400 mt-1">{repCount} / {targetReps}</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400">Form Score</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{formScore ? `${formScore}%` : '—'}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/20 space-y-1">
              <p className="text-xs font-semibold text-sky-300">Live AI Feedback</p>
              <p className="text-xs text-sky-100 font-medium leading-relaxed">{feedback}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><span className="text-slate-500">Session</span><strong className="block text-slate-200 mt-1">{minutes}:{String(seconds).padStart(2, '0')}</strong></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><span className="text-slate-500">Category</span><strong className="block text-slate-200 mt-1">{exercise.category}</strong></div>
            </div>
            <button onClick={resetSession} disabled={isTraining} className="w-full px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Session
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-emerald-400" /><h3 className="font-bold text-xs text-slate-200">Profession Workout</h3></div>
            <div className="space-y-2">
              {suggested.slice(0, 6).map((e, i) => (
                <button key={e.name} disabled={isTraining} onClick={() => { setSelectedExercise(e.name); resetSession(); }} className={`w-full text-left px-3 py-2 rounded-xl border text-xs ${selectedExercise === e.name ? 'border-sky-500/50 bg-sky-500/10 text-sky-300' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                  <strong>{i + 1}. {e.name}</strong><span className="block text-[10px] text-slate-500 mt-0.5">{e.category} • {e.muscles}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
