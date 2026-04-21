CREATE TYPE "public"."block" AS ENUM('mobility', 'basics', 'main', 'cardio');--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text,
	"equipment" text
);
--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"exercise_id" integer NOT NULL,
	"block" "block" NOT NULL,
	"order" integer NOT NULL,
	"notes" text,
	"workout_id" integer,
	"mobility_session_id" integer,
	"cardio_session_id" integer
);
--> statement-breakpoint
CREATE TABLE "sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_exercise_id" integer NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" integer,
	"rpe" numeric(3, 1),
	"rir" integer,
	"tempo" text,
	"is_warmup" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user_exercise_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" integer NOT NULL,
	"reference_1rm" numeric(6, 2),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_exercise_stats_user_id_exercise_id_unique" UNIQUE("user_id","exercise_id")
);
--> statement-breakpoint
DROP TABLE "basics_session_exercises" CASCADE;--> statement-breakpoint
DROP TABLE "basics_session_sets" CASCADE;--> statement-breakpoint
DROP TABLE "workout_exercises" CASCADE;--> statement-breakpoint
DROP TABLE "workout_sets" CASCADE;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_mobility_session_id_mobility_sessions_id_fk" FOREIGN KEY ("mobility_session_id") REFERENCES "public"."mobility_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercises" ADD CONSTRAINT "session_exercises_cardio_session_id_cardio_sessions_id_fk" FOREIGN KEY ("cardio_session_id") REFERENCES "public"."cardio_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_exercise_stats" ADD CONSTRAINT "user_exercise_stats_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;