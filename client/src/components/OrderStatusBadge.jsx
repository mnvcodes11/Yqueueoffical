import React from 'react';

const STYLES = {
  pending_payment: 'border border-amber-400/30 bg-amber-500/10 text-amber-200',
  paid: 'border border-sky-400/30 bg-sky-500/10 text-sky-200',
  preparing: 'border border-orange-400/30 bg-orange-500/10 text-orange-200',
  ready: 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  collected: 'border border-white/10 bg-white/10 text-slate-300',
  cancelled: 'border border-rose-400/30 bg-rose-500/10 text-rose-200',
};

const LABELS = {
  pending_payment: 'Payment Pending',
  paid: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

const OrderStatusBadge = ({ status }) => (
  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[status] || 'border border-white/10 bg-white/10 text-slate-300'}`}>
    {LABELS[status] || status}
  </span>
);

export default OrderStatusBadge;
