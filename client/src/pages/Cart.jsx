import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowRight, FiClock, FiShoppingCart } from 'react-icons/fi';
import * as cartService from '../services/cartService';
import * as orderService from '../services/orderService';
import CartItemRow from '../components/CartItemRow';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchCart = async () => {
    try {
      const res = await cartService.getCart();
      setCart(res.cart);
    } catch (err) {
      toast.error('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleIncrease = async (item) => {
    try {
      const res = await cartService.updateCartItem(item.food._id, item.quantity + 1);
      setCart(res.cart);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update item');
    }
  };

  const handleDecrease = async (item) => {
    if (item.quantity <= 1) return handleRemove(item);
    try {
      const res = await cartService.updateCartItem(item.food._id, item.quantity - 1);
      setCart(res.cart);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update item');
    }
  };

  const handleRemove = async (item) => {
    try {
      const res = await cartService.removeFromCart(item.food._id);
      setCart(res.cart);
      toast.success('Item removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove item');
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await orderService.checkout();
      navigate(`/dashboard/checkout/${res.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const items = cart?.items || [];

  return (
    <div>
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-primary-950/70 p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Cart</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your order is ready to go.</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2"><FiClock size={14} /> Estimated pickup 10–15 min</div>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-3xl">
        {items.length === 0 ? (
          <EmptyState
            icon={FiShoppingCart}
            title="Your cart is empty"
            message="Head to the menu and add something tasty."
          />
        ) : (
          <div className="card p-6">
            {items.map((item) => (
              <CartItemRow
                key={item.food?._id || item.food}
                item={item}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
              />
            ))}
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>₹{cart.totalPrice}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                <span>Service</span>
                <span>Included</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-xl font-semibold text-primary-200">₹{cart.totalPrice}</span>
              </div>
            </div>
            <button onClick={handleCheckout} disabled={checkingOut} className="btn-primary mt-5 w-full gap-2">
              {checkingOut ? 'Preparing checkout...' : <>Continue to payment <FiArrowRight size={16} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
