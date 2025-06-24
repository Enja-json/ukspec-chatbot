import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { updateUserSubscription, getUserByStripeCustomerId } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        // Payment succeeded - subscription status will be updated via subscription.updated event
        console.log('Payment succeeded');
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed - subscription status will be updated via subscription.updated event
        console.log('Payment failed');
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  const status = subscription.status === 'trialing' ? 'trial' : 'active';
  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  await updateUserSubscription({
    userId: user.id,
    subscriptionId: subscription.id,
    subscriptionStatus: status,
    trialEndsAt,
  });

  console.log(`Subscription created for user ${user.id}: ${status}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  let status: 'none' | 'trial' | 'active' | 'cancelled';
  
  switch (subscription.status) {
    case 'trialing':
      status = 'trial';
      break;
    case 'active':
      status = 'active';
      break;
    case 'canceled':
    case 'unpaid':
    case 'past_due':
      status = 'cancelled';
      break;
    default:
      status = 'cancelled';
  }

  const trialEndsAt = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  await updateUserSubscription({
    userId: user.id,
    subscriptionId: subscription.id,
    subscriptionStatus: status,
    trialEndsAt,
  });

  console.log(`Subscription updated for user ${user.id}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);
  
  if (!user) {
    console.error('User not found for Stripe customer:', customerId);
    return;
  }

  await updateUserSubscription({
    userId: user.id,
    subscriptionId: null,
    subscriptionStatus: 'cancelled',
    trialEndsAt: null,
  });

  console.log(`Subscription deleted for user ${user.id}`);
}

// Invoice handlers removed - subscription events handle status changes 