const fetch = global.fetch;
const SERVER_URL = 'http://localhost:5000';

(async () => {
  try {
    const adminRes = await fetch(`${SERVER_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Admin', email: 'admin-debug@test.local', password: 'password123', role: 'admin' }),
    });
    const adminBody = await adminRes.json();
    console.log('signup status', adminRes.status, 'body', adminBody);

    if (!adminBody.success) return;
    const token = adminBody.token;

    const workerRes = await fetch(`${SERVER_URL}/api/auth/create-worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Worker Debug', email: 'worker-debug@test.local', password: 'password123' }),
    });
    const workerBody = await workerRes.json().catch(() => null);
    console.log('create-worker status', workerRes.status, 'body', workerBody);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();