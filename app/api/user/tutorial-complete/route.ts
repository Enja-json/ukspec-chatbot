import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user's tutorialCompleted status
    await db
      .update(user)
      .set({ tutorialCompleted: true })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing tutorial:', error);
    return NextResponse.json(
      { error: 'Failed to complete tutorial' },
      { status: 500 }
    );
  }
} 