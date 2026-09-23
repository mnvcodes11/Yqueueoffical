const assert = require('node:assert/strict');
const test = require('node:test');

const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.RESEND_FROM;
process.env.RESEND_API_KEY = 're_test_key';
process.env.RESEND_FROM = 'YQueue <test@example.com>';

const { sendOtpEmail, safeEmailErrorDetails } = require('../utils/emailService');

test.after(() => {
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;
  if (originalFrom === undefined) delete process.env.RESEND_FROM;
  else process.env.RESEND_FROM = originalFrom;
});

test('sendOtpEmail submits the message through Resend HTTPS API', async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ id: 'email-id' }) };
  };

  try {
    await sendOtpEmail({ name: 'Test User', email: 'test@example.com' }, '123456');
  } finally {
    global.fetch = originalFetch;
  }

  assert.equal(request.url, 'https://api.resend.com/emails');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer re_test_key');
  assert.deepEqual(request.body.to, ['test@example.com']);
  assert.equal(request.body.from, 'YQueue <test@example.com>');
  assert.match(request.body.html, /123456/);
});

test('Resend provider failures expose safe diagnostics', () => {
  const details = safeEmailErrorDetails(Object.assign(new Error('provider rejected re_test_key'), {
    name: 'Error',
    code: 'RESEND_API_ERROR',
    responseCode: 422,
  }));

  assert.deepEqual(details, {
    name: 'Error',
    code: 'RESEND_API_ERROR',
    responseCode: 422,
    message: 'provider rejected [REDACTED]',
  });
});