import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { stripe } from '@/lib/stripe/config';
import { updateUserSubscription } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Handle lifetime subscriptions (they start with 'lifetime_')
    if (subscriptionId.startsWith('lifetime_')) {
      // For lifetime subscriptions, we'll just update the status to cancelled
      // This doesn't actually cancel anything with Stripe since it's a one-time payment
      await updateUserSubscription({
        userId: session.user.id,
        subscriptionId: null,
        subscriptionStatus: 'cancelled',
        trialEndsAt: null,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Lifetime subscription cancelled' 
      });
    }

    // For regular subscriptions, cancel with Stripe
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      
      // Update user subscription status in database
      await updateUserSubscription({
        userId: session.user.id,
        subscriptionId: null,
        subscriptionStatus: 'cancelled',
        trialEndsAt: null,
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription cancelled successfully',
        subscription 
      });
    } catch (stripeError: any) {
      console.error('Stripe cancellation error:', stripeError);
      
      // If the subscription is already cancelled or doesn't exist, update our database
      if (stripeError.code === 'resource_missing' || stripeError.code === 'subscription_already_canceled') {
        await updateUserSubscription({
          userId: session.user.id,
          subscriptionId: null,
          subscriptionStatus: 'cancelled',
          trialEndsAt: null,
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription already cancelled' 
        });
      }
      
      throw stripeError;
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 