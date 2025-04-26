import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  googleId: text('google_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const inquiries = sqliteTable('inquiries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  belief: text('belief').notNull(),
  isTrue: text('is_true'),
  absolutelyTrue: text('absolutely_true'),
  reaction: text('reaction'),
  withoutThought: text('without_thought'),
  turnaround1: text('turnaround1'),
  turnaround2: text('turnaround2'),
  turnaround3: text('turnaround3'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const aiResponses = sqliteTable('ai_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  inquiryId: integer('inquiry_id').notNull(),
  content: text('content').notNull(),
  guidanceCount: integer('guidance_count').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

// Migration tracking table
export const migrations = sqliteTable('migrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  version: integer('version').notNull(),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  status: text('status').notNull(), // 'success', 'failed', 'rolled-back'
  errorMessage: text('error_message'),
  rollbackStatus: text('rollback_status'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});
