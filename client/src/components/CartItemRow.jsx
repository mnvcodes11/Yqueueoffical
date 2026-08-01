import React from 'react';
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';

const FALLBACK_IMAGE = 'https://placehold.co/100x100?text=Food';

const CartItemRow = ({ item, onIncrease, onDecrease, onRemove }) => {
  const food = item.food;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-b-0">
      <img
        src={food?.image || FALLBACK_IMAGE}
        alt={food?.name}
        className="h-16 w-16 rounded-lg object-cover"
        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{food?.name || 'Item removed'}</p>
        <p className="text-sm text-gray-500">₹{food?.price} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onDecrease(item)} className="p-1.5 rounded-full border border-gray-300 hover:bg-gray-100">
          <FiMinus size={14} />
        </button>
        <span className="w-6 text-center font-medium">{item.quantity}</span>
        <button onClick={() => onIncrease(item)} className="p-1.5 rounded-full border border-gray-300 hover:bg-gray-100">
          <FiPlus size={14} />
        </button>
      </div>
      <span className="w-16 text-right font-semibold">₹{(food?.price || 0) * item.quantity}</span>
      <button onClick={() => onRemove(item)} className="text-red-500 hover:text-red-700 p-1.5">
        <FiTrash2 size={18} />
      </button>
    </div>
  );
};

export default CartItemRow;
