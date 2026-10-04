import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { Utensils, CheckCircle2, Sparkles, Plus, Calculator } from 'lucide-react';

export const NutritionPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [foodAnalysis, setFoodAnalysis] = useState<any>(null);
  const [rememberedFoods, setRememberedFoods] = useState<any[]>([]);

  // Manual food analyzer — no camera, image upload, or vision AI.
  const [mealType, setMealType] = useState('Lunch');
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState('1 serving');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const fetchSummary = () => {
    apiRequest('/nutrition/summary')
      .then((res) => setSummary(res))
      .catch((err) => console.error(err));

    apiRequest('/nutrition/suggestions')
      .then((res) => setSuggestions(res))
      .catch((err) => console.error(err));

    apiRequest('/nutrition/remembered-foods')
      .then((res) => {
        const data = res as { foods?: any[] };
        setRememberedFoods(data.foods || []);
      }
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const analyzeManualFood = () => {
    const name = foodName.trim();
    if (!name) return;

    // User enters the nutrition values from a food label/reference.
    // The app calculates macro calories and shows the result before saving.
    const macroCalories = protein * 4 + carbs * 4 + fat * 9;
    const estimatedCalories = calories > 0 ? calories : Math.round(macroCalories);

    setCalories(estimatedCalories);
    setFoodAnalysis({
      food_name: name,
      portion,
      calories: estimatedCalories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
    });
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/nutrition/meals', {
        method: 'POST',
        body: JSON.stringify({
          meal_type: mealType,
          food_name: foodName.trim(),
          portion,
          calories: Number(calories),
          protein_g: Number(protein),
          carbs_g: Number(carbs),
          fat_g: Number(fat),
          is_ai_estimated: false
        })
      });
      fetchSummary();
      setFoodAnalysis(null);
      setFoodName('');
      setPortion('1 serving');
      setCalories(0);
      setProtein(0);
      setCarbs(0);
      setFat(0);
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
          <Utensils className="w-5 h-5 text-emerald-400" /> Manual Food & Nutrition Analyzer
        </h2>
        <p className="text-xs text-slate-400">
          Enter your food, portion, and nutrition values manually. No camera or food-image analysis is used.
        </p>
      </div>

      {/* Daily Macro Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"><p className="text-xs text-slate-400">Total Calories</p><p className="text-2xl font-extrabold text-slate-100 mt-1">{summary?.total_calories || 0} / {summary?.calorie_target || '—'} kcal</p></div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"><p className="text-xs text-slate-400">Protein</p><p className="text-2xl font-extrabold text-emerald-400 mt-1">{summary?.total_protein_g || 0}g</p></div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"><p className="text-xs text-slate-400">Carbohydrates</p><p className="text-2xl font-extrabold text-sky-400 mt-1">{summary?.total_carbs_g || 0}g</p></div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl"><p className="text-xs text-slate-400">Fats</p><p className="text-2xl font-extrabold text-amber-400 mt-1">{summary?.total_fat_g || 0}g</p></div>
      </div>

      {/* Remembered Foods */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">Remembered Foods</h3>
            <p className="text-xs text-slate-400 mt-1">Foods you previously saved are remembered for your account. Select one to reuse its nutrition values.</p>
          </div>
        </div>
        {rememberedFoods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rememberedFoods.map((food) => (
              <button key={food.food_key} type="button" onClick={() => {
                setFoodName(food.food_name);
                setPortion(food.portion || '1 serving');
                setCalories(Number(food.calories || 0));
                setProtein(Number(food.protein_g || 0));
                setCarbs(Number(food.carbs_g || 0));
                setFat(Number(food.fat_g || 0));
                setFoodAnalysis(null);
              }} className="text-left p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-100 text-sm">{food.food_name}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">REUSE</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{food.portion} · {food.calories} kcal · {food.protein_g}g protein</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No remembered foods yet. Save a manual meal and it will appear here next time.</p>
        )}
      </div>

      {/* Manual Food Analyzer */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="font-bold text-sm text-slate-100">Manual Food Analyzer</h3>
            <p className="text-xs text-slate-400 mt-1">Enter the values for the amount you actually ate.</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); analyzeManualFood(); }} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-slate-300 font-semibold mb-1">Meal Type</label>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100">
                <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
              </select>
            </div>
            <div className="md:col-span-2"><label className="block text-slate-300 font-semibold mb-1">Food Name</label>
              <input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Rice with dal and 2 eggs" required className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" />
            </div>
          </div>

          <div><label className="block text-slate-300 font-semibold mb-1">Portion</label>
            <input value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="e.g. 1 cup, 2 eggs, 150 g" required className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="block text-slate-300 font-semibold mb-1">Calories (kcal)</label><input type="number" min="0" value={calories} onChange={(e)=>setCalories(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" /></div>
            <div><label className="block text-slate-300 font-semibold mb-1">Protein (g)</label><input type="number" min="0" value={protein} onChange={(e)=>setProtein(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" /></div>
            <div><label className="block text-slate-300 font-semibold mb-1">Carbs (g)</label><input type="number" min="0" value={carbs} onChange={(e)=>setCarbs(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" /></div>
            <div><label className="block text-slate-300 font-semibold mb-1">Fat (g)</label><input type="number" min="0" value={fat} onChange={(e)=>setFat(Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100" /></div>
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 font-bold text-slate-950 text-xs shadow-glow flex items-center justify-center gap-2">
            <Calculator className="w-4 h-4" /> Analyze Food Manually
          </button>
        </form>

        {foodAnalysis && (
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300">{foodAnalysis.food_name}</span>
              <span className="text-[10px] text-emerald-400 font-semibold">MANUAL ENTRY</span>
            </div>
            <p className="text-xs text-slate-400">Portion: {foodAnalysis.portion}</p>
            <div className="grid grid-cols-4 gap-2 text-xs text-slate-300">
              <span>{foodAnalysis.calories} kcal</span><span>{foodAnalysis.protein_g}g protein</span><span>{foodAnalysis.carbs_g}g carbs</span><span>{foodAnalysis.fat_g}g fat</span>
            </div>
            <button type="button" onClick={handleLogMeal} className="w-full py-2 rounded-xl border border-emerald-500/30 text-emerald-300 font-bold">Save Meal Record</button>
          </div>
        )}
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
