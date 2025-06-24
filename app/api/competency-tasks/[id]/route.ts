import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCompetencyTaskById, deleteCompetencyTask, updateCompetencyTask } from '@/lib/db/queries';
import { z } from 'zod';

// Validation schema for updates
const updateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  competencyCodeIds: z.array(z.string()).min(1, 'At least one competency must be selected').max(10, 'Maximum 10 competencies allowed'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const task = await getCompetencyTaskById(params.id);

    // Verify task belongs to user
    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error('Error fetching competency task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify task exists and belongs to user
    const existingTask = await getCompetencyTaskById(params.id);
    if (existingTask.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const competencyCodeIdsJson = formData.get('competencyCodeIds') as string;

    // Parse competency codes
    let competencyCodeIds: string[];
    try {
      competencyCodeIds = JSON.parse(competencyCodeIdsJson);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid competency codes format' },
        { status: 400 }
      );
    }

    // Validate form data
    const validationResult = updateTaskSchema.safeParse({
      title,
      description,
      competencyCodeIds,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Update the task
    const result = await updateCompetencyTask({
      taskId: params.id,
      title: validationResult.data.title,
      description: validationResult.data.description,
      competencyCodeIds: validationResult.data.competencyCodeIds,
    });

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
    });

  } catch (error) {
    console.error('Error updating competency task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the task (this also verifies ownership)
    await deleteCompetencyTask(params.id, session.user.id!);

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting competency task:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Task not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 