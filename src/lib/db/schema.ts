import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  vector,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  headline: text('headline'),
  about: text('about'),
  skills: jsonb('skills').$type<string[]>().default([]),
  contactLinks: jsonb('contact_links').$type<Record<string, string>>().default({}),
  portfolioUrl: text('portfolio_url'),
  socialLinks: jsonb('social_links').$type<Record<string, string>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assistants = pgTable('assistants', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default('AI Assistant'),
  welcomeMessage: text('welcome_message').default('Hi! Ask me anything.'),
  themeColor: text('theme_color').default('#6366f1'),
  avatarUrl: text('avatar_url'),
  personality: text('personality').default('professional and helpful'),
  responseStyle: text('response_style').default('concise'),
  suggestedQuestions: jsonb('suggested_questions').$type<string[]>().default([]),
  publicKey: text('public_key').notNull().unique(),
  allowedDomains: jsonb('allowed_domains').$type<string[]>().default([]),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  sourceType: text('source_type').notNull(),
  storagePath: text('storage_path').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
    .notNull()
    .default('pending'),
  errorMessage: text('error_message'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    chunkIndex: integer('chunk_index').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('document_chunks_embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    index('document_chunks_profile_idx').on(table.profileId),
  ]
);

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  assistantId: uuid('assistant_id')
    .notNull()
    .references(() => assistants.id, { onDelete: 'cascade' }),
  visitorId: text('visitor_id'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  messageCount: integer('message_count').default(0),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactRequests = pgTable('contact_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  assistantId: uuid('assistant_id')
    .notNull()
    .references(() => assistants.id, { onDelete: 'cascade' }),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  type: text('type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Assistant = typeof assistants.$inferSelect;
export type NewAssistant = typeof assistants.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
