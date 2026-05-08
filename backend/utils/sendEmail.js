
// utils/sendEmail.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: 'Crow Secure Holdings <no-reply@yourdomain.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    // Silent fail — a broken email must never crash the API response
    console.error(`❌ Email failed to ${to}:`, error.message);
  }
};

export default sendEmail;