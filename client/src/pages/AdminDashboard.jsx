import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiAlertCircle, FiArrowRight, FiCheckCircle, FiClock, FiCoffee, FiCpu, FiLayers, FiPackage, FiRefreshCw, FiShoppingBag, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import * as analyticsService from '../services/analyticsService';
import { getSocket } from '../services/socketService';
import LoadingSpinner from '../components/LoadingSpinner';

const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame = requestAnimationFrame(() => setDisplay(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span>{`${prefix}${Math.round(display)}${suffix}`}</span>;
};

const StatCard = ({ icon: Icon, label, value, note, accent, trend }) => (
  <div className="card relative overflow-hidden p-5">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)]" />
    <div className="relative flex items-start justify-between">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent} text-white`}>
        <Icon size={18} />
      </div>
      <div className={`rounded-full px-2 py-1 text-[11px] font-medium ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
        {trend >= 0 ? '+' : ''}{trend}%
      </div>
    </div>
    <p className="relative mt-4 text-2xl font-semibold text-white">{value}</p>
    <p className="relative mt-1 text-sm text-slate-400">{label}</p>
    {note && <p className="relative mt-1 text-xs text-slate-500">{note}</p>}
  </div>
);

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const number = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executiveMode, setExecutiveMode] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getAnalyticsSummary(7);
      setAnalytics(res.summary);
    } catch (err) {
      toast.error('Unable to load live operations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const socket = getSocket();
    if (!socket) {
      return undefined;
    }

    const handleUpdate = () => {
      fetchAnalytics();
    };

    socket.on('order:update', handleUpdate);
    return () => socket.off('order:update', handleUpdate);
  }, []);

  const healthTone = useMemo(() => {
    if (!analytics) return 'text-emerald-300';
    if (analytics.businessHealthScore >= 85) return 'text-emerald-300';
    if (analytics.businessHealthScore >= 70) return 'text-amber-300';
    return 'text-rose-300';
  }, [analytics]);

  if (loading || !analytics) return <LoadingSpinner fullScreen />;

  const metricCards = [
    { label: 'Today revenue', value: currency(analytics.todayRevenue), note: 'Live cash flow', accent: 'bg-sky-500/20', trend: analytics.revenueGrowth || 0, icon: FiTrendingUp },
    { label: 'Today orders', value: number(analytics.todayOrders), note: 'Transactions captured', accent: 'bg-violet-500/20', trend: analytics.orderGrowth || 0, icon: FiShoppingBag },
    { label: 'Pending orders', value: number(analytics.pendingOrders), note: 'Awaiting payment', accent: 'bg-amber-500/20', trend: 0, icon: FiClock },
    { label: 'Preparing orders', value: number(analytics.preparingOrders), note: 'Kitchen in motion', accent: 'bg-indigo-500/20', trend: 0, icon: FiCpu },
    { label: 'Ready orders', value: number(analytics.readyOrders), note: 'Ready for pickup', accent: 'bg-cyan-500/20', trend: 0, icon: FiPackage },
    { label: 'Completed orders', value: number(analytics.completedOrders), note: 'Collected today', accent: 'bg-emerald-500/20', trend: 0, icon: FiCheckCircle },
    { label: 'Avg wait', value: `${number(analytics.averageWaitingTime)}m`, note: 'Current queue dwell', accent: 'bg-fuchsia-500/20', trend: -4, icon: FiActivity },
    { label: 'Queue length', value: number(analytics.currentQueueLength), note: 'Live queue load', accent: 'bg-rose-500/20', trend: 6, icon: FiLayers },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary-950/70 p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Operations command center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Live canteen intelligence</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">A real-time operating view for revenue, queue health, kitchen flow, worker efficiency, and smart operational alerts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setExecutiveMode((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20">
              <FiZap size={14} /> {executiveMode ? 'Investor mode on' : 'Executive mode'}
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              <FiZap size={14} /> Socket live • auto-refreshing
            </div>
          </div>
        </div>
      </motion.div>

      {executiveMode && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/70 to-violet-500/10 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Investor briefing</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Command posture: steady growth with queue pressure under control.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">The platform is balancing throughput, staffing, and revenue velocity in real time, giving leadership a single pulse on performance.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Health</p>
                <p className={`mt-2 text-xl font-semibold ${healthTone}`}>{analytics.businessHealthScore}/100</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Revenue</p>
                <p className="mt-2 text-xl font-semibold text-white">{currency(analytics.todayRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Queue</p>
                <p className="mt-2 text-xl font-semibold text-cyan-300">{analytics.currentQueueLength} live</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -4, scale: 1.01 }}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Live operations overview</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Queue, kitchen, and customer flow in one view</h2>
            </div>
            <div className={`rounded-full px-3 py-1 text-sm font-semibold ${healthTone}`}>{analytics.businessHealthScore}/100 health</div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Queue load', value: `${analytics.currentQueueLength} live`, tone: 'text-cyan-300' },
              { label: 'Kitchen load', value: `${analytics.preparingOrders + analytics.readyOrders} active`, tone: 'text-fuchsia-300' },
              { label: 'Active workers', value: analytics.activeWorkers, tone: 'text-emerald-300' },
              { label: 'Peak hour', value: analytics.peakHour, tone: 'text-amber-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyRevenue} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => currency(value)} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(148,163,184,0.2)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#34D399" strokeWidth={3} dot={{ r: 3, fill: '#60A5FA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 text-white">
              <FiAlertCircle size={16} />
              <h2 className="font-semibold">Smart alerts</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              {analytics.alerts.length > 0 ? analytics.alerts.map((alert) => (
                <div key={alert} className="rounded-2xl border border-amber-400/15 bg-amber-500/10 p-3 text-amber-200">{alert}</div>
              )) : <p>No active alerts.</p>}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-white">
              <FiZap size={16} />
              <h2 className="font-semibold">AI insights</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">{insight}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiRefreshCw size={16} />
            <h2 className="font-semibold">Live order pipeline</h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {['Pending', 'Accepted', 'Preparing', 'Ready', 'Collected'].map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                <span className="text-cyan-300">{step}</span>
                {index < 4 && <FiArrowRight size={14} />}
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { label: 'Pending', value: analytics.pendingOrders, tone: 'text-amber-300' },
              { label: 'Preparing', value: analytics.preparingOrders, tone: 'text-fuchsia-300' },
              { label: 'Ready', value: analytics.readyOrders, tone: 'text-cyan-300' },
              { label: 'Completed', value: analytics.completedOrders, tone: 'text-emerald-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiActivity size={16} />
            <h2 className="font-semibold">Activity feed</h2>
          </div>
          <div className="mt-4 space-y-3">
            {analytics.activityFeed.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiUsers size={16} />
            <h2 className="font-semibold">Worker monitor</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {analytics.staffPerformance?.length > 0 ? analytics.staffPerformance.slice(0, 4).map((worker) => (
              <div key={worker.workerId} className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{worker.workerName}</p>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">Online</span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{number(worker.orders)} orders • {currency(worker.revenue)}</p>
              </div>
            )) : <p className="text-sm text-slate-400">No worker activity yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiCoffee size={16} />
            <h2 className="font-semibold">Food demand pulse</h2>
          </div>
          <div className="mt-5 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topFoods?.slice(0, 5) || []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(148,163,184,0.2)' }} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
