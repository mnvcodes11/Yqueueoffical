import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiClock, FiUsers, FiCheckCircle } from 'react-icons/fi';
import * as orderService from '../services/orderService';
import * as qrService from '../services/qrService';
import { connectSocket } from '../services/socketService';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderStatusBadge from '../components/OrderStatusBadge';
import QRCodeDisplay from '../components/QRCodeDisplay';

const STEPS = ['paid', 'preparing', 'ready', 'collected'];

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadQr = async (currentOrder) => {
    if (!currentOrder || currentOrder.qrUsed || !['paid', 'preparing', 'ready'].includes(currentOrder.status)) {
      setQrToken(null);
      return;
    }
    try {
      const res = await qrService.getQr(currentOrder._id);
      setQrToken(res.qrToken);
    } catch {
      setQrToken(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.getOrderById(id);
        setOrder(res.order);
        await loadQr(res.order);
      } catch (err) {
        toast.error('Could not load this order.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Live updates: the worker/kitchen side pushes status changes over the
  // same socket connection, so this page doesn't need to poll.
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;

    const handleUpdate = (updatedOrder) => {
      if (updatedOrder._id !== id) return;
      setOrder(updatedOrder);
      if (updatedOrder.status === 'ready') {
        loadQr(updatedOrder);
      }
      if (updatedOrder.status === 'ready' || updatedOrder.status === 'collected') {
        toast(updatedOrder.status === 'ready' ? 'Your order is ready for pickup!' : 'Order collected.', { icon: '🔔' });
      }
      if (updatedOrder.qrUsed) setQrToken(null);
    };

    socket.on('order:update', handleUpdate);
    return () => socket.off('order:update', handleUpdate);
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!order) return null;

  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/dashboard/orders" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
        <FiArrowLeft size={16} /> All orders
      </Link>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">{order.orderNumber || `Order #${order._id.slice(-6).toUpperCase()}`}</h1>
            {order.queueNumber && <p className="mt-1 text-sm text-slate-400">Queue Number #{order.queueNumber}</p>}
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.status !== 'cancelled' && order.status !== 'pending_payment' && (
          <div className="mt-6 flex items-center justify-between px-2">
            {STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full ${i <= stepIndex ? 'bg-primary-400' : 'bg-white/10'}`} />
                  <span className={`mt-1 text-[11px] capitalize ${i <= stepIndex ? 'font-medium text-primary-200' : 'text-slate-500'}`}>
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < stepIndex ? 'bg-primary-400' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
          {order.items.map((item) => (
            <div key={item.food} className="flex items-center justify-between text-sm text-slate-300">
              <span>{item.name} × {item.quantity}</span>
              <span className="font-medium text-white">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-slate-400">Total Paid</span>
          <span className="text-xl font-semibold text-primary-200">₹{order.totalPrice}</span>
        </div>

        {order.queueSnapshot && (
          <div className="mt-4 rounded-[1.5rem] border border-primary-400/20 bg-primary-500/10 p-4">
            <div className="flex items-center gap-2 font-semibold text-primary-200">
              <FiUsers size={16} /> Live Queue Status
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Position</p>
                <p className="font-semibold text-white">#{order.queueSnapshot.queuePosition}</p>
              </div>
              <div>
                <p className="text-slate-400">Approx wait</p>
                <p className="font-semibold text-white">{order.queueSnapshot.estimatedWaitMinutes} min</p>
              </div>
            </div>
          </div>
        )}

        {qrToken ? (
          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
              <FiCheckCircle size={16} className="text-emerald-400" /> Ready for pickup at the counter
            </div>
            <QRCodeDisplay token={qrToken} />
          </div>
        ) : (
          <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">
            <div className="flex items-center gap-2"><FiClock size={14} /> QR will appear as soon as this order becomes ready for pickup.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
