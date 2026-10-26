/**
 * Business details shown on the Terms, Privacy, Refund and Contact pages.
 * Replace every value in [square brackets] with your real details before
 * submitting the site for payment-gateway (Razorpay) review.
 */
export const BUSINESS = {
  appName: 'LoveMate',
  legalName: '[Registered business name or your full legal name]',
  ownerName: '[Your full legal name]',
  email: '[support@yourdomain.com]',
  phone: '[+91 XXXXXXXXXX]',
  address: {
    street: '[House / building, street, area]',
    city: '[City]',
    state: '[State]',
    pincode: '[PIN code]',
    country: 'India',
  },
  grievanceOfficer: {
    name: '[Grievance officer full name]',
    email: '[grievance@yourdomain.com]',
  },
  jurisdictionCity: '[City]',
  lastUpdated: '26 October 2026',
} as const;

function containsPlaceholder(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('[');
  if (value && typeof value === 'object') return Object.values(value).some(containsPlaceholder);
  return false;
}

/** True while any business detail still contains a "[...]" placeholder. */
export function hasPlaceholders(): boolean {
  return containsPlaceholder(BUSINESS);
}

/** One-line postal address. */
export function formatAddress(): string {
  const a = BUSINESS.address;
  return `${a.street}, ${a.city}, ${a.state} ${a.pincode}, ${a.country}`;
}
