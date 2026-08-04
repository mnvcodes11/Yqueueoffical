import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiAlertTriangle, FiCpu, FiLayers, FiRefreshCw, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const number = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);

const MetricCard = ({ label, value, detail, accent }) => (
  <div className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
    <p className="text-sm text-slate-400">{label}</p>
    <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    <p className="mt-1 text-sm text-slate-500">{detail}</p>
  </div>
);

const DigitalTwin = () => {
  const [twin, setTwin] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTwin = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/digital-twin');
      setTwin(res.data.twin);
    } catch (error) {
      toast.error('Unable to load the digital twin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwin();
  }, []);

  const mapSections = useMemo(() => [
    { name: 'Counter 1', tone: 'from-cyan-500/40 to-sky-500/15', active: twin?.metrics?.currentQueue > 4 },
    { name: 'Counter 2', tone: 'from-fuchsia-500/40 to-violet-500/15', active: twin?.metrics?.currentQueue > 6 },
    { name: 'Counter 3', tone: 'from-amber-500/40 to-orange-500/15', active: twin?.metrics?.currentQueue > 8 },
    { name: 'Kitchen', tone: 'from-emerald-500/40 to-lime-500/15', active: twin?.flow?.length > 0 },
    { name: 'Pickup', tone: 'from-indigo-500/40 to-blue-500/15', active: twin?.metrics?.currentQueue > 3 },
    { name: 'Waiting', tone: 'from-rose-500/40 to-pink-500/15', active: twin?.metrics?.currentQueue > 5 },
  ], [twin]);

  if (loading || !twin) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/70 p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">YQueue Digital Twin</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Live canteen operating system</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">A premium, real-time simulation of counters, workers, queues, inventory, and flow for the entire canteen.</p>
          </div>
          <button type="button" onClick={fetchTwin} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
            <FiRefreshCw size={14} /> Refresh twin
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Orders today" value={number(twin.metrics.ordersToday)} detail="Live order volume" accent="text-cyan-300" />
        <MetricCard label="Revenue today" value={currency(twin.metrics.revenueToday)} detail="Cash flow in motion" accent="text-emerald-300" />
        <MetricCard label="Current queue" value={number(twin.metrics.currentQueue)} detail="Students waiting" accent="text-amber-300" />
        <MetricCard label="Average wait" value={`${number(twin.metrics.averageWaitMinutes)}m`} detail="Estimated dwell time" accent="text-fuchsia-300" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Live canteen map</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Animated top-down twin</h2>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">Realtime</div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/80 p-4">
            <div className="relative h-[420px] overflow-hidden rounded-[1.5rem] border border-cyan-400/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(2,6,23,1))]">
              {mapSections.map((section, index) => (
                <motion.div
                  key={section.name}
                  initial={{ opacity: 0.7, scale: 0.95 }}
                  animate={{ opacity: section.active ? 1 : 0.7, scale: section.active ? 1.02 : 0.97 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className={`absolute rounded-[1.25rem] border border-white/10 bg-gradient-to-br ${section.tone} p-4 backdrop-blur-xl ${index === 0 ? 'left-6 top-8 h-24 w-28' : index === 1 ? 'left-[35%] top-8 h-24 w-28' : index === 2 ? 'right-6 top-8 h-24 w-28' : index === 3 ? 'left-[35%] bottom-24 h-24 w-28' : index === 4 ? 'bottom-8 left-8 h-24 w-28' : 'bottom-8 right-8 h-24 w-28'}`}
                >
                  <p className="text-sm font-medium text-white">{section.name}</p>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, dotIndex) => (
                      <motion.span
                        key={`${section.name}-${dotIndex}`}
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: dotIndex * 0.12 }}
                        className={`h-2.5 w-2.5 rounded-full ${section.active ? 'bg-white' : 'bg-slate-400'}`}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}

              <motion.div animate={{ x: [0, 60, 0], y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute left-10 top-1/2 h-3 w-12 rounded-full bg-cyan-300/70 blur-[1px]" />
              <motion.div animate={{ x: [0, -70, 0], y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 7.2 }} className="absolute right-14 top-[40%] h-3 w-12 rounded-full bg-fuchsia-300/70 blur-[1px]" />
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="absolute left-[45%] top-[42%] h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(74,222,128,0.7)]" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 text-white">
              <FiCpu size={16} />
              <h2 className="font-semibold">AI recommendations</h2>
            </div>
            <div className="mt-4 space-y-3">
              {twin.recommendations.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 text-white">
              <FiAlertTriangle size={16} />
              <h2 className="font-semibold">Bottlenecks</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              {twin.serviceBottlenecks.map((item) => <p key={item}>{item}</p>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiUsers size={16} />
            <h2 className="font-semibold">Worker digital twin</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {twin.workers.map((worker) => (
              <div key={worker.id} className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{worker.name}</p>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">{Math.round(worker.efficiency)}%</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Task: {worker.currentTask}</p>
                <p className="mt-1 text-sm text-slate-400">Orders completed: {worker.completedOrders}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiLayers size={16} />
            <h2 className="font-semibold">Inventory digital twin</h2>
          </div>
          <div className="mt-5 space-y-4">
            {twin.inventory.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white">{item.name}</p>
                  {item.low ? <span className="rounded-full bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300">Low stock</span> : null}
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-800">
                  <div className={`h-2 rounded-full ${item.low ? 'bg-rose-400' : 'bg-cyan-400'}`} style={{ width: `${Math.max(8, (item.stock ?? 0) * 10)}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-400">Remaining: {item.stock ?? 0} • Finishes in {item.predictedFinishMinutes ?? 0} min</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiTrendingUp size={16} />
            <h2 className="font-semibold">Predictive analytics</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {Object.entries(twin.forecasts).map(([label, values]) => (
              <div key={label} className="rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm capitalize text-slate-400">{label.replace('next', 'Next ').replace('Minutes', ' minutes')}</p>
                <p className="mt-2 text-lg font-semibold text-white">{values.orders} orders</p>
                <p className="mt-1 text-sm text-slate-400">{values.revenue} revenue • {values.queue} queue • {values.wait}m wait</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 text-white">
            <FiZap size={16} />
            <h2 className="font-semibold">Live insights</h2>
          </div>
          <div className="mt-4 space-y-3">
            {twin.insights.map((insight) => (
              <div key={insight} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-400">{insight}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
