import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createCompetencyTaskWithDetails, getCompetencyTasksByUserId } from '@/lib/db/queries';
import { z } from 'zod';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/plain',
];

// Validation schema
const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  competencyCodeIds: z.array(z.string()).min(1, 'At least one competency must be selected').max(10, 'Maximum 10 competencies allowed'),
  // AI analysis fields (optional)
  chatId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  aiModel: z.string().optional(),
  aiCompetencyData: z.array(z.object({
    competencyCodeId: z.string(),
    confidenceScore: z.number().min(0).max(100).optional(),
    aiExplanation: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const competencyCodeIdsJson = formData.get('competencyCodeIds') as string;
    
    // Extract AI analysis fields (optional)
    const chatId = formData.get('chatId') as string | null;
    const messageId = formData.get('messageId') as string | null;
    const aiModel = formData.get('aiModel') as string | null;
    const aiCompetencyDataJson = formData.get('aiCompetencyData') as string | null;
    const aiResponseDataJson = formData.get('aiResponseData') as string | null;

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

    // Parse AI competency data if provided
    let aiCompetencyData: Array<{
      competencyCodeId: string;
      confidenceScore?: number;
      aiExplanation?: string;
    }> | undefined;
    
    if (aiCompetencyDataJson) {
      try {
        aiCompetencyData = JSON.parse(aiCompetencyDataJson);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid AI competency data format' },
          { status: 400 }
        );
      }
    }

    // Parse AI response data if provided
    let aiResponseData: any;
    if (aiResponseDataJson) {
      try {
        aiResponseData = JSON.parse(aiResponseDataJson);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid AI response data format' },
          { status: 400 }
        );
      }
    }

    // Validate basic form data
    const validationResult = createTaskSchema.safeParse({
      title,
      description,
      competencyCodeIds,
      chatId: chatId || undefined,
      messageId: messageId || undefined,
      aiModel: aiModel || undefined,
      aiCompetencyData,
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

    // Extract and validate files
    const evidenceFiles: File[] = [];
    const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('evidenceFile_'));
    
    for (const [, file] of fileEntries) {
      if (file instanceof File) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${file.name}" exceeds maximum size of 10MB` },
            { status: 400 }
          );
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: `File type "${file.type}" is not allowed for file "${file.name}"` },
            { status: 400 }
          );
        }

        evidenceFiles.push(file);
      }
    }

    // Validate maximum number of files
    if (evidenceFiles.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed' },
        { status: 400 }
      );
    }

    // Create the task in the database
    const result = await createCompetencyTaskWithDetails({
      title: validationResult.data.title,
      description: validationResult.data.description,
      competencyCodeIds: validationResult.data.competencyCodeIds,
      evidenceFiles,
      userId: session.user.id!,
      // AI analysis fields
      source: (chatId && messageId) ? 'ai_analysis' : 'manual',
      chatId: validationResult.data.chatId,
      messageId: validationResult.data.messageId,
      aiModel: validationResult.data.aiModel,
      aiResponseData,
      aiCompetencyData: aiCompetencyData?.map(comp => ({
        ...comp,
        sourceType: 'ai_suggested' as const,
      })),
    });

    return NextResponse.json({
      success: true,
      taskId: result.task.id,
      message: 'Task created successfully',
    });

  } catch (error) {
    console.error('Error creating competency task:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('competency codes do not exist')) {
        return NextResponse.json(
          { error: 'One or more selected competency codes are invalid' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('file upload')) {
        return NextResponse.json(
          { error: 'File upload failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's competency tasks with competencies and evidence
    const tasks = await getCompetencyTasksByUserId(session.user.id!);

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error('Error fetching competency tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 