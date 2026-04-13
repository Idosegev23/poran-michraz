/* eslint-disable @typescript-eslint/no-require-imports */

function getTransporter() {
  // Dynamic require to avoid TypeScript/webpack resolution issues on Vercel
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export interface ErrorContext {
  route: string;
  errorMessage: string;
  errorStack?: string;
  details?: Record<string, unknown>;
}

export async function sendErrorAlert(ctx: ErrorContext): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.ALERT_EMAIL;

  if (!user || !pass || !to) return;

  const timestamp = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

  const detailsHtml = ctx.details
    ? Object.entries(ctx.details)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap"><b>${k}</b></td><td style="padding:4px 0;color:#111;font-family:monospace;word-break:break-all">${String(v)}</td></tr>`)
        .join('')
    : '';

  const html = `
<div style="font-family:sans-serif;max-width:700px;margin:0 auto">
  <div style="background:#EF4444;color:white;padding:16px 20px;border-radius:8px 8px 0 0">
    <h2 style="margin:0;font-size:18px">שגיאה במערכת ניתוח מכרזים</h2>
    <p style="margin:4px 0 0;opacity:0.85;font-size:13px">${timestamp} | ${ctx.route}</p>
  </div>
  <div style="background:#FFF;border:1px solid #E5E7EB;border-top:none;padding:20px;border-radius:0 0 8px 8px">
    <h3 style="margin:0 0 8px;color:#EF4444;font-size:15px">שגיאה:</h3>
    <pre style="background:#FEF2F2;border:1px solid #FECACA;padding:12px;border-radius:6px;overflow:auto;font-size:13px;color:#991B1B;white-space:pre-wrap">${ctx.errorMessage}</pre>

    ${ctx.errorStack ? `
    <h3 style="margin:16px 0 8px;color:#374151;font-size:15px">Stack Trace:</h3>
    <pre style="background:#F9FAFB;border:1px solid #E5E7EB;padding:12px;border-radius:6px;overflow:auto;font-size:12px;color:#6B7280;white-space:pre-wrap">${ctx.errorStack}</pre>
    ` : ''}

    ${detailsHtml ? `
    <h3 style="margin:16px 0 8px;color:#374151;font-size:15px">פרטים נוספים:</h3>
    <table style="border-collapse:collapse;font-size:13px;width:100%">${detailsHtml}</table>
    ` : ''}

    <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:12px">
      מערכת ניתוח מכרזים – פורן שרם | התראה אוטומטית
    </p>
  </div>
</div>`;

  try {
    await getTransporter().sendMail({
      from: `"מערכת מכרזים" <${user}>`,
      to,
      subject: `שגיאה: ${ctx.route} – ${ctx.errorMessage.substring(0, 60)}`,
      html,
    });
  } catch {
    // Don't let email failure crash the main flow
  }
}
