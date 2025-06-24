import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getAllCompetencyCodes } from '@/lib/db/queries';
import { seedCompetencyCodes } from '@/lib/db/seed-competency-codes';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let competencyCodes = await getAllCompetencyCodes();

    // Force re-seeding if we don't have the correct competency structure
    const expectedCodes = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'E1', 'E2', 'E3', 'E4', 'E5'];
    const currentCodes = competencyCodes.map(code => code.id).sort();
    const validCodes = competencyCodes.filter(code => expectedCodes.includes(code.id));
    
    const needsUpdate = 
      validCodes.length !== expectedCodes.length ||
      !expectedCodes.every(code => validCodes.map(c => c.id).includes(code));

    if (needsUpdate) {
      console.log('Competency codes need updating. Current valid codes:', validCodes.map(c => c.id));
      console.log('Expected codes:', expectedCodes);
      console.log('Auto-seeding competency codes...');
      await seedCompetencyCodes();
      competencyCodes = await getAllCompetencyCodes();
      console.log(`Auto-seeded, now have ${competencyCodes.length} total competency codes`);
    }

    // Filter to only return valid UK-SPEC competency codes
    const validCompetencyCodes = competencyCodes.filter(code => expectedCodes.includes(code.id));
    console.log(`Returning ${validCompetencyCodes.length} valid competency codes to client`);
    
    return NextResponse.json(validCompetencyCodes);
  } catch (error) {
    console.error('Error fetching competency codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 