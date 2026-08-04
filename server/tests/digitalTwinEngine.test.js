const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDigitalTwinSnapshot } = require('../utils/digitalTwinEngine');

test('buildDigitalTwinSnapshot should produce a valid twin payload without runtime ordering issues', () => {
  const snapshot = buildDigitalTwinSnapshot({
    orders: [
      {
        _id: 'o1',
        status: 'paid',
        payment: { status: 'paid' },
        totalPrice: 120,
        createdAt: new Date('2026-08-04T09:00:00Z'),
        workerAssigned: 'w1',
      },
      {
        _id: 'o2',
        status: 'preparing',
        payment: { status: 'paid' },
        totalPrice: 90,
        createdAt: new Date('2026-08-04T09:15:00Z'),
        workerAssigned: 'w1',
      },
      {
        _id: 'o3',
        status: 'ready',
        payment: { status: 'paid' },
        totalPrice: 80,
        createdAt: new Date('2026-08-04T09:30:00Z'),
        workerAssigned: 'w2',
      },
    ],
    foods: [
      { _id: 'f1', name: 'Masala Dosa', price: 45, stock: 6 },
      { _id: 'f2', name: 'Tea', price: 20, stock: 2 },
    ],
    users: [
      { _id: 'w1', name: 'Riya', role: 'worker' },
      { _id: 'w2', name: 'Vikram', role: 'worker' },
    ],
    now: new Date('2026-08-04T10:00:00Z'),
  });

  assert.equal(snapshot.metrics.ordersToday, 3);
  assert.equal(snapshot.metrics.currentQueue, 3);
  assert.ok(Array.isArray(snapshot.recommendations));
  assert.ok(Array.isArray(snapshot.workers));
});
