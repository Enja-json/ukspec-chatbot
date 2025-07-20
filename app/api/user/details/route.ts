import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserById } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userDetails = await getUserById(session.user.id);
    
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return only the necessary subscription details
    return NextResponse.json({
      subscriptionStatus: userDetails.subscriptionStatus,
      subscriptionId: userDetails.subscriptionId,
      trialEndsAt: userDetails.trialEndsAt,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 