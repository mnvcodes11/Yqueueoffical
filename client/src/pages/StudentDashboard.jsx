import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCoffee, FiShoppingCart, FiUser, FiClock, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import * as orderService from '../services/orderService';
import { connectSocket } from '../services/socketService';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    const loadLatest = async () => {
      try {
        const res = await orderService.getMyOrders();
        const latest = res.orders?.find((order) => ['paid', 'preparing', 'ready', 'collected'].includes(order.status));
        setActiveOrder(latest || null);
      } catch {
        setActiveOrder(null);
      }
    };

    loadLatest();
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    const handleUpdate = (updatedOrder) => {
      if (updatedOrder.student?._id === user?._id || updatedOrder.student === user?._id) {
        setActiveOrder(updatedOrder);
      }
    };

    socket.on('order:update', handleUpdate);
    return () => socket.off('order:update', handleUpdate);
  }, [user?._id]);

  return (
    <div>
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-primary-950/70 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Student portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">Order, track, and collect with a premium experience built for campus convenience.</p>
      </div>

      {activeOrder && (
        <div className="mt-6 rounded-[1.5rem] border border-primary-400/20 bg-primary-500/10 p-5 backdrop-blur">
          <div className="flex items-center gap-2 text-primary-200 font-semibold">
            <FiClock size={16} /> Live Queue Status
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-sm text-slate-400">Current status</p>
              <p className="font-semibold text-white capitalize">{activeOrder.status?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Queue position</p>
              <p className="font-semibold text-white">#{activeOrder.queueSnapshot?.queuePosition || activeOrder.queueNumber || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Approx wait</p>
              <p className="font-semibold text-white">{activeOrder.queueSnapshot?.estimatedWaitMinutes || 0} min</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/dashboard/menu" className="card group p-6 transition hover:-translate-y-1">
          <FiCoffee className="mb-3 text-primary-300" size={24} />
          <h3 className="font-semibold text-white">Browse Menu</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">Explore meals, snacks, drinks, and desserts with a polished menu experience.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary-200">
            Explore <FiArrowRight size={14} />
          </div>
        </Link>
        <Link to="/dashboard/cart" className="card group p-6 transition hover:-translate-y-1">
          <FiShoppingCart className="mb-3 text-primary-300" size={24} />
          <h3 className="font-semibold text-white">My Cart</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">Review your selection and move to checkout with confidence.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary-200">
            Checkout <FiArrowRight size={14} />
          </div>
        </Link>
        <Link to="/dashboard/profile" className="card group p-6 transition hover:-translate-y-1">
          <FiUser className="mb-3 text-primary-300" size={24} />
          <h3 className="font-semibold text-white">My Profile</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">Manage your account and keep track of your pickup history.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary-200">
            View profile <FiArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
