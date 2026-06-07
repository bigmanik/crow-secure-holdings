// utils/sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email via Resend.
 *
 * ⚠️  RESEND FREE-TIER RULES (no verified custom domain):
 *   - from:  must be  onboarding@resend.dev
 *   - to:    must be  the email address registered on your Resend account
 *
 * Once you verify a custom domain on resend.com/domains:
 *   - Set RESEND_FROM_EMAIL=no-reply@yourdomain.com  in .env
 *   - Remove the RESEND_TEST_EMAIL override below
 *   - You can send to ANY recipient
 */
const sendEmail = async ({ to, subject, html }) => {
  // ─── Resolve sender ──────────────────────────────────────────
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  const fromName = process.env.RESEND_FROM_NAME ?? 'Crow Secure Holdings';

  // ─── Resolve recipient ───────────────────────────────────────
  // In development without a verified domain, Resend silently drops
  // emails sent to addresses other than your Resend account email.
  // Set RESEND_TEST_EMAIL to your Resend account email to receive
  // test emails locally. In production this override is removed.
  const recipient =
    process.env.NODE_ENV !== 'production' && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : to;

  if (process.env.NODE_ENV !== 'production' && process.env.RESEND_TEST_EMAIL) {
    console.log(`📧 [DEV] Redirecting email from <${to}> → <${recipient}>`);
  }

  // ─── Send ────────────────────────────────────────────────────
  // We intentionally do NOT swallow errors here.
  // Let them propagate to the caller so the controller can decide
  // whether to surface the failure or degrade gracefully.
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: recipient,
    subject,
    html,
  });

  if (error) {
    // Resend returned a structured error — throw it so the controller knows
    console.error(`❌ Resend rejected email to <${recipient}>:`, error);
    throw new Error(error.message ?? 'Email delivery failed.');
  }

  console.log(`✅ Email sent to <${recipient}> — Resend ID: ${data?.id}`);
  return data;
};

export default sendEmail;