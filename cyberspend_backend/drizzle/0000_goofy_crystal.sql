CREATE TYPE "public"."criticality" AS ENUM('Low', 'Medium', 'High', 'Critical');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"value" real NOT NULL,
	"criticality" "criticality" NOT NULL,
	"internet_exposed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "controls" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"cost" real NOT NULL,
	"risk_reduction_pct" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insider_threat_events" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_department" text NOT NULL,
	"employee_campus" text NOT NULL,
	"employee_position" text NOT NULL,
	"employee_seniority_years" integer NOT NULL,
	"is_contractor" integer NOT NULL,
	"employee_classification" integer NOT NULL,
	"has_foreign_citizenship" integer NOT NULL,
	"has_criminal_record" integer NOT NULL,
	"has_medical_history" integer NOT NULL,
	"employee_origin_country" text NOT NULL,
	"total_printed_pages" integer NOT NULL,
	"num_printed_pages_off_hours" integer NOT NULL,
	"total_files_burned" integer NOT NULL,
	"burned_from_other" integer NOT NULL,
	"is_abroad" integer NOT NULL,
	"trip_day_number" real,
	"hostility_country_level" integer NOT NULL,
	"num_entries" integer NOT NULL,
	"num_unique_campus" integer NOT NULL,
	"late_exit_flag" integer NOT NULL,
	"entry_during_weekend" integer NOT NULL,
	"is_malicious" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vulnerabilities" (
	"id" text PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"name" text NOT NULL,
	"cvss" real NOT NULL,
	"exploit_available" boolean DEFAULT false NOT NULL,
	"control_effectiveness" real DEFAULT 0 NOT NULL,
	"discovered_on" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vulnerabilities" ADD CONSTRAINT "vulnerabilities_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;