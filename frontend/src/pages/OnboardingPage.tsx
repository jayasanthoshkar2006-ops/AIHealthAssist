import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { apiRequest } from '../api/client';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const { setHasProfile } = useAuth();
  const navigate = useNavigate();

  // Wizard State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    profession: '',
    wake_time: '06:30',
    sleep_time: '23:00',
    work_start: '09:00',
    work_end: '17:30',
    food_preference: 'Vegetarian',
    food_budget: 'Moderate',
    cooking_availability: 'Daily',
    eating_out_frequency: 'Rarely',
    available_foods: [] as string[],
    gym_available: false,
    home_workout: true,
    available_equipment: [] as string[],
    fitness_level: 'Beginner',
    stress_rating: 5,
    primary_goals: [] as string[],
  });

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNext = () => {
    // Validate Step 1 before continuing
    if (step === 1) {
      if (!formData.name.trim()) {
        alert('Please enter your name.');
        return;
      }

      if (!formData.age || Number(formData.age) <= 0) {
        alert('Please enter a valid age.');
        return;
      }

      if (!formData.gender) {
        alert('Please select your gender.');
        return;
      }

      if (!formData.height || Number(formData.height) <= 0) {
        alert('Please enter your height.');
        return;
      }

      if (!formData.weight || Number(formData.weight) <= 0) {
        alert('Please enter your weight.');
        return;
      }

      if (!formData.profession) {
        alert('Please select your profession.');
        return;
      }
    }

    setStep((s) => Math.min(s + 1, 5));
  };

  const handlePrev = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const onboardingData = {
        ...formData,
        preferred_language: 'en',
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
      };

      await apiRequest('/onboarding', {
        method: 'POST',
        body: JSON.stringify(onboardingData),
      });

      setHasProfile(true);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">

        {/* Header Progress */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="font-extrabold text-lg bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Personalized AI Setup
              </h2>

              <p className="text-xs text-slate-400">
                Step {step} of 5
              </p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-8 h-2 rounded-full transition-all ${
                  i <= step
                    ? 'bg-gradient-to-r from-sky-500 to-emerald-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Basic Info & Profession */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                1. Basic Profile & Profession
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                These details help the AI personalize your health and wellness plan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Name
                </label>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Santhosh"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Profession */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profession
                </label>

                <select
                  value={formData.profession}
                  onChange={(e) => updateField('profession', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select profession</option>
                  <option value="Software Developer">Software Developer</option>
                  <option value="Student">Student</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Engineer">Engineer</option>
                  <option value="Office Employee">Office Employee</option>
                  <option value="Driver">Driver</option>
                  <option value="Homemaker">Homemaker</option>
                  <option value="Fitness Professional">Fitness Professional</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Age
                </label>

                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gender
                </label>

                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Height (cm)
                </label>

                <input
                  type="number"
                  min="50"
                  max="250"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                  placeholder="e.g. 170"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Used for health analysis such as BMI.
                </p>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Weight (kg)
                </label>

                <input
                  type="number"
                  min="10"
                  max="500"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Used for health analysis and progress tracking.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: Routine */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              2. Daily Routine & Schedule
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Wake-up Time
                </label>

                <input
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) => updateField('wake_time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Sleep Time
                </label>

                <input
                  type="time"
                  value={formData.sleep_time}
                  onChange={(e) => updateField('sleep_time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work/Study Start
                </label>

                <input
                  type="time"
                  value={formData.work_start}
                  onChange={(e) => updateField('work_start', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work/Study End
                </label>

                <input
                  type="time"
                  value={formData.work_end}
                  onChange={(e) => updateField('work_end', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Food Environment */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              3. Food & Kitchen Environment
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dietary Preference
                </label>

                <select
                  value={formData.food_preference}
                  onChange={(e) => updateField('food_preference', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Food Budget Tier
                </label>

                <select
                  value={formData.food_budget}
                  onChange={(e) => updateField('food_budget', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Budget-Friendly">Budget-Friendly</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Exercise Environment */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              4. Workout & Exercise Resources
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gym"
                  checked={formData.gym_available}
                  onChange={(e) =>
                    updateField('gym_available', e.target.checked)
                  }
                  className="w-4 h-4 rounded text-sky-500"
                />

                <label htmlFor="gym" className="text-xs text-slate-300">
                  Commercial Gym Access Available
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="home"
                  checked={formData.home_workout}
                  onChange={(e) =>
                    updateField('home_workout', e.target.checked)
                  }
                  className="w-4 h-4 rounded text-sky-500"
                />

                <label htmlFor="home" className="text-xs text-slate-300">
                  Home Workout Area Available
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fitness Level
                </label>

                <select
                  value={formData.fitness_level}
                  onChange={(e) =>
                    updateField('fitness_level', e.target.value)
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Goals */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              5. Primary Goals
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                'weight management',
                'strength',
                'endurance',
                'general fitness',
                'sleep consistency',
                'habit building',
              ].map((goal) => {
                const isSelected = formData.primary_goals.includes(goal);

                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => {
                      const current = [...formData.primary_goals];

                      const updated = isSelected
                        ? current.filter((g) => g !== goal)
                        : [...current, goal];

                      updateField('primary_goals', updated);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {goal.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">

          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-semibold text-slate-950 text-xs shadow-glow flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-semibold text-slate-950 text-xs shadow-glow flex items-center gap-2 disabled:opacity-50"
            >
              {loading
                ? 'Building Plan...'
                : 'Complete & Generate AI Plan'}

              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
