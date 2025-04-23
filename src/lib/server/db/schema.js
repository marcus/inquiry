import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const inquiries = sqliteTable('inquiries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
