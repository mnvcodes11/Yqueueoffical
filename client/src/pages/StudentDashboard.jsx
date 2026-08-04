import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCoffee, FiShoppingCart, FiUser, FiClock, FiArrowRight, FiZap } from 'react-icons/fi';
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-primary-950/70 p-6 shadow-[0_30px_80px_rgba(2,8,23,0.35)] sm:p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Student portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, {user?.name?.split(' ')[0]}.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">Your campus pickup experience is now intelligent, fast, and beautifully live.</p>
      </motion.div>

      {activeOrder && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/70 to-violet-500/10 p-5 backdrop-blur-2xl">
          <div className="flex items-center gap-2 font-semibold text-cyan-200">
            <FiClock size={16} /> Live queue status
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">Current status</p>
              <p className="mt-1 font-semibold text-white capitalize">{activeOrder.status?.replace('_', ' ')}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">Queue position</p>
              <p className="mt-1 font-semibold text-white">#{activeOrder.queueSnapshot?.queuePosition || activeOrder.queueNumber || '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm text-slate-400">Approx wait</p>
              <p className="mt-1 font-semibold text-white">{activeOrder.queueSnapshot?.estimatedWaitMinutes || 0} min</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { to: '/dashboard/menu', icon: FiCoffee, title: 'Browse menu', description: 'Explore meals, snacks, and drinks with a premium browsing experience.', cta: 'Explore' },
          { to: '/dashboard/cart', icon: FiShoppingCart, title: 'My cart', description: 'Review your order before checkout and move with confidence.', cta: 'Checkout' },
          { to: '/dashboard/profile', icon: FiUser, title: 'My profile', description: 'Manage your preferences and pickup history in one place.', cta: 'View profile' },
        ].map(({ to, icon: Icon, title, description, cta }, index) => (
          <motion.div key={title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
            <Link to={to} className="card group block p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-violet-500/10 text-cyan-200">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-200">
                {cta} <FiArrowRight size={14} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex items-center gap-2 text-cyan-200">
          <FiZap size={16} />
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Operational pulse</p>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-400">Every order, queue, and handoff is reflected live across the platform so your pickup experience feels calm, predictable, and premium.</p>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
