const safeDivide = (numerator, denominator) => (denominator ? numerator / denominator : 0);

const toDate = (value) => (value ? new Date(value) : null);

const getHourLabel = (date) => `${String(date.getHours()).padStart(2, '0')}:00`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const buildDigitalTwinSnapshot = ({ orders = [], foods = [], users = [], now = new Date() } = {}) => {
  const referenceTime = toDate(now) || new Date();
  const startOfToday = new Date(referenceTime);
  startOfToday.setHours(0, 0, 0, 0);

  const todaysOrders = (orders || []).filter((order) => {
    const createdAt = toDate(order.createdAt);
    return createdAt && createdAt >= startOfToday;
  });

  const liveOrders = todaysOrders.filter((order) => ['paid', 'preparing', 'ready'].includes(order.status));
  const readyOrders = todaysOrders.filter((order) => order.status === 'ready');
  const pendingOrders = todaysOrders.filter((order) => order.status === 'pending_payment');
  const completedOrders = todaysOrders.filter((order) => order.status === 'collected');
  const paidOrders = todaysOrders.filter((order) => order.payment?.status === 'paid' || ['paid', 'preparing', 'ready', 'collected'].includes(order.status));

  const revenue = paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const averageWaitMinutes = safeDivide(
    liveOrders.reduce((sum, order) => sum + Math.max(0, (referenceTime.getTime() - toDate(order.createdAt).getTime()) / 60000), 0),
    Math.max(1, liveOrders.length)
  );
  const maxWaitMinutes = liveOrders.reduce((max, order) => {
    const age = Math.max(0, (referenceTime.getTime() - toDate(order.createdAt).getTime()) / 60000);
    return Math.max(max, age);
  }, 0);

  const hourlyCounts = todaysOrders.reduce((acc, order) => {
    const createdAt = toDate(order.createdAt);
    if (!createdAt) return acc;
    const hourKey = getHourLabel(createdAt);
    acc[hourKey] = (acc[hourKey] || 0) + 1;
    return acc;
  }, {});
  const peakHour = Object.entries(hourlyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '12:00';

  const inventory = (foods || []).map((food) => {
    const stock = food.stock ?? null;
    const isLow = typeof stock === 'number' && stock <= 4;
    const predictedFinishMinutes = typeof stock === 'number' && stock > 0
      ? Math.round(stock * 4.5)
      : null;
    return {
      id: food._id || food.id || food.name,
      name: food.name,
      stock,
      low: isLow,
      predictedFinishMinutes,
      price: food.price || 0,
    };
  });

  const workerActivity = (users || []).filter((user) => user.role === 'worker').map((worker) => {
    const workerOrders = completedOrders.filter((order) => order.workerAssigned?.toString?.() === worker._id?.toString?.() || order.workerAssigned?.toString?.() === worker.id?.toString?.());
    const efficiency = Math.min(100, 65 + workerOrders.length * 4 + (workerOrders.length > 0 ? 4 : 0));
    return {
      id: worker._id || worker.id,
      name: worker.name || worker.email || 'Worker',
      completedOrders: workerOrders.length,
      efficiency,
      currentTask: workerOrders.length > 0 ? 'Packing & dispatch' : 'Idle rotation',
    };
  });

  const queueLength = liveOrders.length + pendingOrders.length;

  const workerUtilization = workerActivity.length
    ? workerActivity.reduce((sum, worker) => sum + worker.efficiency, 0) / workerActivity.length
    : 0;

  const counterLoad = [
    { id: 'counter-1', name: 'Counter 1', load: clamp(45 + queueLength * 6 + (readyOrders.length > 0 ? 8 : 0), 20, 100) },
    { id: 'counter-2', name: 'Counter 2', load: clamp(35 + Math.max(0, queueLength - 3) * 8, 20, 100) },
    { id: 'counter-3', name: 'Counter 3', load: clamp(25 + pendingOrders.length * 5, 20, 100) },
  ];
  const throughput = safeDivide(completedOrders.length, Math.max(1, todaysOrders.length)) * 100;
  const orderCompletionTime = Math.max(8, 16 - Math.min(8, queueLength * 0.7));
  const studentArrivalRate = safeDivide(todaysOrders.length, Math.max(1, 8));
  const serviceBottlenecks = [];
  if (queueLength > 8) serviceBottlenecks.push('Queue pressure is building at the pickup window.');
  if (readyOrders.length > 2) serviceBottlenecks.push('Pickup station is creating a backup for completed items.');
  if (workerActivity.every((worker) => worker.completedOrders === 0)) serviceBottlenecks.push('No active worker throughput has been recorded yet.');

  const recommendations = [];
  if (queueLength > 8) recommendations.push({ title: 'Open Counter 3', detail: 'Current wait time is increasing and the queue is beyond the safe threshold.' });
  if (averageWaitMinutes > 10) recommendations.push({ title: 'Shift a worker to Counter 2', detail: 'Queue depth is creating a bottleneck in the main service lane.' });
  const lowInventory = inventory.filter((item) => item.low).slice(0, 2);
  lowInventory.forEach((item) => {
    recommendations.push({ title: `Restock ${item.name}`, detail: `Inventory is projected to finish in ${item.predictedFinishMinutes} minutes.` });
  });
  if (peakHour) recommendations.push({ title: 'Prepare for lunch rush', detail: `Peak demand is trending around ${peakHour}.` });
  if (readyOrders.length > 2) recommendations.push({ title: 'Reduce pickup queue', detail: 'Route completed orders to the pickup lane with a dedicated handoff.' });

  const forecastWindow = 60;
  const orderRate = safeDivide(todaysOrders.length, Math.max(1, 8));
  const forecastOrders = Math.round(orderRate * (forecastWindow / 15));
  const forecastRevenue = Math.round(revenue * (forecastWindow / 60));
  const forecastQueue = Math.max(0, Math.round(queueLength + orderRate * 2));
  const forecastWait = Math.round(clamp(averageWaitMinutes + orderRate * 1.8, 4, 40));
  const forecastInventory = inventory.slice(0, 4).map((item) => ({
    name: item.name,
    remaining: item.stock ?? 0,
    finishMinutes: item.predictedFinishMinutes ?? 0,
  }));

  const flow = liveOrders.slice(0, 6).map((order) => ({
    id: order._id || order.id || `order-${Math.random()}`,
    orderNumber: order.orderNumber || 'YQ-0001',
    status: order.status,
    progress: order.status === 'paid' ? 35 : order.status === 'preparing' ? 70 : 95,
  }));

  return {
    generatedAt: referenceTime.toISOString(),
    metrics: {
      ordersToday: todaysOrders.length,
      revenueToday: revenue,
      currentQueue: queueLength,
      averageWaitMinutes: Number(averageWaitMinutes.toFixed(1)),
      maxWaitMinutes: Number(maxWaitMinutes.toFixed(1)),
      peakHour,
      throughput: Number(throughput.toFixed(1)),
      orderCompletionTime: Number(orderCompletionTime.toFixed(1)),
      studentArrivalRate: Number(studentArrivalRate.toFixed(2)),
      workerUtilization: Number(workerUtilization.toFixed(1)),
      counterUtilization: Number(counterLoad.reduce((sum, item) => sum + item.load, 0) / counterLoad.length),
      inventoryRemaining: inventory.reduce((sum, item) => sum + (item.stock ?? 0), 0),
    },
    counters: counterLoad,
    workers: workerActivity,
    inventory,
    recommendations,
    serviceBottlenecks,
    flow,
    heatmaps: {
      busyCounters: counterLoad.map((counter) => ({ name: counter.name, value: counter.load })),
      workerActivity: workerActivity.map((worker) => ({ name: worker.name, value: worker.efficiency })),
      queueDensity: [
        { name: 'Counter 1', value: Math.min(100, queueLength * 8 + 20) },
        { name: 'Counter 2', value: Math.min(100, queueLength * 9 + 15) },
        { name: 'Counter 3', value: Math.min(100, queueLength * 6 + 10) },
      ],
      inventoryConsumption: inventory.map((item) => ({ name: item.name, value: clamp(100 - ((item.stock ?? 0) * 10), 0, 100) })),
    },
    forecasts: {
      next15Minutes: {
        orders: Math.round(forecastOrders * 0.25),
        revenue: Math.round(forecastRevenue * 0.25),
        queue: Math.max(0, Math.round(forecastQueue * 0.25)),
        wait: Math.max(4, Math.round(forecastWait * 0.25)),
      },
      next30Minutes: {
        orders: Math.round(forecastOrders * 0.5),
        revenue: Math.round(forecastRevenue * 0.5),
        queue: Math.max(0, Math.round(forecastQueue * 0.5)),
        wait: Math.max(4, Math.round(forecastWait * 0.5)),
      },
      nextHour: {
        orders: forecastOrders,
        revenue: forecastRevenue,
        queue: forecastQueue,
        wait: forecastWait,
      },
    },
    insights: [
      `${Math.round(averageWaitMinutes)} minute average wait across ${queueLength} active orders.`,
      `${peakHour} is the strongest demand window in the current shift.`,
      `${workerActivity[0]?.name || 'Staff'} is driving the highest throughput today.`,
      `Counter utilization is ${Math.round(counterLoad.reduce((sum, item) => sum + item.load, 0) / counterLoad.length)}%.`,
    ],
  };
};

module.exports = { buildDigitalTwinSnapshot };
