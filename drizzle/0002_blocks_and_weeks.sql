CREATE TABLE "training_blocks" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_weeks" (
  "id" serial PRIMARY KEY,
  "block_id" integer NOT NULL,
  "week_number" integer NOT NULL,
  "notes" text,
  CONSTRAINT "training_weeks_block_id_training_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "training_blocks"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "block_type" "block" NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_exercises" (
  "id" serial PRIMARY KEY,
  "template_id" integer NOT NULL,
  "exercise_id" integer NOT NULL,
  "order" integer NOT NULL,
  "default_sets" integer,
  "default_reps" integer,
  "default_rir" integer,
  "notes" text,
  CONSTRAINT "template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "workout_templates"("id") ON DELETE cascade,
  CONSTRAINT "template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "week_id" integer;
--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "name" text;
--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_week_id_training_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "training_weeks"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "workouts" DROP COLUMN "date";
