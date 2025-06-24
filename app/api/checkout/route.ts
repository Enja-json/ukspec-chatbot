import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { updateUserStripeCustomerId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Validate price ID
    const validPriceIds = Object.values(STRIPE_CONFIG.prices.professional);
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Create Stripe customer if needed
    const customer = await stripe.customers.create({
      email: session.user.email!,
      metadata: {
        userId: session.user.id,
      },
    });

    // Update user with Stripe customer ID
    await updateUserStripeCustomerId(session.user.id, customer.id);

    // Create checkout session with 14-day trial
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: session.user.id,
        },
      },
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/?cancelled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 