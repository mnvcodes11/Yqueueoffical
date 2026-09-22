import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiDownload, FiPrinter } from 'react-icons/fi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import * as reportService from '../services/reportService';
import LoadingSpinner from '../components/LoadingSpinner';

const periods = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'semester', label: 'Semester' },
  { key: 'custom', label: 'Custom range' },
];

const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
const formatNumber = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeObject = (value) => (value && typeof value === 'object' ? value : {});

const normalizeReport = (input) => {
  const payload = input?.report || input || {};
  return {
    ...payload,
    executiveSummary: payload.executiveSummary || 'Report data is being prepared.',
    financialSummary: safeObject(payload.financialSummary),
    orderAnalytics: safeObject(payload.orderAnalytics),
    queueIntelligence: safeObject(payload.queueIntelligence),
    foodIntelligence: {
      ...safeObject(payload.foodIntelligence),
      mostSoldItems: safeArray(payload.foodIntelligence?.mostSoldItems),
      leastSoldItems: safeArray(payload.foodIntelligence?.leastSoldItems),
    },
    workerPerformance: safeObject(payload.workerPerformance),
    customerBehaviour: safeObject(payload.customerBehaviour),
    aiPredictions: safeObject(payload.aiPredictions),
    aiBusinessInsights: safeArray(payload.aiBusinessInsights),
    aiRecommendations: safeArray(payload.aiRecommendations),
    riskDetection: safeArray(payload.riskDetection),
    visualAnalytics: {
      ...safeObject(payload.visualAnalytics),
      revenueTrend: safeArray(payload.visualAnalytics?.revenueTrend),
      peakHours: safeArray(payload.visualAnalytics?.peakHours),
      workerComparison: safeArray(payload.visualAnalytics?.workerComparison),
    },
  };
};

const AdminReport = () => {
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executiveMode, setExecutiveMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (period === 'custom' && (!startDate || !endDate)) {
        setReport(null);
        return;
      }

      const res = await reportService.getReport(period, startDate, endDate);
      const payload = normalizeReport(res);
      setReport(payload);
      setErrorMessage('');
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load the business intelligence report.';
      toast.error(message);
      setErrorMessage(message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, startDate, endDate]);

  const normalizedReport = useMemo(() => normalizeReport(report), [report]);

  const reportRows = useMemo(() => {
    if (!normalizedReport) return [];
    return [
      { label: 'Total Revenue', value: formatMoney(normalizedReport.financialSummary.totalRevenue) },
      { label: 'Net Revenue', value: formatMoney(normalizedReport.financialSummary.netRevenue) },
      { label: 'Average Order Value', value: formatMoney(normalizedReport.financialSummary.averageOrderValue) },
      { label: 'Projected EOD Revenue', value: formatMoney(normalizedReport.financialSummary.projectedEndOfDayRevenue) },
    ];
  }, [normalizedReport]);

  const downloadCsv = () => {
    if (!normalizedReport) return;
    const rows = [
      ['Section', 'Metric', 'Value'],
      ['Financial Summary', 'Total Revenue', normalizedReport.financialSummary.totalRevenue],
      ['Financial Summary', 'Net Revenue', normalizedReport.financialSummary.netRevenue],
      ['Order Analytics', 'Total Orders', normalizedReport.orderAnalytics.totalOrders],
      ['Queue Intelligence', 'Peak Queue Time', normalizedReport.queueIntelligence.peakQueueTime],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yqueue-report-${period}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!normalizedReport) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-slate-300">
        <p className="text-lg font-semibold text-white">No report data available.</p>
        <p className="mt-2 text-sm text-slate-400">{errorMessage || 'The analytics endpoint returned no usable payload for this period.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print-hidden { display: none !important; }
          .print-card { box-shadow: none !important; border-color: #e2e8f0 !important; background: white !important; }
          .print-text { color: #0f172a !important; }
        }
      `}</style>

      <div className="print-card rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-[0_30px_80px_rgba(2,8,23,0.35)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Executive Business Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">AI-Powered Operations Report</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">A boardroom-grade report combining financial performance, queue health, food demand, staffing intelligence, and predictive forecasts into one executive briefing.</p>
          </div>
          <div className="print-hidden flex flex-wrap gap-2">
            <button type="button" onClick={() => setExecutiveMode((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20">
              {executiveMode ? 'Investor view on' : 'Executive mode'}
            </button>
            <button onClick={downloadCsv} type="button" className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
              <FiDownload size={16} /> Export CSV
            </button>
            <button onClick={printReport} type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400 hover:text-white">
              <FiPrinter size={16} /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      {executiveMode && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="print-card rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-950/70 to-violet-500/10 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Boardroom briefing</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">A sharper executive narrative for investors and operators.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">The report now surfaces the metrics that matter most to leadership: revenue trajectory, demand spikes, workforce efficiency, and risk posture.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Revenue</p>
                <p className="mt-2 text-lg font-semibold text-white">{formatMoney(normalizedReport.financialSummary.totalRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Peak hour</p>
                <p className="mt-2 text-lg font-semibold text-cyan-300">{normalizedReport.orderAnalytics.peakOrderHour || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Risk</p>
                <p className="mt-2 text-lg font-semibold text-amber-300">{normalizedReport.riskDetection.length} signals</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="print-hidden grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {periods.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPeriod(item.key)}
            className={`rounded-3xl border px-4 py-4 text-left transition ${period === item.key ? 'border-cyan-400 bg-cyan-500/10 text-white' : 'border-white/10 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-white'}`}>
            <p className="text-sm uppercase tracking-[0.25rem] text-slate-400">{item.label}</p>
            <p className="mt-3 text-xl font-semibold">Select</p>
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="print-hidden grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-slate-400">From</span>
            <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">To</span>
            <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none" />
          </label>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Executive summary</p>
              <h2 className="mt-3 text-2xl font-semibold text-white print-text">{normalizedReport.executiveSummary}</h2>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{period.toUpperCase()}</div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {reportRows.map((item) => (
              <motion.div whileHover={{ y: -4, scale: 1.01 }} key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white print-text">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="print-card rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Boardroom insights</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {normalizedReport.aiBusinessInsights.map((insight, idx) => (
                <li key={idx} className="rounded-2xl bg-slate-900/80 p-4">{insight}</li>
              ))}
            </ul>
          </div>

          <div className="print-card rounded-3xl border border-white/10 bg-slate-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Executive recommendations</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {normalizedReport.aiRecommendations.map((item, idx) => (
                <li key={idx} className="rounded-2xl bg-slate-900/80 p-4">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Financial trajectory</p>
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={normalizedReport.visualAnalytics.revenueTrend}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(148,163,184,0.2)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#34D399" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Peak hour demand</p>
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedReport.visualAnalytics.peakHours.slice(0, 8)}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(148,163,184,0.2)' }} />
                <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Food demand intelligence</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {normalizedReport.foodIntelligence.mostSoldItems.slice(0, 4).map((item) => (
              <div key={item.name} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="font-semibold text-white">{item.name}</p>
                <p className="mt-2 text-sm text-slate-400">{formatNumber(item.quantity)} units • {formatMoney(item.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Workforce efficiency</p>
          <div className="mt-5 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedReport.visualAnalytics.workerComparison.slice(0, 6)}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="workerName" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(148,163,184,0.2)' }} />
                <Bar dataKey="efficiencyScore" radius={[8, 8, 0, 0]} fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Forecast & planning</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {Object.entries(normalizedReport.aiPredictions).filter(([key]) => key !== 'tomorrowFoodDemand').map(([key, value]) => (
              <div key={key} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <p className="text-sm capitalize text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="mt-2 text-lg font-semibold text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Risk & control</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            {normalizedReport.riskDetection.map((risk, idx) => (
              <li key={idx} className="rounded-2xl bg-slate-900/80 p-4">{risk}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Top performer</p>
          <p className="mt-4 text-xl font-semibold text-white">{normalizedReport.workerPerformance.bestWorkerOfTheDay?.workerName || 'N/A'}</p>
          <p className="mt-2 text-sm text-slate-400">Efficiency score {normalizedReport.workerPerformance.bestWorkerOfTheDay?.efficiencyScore || '—'}</p>
        </div>
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Peak hour</p>
          <p className="mt-4 text-xl font-semibold text-white">{normalizedReport.orderAnalytics.peakOrderHour || 'N/A'}</p>
          <p className="mt-2 text-sm text-slate-400">Hourly volume {formatNumber(normalizedReport.orderAnalytics.totalOrders)} orders</p>
        </div>
        <div className="print-card rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Customer behaviour</p>
          <p className="mt-4 text-xl font-semibold text-white">{normalizedReport.customerBehaviour.favouriteFood || 'N/A'}</p>
          <p className="mt-2 text-sm text-slate-400">Repeat customers {formatNumber(normalizedReport.customerBehaviour.repeatCustomers)}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminReport;
