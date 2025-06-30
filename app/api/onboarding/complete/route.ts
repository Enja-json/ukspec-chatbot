import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { completeUserOnboarding } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { registrationTitle, careerGoals, currentPosition } = body;

    // Validate required fields
    if (!registrationTitle || !careerGoals || !currentPosition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate registrationTitle
    const validTitles = ['still-learning', 'engtech', 'ieng', 'ceng'];
    if (!validTitles.includes(registrationTitle)) {
      return NextResponse.json(
        { error: 'Invalid registration title' },
        { status: 400 }
      );
    }

    const updatedUser = await completeUserOnboarding({
      userId: session.user.id,
      onboardingData: {
        registrationTitle,
        careerGoals,
        currentPosition,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.type === 'not_found' ? 404 : 400 }
      );
    }

    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 