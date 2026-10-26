/**
 * Email through SMTP with Nodemailer. Default: Gmail with an App Password
 *   SMTP_USER=lovemate.app@gmail.com  SMTP_PASS=<16-letter app password>
 * Any SMTP server works (set SMTP_HOST / SMTP_PORT). Note: Render's free plan blocks SMTP ports;
 * a VPS or a paid instance is needed for this to send.
 */
import nodemailer, { type Transporter } from 'nodemailer';

const env = (k: string) => process.env[k]?.trim() || '';

export const emailEnabled = () => Boolean(env('SMTP_USER') && env('SMTP_PASS'));

let transporter: Transporter | null = null;
let transporterKey = '';

function getTransporter(): Transporter {
  const host = env('SMTP_HOST') || 'smtp.gmail.com';
  const port = Number(env('SMTP_PORT') || 465);
  const key = `${host}:${port}:${env('SMTP_USER')}`;
  if (!transporter || key !== transporterKey) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') },
      pool: true,
      maxConnections: 2, // Gmail refuses many parallel sessions from one account
    });
    transporterKey = key;
  }
  return transporter;
}

export const fromAddress = () => env('MAIL_FROM') || `LoveMate <${env('SMTP_USER')}>`;

export async function sendEmail(to: string, subject: string, html: string, text: string, headers: Record<string, string> = {}): Promise<void> {
  await getTransporter().sendMail({ from: fromAddress(), to, subject, html, text, headers });
}

/** Checks the SMTP login without sending anything. */
export async function verifyEmail(): Promise<{ ok: boolean; message: string }> {
  if (!emailEnabled()) return { ok: false, message: 'SMTP_USER and SMTP_PASS are not set.' };
  try {
    await getTransporter().verify();
    return { ok: true, message: 'SMTP login works.' };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
