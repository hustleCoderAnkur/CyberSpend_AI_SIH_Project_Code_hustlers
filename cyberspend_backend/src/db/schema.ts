import {
  pgTable,
  text,
  real,
  boolean,
  timestamp,
  pgEnum,
  integer,
} from 'drizzle-orm/pg-core'

export const criticalityEnum = pgEnum(
  'criticality',
  ['Low', 'Medium', 'High', 'Critical'],
)

/*
|--------------------------------------------------------------------------
| Assets
|--------------------------------------------------------------------------
*/

export const assets = pgTable('assets', {
  id: text('id').primaryKey(),

  name: text('name').notNull(),

  category: text('category').notNull(),

  value: real('value').notNull(), // INR

  criticality: criticalityEnum(
    'criticality',
  ).notNull(),

  internetExposed: boolean(
    'internet_exposed',
  )
    .notNull()
    .default(false),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),
})

/*
|--------------------------------------------------------------------------
| Vulnerabilities
|--------------------------------------------------------------------------
*/

export const vulnerabilities = pgTable(
  'vulnerabilities',
  {
    id: text('id').primaryKey(),

    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id, {
        onDelete: 'cascade',
      }),

    name: text('name').notNull(),

    cvss: real('cvss').notNull(),

    exploitAvailable: boolean(
      'exploit_available',
    )
      .notNull()
      .default(false),

    controlEffectiveness: real(
      'control_effectiveness',
    )
      .notNull()
      .default(0), // 0-1

    discoveredOn: timestamp(
      'discovered_on',
    )
      .defaultNow()
      .notNull(),
  },
)

/*
|--------------------------------------------------------------------------
| Security Controls
|--------------------------------------------------------------------------
*/

export const controls = pgTable(
  'controls',
  {
    id: text('id').primaryKey(),

    name: text('name').notNull(),

    category: text('category').notNull(),

    cost: real('cost').notNull(), // INR

    riskReductionPct: real(
      'risk_reduction_pct',
    ).notNull(), // 0-1
  },
)

/*
|--------------------------------------------------------------------------
| Insider Threat Events
|--------------------------------------------------------------------------
|
| This table stores the cleaned insider-threat dataset.
|
| isMalicious is the ground-truth label from the dataset.
| It should NOT be used as an input feature during prediction.
|
|--------------------------------------------------------------------------
*/

export const insiderThreatEvents = pgTable(
  'insider_threat_events',
  {
    id: text('id').primaryKey(),

    employeeDepartment: text(
      'employee_department',
    ).notNull(),

    employeeCampus: text(
      'employee_campus',
    ).notNull(),

    employeePosition: text(
      'employee_position',
    ).notNull(),

    employeeSeniorityYears: integer(
      'employee_seniority_years',
    ).notNull(),

    isContractor: integer(
      'is_contractor',
    ).notNull(),

    employeeClassification: integer(
      'employee_classification',
    ).notNull(),

    hasForeignCitizenship: integer(
      'has_foreign_citizenship',
    ).notNull(),

    hasCriminalRecord: integer(
      'has_criminal_record',
    ).notNull(),

    hasMedicalHistory: integer(
      'has_medical_history',
    ).notNull(),

    employeeOriginCountry: text(
      'employee_origin_country',
    ).notNull(),

    totalPrintedPages: integer(
      'total_printed_pages',
    ).notNull(),

    numPrintedPagesOffHours: integer(
      'num_printed_pages_off_hours',
    ).notNull(),

    totalFilesBurned: integer(
      'total_files_burned',
    ).notNull(),

    burnedFromOther: integer(
      'burned_from_other',
    ).notNull(),

    isAbroad: integer(
      'is_abroad',
    ).notNull(),

    tripDayNumber: real(
      'trip_day_number',
    ),

    hostilityCountryLevel: integer(
      'hostility_country_level',
    ).notNull(),

    numEntries: integer(
      'num_entries',
    ).notNull(),

    numUniqueCampus: integer(
      'num_unique_campus',
    ).notNull(),

    lateExitFlag: integer(
      'late_exit_flag',
    ).notNull(),

    entryDuringWeekend: integer(
      'entry_during_weekend',
    ).notNull(),

    isMalicious: boolean(
      'is_malicious',
    ).notNull(),

    createdAt: timestamp(
      'created_at',
    )
      .defaultNow()
      .notNull(),
  },
)

export type AssetRow =
  typeof assets.$inferSelect

export type NewAssetRow =
  typeof assets.$inferInsert

export type VulnerabilityRow =
  typeof vulnerabilities.$inferSelect

export type NewVulnerabilityRow =
  typeof vulnerabilities.$inferInsert

export type ControlRow =
  typeof controls.$inferSelect

export type NewControlRow =
  typeof controls.$inferInsert

export type InsiderThreatEventRow =
  typeof insiderThreatEvents.$inferSelect

export type NewInsiderThreatEventRow =
  typeof insiderThreatEvents.$inferInsert