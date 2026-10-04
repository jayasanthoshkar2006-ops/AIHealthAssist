import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Utensils, Camera, Upload, CheckCircle2, Sparkles, Plus } from 'lucide-react';

export const NutritionPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [foodAnalysis, setFoodAnalysis] = useState<any>(null);
  
  // Correction Form
  const [mealType, setMealType] = useState('Lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState(450);
  const [protein, setProtein] = useState(18);
  const [carbs, setCarbs] = useState(65);
  const [fat, setFat] = useState(12);

  const fetchSummary = () => {
    apiRequest('/nutrition/summary')
      .then((res) => setSummary(res))
      .catch((err) => console.error(err));

    apiRequest('/nutrition/suggestions')
      .then((res) => setSuggestions(res))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSimulateImageUpload = async () => {
    setAnalyzing(true);
    try {
      const res: any = await apiRequest('/nutrition/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ image_base64: 'sample_base64_string', meal_type: mealType })
      });
      setFoodAnalysis(res);
      setFoodName(res.food_name);
      setCalories(res.calories);
      setProtein(res.protein_g);
      setCarbs(res.carbs_g);
      setFat(res.fat_g);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_type: mealType,
          food_name: foodName || 'South Indian Thali',
          portion: '1 serving',
          calories: Number(calories),
          protein_g: Number(protein),
          carbs_g: Number(carbs),
          fat_g: Number(fat),
          is_ai_estimated: foodAnalysis ? true : false
        })
      });
      fetchSummary();
      setFoodAnalysis(null);
      setFoodName('');
    } catch (err: any) {
      alert(err.message || 'Failed to log meal');
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
        <h2 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-400" /> AI Food Vision & Macro Nutrition Tracker
        </h2>
        <p className="text-xs text-slate-400">
          Upload meal photos for visual nutrition estimation with manual correction & personalized pantry suggestions
        </p>
      </div>

      {/* Daily Macro Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400">Total Calories</p>
          <p className="text-2xl font-extrabold text-slate-100 mt-1">{summary?.total_calories || 0} / {summary?.calorie_target || '—'} kcal</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400">Protein</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{summary?.total_protein_g || 0}g</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400">Carbohydrates</p>
          <p className="text-2xl font-extrabold text-sky-400 mt-1">{summary?.total_carbs_g || 0}g</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <p className="text-xs text-slate-400">Fats</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{summary?.total_fat_g || 0}g</p>
        </div>
      </div>

      {/* Main Grid: AI Camera Analyzer + Log Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Food Camera Analyzer Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100">AI Food Image Analyzer</h3>
          </div>

          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-950">
            <Upload className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              Capture or upload food photo to trigger visual AI identification
            </p>
            <button
              onClick={handleSimulateImageUpload}
              disabled={analyzing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow"
            >
              {analyzing ? 'Analyzing Image...' : 'Analyze Sample Food Photo'}
            </button>
          </div>

          {foodAnalysis && (
            <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-300">{foodAnalysis.food_name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{foodAnalysis.confidence_percentage}% AI Confidence</span>
              </div>
              <p className="text-slate-400">Est. Serving: {foodAnalysis.estimated_serving}</p>
              <p className="text-[10px] text-slate-500 italic">{foodAnalysis.disclaimer}</p>
            </div>
          )}
        </div>

        {/* Meal Logging & Manual Correction Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-100">Log / Edit Meal Record</h3>

          <form onSubmit={handleLogMeal} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Food Name</label>
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g. Lentil Dal with Rice"
                required
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Save Meal Record
            </button>
          </form>
        </div>
      </div>

      {/* Practical Food Suggestions */}
      {suggestions && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Practical Pantry Food Suggestions ({suggestions.food_preference})</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.suggestions.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-sky-400 text-sm">{item.title}</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">{item.description}</p>
                <div className="flex justify-between text-[11px] font-semibold text-slate-300 pt-2 border-t border-slate-900">
                  <span>{item.calories} kcal</span>
                  <span className="text-emerald-400">{item.protein} protein</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
