/**
 * Razorpay checkout in the browser. The server creates the subscription and checks Razorpay's signature;
 * the browser only opens Razorpay's own payment window (UPI, cards, netbanking).
 */
import { cloudAccessToken } from './cloud';
import type { PaidPlan } from '../utils/plans';

export type Cycle = 'monthly' | 'yearly';
export type CheckoutResult =
  | { ok: true; plan: PaidPlan; currentEnd: string | null }
  | { ok: false; cancelled?: boolean; message: string };

let status: Promise<{ enabled: boolean; keyId: string | null }> | null = null;

/** Whether real payments are switched on for this server (cached). */
export function getPaymentStatus() {
  status ??= fetch('/api/pay/status')
    .then((r) => (r.ok ? r.json() : { enabled: false, keyId: null }))
    .catch(() => ({ enabled: false, keyId: null }));
  return status;
}

async function api<T>(path: string, body: unknown): Promise<T> {
  const token = await cloudAccessToken();
  if (!token) throw new Error('Please sign in first.');
  const res = await fetch(`/api/pay/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message || 'The payment service had a problem. Please try again.');
  return json;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id?: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
}
interface RazorpayCheckout {
  open: () => void;
  on: (event: string, cb: (e: { error?: { description?: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

let scriptLoading: Promise<void> | null = null;
function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => {
      scriptLoading = null;
      reject(new Error('Could not load the payment window. Check your connection and try again.'));
    };
    document.head.appendChild(s);
  });
  return scriptLoading;
}

/** Opens Razorpay for the plan and resolves once the payment is verified by the server (or cancelled). */
export async function checkout(plan: PaidPlan, cycle: Cycle, prefill: { name?: string; email?: string }): Promise<CheckoutResult> {
  try {
    // Auto-renewing subscription, or a one-time payment while Razorpay Subscriptions is off for the account.
    const [{ subscriptionId, orderId, amount, keyId }] = await Promise.all([
      api<{ subscriptionId?: string; orderId?: string; amount?: number; keyId: string }>('subscribe', { plan, cycle }),
      loadCheckoutScript(),
    ]);
    const response = await new Promise<RazorpayResponse | null>((resolve, reject) => {
      const rzp = new window.Razorpay!({
        key: keyId,
        ...(subscriptionId ? { subscription_id: subscriptionId } : { order_id: orderId, amount, currency: 'INR' }),
        name: 'LoveMate',
        description: `LoveMate ${plan === 'plus' ? 'Plus' : 'Couple'} (${cycle})`,
        prefill: { name: prefill.name, email: prefill.email },
        theme: { color: '#e11d48' },
        handler: (r: RazorpayResponse) => resolve(r),
        modal: { ondismiss: () => resolve(null) },
      });
      rzp.on('payment.failed', (e) => reject(new Error(e.error?.description || 'The payment failed. No money was taken.')));
      rzp.open();
    });
    if (!response) return { ok: false, cancelled: true, message: 'Payment cancelled.' };
    const verified = await api<{ plan: PaidPlan; currentEnd: string | null }>('verify', response);
    return { ok: true, plan: verified.plan, currentEnd: verified.currentEnd };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/** Stops renewal; the plan stays active until the end of the paid period. */
export async function cancelRenewal(subscriptionId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await api('cancel', { subscriptionId });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
