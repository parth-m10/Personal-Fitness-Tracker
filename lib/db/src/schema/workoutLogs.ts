import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { exercisesTable } from "./exercises";
import { relations } from "drizzle-orm";

export const workoutLogsTable = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  cycleNumber: integer("cycle_number").notNull(),
  workoutDayNumber: integer("workout_day_number").notNull(),
  status: text("status").notNull(),
  totalCalories: real("total_calories"),
  totalCyclingMinutes: real("total_cycling_minutes"),
  energyLevel: text("energy_level"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exerciseLogsTable = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  workoutLogId: integer("workout_log_id").notNull().references(() => workoutLogsTable.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercisesTable.id),
  status: text("status").notNull(),
  actualSets: integer("actual_sets"),
  actualReps: integer("actual_reps"),
  actualWeightKg: real("actual_weight_kg"),
  actualDurationSeconds: integer("actual_duration_seconds"),
  totalVolume: real("total_volume"),
  formQuality: text("form_quality"),
  painDiscomfort: boolean("pain_discomfort"),
  notes: text("notes"),
});

export const workoutLogsRelations = relations(workoutLogsTable, ({ many }) => ({
  exerciseLogs: many(exerciseLogsTable),
}));

export const exerciseLogsRelations = relations(exerciseLogsTable, ({ one }) => ({
  workoutLog: one(workoutLogsTable, {
    fields: [exerciseLogsTable.workoutLogId],
    references: [workoutLogsTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [exerciseLogsTable.exerciseId],
    references: [exercisesTable.id],
  }),
}));

export const insertWorkoutLogSchema = createInsertSchema(workoutLogsTable).omit({ id: true, createdAt: true });
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof workoutLogsTable.$inferSelect;

export const insertExerciseLogSchema = createInsertSchema(exerciseLogsTable).omit({ id: true });
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;
export type ExerciseLog = typeof exerciseLogsTable.$inferSelect;
