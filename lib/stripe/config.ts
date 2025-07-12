import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
});

export const STRIPE_CONFIG = {
  prices: {
    professional: {
      monthly: 'price_1Rk0ozPsTCOo0fiqB9GlMHI4',
      lifetime: 'price_1Rk10QPsTCOo0fiqelQbkwze',
    },
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'cancelled'; 