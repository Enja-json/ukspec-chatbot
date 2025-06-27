import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  competencyCode,
  competencyTask,
  taskCompetency,
  taskEvidence,
  type CompetencyCode,
  type CompetencyTask,
  type TaskCompetency,
  type TaskEvidence,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function getUserById(id: string) {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    
    return result;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by ID',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  selectedChatModel,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  selectedChatModel?: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      selectedChatModel,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function getMessageCountByUserIdAndModel({
  id,
  modelId,
  differenceInDays,
}: { id: string; modelId: string; differenceInDays: number }) {
  try {
    const timeAgo = new Date(
      Date.now() - differenceInDays * 24 * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          eq(chat.selectedChatModel, modelId),
          gte(message.createdAt, timeAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id and model',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.stripeCustomerId, stripeCustomerId))
      .limit(1);
    
    return result;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by Stripe customer ID',
    );
  }
}

export async function updateUserSubscription({
  userId,
  subscriptionId,
  subscriptionStatus,
  trialEndsAt,
}: {
  userId: string;
  subscriptionId: string | null;
  subscriptionStatus: 'none' | 'trial' | 'active' | 'cancelled';
  trialEndsAt: Date | null;
}) {
  try {
    return await db
      .update(user)
      .set({
        subscriptionId,
        subscriptionStatus,
        trialEndsAt,
      })
      .where(eq(user.id, userId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update user subscription',
    );
  }
}

export async function updateUserStripeCustomerId(userId: string, stripeCustomerId: string) {
  try {
    return await db
      .update(user)
      .set({ stripeCustomerId })
      .where(eq(user.id, userId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update user Stripe customer ID',
    );
  }
}

// Competency Log System Functions

export async function getAllCompetencyCodes(): Promise<CompetencyCode[]> {
  try {
    return await db
      .select()
      .from(competencyCode)
      .orderBy(competencyCode.id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get competency codes',
    );
  }
}

export async function getCompetencyCodesByCategory(category: 'A' | 'B' | 'C' | 'D' | 'E'): Promise<CompetencyCode[]> {
  try {
    return await db
      .select()
      .from(competencyCode)
      .where(eq(competencyCode.category, category))
      .orderBy(competencyCode.id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get competency codes by category',
    );
  }
}

export async function createCompetencyTask({
  userId,
  title,
  description,
  source = 'manual',
  chatId,
}: {
  userId: string;
  title: string;
  description: string;
  source?: 'manual' | 'ai_analysis';
  chatId?: string;
}) {
  try {
    const [task] = await db
      .insert(competencyTask)
      .values({
        userId,
        title,
        description,
        source,
        chatId,
      })
      .returning();
    
    return task;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create competency task',
    );
  }
}

export async function createCompetencyTaskWithDetails({
  userId,
  title,
  description,
  competencyCodeIds,
  evidenceFiles,
  source = 'manual',
  chatId,
  messageId,
  aiModel,
  aiResponseData,
  aiCompetencyData,
}: {
  userId: string;
  title: string;
  description: string;
  competencyCodeIds: string[];
  evidenceFiles: File[];
  source?: 'manual' | 'ai_analysis';
  chatId?: string;
  messageId?: string;
  aiModel?: string;
  aiResponseData?: any;
  aiCompetencyData?: Array<{
    competencyCodeId: string;
    confidenceScore?: number;
    aiExplanation?: string;
    sourceType?: 'ai_suggested' | 'manual_added' | 'ai_modified';
  }>;
}) {
  try {
    // First, verify all competency codes exist
    const existingCodes = await db
      .select({ id: competencyCode.id })
      .from(competencyCode)
      .where(inArray(competencyCode.id, competencyCodeIds));
    
    const existingCodeIds = existingCodes.map(code => code.id);
    const invalidCodes = competencyCodeIds.filter(id => !existingCodeIds.includes(id));
    
    if (invalidCodes.length > 0) {
      throw new Error(`Invalid competency codes: ${invalidCodes.join(', ')}`);
    }

    // Create the task
    const [task] = await db
      .insert(competencyTask)
      .values({
        userId,
        title,
        description,
        source,
        chatId,
        messageId,
        aiModel,
        aiResponseData,
      })
      .returning();

    // Add competencies to the task with AI data if available
    if (competencyCodeIds.length > 0) {
      const competencyValues = competencyCodeIds.map((competencyCodeId) => {
        // Find AI data for this competency
        const aiData = aiCompetencyData?.find(c => c.competencyCodeId === competencyCodeId);
        
        return {
          taskId: task.id,
          competencyCodeId,
          confidenceScore: aiData?.confidenceScore?.toString() || null,
          notes: null, // User can add notes later
          aiExplanation: aiData?.aiExplanation || null,
          sourceType: aiData?.sourceType || 'manual_added',
        };
      });

      await db
        .insert(taskCompetency)
        .values(competencyValues);
    }

    // Handle file uploads (simplified - in production you'd upload to cloud storage)
    const evidenceRecords = [];
    for (const file of evidenceFiles) {
      // In a real implementation, you would:
      // 1. Upload file to cloud storage (AWS S3, etc.)
      // 2. Get the permanent URL
      // 3. Store the URL in the database
      
      // For now, we'll just store metadata with a placeholder URL
      const fileUrl = `/uploads/tasks/${task.id}/${file.name}`; // Placeholder
      
      const [evidence] = await db
        .insert(taskEvidence)
        .values({
          taskId: task.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileUrl,
        })
        .returning();
        
      evidenceRecords.push(evidence);
    }

    return {
      task,
      competencies: competencyCodeIds,
      evidence: evidenceRecords,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create competency task with details',
    );
  }
}

export async function createCompetencyTaskFromAIAnalysis({
  userId,
  chatId,
  messageId,
  aiModel,
  taskTitle,
  taskDescription,
  demonstratedCompetencies,
  aiResponseData,
}: {
  userId: string;
  chatId: string;
  messageId: string;
  aiModel: string;
  taskTitle: string;
  taskDescription: string;
  demonstratedCompetencies: Array<{
    code: string;
    confidence_percentage: number;
    explanation: string;
  }>;
  aiResponseData: any;
}) {
  try {
    // Extract competency codes and prepare AI data
    const competencyCodeIds = demonstratedCompetencies.map(c => c.code);
    const aiCompetencyData = demonstratedCompetencies.map(comp => ({
      competencyCodeId: comp.code,
      confidenceScore: comp.confidence_percentage,
      aiExplanation: comp.explanation,
      sourceType: 'ai_suggested' as const,
    }));

    // Create task using the enhanced function
    return await createCompetencyTaskWithDetails({
      userId,
      title: taskTitle,
      description: taskDescription,
      competencyCodeIds,
      evidenceFiles: [], // No files for AI-generated tasks initially
      source: 'ai_analysis',
      chatId,
      messageId,
      aiModel,
      aiResponseData,
      aiCompetencyData,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create competency task from AI analysis',
    );
  }
}

export async function addTaskCompetencies({
  taskId,
  competencies,
}: {
  taskId: string;
  competencies: Array<{
    competencyCodeId: string;
    confidenceScore?: number;
    notes?: string;
  }>;
}) {
  try {
    return await db
      .insert(taskCompetency)
      .values(
        competencies.map((comp) => ({
          taskId,
          competencyCodeId: comp.competencyCodeId,
          confidenceScore: comp.confidenceScore?.toString(),
          notes: comp.notes,
        }))
      )
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to add task competencies',
    );
  }
}

export async function addTaskEvidence({
  taskId,
  fileName,
  fileSize,
  mimeType,
  fileUrl,
}: {
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
}) {
  try {
    const [evidence] = await db
      .insert(taskEvidence)
      .values({
        taskId,
        fileName,
        fileSize,
        mimeType,
        fileUrl,
      })
      .returning();
    
    return evidence;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to add task evidence',
    );
  }
}

export async function getCompetencyTasksByUserId(userId: string) {
  try {
    // Get all tasks for the user
    const tasks = await db
      .select({
        id: competencyTask.id,
        title: competencyTask.title,
        description: competencyTask.description,
        source: competencyTask.source,
        chatId: competencyTask.chatId,
        createdAt: competencyTask.createdAt,
        updatedAt: competencyTask.updatedAt,
      })
      .from(competencyTask)
      .where(eq(competencyTask.userId, userId))
      .orderBy(desc(competencyTask.createdAt));

    // For each task, fetch competencies and evidence
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        // Get competencies for this task
        const competencies = await db
          .select({
            competencyCodeId: taskCompetency.competencyCodeId,
            confidenceScore: taskCompetency.confidenceScore,
            notes: taskCompetency.notes,
            createdAt: taskCompetency.createdAt,
            code: {
              id: competencyCode.id,
              category: competencyCode.category,
              title: competencyCode.title,
              description: competencyCode.description,
            },
          })
          .from(taskCompetency)
          .innerJoin(competencyCode, eq(taskCompetency.competencyCodeId, competencyCode.id))
          .where(eq(taskCompetency.taskId, task.id))
          .orderBy(taskCompetency.competencyCodeId);
        
        // Get evidence for this task
        const evidence = await db
          .select()
          .from(taskEvidence)
          .where(eq(taskEvidence.taskId, task.id))
          .orderBy(taskEvidence.uploadedAt);
        
        return {
          ...task,
          competencies: competencies || [],
          evidence: evidence || [],
        };
      })
    );

    return tasksWithDetails;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get competency tasks by user ID',
    );
  }
}

export async function getCompetencyTaskById(taskId: string) {
  try {
    const [task] = await db
      .select()
      .from(competencyTask)
      .where(eq(competencyTask.id, taskId))
      .limit(1);
    
    if (!task) {
      throw new ChatSDKError(
        'not_found:database',
        'Competency task not found',
      );
    }
    
    // Get competencies for this task
    const competencies = await db
      .select({
        competencyCodeId: taskCompetency.competencyCodeId,
        confidenceScore: taskCompetency.confidenceScore,
        notes: taskCompetency.notes,
        createdAt: taskCompetency.createdAt,
        code: {
          id: competencyCode.id,
          category: competencyCode.category,
          title: competencyCode.title,
          description: competencyCode.description,
        },
      })
      .from(taskCompetency)
      .innerJoin(competencyCode, eq(taskCompetency.competencyCodeId, competencyCode.id))
      .where(eq(taskCompetency.taskId, taskId))
      .orderBy(taskCompetency.competencyCodeId);
    
    // Get evidence for this task
    const evidence = await db
      .select()
      .from(taskEvidence)
      .where(eq(taskEvidence.taskId, taskId))
      .orderBy(taskEvidence.uploadedAt);
    
    return {
      ...task,
      competencies,
      evidence,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get competency task by ID',
    );
  }
}

export async function updateCompetencyTask({
  taskId,
  title,
  description,
  competencyCodeIds,
}: {
  taskId: string;
  title: string;
  description: string;
  competencyCodeIds: string[];
}) {
  try {
    // Update the task
    const [updatedTask] = await db
      .update(competencyTask)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(competencyTask.id, taskId))
      .returning();

    if (!updatedTask) {
      throw new ChatSDKError(
        'not_found:database',
        'Task not found',
      );
    }

    // Delete existing competencies
    await db
      .delete(taskCompetency)
      .where(eq(taskCompetency.taskId, taskId));

    // Add new competencies
    if (competencyCodeIds.length > 0) {
      await db
        .insert(taskCompetency)
        .values(
          competencyCodeIds.map((competencyCodeId) => ({
            taskId,
            competencyCodeId,
            confidenceScore: null,
            notes: null,
          }))
        );
    }

    return updatedTask;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update competency task',
    );
  }
}

export async function deleteCompetencyTask(taskId: string, userId: string) {
  try {
    // Verify the task belongs to the user
    const [task] = await db
      .select()
      .from(competencyTask)
      .where(and(eq(competencyTask.id, taskId), eq(competencyTask.userId, userId)))
      .limit(1);
    
    if (!task) {
      throw new ChatSDKError(
        'not_found:database',
        'Competency task not found or unauthorized',
      );
    }
    
    // Delete task (cascading will handle competencies and evidence)
    return await db
      .delete(competencyTask)
      .where(eq(competencyTask.id, taskId))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete competency task',
    );
  }
}

export async function getCompetencyStatsByUserId(userId: string) {
  try {
    // Get total tasks
    const [totalTasks] = await db
      .select({ count: count(competencyTask.id) })
      .from(competencyTask)
      .where(eq(competencyTask.userId, userId));
    
    // Get competency distribution by category
    const competencyDistribution = await db
      .select({
        category: competencyCode.category,
        count: count(taskCompetency.competencyCodeId),
      })
      .from(taskCompetency)
      .innerJoin(competencyTask, eq(taskCompetency.taskId, competencyTask.id))
      .innerJoin(competencyCode, eq(taskCompetency.competencyCodeId, competencyCode.id))
      .where(eq(competencyTask.userId, userId))
      .groupBy(competencyCode.category)
      .orderBy(competencyCode.category);
    
    return {
      totalTasks: totalTasks?.count ?? 0,
      competencyDistribution,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get competency stats by user ID',
    );
  }
}

export async function getDetailedCompetencyAnalytics(userId: string) {
  try {
    // Get total tasks and evidence count
    const [taskStats] = await db
      .select({ 
        taskCount: count(competencyTask.id),
      })
      .from(competencyTask)
      .where(eq(competencyTask.userId, userId));

    const [evidenceStats] = await db
      .select({ 
        evidenceCount: count(taskEvidence.id),
      })
      .from(taskEvidence)
      .innerJoin(competencyTask, eq(taskEvidence.taskId, competencyTask.id))
      .where(eq(competencyTask.userId, userId));
    
    // Get competency distribution by category with detailed breakdown
    const categoryDistribution = await db
      .select({
        category: competencyCode.category,
        count: count(taskCompetency.competencyCodeId),
        averageConfidence: sql<number>`ROUND(AVG(CAST(${taskCompetency.confidenceScore} AS DECIMAL)), 2)`,
      })
      .from(taskCompetency)
      .innerJoin(competencyTask, eq(taskCompetency.taskId, competencyTask.id))
      .innerJoin(competencyCode, eq(taskCompetency.competencyCodeId, competencyCode.id))
      .where(eq(competencyTask.userId, userId))
      .groupBy(competencyCode.category)
      .orderBy(competencyCode.category);
    
    // Get individual competency code distribution
    const competencyCodeDistribution = await db
      .select({
        competencyCodeId: competencyCode.id,
        category: competencyCode.category,
        title: competencyCode.title,
        count: count(taskCompetency.competencyCodeId),
        averageConfidence: sql<number>`ROUND(AVG(CAST(${taskCompetency.confidenceScore} AS DECIMAL)), 2)`,
      })
      .from(taskCompetency)
      .innerJoin(competencyTask, eq(taskCompetency.taskId, competencyTask.id))
      .innerJoin(competencyCode, eq(taskCompetency.competencyCodeId, competencyCode.id))
      .where(eq(competencyTask.userId, userId))
      .groupBy(competencyCode.id, competencyCode.category, competencyCode.title)
      .orderBy(competencyCode.category, competencyCode.id);
    
    // Get monthly task creation trends (last 12 months)
    const monthlyTrends = await db
      .select({
        month: sql<string>`to_char(${competencyTask.createdAt}, 'YYYY-MM')`,
        taskCount: count(competencyTask.id),
      })
      .from(competencyTask)
      .where(
        and(
          eq(competencyTask.userId, userId),
          gte(competencyTask.createdAt, sql`NOW() - INTERVAL '12 months'`)
        )
      )
      .groupBy(sql`to_char(${competencyTask.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${competencyTask.createdAt}, 'YYYY-MM')`);

    // Get source distribution (manual vs AI analysis)
    const sourceDistribution = await db
      .select({
        source: competencyTask.source,
        count: count(competencyTask.id),
      })
      .from(competencyTask)
      .where(eq(competencyTask.userId, userId))
      .groupBy(competencyTask.source);

    // Get top competencies (most frequently demonstrated)
    const topCompetencies = await db
      .select({
        competencyCodeId: competencyCode.id,
        category: competencyCode.category,
        title: competencyCode.title,
        count: count(taskCompetency.competencyCodeId),
      })
      .from(taskCompetency)
      .innerJoin(competencyTask, eq(taskCompetency.taskId, competencyTask.id))
      .innerJoin(competencyCode, eq(taskCompetency.competencyCodeId, competencyCode.id))
      .where(eq(competencyTask.userId, userId))
      .groupBy(competencyCode.id, competencyCode.category, competencyCode.title)
      .orderBy(desc(count(taskCompetency.competencyCodeId)))
      .limit(10);
    
    return {
      totalTasks: taskStats?.taskCount ?? 0,
      totalEvidence: evidenceStats?.evidenceCount ?? 0,
      categoryDistribution,
      competencyCodeDistribution,
      monthlyTrends,
      sourceDistribution,
      topCompetencies,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get detailed competency analytics',
    );
  }
}
