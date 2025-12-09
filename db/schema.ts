import { pgTable, serial, text, timestamp, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. WEBSITES TABLE (Projects)
export const websites = pgTable('websites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // From Clerk
  name: text('name').notNull(),      // e.g. "My Portfolio"
  url: text('url').notNull(),        // e.g. "https://myportfolio.com"
  createdAt: timestamp('created_at').defaultNow(),
});

// RELATIONS: A Website has many Pages
export const websitesRelations = relations(websites, ({ many }) => ({
  pages: many(pages),
}));

// 2. PAGES TABLE (Specific URLs to monitor)
export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').references(() => websites.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),      // e.g. "/about-us" or "/"
  
  // The Baseline (Master Copy)
  baselineUrl: text('baseline_url'), // URL to the image in storage
  
  // The Last Check Result
  lastCheckTime: timestamp('last_check_time'),
  lastDiffPercent: doublePrecision('last_diff_percent').default(0), // e.g. 5.23
  status: text('status').default('clean'), // 'clean' | 'changed' | 'error'
});

// RELATIONS: A Page belongs to one Website and has many Snapshots
export const pagesRelations = relations(pages, ({ one, many }) => ({
  website: one(websites, {
    fields: [pages.websiteId],
    references: [websites.id],
  }),
  snapshots: many(snapshots),
}));

// 3. SNAPSHOTS TABLE (History)
export const snapshots = pgTable('snapshots', {
  id: serial('id').primaryKey(),
  pageId: integer('page_id').references(() => pages.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  diffUrl: text('diff_url'), // The pink overlay image
  diffPercent: doublePrecision('diff_percent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RELATIONS: A Snapshot belongs to one Page
export const snapshotsRelations = relations(snapshots, ({ one }) => ({
  page: one(pages, {
    fields: [snapshots.pageId],
    references: [pages.id],
  }),
}));