import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiCoffee, FiFilter } from 'react-icons/fi';
import * as foodService from '../services/foodService';
import * as cartService from '../services/cartService';
import FoodCard from '../components/FoodCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AnimatedSection from '../components/AnimatedSection';

const CATEGORIES = ['All', 'Meals', 'Snacks', 'Drinks', 'Desserts', 'South Indian', 'Chinese', 'Beverages', 'Breakfast'];

const Menu = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [addingId, setAddingId] = useState(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = { available: 'true' };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const res = await foodService.getFoods(params);
      setFoods(res.foods);
    } catch (err) {
      toast.error('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const debounce = setTimeout(fetchFoods, 300);
    return () => clearTimeout(debounce);
  }, [fetchFoods]);

  const handleAddToCart = async (food) => {
    setAddingId(food._id);
    try {
      await cartService.addToCart(food._id, 1);
      toast.success(`${food.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      <AnimatedSection className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-primary-950/70 p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Menu</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Discover campus favourites.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">Browse fresh meals, quick bites, and beverages with a polished storefront experience designed for speed.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-300">
            Live availability updated instantly
          </div>
        </div>
      </AnimatedSection>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/70 p-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                category === c ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner fullScreen />
        ) : foods.length === 0 ? (
          <EmptyState
            icon={FiCoffee}
            title="No food items found"
            message="Try a different search term or category."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {foods.map((food) => (
              <FoodCard key={food._id} food={food} onAddToCart={handleAddToCart} adding={addingId === food._id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
