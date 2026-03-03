import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getWebBaseUrl(): string {
  const value = process.env.WEB_BASE_URL ?? 'http://localhost:5173';

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('WEB_BASE_URL must use http or https');
    }

    return url.origin;
  } catch (error) {
    throw new Error(
      `WEB_BASE_URL is invalid: ${error instanceof Error ? error.message : 'Unable to parse URL'}`
    );
  }
}
