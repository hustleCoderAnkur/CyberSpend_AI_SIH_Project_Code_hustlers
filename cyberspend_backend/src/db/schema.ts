import { pgTable, text, integer, real, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const criticalityEnum = pgEnum('criticality', ['Low', 'Medium', 'High', 'Critical'])

export const assets = pgTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  value: real('value').notNull(), // INR
  criticality: criticalityEnum('criticality').notNull(),
  internetExposed: boolean('internet_exposed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const vulnerabilities = pgTable('vulnerabilities', {
  id: text('id').primaryKey(),
  assetId: text('asset_id')
    .notNull()
    .references(() => assets.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  cvss: real('cvss').notNull(),
  exploitAvailable: boolean('exploit_available').notNull().default(false),
  controlEffectiveness: real('control_effectiveness').notNull().default(0), // 0-1
  discoveredOn: timestamp('discovered_on').defaultNow().notNull(),
})

export const controls = pgTable('controls', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  cost: real('cost').notNull(), // INR
  riskReductionPct: real('risk_reduction_pct').notNull(), // 0-1
})

export type AssetRow = typeof assets.$inferSelect
export type NewAssetRow = typeof assets.$inferInsert
export type VulnerabilityRow = typeof vulnerabilities.$inferSelect
export type NewVulnerabilityRow = typeof vulnerabilities.$inferInsert
export type ControlRow = typeof controls.$inferSelect
export type NewControlRow = typeof controls.$inferInsert
