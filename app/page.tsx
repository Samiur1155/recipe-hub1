'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, X, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Dish = {
  id: number;
  title: string;
  description: string;
  image: string;
};

export default function Home() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recipe, setRecipe] = useState('');
  const [nutrition, setNutrition] = useState<{ calories: string, protein: string, fat: string, carbs: string } | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [mealPlan, setMealPlan] = useState<{ day: string, breakfast: string, lunch: string, dinner: string }[] | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [swappingMeal, setSwappingMeal] = useState<{ dayIndex: number | null, mealType: string | null }>({ dayIndex: null, mealType: null });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDishTitle, setNewDishTitle] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImage, setNewDishImage] = useState('');

  useEffect(() => {
    fetch('/api/dishes')
      .then(res => res.json())
      .then(data => setDishes(data));
  }, []);

  const handleGenerateRecipe = async () => {
    if (!searchQuery) return;
    setIsLoadingRecipe(true);
    setRecipe('');
    setNutrition(null);

    try {
      // 1. This "fetches" the data from your bridge (the API route)
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: searchQuery }),
      });

      const data = await response.json();

      // 2. This puts the AI's recipe into the "recipe" variable to show on screen
      setNutrition(data.nutrition || null);
      setRecipe(data.recipe || 'Failed to generate recipe.');
      // Save to history (and keep only the 5 most recent)
      setSearchHistory((prev) => {
        const newHistory = [searchQuery, ...prev.filter(q => q !== searchQuery)];
        return newHistory.slice(0, 5);
      });
    } catch (error) {
      setRecipe('Error connecting to Gemini API.');
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    if (!searchQuery) return;
    setIsLoadingPlan(true);
    setMealPlan(null);
    setRecipe('');
    setNutrition(null);

    try {
      const response = await fetch('/api/mealplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dietType: searchQuery, mode: 'generate' }), // Added mode
      });

      const data = await response.json();
      setMealPlan(data.plan || null);
    } catch (error) {
      console.error('Error connecting to Meal Plan API.');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleSwapMeal = async (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', currentDish: string) => {
    setSwappingMeal({ dayIndex, mealType });
    try {
      const response = await fetch('/api/mealplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietType: searchQuery || "Healthy",
          mode: 'swap',
          mealType,
          currentDish
        }),
      });
      const data = await response.json();

      if (mealPlan) {
        const updatedPlan = [...mealPlan];
        updatedPlan[dayIndex] = { ...updatedPlan[dayIndex], [mealType]: data.newDish };
        setMealPlan(updatedPlan);
      }
    } catch (error) {
      console.error("Swap failed");
    } finally {
      setSwappingMeal({ dayIndex: null, mealType: null });
    }
  };

  const handleDeleteDish = async (id: number) => {
    await fetch(`/api/dishes?id=${id}`, { method: 'DELETE' });
    setDishes(dishes.filter(dish => dish.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDishImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newDishTitle,
        description: newDishDesc,
        image: newDishImage
      }),
    });

    const addedDish = await response.json();
    setDishes([...dishes, addedDish]);

    setNewDishTitle('');
    setNewDishDesc('');
    setNewDishImage('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">

      {/* HERO SECTION */}
      <section className="relative w-full h-[500px] flex flex-col items-center justify-center text-center px-4 mb-16">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1495195134817-a1a28078aca9?q=80&w=2000&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-white/75 backdrop-blur-sm"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center mt-10 print:hidden">
          <span className="bg-orange-100 text-[#f08a6e] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 flex items-center gap-2">
            <Sparkles size={16} /> AI DISH ANALYZER
          </span>
          <span className="bg-orange-100 text-[#f08a6e] px-4 py-1.5 rounded-full text-sm font-semibold mb-6 flex items-center gap-2">
            <Sparkles size={16} /> AI-Powered College Project
          </span>

          <h1 className="text-5xl md:text-6xl font-serif text-amber-900 mb-4 tracking-tight">
            Discover Your Next <br />
            <span className="text-[#f08a6e] italic">Masterpiece</span>
          </h1>

          <p className="text-amber-800 text-lg mb-10 max-w-xl">
            Explore curated dishes or ask our AI chef to generate a complete, step-by-step recipe for anything you're craving.
          </p>

          <div className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-lg flex items-center gap-2 border border-gray-100">
            <div className="pl-4 text-[#f08a6e]"><Sparkles size={20} /></div>
            <input
              type="text"
              placeholder="Ask Gemini to create a recipe... (e.g. Vegan Pad Thai)"
              /* ✨ UPDATED: Darker text and placeholder for search bar */
              className="flex-1 py-3 px-2 outline-none text-gray-900 placeholder-gray-500 bg-transparent w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe()}
            />
            <button
              onClick={handleGenerateRecipe}
              disabled={isLoadingRecipe}
              className="bg-[#f08a6e] hover:bg-[#e0795c] text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-70"
            >
              {isLoadingRecipe ? 'Cooking...' : 'Generate'}
            </button>

            <button
              onClick={handleGenerateMealPlan}
              type="button"
              className="px-6 py-3 bg-white text-[#f08a6e] font-semibold rounded-xl border border-[#f08a6e] hover:bg-orange-50 transition-colors shadow-sm whitespace-nowrap"
            >
              Generate 7-Day Plan
            </button>
          </div>
        </div>
      </section>

      {/* RECIPE OUTPUT */}
      {/* --- NEW RECIPE, HISTORY & NUTRITION DASHBOARD --- */}
      {(recipe || isLoadingRecipe || searchHistory.length > 0) && (
        <div className="w-full max-w-7xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">

          {/* 1. LEFT COLUMN: Search History Sidebar */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur p-5 rounded-2xl shadow-sm border border-orange-100 h-fit">
            <h3 className="font-serif text-lg text-amber-900 mb-4 border-b border-orange-100 pb-2">
              Recent Cravings
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              {searchHistory.length === 0 ? (
                <p className="text-gray-400 italic">No history yet.</p>
              ) : (
                searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(item)}
                    className="text-left text-gray-600 hover:text-[#f08a6e] hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors capitalize font-medium"
                  >
                    • {item}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 2. MIDDLE COLUMN: Compact Recipe Card */}
          <div className="lg:col-span-3">
            {isLoadingRecipe ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 flex flex-col items-center justify-center h-64 text-[#f08a6e]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f08a6e] mb-4"></div>
                <p className="font-medium animate-pulse">Your AI Chef is cooking...</p>
              </div>
            ) : recipe ? (
              <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">

                {/* Header Banner */}
                <div className="h-32 w-full bg-gradient-to-r from-orange-200 to-[#f08a6e] flex items-end p-5 relative">
                  <span className="text-white font-serif text-3xl font-bold drop-shadow-md capitalize">
                    {searchHistory[0] || searchQuery}
                  </span>
                </div>

                {/* Scrollable Recipe Text */}
                <div className="p-6 max-h-[450px] overflow-y-auto bg-[#fafafa] custom-scrollbar">
                  <div className="prose prose-orange max-w-none text-gray-700 text-sm">
                    <ReactMarkdown>{recipe}</ReactMarkdown>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-100 text-center text-gray-400 italic">
                Select a dish from your history to view it again.
              </div>
            )}
          </div>

          {/* 3. RIGHT COLUMN: Nutrition Panel */}
          <div className="lg:col-span-1">
            {nutrition && !isLoadingRecipe && (
              <div className="bg-white/80 backdrop-blur p-5 rounded-2xl shadow-sm border border-orange-100 h-fit">
                <h3 className="font-serif text-lg text-amber-900 mb-4 border-b border-orange-100 pb-2">
                  Nutrition
                </h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <span className="text-[#f08a6e] font-bold tracking-wide uppercase text-xs">Calories</span>
                    <span className="font-bold text-gray-800">{nutrition.calories}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <span className="text-[#f08a6e] font-bold tracking-wide uppercase text-xs">Protein</span>
                    <span className="font-bold text-gray-800">{nutrition.protein}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <span className="text-[#f08a6e] font-bold tracking-wide uppercase text-xs">Fat</span>
                    <span className="font-bold text-gray-800">{nutrition.fat}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                    <span className="text-[#f08a6e] font-bold tracking-wide uppercase text-xs">Carbs</span>
                    <span className="font-bold text-gray-800">{nutrition.carbs}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
      {/* --- END NEW DASHBOARD --- */}

      {/* --- 7-DAY MEAL PLAN DASHBOARD --- */}
{mealPlan && !isLoadingPlan && (
  <div className="w-full max-w-7xl mx-auto mt-12 mb-20 px-4">
    <h2 className="font-serif text-3xl text-amber-900 mb-8 text-center capitalize border-b border-orange-200 pb-4">
      Your 7-Day {searchQuery} Plan
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {mealPlan.map((day, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl shadow-md border border-orange-100 hover:shadow-lg transition-shadow">
          <div className="bg-[#f08a6e] text-white text-center font-bold py-2 rounded-lg mb-4 uppercase tracking-widest text-sm">
            {day.day}
          </div>
          
          <div className="flex flex-col gap-3 text-sm">
            {['breakfast', 'lunch', 'dinner'].map((type) => (
              <div key={type} className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#f08a6e] font-bold text-xs uppercase">{type}</span>
                  <button 
                    onClick={() => handleSwapMeal(index, type as any, (day as any)[type])}
                    disabled={swappingMeal.dayIndex === index && swappingMeal.mealType === type}
                    className="text-[10px] bg-white border border-orange-200 px-2 py-0.5 rounded-md hover:bg-orange-100 transition-colors disabled:opacity-50"
                  >
                    {swappingMeal.dayIndex === index && swappingMeal.mealType === type ? '...' : 'Swap'}
                  </button>
                </div>
                <span className="text-gray-700 font-medium">{(day as any)[type]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      {/* MENU / GRID */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-4xl font-serif text-gray-800 mb-2">Your Menu</h2>
            <p className="text-gray-500">Manage your saved dishes and culinary ideas.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#f08a6e] hover:bg-[#e0795c] text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md"
          >
            <Plus size={20} /> Add New Dish
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map((dish) => (
            <div key={dish.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100 relative group">
              <button
                onClick={() => handleDeleteDish(dish.id)}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>

              <div className="h-56 overflow-hidden">
                <img src={dish.image} alt={dish.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif text-gray-800 mb-2">{dish.title}</h3>
                <p className="text-gray-600 text-sm">{dish.description}</p>
              </div>
            </div>
          ))}

          {dishes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-2xl">
              No dishes added yet. Click "Add New Dish" to get started!
            </div>
          )}
        </div>
      </section>

      {/* ADD NEW DISH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-serif text-gray-800 mb-6">Add New Dish</h3>

            <form onSubmit={handleAddDish} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Dish Name</label>
                <input
                  required
                  type="text"
                  value={newDishTitle}
                  onChange={e => setNewDishTitle(e.target.value)}
                  /* ✨ UPDATED: text-gray-900 (dark text) and placeholder-gray-400 (visible placeholder) */
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#f08a6e] text-gray-900 placeholder-gray-400"
                  placeholder="e.g. Avocado Toast"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Description</label>
                <textarea
                  required
                  value={newDishDesc}
                  onChange={e => setNewDishDesc(e.target.value)}
                  /* ✨ UPDATED: text-gray-900 and placeholder-gray-400 */
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-[#f08a6e] resize-none h-24 text-gray-900 placeholder-gray-400"
                  placeholder="A short description of the dish..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Dish Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-700
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-50 file:text-[#f08a6e]
                      hover:file:bg-orange-100 cursor-pointer"
                  />
                  {newDishImage && (
                    <div className="h-12 w-12 rounded-md border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                      <img src={newDishImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#f08a6e] hover:bg-[#e0795c] text-white font-medium py-3 rounded-xl mt-4 transition-colors shadow-md"
              >
                Save Dish
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
