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
      monthly: 'price_1RajA9PsTCOo0fiqqAZs8mKk',
      yearly: 'price_1RajA9PsTCOo0fiqznY8qN6b',
    },
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

export type SubscriptionStatus = 'none' | 'trial' | 'active' | 'cancelled'; 