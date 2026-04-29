import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const blockEnum = pgEnum("block", ["mobility", "basics", "main", "cardio"]);
export const rankEnum = pgEnum("rank", ["E", "D", "C", "B", "A", "S", "S+"]);

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group"),
  equipment: text("equipment"),
});

// ---------------------------------------------------------------------------
// Training blocks & weeks
// ---------------------------------------------------------------------------

export const trainingBlocks = pgTable("training_blocks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trainingWeeks = pgTable("training_weeks", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id")
    .notNull()
    .references(() => trainingBlocks.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  notes: text("notes"),
});

// ---------------------------------------------------------------------------
// Workout (container for a session — either part of a week or standalone)
// ---------------------------------------------------------------------------

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  weekId: integer("week_id")
    .references(() => trainingWeeks.id, { onDelete: "set null" }),
  name: text("name"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Sessions (children of workout)
// ---------------------------------------------------------------------------

export const mobilitySessions = pgTable("mobility_sessions", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
}, (t) => [unique().on(t.workoutId)]);

export const basicsSessions = pgTable("basics_sessions", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  notes: text("notes"),
}, (t) => [unique().on(t.workoutId)]);

export const cardioSessions = pgTable("cardio_sessions", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  type: text("type"),
  durationMinutes: integer("duration_minutes"),
  distanceKm: numeric("distance_km", { precision: 6, scale: 2 }),
  notes: text("notes"),
}, (t) => [unique().on(t.workoutId)]);

// ---------------------------------------------------------------------------
// Session exercises (unified)
// block='mobility'  -> mobilitySessionId set, workoutId/cardioSessionId null
// block='basics'    -> workoutId set, others null
// block='main'      -> workoutId set, others null
// block='cardio'    -> cardioSessionId set, others null
// ---------------------------------------------------------------------------

export const sessionExercises = pgTable("session_exercises", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  block: blockEnum("block").notNull(),
  order: integer("order").notNull(),
  notes: text("notes"),
  // parent FK — only one is set per row
  workoutId: integer("workout_id")
    .references(() => workouts.id, { onDelete: "cascade" }),
  mobilitySessionId: integer("mobility_session_id")
    .references(() => mobilitySessions.id, { onDelete: "cascade" }),
  cardioSessionId: integer("cardio_session_id")
    .references(() => cardioSessions.id, { onDelete: "cascade" }),
});

// ---------------------------------------------------------------------------
// Sets (only for basics + main exercises)
// ---------------------------------------------------------------------------

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  sessionExerciseId: integer("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  reps: integer("reps"),
  rpe: numeric("rpe", { precision: 3, scale: 1 }),
  rir: integer("rir"),
  tempo: text("tempo"),
  isWarmup: boolean("is_warmup").default(false).notNull(),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
});

// ---------------------------------------------------------------------------
// User exercise stats (auto-calculated 1RM per user per exercise)
// ---------------------------------------------------------------------------

export const userExerciseStats = pgTable("user_exercise_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  reference1rm: numeric("reference_1rm", { precision: 6, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.exerciseId)]);

// ---------------------------------------------------------------------------
// Solo Leveling — user level & XP events
// ---------------------------------------------------------------------------

export const userLevels = pgTable("user_levels", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  rank: rankEnum("rank").default("E").notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  lastWorkoutDate: timestamp("last_workout_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const xpEvents = pgTable("xp_events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  xpGained: integer("xp_gained").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const exercisesRelations = relations(exercises, ({ many }) => ({
  sessionExercises: many(sessionExercises),
  userStats: many(userExerciseStats),
}));

export const trainingBlocksRelations = relations(trainingBlocks, ({ many }) => ({
  weeks: many(trainingWeeks),
}));

export const trainingWeeksRelations = relations(trainingWeeks, ({ one, many }) => ({
  block: one(trainingBlocks, {
    fields: [trainingWeeks.blockId],
    references: [trainingBlocks.id],
  }),
  workouts: many(workouts),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  week: one(trainingWeeks, {
    fields: [workouts.weekId],
    references: [trainingWeeks.id],
  }),
  mobilitySession: one(mobilitySessions, {
    fields: [workouts.id],
    references: [mobilitySessions.workoutId],
  }),
  basicsSession: one(basicsSessions, {
    fields: [workouts.id],
    references: [basicsSessions.workoutId],
  }),
  cardioSession: one(cardioSessions, {
    fields: [workouts.id],
    references: [cardioSessions.workoutId],
  }),
  sessionExercises: many(sessionExercises),
}));

export const mobilitySessionsRelations = relations(mobilitySessions, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [mobilitySessions.workoutId],
    references: [workouts.id],
  }),
  sessionExercises: many(sessionExercises),
}));

export const basicsSessionsRelations = relations(basicsSessions, ({ one }) => ({
  workout: one(workouts, {
    fields: [basicsSessions.workoutId],
    references: [workouts.id],
  }),
}));

export const cardioSessionsRelations = relations(cardioSessions, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [cardioSessions.workoutId],
    references: [workouts.id],
  }),
  sessionExercises: many(sessionExercises),
}));

export const sessionExercisesRelations = relations(sessionExercises, ({ one, many }) => ({
  exercise: one(exercises, {
    fields: [sessionExercises.exerciseId],
    references: [exercises.id],
  }),
  workout: one(workouts, {
    fields: [sessionExercises.workoutId],
    references: [workouts.id],
  }),
  mobilitySession: one(mobilitySessions, {
    fields: [sessionExercises.mobilitySessionId],
    references: [mobilitySessions.id],
  }),
  cardioSession: one(cardioSessions, {
    fields: [sessionExercises.cardioSessionId],
    references: [cardioSessions.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  sessionExercise: one(sessionExercises, {
    fields: [sets.sessionExerciseId],
    references: [sessionExercises.id],
  }),
}));

export const userExerciseStatsRelations = relations(userExerciseStats, ({ one }) => ({
  exercise: one(exercises, {
    fields: [userExerciseStats.exerciseId],
    references: [exercises.id],
  }),
}));
