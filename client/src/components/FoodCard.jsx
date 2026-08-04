import React from 'react';
import { FiClock, FiPlus, FiStar, FiHeart } from 'react-icons/fi';

const FALLBACK_IMAGE = 'https://placehold.co/400x300?text=Food';

const FoodCard = ({ food, onAddToCart, adding }) => {
  return (
    <div className="card group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary-400/50">
      <div className="relative">
        <img
          src={food.image || FALLBACK_IMAGE}
          alt={food.name}
          className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100">
          {food.category || 'Featured'}
        </div>
        {food.isBestseller && (
          <div className="absolute left-3 top-12 rounded-full bg-amber-500/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950">
            Bestseller
          </div>
        )}
        {!food.available && (
          <div className="absolute right-3 top-3 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
            Unavailable
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-white">{food.name}</h3>
          <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
            <FiStar size={12} /> {food.isSpecial ? 'Special' : 'Campus'}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-slate-500">
          <span className="inline-flex items-center gap-1"><FiHeart size={12} /> {food.isVeg === false ? 'Non-veg' : 'Vegetarian'}</span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-7 text-slate-400">{food.description}</p>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span className="inline-flex items-center gap-1"><FiClock size={14} /> {food.prepTime || '10-15 min'}</span>
          <span className="text-lg font-semibold text-primary-200">₹{food.price}</span>
        </div>
        <button
          onClick={() => onAddToCart(food)}
          disabled={!food.available || adding}
          className="btn-primary mt-4 flex items-center justify-center gap-2 text-sm"
        >
          <FiPlus size={16} /> {adding ? 'Adding...' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
};

export default FoodCard;
