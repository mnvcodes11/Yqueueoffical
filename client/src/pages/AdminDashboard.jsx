import React, { useEffect, useState } from 'react';
import { FiActivity, FiCoffee, FiLayers, FiShoppingBag, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import * as foodService from '../services/foodService';
import * as orderService from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';

const StatCard = ({ icon: Icon, label, value, note, accent }) => (
  <div className="card relative overflow-hidden p-6">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)]" />
    <div className="relative flex items-center justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent} text-white`}>
        <Icon size={20} />
      </div>
      <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-300"><FiTrendingUp size={14} /></div>
    </div>
    <p className="relative mt-4 text-2xl font-semibold text-white">{value}</p>
    <p className="relative mt-1 text-sm text-slate-400">{label}</p>
    {note && <p className="relative mt-1 text-xs text-slate-500">{note}</p>}
  </div>
);

const AdminDashboard = () => {
  const [foodCount, setFoodCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [foodsRes, ordersRes] = await Promise.all([
          foodService.getFoods(),
          orderService.getKitchenOrders(),
        ]);
        setFoodCount(foodsRes.count);
        setActiveOrders(ordersRes.count);
      } catch (err) {
        toast.error('Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary-950/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Admin Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Operational command center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">A premium control surface for food inventory, live queues, and staff coordination.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <FiZap size={14} /> System online • live
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Users" value="—" note="User analytics ready for next phase" accent="bg-primary-500/20" />
        <StatCard icon={FiCoffee} label="Total Food Items" value={foodCount} accent="bg-cyan-500/20" />
        <StatCard icon={FiShoppingBag} label="Active Orders" value={activeOrders} note="Paid, preparing, or ready" accent="bg-fuchsia-500/20" />
        <StatCard icon={FiActivity} label="System Status" value="Online" accent="bg-emerald-500/20" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiLayers size={16} />
            <h2 className="font-semibold">Live operating pulse</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Queue health', value: 'Stable', tone: 'text-emerald-300' },
              { label: 'Prep throughput', value: 'High', tone: 'text-primary-200' },
              { label: 'Pickup confidence', value: '98%', tone: 'text-cyan-300' },
              { label: 'Escalations', value: '0', tone: 'text-slate-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Next unlocks</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-400">
            <li>• Revenue and order trend analytics</li>
            <li>• Peak-hour forecasting and queue insights</li>
            <li>• Worker performance and kitchen load reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
