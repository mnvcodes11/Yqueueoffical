const ACTIVE_QUEUE_STATUSES = ['paid', 'preparing', 'ready'];

const getQueuePosition = (order, orders = []) => {
  if (!order) return 0;

  const activeOrders = orders
    .filter((candidate) => ACTIVE_QUEUE_STATUSES.includes(candidate.status))
    .sort((a, b) => {
      const aNumber = typeof a.queueNumber === 'number' && a.queueNumber > 0 ? a.queueNumber : Number.MAX_SAFE_INTEGER;
      const bNumber = typeof b.queueNumber === 'number' && b.queueNumber > 0 ? b.queueNumber : Number.MAX_SAFE_INTEGER;
      if (aNumber !== bNumber) return aNumber - bNumber;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  return activeOrders.findIndex((candidate) => candidate._id.toString() === order._id.toString()) + 1;
};

const buildQueueSnapshot = (order, orders = []) => {
  if (!order) return null;

  const position = getQueuePosition(order, orders);
  const activeOrders = orders.filter((candidate) => ACTIVE_QUEUE_STATUSES.includes(candidate.status));
  const preparingCount = activeOrders.filter((candidate) => candidate.status === 'preparing').length;
  const baseWait = Math.max(5, Number(order.estimatedTime || 12));
  const ordersBeforeYou = Math.max(position - 1, 0);
  const estimatedWaitMinutes = order.status === 'ready'
    ? 0
    : Math.max(3, ordersBeforeYou * 3 + preparingCount * 2 + Math.round(baseWait / 2));

  return {
    queuePosition: position || activeOrders.length + 1,
    ordersBeforeYou,
    estimatedWaitMinutes,
    currentStatus: order.status,
    counterNumber: order.counterNumber || 1,
    preparingCount,
  };
};

module.exports = {
  ACTIVE_QUEUE_STATUSES,
  buildQueueSnapshot,
};
