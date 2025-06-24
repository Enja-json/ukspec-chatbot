import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  stripeCustomerId: varchar('stripeCustomerId', { length: 128 }),
  subscriptionStatus: varchar('subscriptionStatus', { 
    enum: ['none', 'trial', 'active', 'cancelled'] 
  }).notNull().default('none'),
  subscriptionId: varchar('subscriptionId', { length: 128 }),
  trialEndsAt: timestamp('trialEndsAt'),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  selectedChatModel: varchar('selectedChatModel', { length: 64 }).default('mini-mentor-model'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// Competency Log System Tables

export const competencyCode = pgTable('CompetencyCode', {
  id: varchar('id', { length: 8 }).primaryKey().notNull(), // e.g., 'A1', 'B2', 'C3'
  category: varchar('category', { length: 1, enum: ['A', 'B', 'C', 'D', 'E'] }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type CompetencyCode = InferSelectModel<typeof competencyCode>;

export const competencyTask = pgTable('CompetencyTask', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  source: varchar('source', { enum: ['manual', 'ai_analysis'] }).notNull().default('manual'),
  chatId: uuid('chatId').references(() => chat.id), // Optional link to chat where analysis was performed
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type CompetencyTask = InferSelectModel<typeof competencyTask>;

export const taskCompetency = pgTable(
  'TaskCompetency',
  {
    taskId: uuid('taskId')
      .notNull()
      .references(() => competencyTask.id, { onDelete: 'cascade' }),
    competencyCodeId: varchar('competencyCodeId', { length: 8 })
      .notNull()
      .references(() => competencyCode.id),
    confidenceScore: decimal('confidenceScore', { precision: 5, scale: 2 }), // 0.00 to 100.00
    notes: text('notes'), // Additional notes about how this competency was demonstrated
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    // Primary key on task and competency code (ensures no duplicates)
    pk: primaryKey({ columns: [table.taskId, table.competencyCodeId] }),
  }),
);

export type TaskCompetency = InferSelectModel<typeof taskCompetency>;

export const taskEvidence = pgTable('TaskEvidence', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  taskId: uuid('taskId')
    .notNull()
    .references(() => competencyTask.id, { onDelete: 'cascade' }),
  fileName: text('fileName').notNull(),
  fileSize: integer('fileSize').notNull(), // Size in bytes
  mimeType: varchar('mimeType', { length: 128 }).notNull(),
  fileUrl: text('fileUrl').notNull(), // Storage URL or path
  uploadedAt: timestamp('uploadedAt').notNull().defaultNow(),
});

export type TaskEvidence = InferSelectModel<typeof taskEvidence>;
