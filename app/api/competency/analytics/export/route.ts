import { auth } from '@/app/(auth)/auth';
import { getCompetencyTasksByUserId, getAllCompetencyCodes, getUserById } from '@/lib/db/queries';
import { NextResponse } from 'next/server';
import { getUserEntitlements } from '@/lib/ai/entitlements';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user entitlements
    const userDetails = await getUserById(session.user.id);
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = session.user.type || 'regular';
    const userEntitlements = getUserEntitlements(userType, userDetails.subscriptionStatus);

    if (!userEntitlements.canExportAnalyticsPDF) {
      return NextResponse.json(
        { error: 'Upgrade to Professional to export analytics PDF' },
        { status: 403 }
      );
    }

    // Get all tasks and competency codes
    const [tasks, competencyCodes] = await Promise.all([
      getCompetencyTasksByUserId(session.user.id),
      getAllCompetencyCodes()
    ]);

    // Create PDF document
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { width, height } = page.getSize();

    // Embed fonts
    const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);

    // Add title
    page.drawText('Competency Analytics Report', {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold
    });

    // Add subtitle with user name
    page.drawText(`${session.user.name || 'Engineer'}'s Engineering Development Progress`, {
      x: 50,
      y: height - 80,
      size: 14,
      font: helvetica
    });

    // Add date
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    page.drawText(`Generated on ${today}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4)
    });

    // Add key metrics
    const totalTasks = tasks.length;
    const totalEvidence = tasks.reduce((sum, task) => sum + task.evidence.length, 0);

    // Calculate category distribution
    const categoryMap = new Map();
    tasks.forEach(task => {
      task.competencies.forEach(comp => {
        const category = comp.code.category;
        const current = categoryMap.get(category) || { count: 0 };
        current.count++;
        categoryMap.set(category, current);
      });
    });

    const totalCompetencies = Array.from(categoryMap.values()).reduce(
      (sum, { count }) => sum + count,
      0
    );

    // Draw metrics section
    page.drawText('Key Metrics', {
      x: 50,
      y: height - 150,
      size: 18,
      font: helveticaBold
    });

    page.drawText(`Total Tasks: ${totalTasks}`, {
      x: 50,
      y: height - 180,
      size: 14,
      font: helvetica
    });

    page.drawText(`Total Competency Entries: ${totalCompetencies}`, {
      x: 50,
      y: height - 200,
      size: 14,
      font: helvetica
    });

    page.drawText(`Supporting Evidence Files: ${totalEvidence}`, {
      x: 50,
      y: height - 220,
      size: 14,
      font: helvetica
    });

    // Add category distribution
    page.drawText('Category Distribution', {
      x: 50,
      y: height - 270,
      size: 18,
      font: helveticaBold
    });

    let yOffset = 300;
    for (const [category, data] of categoryMap.entries()) {
      const percentage = Math.round((data.count / totalCompetencies) * 100);
      const categoryLabels = {
        A: 'Knowledge & Understanding',
        B: 'Design & Development',
        C: 'Responsibility & Management',
        D: 'Communication & Interpersonal',
        E: 'Professional Commitment'
      };

      page.drawText(`Category ${category}: ${data.count} entries (${percentage}%)`, {
        x: 50,
        y: height - yOffset,
        size: 12,
        font: helveticaBold
      });

      page.drawText(categoryLabels[category as keyof typeof categoryLabels], {
        x: 70,
        y: height - (yOffset + 20),
        size: 12,
        font: helvetica
      });

      yOffset += 50;
    }

    // Add footer
    page.drawText('Generated by Mini Mentor • Confidential', {
      x: width / 2 - 100,
      y: 30,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4)
    });

    // Generate PDF buffer
    const pdfBytes = await doc.save();

    // Format current date for filename
    const dateString = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    // Return the PDF file
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="competency-analytics-${dateString}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error exporting analytics PDF:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics PDF' },
      { status: 500 }
    );
  }
} 