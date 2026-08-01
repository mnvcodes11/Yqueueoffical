import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArchive, FiArrowRight, FiCheckCircle, FiClock, FiZap } from 'react-icons/fi';
import * as orderService from '../services/orderService';
import { connectSocket } from '../services/socketService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const COLUMNS = [
  { status: 'paid', title: 'New Orders', nextStatus: 'preparing', nextLabel: 'Start Preparing' },
  { status: 'preparing', title: 'Preparing', nextStatus: 'ready', nextLabel: 'Mark Ready' },
  { status: 'ready', title: 'Ready for Pickup', nextStatus: null, nextLabel: null },
];

const WorkerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const [queueRes, historyRes] = await Promise.all([
        orderService.getKitchenOrders(),
        orderService.getStaffOrders('collected'),
      ]);
      setOrders(queueRes.orders || []);
      setHistory(historyRes.orders || []);
    } catch (err) {
      toast.error('Could not load the kitchen queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Live queue: any order update (from payment confirmation, another
  // worker's action, or a QR scan) is reflected here immediately.
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    const handleUpdate = (updatedOrder) => {
      setOrders((prev) => {
        const withoutOld = prev.filter((o) => o._id !== updatedOrder._id);
        const stillInKitchen = ['paid', 'preparing', 'ready'].includes(updatedOrder.status);
        return stillInKitchen ? [...withoutOld, updatedOrder] : withoutOld;
      });
    };

    socket.on('order:update', handleUpdate);
    return () => socket.off('order:update', handleUpdate);
  }, []);

  const advance = async (order, nextStatus) => {
    setUpdatingId(order._id);
    try {
      await orderService.updateOrderStatus(order._id, nextStatus);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary-950/70 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Kitchen Operations</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Live queue management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">Advance paid orders through preparation and hand them to students once the QR pickup is verified.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2"><span className="font-semibold text-white">{orders.length}</span> active</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2"><span className="font-semibold text-white">{history.length}</span> collected</div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
              <FiZap size={14} /> Live updates
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnOrders = orders
            .filter((o) => o.status === col.status)
            .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));

          return (
            <div key={col.status} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-white">{col.title}</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-400">{columnOrders.length}</span>
              </div>

              {columnOrders.length === 0 ? (
                <EmptyState icon={FiClock} title="No orders yet" message="This queue is clear right now." />
              ) : (
                <div className="space-y-3">
                  {columnOrders.map((order) => (
                    <div key={order._id} className="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {order.orderNumber || `Order #${order._id.slice(-6).toUpperCase()}`}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{order.student?.name}</p>
                        </div>
                        <span className="text-xs text-slate-400">₹{order.totalPrice}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded-full bg-white/10 px-2 py-0.5">Queue #{order.queueNumber ?? '—'}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5">ETA {order.estimatedTime ?? 15}m</span>
                      </div>
                      <ul className="mt-2 space-y-0.5 text-xs text-slate-400">
                        {order.items.map((item) => (
                          <li key={item.food}>{item.quantity}× {item.name}</li>
                        ))}
                      </ul>
                      {col.nextStatus ? (
                        <button
                          onClick={() => advance(order, col.nextStatus)}
                          disabled={updatingId === order._id}
                          className="btn-primary mt-3 flex w-full items-center justify-center gap-2 text-xs"
                        >
                          {updatingId === order._id ? 'Updating...' : <>{col.nextLabel} <FiArrowRight size={12} /></>}
                        </button>
                      ) : (
                        <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                          <FiCheckCircle size={12} /> Waiting for QR scan at counter
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center gap-2 font-semibold text-white">
          <FiArchive size={16} /> Recently Collected
        </div>
        {history.length === 0 ? (
          <div className="mt-3 rounded-[1.25rem] border border-dashed border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
            No completed pickups yet.
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {history.slice(0, 4).map((order) => (
              <div key={order._id} className="rounded-[1.25rem] border border-white/10 bg-slate-950/50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{order.orderNumber}</span>
                  <span className="text-xs text-slate-400">{order.student?.name}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Collected by {order.workerAssigned?.name || 'staff'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
