const nodemailer = require('nodemailer');

const getTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const isTestTransport = !host || !user || !pass;

  if (host && user && pass) {
    return { transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    }), isTestTransport };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SMTP configuration is required in production');
  }

  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    isTestTransport,
  };
};

const buildOtpEmailHtml = ({ name, otp, expiresIn }) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YQueue Security Verification</title>
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #050816; color: #e2e8f0; }
      .wrapper { width: 100%; padding: 24px; background: linear-gradient(180deg, #060b1a 0%, #0f172a 100%); }
      .card { max-width: 600px; margin: 0 auto; border-radius: 28px; background: #0f172a; border: 1px solid rgba(148, 163, 184, 0.12); box-shadow: 0 25px 80px rgba(15, 23, 42, 0.45); overflow: hidden; }
      .header { padding: 32px; background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(168,85,247,0.08)); }
      .brand { display: inline-flex; align-items: center; gap: 12px; color: #fff; text-decoration: none; font-weight: 700; font-size: 20px; }
      .brand-dot { width: 12px; height: 12px; border-radius: 999px; background: linear-gradient(135deg, #22d3ee, #8b5cf6); box-shadow: 0 0 18px rgba(34,211,238,0.4); }
      .content { padding: 32px; }
      .title { margin: 0 0 12px; font-size: 28px; color: #f8fafc; }
      .subtitle { margin: 0 0 24px; line-height: 1.8; color: #cbd5e1; }
      .otp { display: inline-block; padding: 20px 0; width: 100%; text-align: center; border-radius: 24px; background: rgba(14, 165, 233, 0.1); color: #e0f2fe; font-size: 40px; letter-spacing: 0.24em; font-weight: 700; margin: 16px 0; }
      .note { margin: 0 0 16px; color: #94a3b8; font-size: 14px; }
      .footer { padding: 24px 32px 32px; font-size: 13px; color: #6b7280; }
      .footer p { margin: 8px 0 0; }
      .badge { display: inline-flex; align-items: center; gap: 8px; margin-top: 18px; padding: 10px 14px; border-radius: 999px; background: rgba(96, 165, 250, 0.12); color: #bfdbfe; font-size: 13px; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <a href="https://yqueue.app" class="brand">
            <span class="brand-dot"></span>
            <span>YQueue</span>
          </a>
        </div>
        <div class="content">
          <p class="title">Security Verification</p>
          <p class="subtitle">Hello ${name},<br />We received a request to reset your password for your YQueue account.</p>
          <div class="otp">${otp}</div>
          <p class="subtitle">This one-time password expires in ${expiresIn} minutes. Enter it on the verification page to continue.</p>
          <p class="note">If you did not request this change, you can safely ignore this message. Your account remains protected.</p>
          <div class="badge">YQueue Security Alert — Do not share this code with anyone.</div>
        </div>
        <div class="footer">
          <p>YQueue</p>
          <p>Secure food ordering for your campus.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

const buildResetConfirmationHtml = ({ name }) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset Confirmed</title>
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #050816; color: #e2e8f0; }
      .wrapper { width: 100%; padding: 24px; background: linear-gradient(180deg, #060b1a 0%, #0f172a 100%); }
      .card { max-width: 600px; margin: 0 auto; border-radius: 28px; background: #0f172a; border: 1px solid rgba(148, 163, 184, 0.12); box-shadow: 0 25px 80px rgba(15, 23, 42, 0.45); overflow: hidden; }
      .header { padding: 32px; background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(168,85,247,0.08)); }
      .brand { display: inline-flex; align-items: center; gap: 12px; color: #fff; text-decoration: none; font-weight: 700; font-size: 20px; }
      .brand-dot { width: 12px; height: 12px; border-radius: 999px; background: linear-gradient(135deg, #22d3ee, #8b5cf6); box-shadow: 0 0 18px rgba(34,211,238,0.4); }
      .content { padding: 32px; }
      .title { margin: 0 0 12px; font-size: 28px; color: #f8fafc; }
      .subtitle { margin: 0 0 24px; line-height: 1.8; color: #cbd5e1; }
      .footer { padding: 24px 32px 32px; font-size: 13px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <a href="https://yqueue.app" class="brand">
            <span class="brand-dot"></span>
            <span>YQueue</span>
          </a>
        </div>
        <div class="content">
          <p class="title">Password Reset Complete</p>
          <p class="subtitle">Hi ${name},<br />Your password has been updated successfully. If you did not make this change, please contact support immediately.</p>
        </div>
        <div class="footer">
          <p>YQueue</p>
          <p>Thank you for keeping your account secure.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

const sendEmail = async ({ to, subject, html }) => {
  const { transporter, isTestTransport } = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'YQueue <no-reply@yqueue.app>',
    to,
    subject,
    html,
  });

  if (isTestTransport) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('YQueue test email preview URL:', previewUrl);
  }
};

const sendOtpEmail = async (user, otp) => {
  const html = buildOtpEmailHtml({ name: user.name || 'YQueue User', otp, expiresIn: 10 });
  await sendEmail({
    to: user.email,
    subject: 'YQueue Security Verification',
    html,
  });
};

const sendPasswordResetSuccessEmail = async (user) => {
  const html = buildResetConfirmationHtml({ name: user.name || 'YQueue User' });
  await sendEmail({
    to: user.email,
    subject: 'YQueue Password Reset Confirmed',
    html,
  });
};

module.exports = { sendOtpEmail, sendPasswordResetSuccessEmail };
