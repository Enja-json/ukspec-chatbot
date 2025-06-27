import { auth } from '@/app/(auth)/auth';
import { getDetailedCompetencyAnalytics } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const analytics = await getDetailedCompetencyAnalytics(session.user.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching competency analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 