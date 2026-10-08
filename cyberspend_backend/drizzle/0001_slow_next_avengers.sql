CREATE TABLE "imported_datasets" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"format" text NOT NULL,
	"detected_type" text,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
