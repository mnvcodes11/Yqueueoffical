const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { getCache, setCache } = require('../utils/simpleCache');
const { buildDigitalTwinSnapshot } = require('../utils/digitalTwinEngine');
const Food = require('../models/Food');

const normalizeDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeHourKey = (date) => {
  const hour = String(date.getHours()).padStart(2, '0');
  return `${hour}:00`; 
};

const buildDateSeries = (startDate, endDate, dataMap, defaultPoint = { revenue: 0, orders: 0 }) => {
  const series = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const key = normalizeDateKey(current);
    const point = dataMap[key] || defaultPoint;
    series.push({ date: key, ...point });
    current.setDate(current.getDate() + 1);
  }

  return series;
};

const buildHourSeries = (hourMap) => {
  return Array.from({ length: 24 }, (_, index) => {
    const key = `${String(index).padStart(2, '0')}:00`;
    return { hour: key, orders: hourMap[key] || 0 };
  });
};

const safeDivide = (numerator, denominator) => (denominator ? numerator / denominator : 0);

const toPercent = (value) => Number((value * 100).toFixed(1));

const formatValue = (value) => (typeof value === 'number' ? Number(value.toFixed(2)) : value);

const comparePeriod = (current, previous) => {
  if (!previous) return { diff: current, percent: 0 };
  const diff = current - previous;
  const percent = previous === 0 ? 0 : (diff / Math.abs(previous)) * 100;
  return { diff: formatValue(diff), percent: formatValue(percent) };
};

const parseReportDates = (type, fromDate, toDate) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  switch (type) {
    case 'weekly':
      start.setDate(start.getDate() - 6);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      start.setDate(start.getDate() + 1);
      break;
    case 'quarterly':
      start.setMonth(start.getMonth() - 3);
      start.setDate(start.getDate() + 1);
      break;
    case 'semester':
      start.setMonth(start.getMonth() - 6);
      start.setDate(start.getDate() + 1);
      break;
    case 'daily':
      break;
    case 'custom':
      if (!fromDate || !toDate) {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
      const customStart = new Date(fromDate);
      const customEnd = new Date(toDate);
      customStart.setHours(0, 0, 0, 0);
      customEnd.setHours(23, 59, 59, 999);
      return { start: customStart, end: customEnd };
    default:
      start.setDate(start.getDate() - 6);
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const getPreviousPeriod = (start, end) => {
  const durationMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  previousStart.setHours(0, 0, 0, 0);
  previousEnd.setHours(23, 59, 59, 999);
  return { previousStart, previousEnd };
};

const getSummaryCacheKey = (path, params) => `${path}:${JSON.stringify(params)}`;

const buildPrediction = (series, currentTotal, previousTotal, label) => {
  const dailyAverage = safeDivide(currentTotal, series.length);
  const priorDailyAverage = safeDivide(previousTotal, series.length);
  const growth = safeDivide(currentTotal - previousTotal, Math.max(previousTotal, 1));
  const predicted = currentTotal * (1 + growth * 0.15);
  return {
    label,
    predicted: formatValue(predicted),
    growthPercent: toPercent(growth),
    baseAverage: formatValue(dailyAverage),
    priorAverage: formatValue(priorDailyAverage),
  };
};

const buildAIInsights = ({ revenueComparison, cancelRate, queueAccuracy, topFoods, workerRanks, revenueTrend }) => {
  const insights = [];
  if (revenueComparison.percent > 5) {
    insights.push(`Revenue increased by ${Math.abs(revenueComparison.percent)}% compared to the previous period.`);
  } else if (revenueComparison.percent < -5) {
    insights.push(`Revenue declined by ${Math.abs(revenueComparison.percent)}% versus the prior period.`);
  } else {
    insights.push('Revenue remained stable compared to the previous period.');
  }

  if (cancelRate > 0.15) {
    insights.push('Cancellation rate is elevated, recommending an urgent review of payment and pickup workflows.');
  }

  if (queueAccuracy < 85) {
    insights.push('Queue wait time estimates are less accurate than expected; use delay analysis to optimize counter load.');
  }

  if (topFoods.length) {
    insights.push(`Top seller is ${topFoods[0].name}, generating strong demand this period.`);
  }

  if (workerRanks.length) {
    const best = workerRanks[0];
    insights.push(`Best worker of the period is ${best.workerName} with a score of ${best.efficiencyScore}.`);
  }

  if (revenueTrend > 0) {
    insights.push('Revenue trend is upward, supporting a capacity increase for the next busiest hour.');
  }

  return insights;
};

const buildRecommendations = ({ peakHour, topFoods, cancelRate, workerRanks }) => {
  const recommendations = [];
  if (peakHour) {
    recommendations.push(`Increase worker coverage around ${peakHour} to improve queue throughput.`);
  }
  if (topFoods.length) {
    recommendations.push(`Prepare additional ${topFoods[0].name} ahead of peak demand to reduce stockouts.`);
  }
  if (cancelRate > 0.12) {
    recommendations.push('Investigate cancellation causes and reduce payment friction during checkout.');
  }
  if (workerRanks.length > 1) {
    recommendations.push(`Recognize ${workerRanks[0].workerName} for strong performance and coach ${workerRanks[workerRanks.length - 1].workerName} to improve speed.`);
  }
  return recommendations;
};

const detectRisks = ({ revenueComparison, cancelRate, repeatCustomers, workerRanks, queueDelayRate }) => {
  const risks = [];
  if (revenueComparison.percent < -10) {
    risks.push('Declining revenue trend detected.');
  }
  if (cancelRate > 0.18) {
    risks.push('High cancellation volume may be affecting order conversion.');
  }
  if (repeatCustomers < 0.2) {
    risks.push('Low repeat customer rate suggests retention risk.');
  }
  if (queueDelayRate > 0.25) {
    risks.push('Queue delays are frequent; verify staffing and preparation speed.');
  }
  if (workerRanks.find((worker) => worker.orders === 0)) {
    risks.push('One or more workers recorded no completed orders; investigate assignment or inactivity.');
  }
  return risks;
};

const derivateWorkerScore = (orders, avgServiceTime, delayRate) => {
  const speedScore = avgServiceTime > 0 ? Math.max(0, 120 - avgServiceTime) : 100;
  const delayPenalty = delayRate * 100;
  const score = Math.max(0, (orders * 8) + speedScore - delayPenalty);
  return Number(score.toFixed(0));
};

const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const range = Number(req.query.range) || 7;
  const rangeDays = [7, 14, 30].includes(range) ? range : 7;

  const today = new Date();
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (rangeDays - 1));
  startDate.setHours(0, 0, 0, 0);

  const cacheKey = getSummaryCacheKey('analyticsSummary', { rangeDays });
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const [totalUsers, studentCount, workerCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'worker' }),
  ]);

  const statusCountsAgg = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statusCounts = statusCountsAgg.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const dailyRevenueAgg = await Order.aggregate([
    {
      $match: {
        'payment.status': 'paid',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyRevenueMap = dailyRevenueAgg.reduce((acc, item) => {
    acc[item._id] = { revenue: item.revenue, orders: item.orders };
    return acc;
  }, {});

  const dailyRevenue = buildDateSeries(startDate, endDate, dailyRevenueMap);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

  const [todayStats, yesterdayStats, liveOrders, recentOrders, rangeOrders] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
    ]),
    Order.find({ status: { $in: ['paid', 'preparing', 'ready'] } }).sort({ queueNumber: 1, createdAt: 1 }).populate('student', 'name').populate('workerAssigned', 'name').lean(),
    Order.find({ createdAt: { $gte: new Date(todayStart.getTime() - 6 * 60 * 60 * 1000) } }).sort({ createdAt: -1 }).limit(8).populate('student', 'name').populate('workerAssigned', 'name').lean(),
    Order.find({ createdAt: { $gte: startDate, $lte: endDate } }).select('items totalPrice workerAssigned student status payment createdAt').populate('student', 'name').populate('workerAssigned', 'name').lean(),
  ]);

  const todayStatusMap = todayStats.reduce((acc, item) => {
    acc[item._id] = { count: item.count, revenue: item.revenue };
    return acc;
  }, {});

  const yesterdayStatusMap = yesterdayStats.reduce((acc, item) => {
    acc[item._id] = { count: item.count, revenue: item.revenue };
    return acc;
  }, {});

  const todayRevenue = (todayStatusMap.paid?.revenue || 0) + (todayStatusMap.preparing?.revenue || 0) + (todayStatusMap.ready?.revenue || 0);
  const yesterdayRevenue = (yesterdayStatusMap.paid?.revenue || 0) + (yesterdayStatusMap.preparing?.revenue || 0) + (yesterdayStatusMap.ready?.revenue || 0);
  const todayOrderCount = todayStats.reduce((sum, item) => sum + item.count, 0);
  const yesterdayOrderCount = yesterdayStats.reduce((sum, item) => sum + item.count, 0);
  const pendingOrders = todayStatusMap.pending_payment?.count || 0;
  const preparingOrders = todayStatusMap.preparing?.count || 0;
  const readyOrders = todayStatusMap.ready?.count || 0;
  const completedOrders = todayStatusMap.collected?.count || 0;
  const cancelledOrders = todayStatusMap.cancelled?.count || 0;

  const liveOrderAges = liveOrders.map((order) => (Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const averageWaitingTime = safeDivide(liveOrderAges.reduce((sum, value) => sum + value, 0), Math.max(1, liveOrderAges.length));
  const completedWithTime = recentOrders.filter((order) => order.status === 'collected' || order.status === 'ready').map((order) => {
    const startTime = new Date(order.createdAt).getTime();
    const endTime = new Date(order.verifiedAt || order.updatedAt || order.createdAt).getTime();
    return (endTime - startTime) / 60000;
  });
  const averagePreparationTime = safeDivide(completedWithTime.reduce((sum, value) => sum + value, 0), Math.max(1, completedWithTime.length));

  const currentQueueLength = liveOrders.length;
  const activeWorkers = new Set(liveOrders.filter((order) => order.workerAssigned).map((order) => order.workerAssigned._id?.toString?.() || order.workerAssigned.toString())).size;

  const hourlyDemandAgg = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);

  const hourlyOrderMap = hourlyDemandAgg.reduce((acc, item) => {
    const hourLabel = `${String(item._id).padStart(2, '0')}:00`;
    acc[hourLabel] = item.count;
    return acc;
  }, {});
  const peakHour = Object.entries(hourlyOrderMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const queueEfficiency = Math.max(0, 100 - (cancelledOrders / Math.max(1, todayOrderCount)) * 100);
  const workerProductivity = safeDivide(completedOrders, Math.max(1, activeWorkers));
  const businessHealthScore = Math.max(0, Math.min(100, Math.round(76 + (todayRevenue > yesterdayRevenue ? 8 : 0) + (queueEfficiency / 10) - (cancelledOrders * 2))));

  const revenueGrowth = comparePeriod(todayRevenue, yesterdayRevenue);
  const orderGrowth = comparePeriod(todayOrderCount, yesterdayOrderCount);

  const topFoods = Object.values(rangeOrders.reduce((acc, order) => {
    order.items?.forEach((item) => {
      const name = item.name || 'Menu item';
      const existing = acc[name] || { name, quantity: 0, revenue: 0 };
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      existing.quantity += quantity;
      existing.revenue += price * quantity;
      acc[name] = existing;
    });
    return acc;
  }, {})).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  const staffPerformance = Object.values(rangeOrders.reduce((acc, order) => {
    const worker = order.workerAssigned;
    if (!worker) return acc;
    const workerId = worker._id?.toString?.() || worker.toString?.() || String(worker);
    const existing = acc[workerId] || { workerId, workerName: worker.name || 'Worker', orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += Number(order.totalPrice || 0);
    acc[workerId] = existing;
    return acc;
  }, {})).sort((a, b) => b.orders - a.orders).slice(0, 5);

  const alerts = [];
  if (currentQueueLength > 10) alerts.push('Queue load is above target.');
  if (cancelledOrders > 2) alerts.push('Cancellation spike detected.');
  if (averageWaitingTime > 12) alerts.push('Average waiting time is rising.');
  if (activeWorkers < 2) alerts.push('Worker coverage is thin for current load.');
  if (pendingOrders > 5) alerts.push('Several orders still await payment confirmation.');

  const insights = [];
  if (revenueGrowth.percent > 5) insights.push(`Revenue increased by ${Math.abs(revenueGrowth.percent)}% compared to yesterday.`);
  if (revenueGrowth.percent < -5) insights.push(`Revenue declined by ${Math.abs(revenueGrowth.percent)}% compared to yesterday.`);
  if (currentQueueLength > readyOrders) insights.push('Queue pressure is building; consider additional counter support.');
  if (activeWorkers > 0) insights.push(`Today’s fastest throughput is being supported by ${activeWorkers} active workers.`);
  if (readyOrders > 0) insights.push(`There are ${readyOrders} orders ready for pickup and should be cleared quickly.`);

  const activityFeed = recentOrders.map((order) => {
    const statusLabel = order.status === 'paid' ? 'Payment confirmed' : order.status === 'preparing' ? 'Order in prep' : order.status === 'ready' ? 'Ready for pickup' : order.status === 'collected' ? 'Collected' : 'Updated';
    return {
      id: order._id,
      title: `${statusLabel} • ${order.orderNumber || 'Order'}`,
      detail: `${order.student?.name || 'Customer'} • ${order.status}`,
      timestamp: order.createdAt,
    };
  });

  const response = {
    success: true,
    summary: {
      totalUsers,
      studentCount,
      workerCount,
      activeOrders: (statusCounts.paid || 0) + (statusCounts.preparing || 0) + (statusCounts.ready || 0),
      pendingPayments: statusCounts.pending_payment || 0,
      canceledOrders: statusCounts.cancelled || 0,
      totalRevenue: dailyRevenue.reduce((sum, item) => sum + item.revenue, 0),
      averageOrderValue: safeDivide(dailyRevenue.reduce((sum, item) => sum + item.revenue, 0), dailyRevenue.reduce((sum, item) => sum + item.orders, 0)),
      paidOrderCount: dailyRevenue.reduce((sum, item) => sum + item.orders, 0),
      todayRevenue,
      todayOrders: todayOrderCount,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,
      averageWaitingTime: formatValue(averageWaitingTime),
      averagePreparationTime: formatValue(averagePreparationTime),
      currentQueueLength,
      activeWorkers,
      peakHour,
      revenueGrowth: revenueGrowth.percent,
      orderGrowth: orderGrowth.percent,
      businessHealthScore,
      queueEfficiency: formatValue(queueEfficiency),
      workerProductivity: formatValue(workerProductivity),
      dailyRevenue,
      statusCounts,
      topFoods,
      staffPerformance,
      activityFeed,
      alerts,
      insights,
      insight: {
        revenueTrend: dailyRevenue.length ? dailyRevenue[dailyRevenue.length - 1].revenue - dailyRevenue[0].revenue : 0,
        busiestWorker: 'N/A',
      },
    },
  };

  setCache(cacheKey, response, 45 * 1000);
  res.status(200).json(response);
});

const getDigitalTwin = asyncHandler(async (req, res) => {
  const cacheKey = 'digitalTwin:live';
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }




  const [orders, foods, users] = await Promise.all([
    Order.find({}).sort({ createdAt: -1 }).lean(),
    Food.find({}).lean(),
    User.find({}).select('name email role').lean(),
  ]);

  const payload = {
    success: true,
    twin: buildDigitalTwinSnapshot({ orders, foods, users }),
  };

  setCache(cacheKey, payload, 15 * 1000);
  res.status(200).json(payload);
});

const getAnalyticsReport = asyncHandler(async (req, res) => {
  const type = String(req.query.type || 'daily').toLowerCase();
  const fromDate = req.query.startDate;
  const toDate = req.query.endDate;
  const { start, end } = parseReportDates(type, fromDate, toDate);
  const { previousStart, previousEnd } = getPreviousPeriod(start, end);

  const cacheKey = getSummaryCacheKey('analyticsReport', { type, fromDate, toDate });
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  const [allOrders, ordersInRange, previousOrders] = await Promise.all([
    Order.find({}).select('createdAt status totalPrice payment items student workerAssigned estimatedTime verifiedAt updatedAt qrUsed').lean(),
    Order.find({ createdAt: { $gte: start, $lte: end } }).select('createdAt status totalPrice payment items student workerAssigned estimatedTime verifiedAt updatedAt qrUsed').lean(),
    Order.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).select('createdAt status totalPrice payment items student workerAssigned estimatedTime verifiedAt updatedAt qrUsed').lean(),
  ]);

  const reportLengthDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const currentOrders = ordersInRange;
  const priorOrders = previousOrders;

  const paidOrders = currentOrders.filter((order) => order.payment?.status === 'paid');
  const collectedOrders = currentOrders.filter((order) => order.status === 'collected');
  const pendingOrders = currentOrders.filter((order) => order.status === 'pending_payment');
  const canceledOrders = currentOrders.filter((order) => order.status === 'cancelled');
  const refundedOrders = currentOrders.filter((order) => order.payment?.status === 'cancelled' || order.payment?.status === 'failed');

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const netRevenue = totalRevenue * 0.92;
  const estimatedProfit = netRevenue * 0.28;
  const refundAmount = refundedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const cancellationLoss = canceledOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const averageOrderValue = safeDivide(totalRevenue, paidOrders.length);

  const dailyOrdersMap = currentOrders.reduce((acc, order) => {
    const key = normalizeDateKey(order.createdAt);
    acc[key] = acc[key] || { orders: 0, revenue: 0 };
    acc[key].orders += 1;
    acc[key].revenue += order.totalPrice;
    return acc;
  }, {});

  const dailyRevenueSeries = buildDateSeries(start, end, dailyOrdersMap, { revenue: 0, orders: 0 });

  const hourlyOrdersMap = currentOrders.reduce((acc, order) => {
    const key = normalizeHourKey(order.createdAt);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const hourlyOrders = buildHourSeries(hourlyOrdersMap);
  const peakHour = hourlyOrders.reduce((best, hour) => (hour.orders > best.orders ? hour : best), { hour: null, orders: 0 }).hour;
  const averageOrdersPerHour = safeDivide(currentOrders.length, 24);

  const completedWithTime = collectedOrders.map((order) => {
    const startTime = order.createdAt;
    const endTime = order.verifiedAt || order.updatedAt || order.createdAt;
    const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000;
    return { ...order, durationMinutes };
  });

  const averageQueueTime = safeDivide(completedWithTime.reduce((sum, order) => sum + (order.durationMinutes || 0), 0), completedWithTime.length);
  const averagePreparationTime = averageQueueTime;

  const foodAgg = {};
  currentOrders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.name;
      if (!foodAgg[key]) {
        foodAgg[key] = { name: item.name, quantity: 0, revenue: 0, firstSale: order.createdAt, lastSale: order.createdAt };
      }
      foodAgg[key].quantity += item.quantity;
      foodAgg[key].revenue += item.price * item.quantity;
      if (order.createdAt < foodAgg[key].firstSale) foodAgg[key].firstSale = order.createdAt;
      if (order.createdAt > foodAgg[key].lastSale) foodAgg[key].lastSale = order.createdAt;
    });
  });

  const foodsByQuantity = Object.values(foodAgg).sort((a, b) => b.quantity - a.quantity);
  const foodsByRevenue = Object.values(foodAgg).sort((a, b) => b.revenue - a.revenue);
  const mostSoldItems = foodsByQuantity.slice(0, 5);
  const leastSoldItems = foodsByQuantity.slice(-5).reverse();
  const highestRevenueItem = foodsByRevenue[0] || null;
  const lowestRevenueItem = foodsByRevenue[foodsByRevenue.length - 1] || null;
  const fastestSellingItem = foodsByQuantity[0] || null;
  const slowestSellingItem = foodsByQuantity[foodsByQuantity.length - 1] || null;
  const foodPopularityRanking = foodsByQuantity.map((item, index) => ({ rank: index + 1, name: item.name, quantity: item.quantity }));

  const previousPaidOrders = priorOrders.filter((order) => order.payment?.status === 'paid');
  const currentTotalQuantity = Object.values(foodAgg).reduce((sum, item) => sum + item.quantity, 0);
  const previousAgg = previousPaidOrders.reduce((acc, order) => {
    order.items.forEach((item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {});
  const demandTrend = foodsByQuantity.slice(0, 3).map((item) => ({
    name: item.name,
    current: item.quantity,
    previous: previousAgg[item.name] || 0,
    growthPercent: toPercent(safeDivide(item.quantity - (previousAgg[item.name] || 0), Math.max(previousAgg[item.name], 1))),
  }));

  const predictedTomorrowDemand = foodsByQuantity.slice(0, 5).map((item) => {
    const dailyAverage = safeDivide(item.quantity, reportLengthDays);
    const growthRate = demandTrend.find((trend) => trend.name === item.name)?.growthPercent || 0;
    const forecast = dailyAverage * (1 + growthRate / 100);
    return { name: item.name, forecast: Math.max(0, Number(forecast.toFixed(1))) };
  });

  const workerAgg = {};
  const priorWorkerAgg = {};

  collectedOrders.forEach((order) => {
    if (!order.workerAssigned) return;
    const id = order.workerAssigned.toString();
    const durationMinutes = (new Date(order.verifiedAt || order.updatedAt || order.createdAt).getTime() - new Date(order.createdAt).getTime()) / 60000;
    workerAgg[id] = workerAgg[id] || { workerId: id, orders: 0, totalMinutes: 0, delayCount: 0 };
    workerAgg[id].orders += 1;
    workerAgg[id].totalMinutes += durationMinutes;
    if (durationMinutes > (order.estimatedTime || 15)) {
      workerAgg[id].delayCount += 1;
    }
  });

  priorOrders.filter((order) => order.status === 'collected').forEach((order) => {
    if (!order.workerAssigned) return;
    const id = order.workerAssigned.toString();
    const durationMinutes = (new Date(order.verifiedAt || order.updatedAt || order.createdAt).getTime() - new Date(order.createdAt).getTime()) / 60000;
    priorWorkerAgg[id] = priorWorkerAgg[id] || { orders: 0, totalMinutes: 0 };
    priorWorkerAgg[id].orders += 1;
    priorWorkerAgg[id].totalMinutes += durationMinutes;
  });

  const workerRanks = await Promise.all(Object.entries(workerAgg).map(async ([workerId, stats]) => {
    const user = await User.findById(workerId).select('name').lean();
    const avgServiceTime = safeDivide(stats.totalMinutes, stats.orders);
    const delayRate = safeDivide(stats.delayCount, stats.orders);
    const score = derivateWorkerScore(stats.orders, avgServiceTime, delayRate);
    const previous = priorWorkerAgg[workerId] || { orders: 0, totalMinutes: 0 };
    const prevAvg = safeDivide(previous.totalMinutes, previous.orders);
    const improvement = stats.orders - previous.orders;
    return {
      workerId,
      workerName: user?.name || 'Unknown',
      orders: stats.orders,
      averagePreparationTime: formatValue(avgServiceTime),
      averageDeliveryTime: formatValue(avgServiceTime),
      efficiencyScore: score,
      delayPercent: toPercent(delayRate),
      idleTime: stats.orders === 0 ? 100 : Number(Math.max(0, 20 - stats.orders).toFixed(0)),
      overallRating: Number(Math.min(5, Math.max(1, 3 + score / 100)).toFixed(1)),
      bestWorkerImpact: improvement,
    };
  }));

  workerRanks.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  const bestWorkerOfThePeriod = workerRanks[0] || null;
  const mostImprovedWorker = workerRanks.reduce((best, worker) => {
    if (!best || worker.bestWorkerImpact > best.bestWorkerImpact) return worker;
    return best;
  }, null);

  const uniqueCustomers = new Set(paidOrders.map((order) => order.student.toString()));
  const orderCountsByCustomer = paidOrders.reduce((acc, order) => {
    const studentId = order.student.toString();
    acc[studentId] = (acc[studentId] || 0) + 1;
    return acc;
  }, {});
  const repeatCustomers = Object.values(orderCountsByCustomer).filter((count) => count > 1).length;
  const newCustomers = new Set(currentOrders.filter((order) => {
    return !allOrders.some((older) => older.student.toString() === order.student.toString() && older.createdAt < start);
  }).map((order) => order.student.toString())).size;
  const favouriteFood = mostSoldItems[0]?.name || 'N/A';
  const purchaseFrequency = safeDivide(currentOrders.length, uniqueCustomers.size);

  const previousPaidRevenue = previousPaidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
  const revenueComparison = comparePeriod(totalRevenue, previousPaidRevenue);

  const estimatedWaitAccuracy = safeDivide(averageQueueTime, currentOrders.reduce((sum, order) => sum + (order.estimatedTime || 15), 0) / Math.max(1, currentOrders.length));

  const dailyAverageOrders = safeDivide(currentOrders.length, Math.max(1, reportLengthDays));
  const dailyAverageRevenue = safeDivide(totalRevenue, Math.max(1, reportLengthDays));
  const averageRevenuesByDay = dailyRevenueSeries.length ? safeDivide(dailyRevenueSeries.reduce((sum, point) => sum + point.revenue, 0), Math.max(1, dailyRevenueSeries.length)) : 0;
  const tomorrowRevenue = dailyAverageRevenue + Math.max(0, averageRevenuesByDay * 0.02);
  const tomorrowOrders = Math.max(1, Math.round(dailyAverageOrders + Math.max(0, dailyAverageOrders * 0.02)));
  const tomorrowQueueLength = Math.max(0, Math.round(safeDivide(paidOrders.length, Math.max(1, reportLengthDays)) + Math.max(0, safeDivide(paidOrders.length, Math.max(1, reportLengthDays)) * 0.02)));
  const tomorrowProfit = Math.max(0, tomorrowRevenue * 0.28);

  const prediction = {
    tomorrowRevenue: formatValue(tomorrowRevenue),
    tomorrowOrders,
    tomorrowQueueLength: formatValue(tomorrowQueueLength),
    tomorrowPeakHour: peakHour,
    tomorrowFoodDemand: predictedTomorrowDemand,
    expectedWaste: formatValue(Math.max(0, totalRevenue * 0.04)),
    expectedProfit: formatValue(tomorrowProfit),
    workerRequirement: Math.max(1, Math.ceil(tomorrowOrders / 12)),
    inventoryRequirement: predictedTomorrowDemand,
  };

  const aiInsights = buildAIInsights({
    revenueComparison,
    cancelRate: safeDivide(canceledOrders.length, Math.max(1, currentOrders.length)),
    queueAccuracy: 100 - estimatedWaitAccuracy * 100,
    topFoods: mostSoldItems,
    workerRanks,
    revenueTrend: revenueComparison.diff,
  });

  const recommendations = buildRecommendations({
    peakHour,
    topFoods: mostSoldItems,
    cancelRate: safeDivide(canceledOrders.length, Math.max(1, currentOrders.length)),
    workerRanks,
  });

  const risks = detectRisks({
    revenueComparison,
    cancelRate: safeDivide(canceledOrders.length, Math.max(1, currentOrders.length)),
    repeatCustomers: safeDivide(repeatCustomers, Math.max(1, uniqueCustomers.size)),
    workerRanks,
    queueDelayRate: safeDivide(workerRanks.filter((w) => w.delayPercent > 15).length, Math.max(1, workerRanks.length)),
  });

  const report = {
    success: true,
    report: {
      period: type,
      from: start,
      to: end,
      executiveSummary: aiInsights.slice(0, 2).join(' '),
      financialSummary: {
        totalRevenue: formatValue(totalRevenue),
        netRevenue: formatValue(netRevenue),
        estimatedProfit: formatValue(estimatedProfit),
        refundAmount: formatValue(refundAmount),
        cancellationLoss: formatValue(cancellationLoss),
        averageOrderValue: formatValue(averageOrderValue),
        revenueGrowthPercent: revenueComparison.percent,
        revenuePerWorker: formatValue(safeDivide(totalRevenue, Math.max(1, workerRanks.length))),
        revenuePerFoodItem: formatValue(safeDivide(totalRevenue, Math.max(1, Object.keys(foodAgg).length))),
        projectedEndOfDayRevenue: formatValue(type === 'daily' ? (totalRevenue / Math.max(1, new Date().getHours() + 1) * 24) : totalRevenue),
      },
      orderAnalytics: {
        totalOrders: currentOrders.length,
        completedOrders: collectedOrders.length,
        pendingOrders: pendingOrders.length,
        cancelledOrders: canceledOrders.length,
        refundedOrders: refundedOrders.length,
        peakOrderHour: peakHour,
        averageOrdersPerHour: formatValue(averageOrdersPerHour),
        averageQueueTime: formatValue(averageQueueTime),
        averagePreparationTime: formatValue(averagePreparationTime),
      },
      foodIntelligence: {
        mostSoldItems,
        leastSoldItems,
        highestRevenueItem,
        lowestRevenueItem,
        fastestSellingItem,
        slowestSellingItem,
        foodPopularityRanking,
        demandTrend,
        predictedTomorrowDemand,
      },
      workerPerformance: {
        workerRanks,
        bestWorkerOfTheDay: bestWorkerOfThePeriod,
        mostImprovedWorker,
      },
      queueIntelligence: {
        averageQueueLength: formatValue(safeDivide(paidOrders.length, reportLengthDays)),
        longestQueue: hourlyOrders.reduce((best, hour) => (hour.orders > best ? hour.orders : best), 0),
        shortestQueue: hourlyOrders.reduce((best, hour) => (hour.orders < best ? hour.orders : best), Number.MAX_SAFE_INTEGER),
        peakQueueTime: peakHour,
        estimatedWaitTimeAccuracy: formatValue(100 - estimatedWaitAccuracy * 100),
        queueEfficiency: formatValue(100 - safeDivide(canceledOrders.length, Math.max(1, currentOrders.length)) * 100),
      },
      customerBehaviour: {
        averageSpending: formatValue(safeDivide(totalRevenue, Math.max(1, uniqueCustomers.size))),
        repeatCustomers: repeatCustomers,
        newCustomers,
        mostActiveHour: peakHour,
        favouriteFood,
        purchaseFrequency: formatValue(purchaseFrequency),
      },
      aiPredictions: prediction,
      aiBusinessInsights: aiInsights,
      aiRecommendations: recommendations,
      riskDetection: risks,
      visualAnalytics: {
        revenueTrend: dailyRevenueSeries,
        ordersTrend: dailyRevenueSeries.map((point) => ({ date: point.date, orders: point.orders })),
        profitTrend: dailyRevenueSeries.map((point) => ({ date: point.date, profit: formatValue(point.revenue * 0.28) })),
        peakHours: hourlyOrders,
        cancellationTrend: buildDateSeries(start, end, currentOrders.reduce((acc, order) => {
          const key = normalizeDateKey(order.createdAt);
          acc[key] = acc[key] || { cancellations: 0 };
          if (order.status === 'cancelled') acc[key].cancellations += 1;
          return acc;
        }, {}), { cancellations: 0 }),
        workerComparison: workerRanks,
        demandForecast: predictedTomorrowDemand,
      },
    },
  };

  setCache(cacheKey, report, 60 * 1000);
  res.status(200).json(report);
});

module.exports = { getAnalyticsSummary, getAnalyticsReport, getDigitalTwin };
