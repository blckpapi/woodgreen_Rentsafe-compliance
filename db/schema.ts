import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const monitorState = sqliteTable('monitor_state', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
  checkedAt: text('checked_at').notNull(),
  lastAttempt: text('last_attempt'),
  warning: text('warning'),
  leaseUntil: integer('lease_until').notNull().default(0),
  feedReadAt: integer('feed_read_at').notNull().default(0),
});
export const events = sqliteTable(
  'monitor_events',
  {
    id: text('id').primaryKey(),
    buildingId: text('building_id').notNull(),
    kind: text('kind').notNull(),
    message: text('message').notNull(),
    observedAt: text('observed_at').notNull(),
    reviewed: integer('reviewed').notNull().default(0),
  },
  (table) => [index('idx_monitor_events_observed_at').on(table.observedAt)],
);
