import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPackage, FiClock } from 'react-icons/fi';
import * as orderService from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import OrderStatusBadge from '../components/OrderStatusBadge';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderService.getMyOrders();
        setOrders(res.orders);
      } catch (err) {
        toast.error('Could not load your orders.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div>
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-primary-950/70 p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Order History</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Recent pickups and payments</h1>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2"><FiClock size={14} /> Updates arrive live</div>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-3xl">
        {orders.length === 0 ? (
          <EmptyState icon={FiPackage} title="No orders yet" message="Your order history will show up here once you place your first pickup request." />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={order.status === 'pending_payment' ? `/dashboard/checkout/${order._id}` : `/dashboard/orders/${order._id}`}
                className="card flex items-center justify-between p-4 transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-medium text-white">
                    {order.orderNumber || `Order #${order._id.slice(-6).toUpperCase()}`}
                    {order.queueNumber && <span className="ml-2 font-normal text-slate-400">· Queue #{order.queueNumber}</span>}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''} · ₹{order.totalPrice} ·{' '}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
