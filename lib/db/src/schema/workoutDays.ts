import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { exercisesTable } from "./exercises";
import { relations } from "drizzle-orm";

export const workoutDaysTable = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull().unique(),
  focus: text("focus").notNull(),
});

export const workoutDayExercisesTable = pgTable("workout_day_exercises", {
  id: serial("id").primaryKey(),
  workoutDayId: integer("workout_day_id").notNull().references(() => workoutDaysTable.id),
  exerciseId: integer("exercise_id").notNull().references(() => exercisesTable.id),
  exerciseOrder: integer("exercise_order").notNull(),
  targetSets: integer("target_sets"),
  targetReps: text("target_reps"),
  targetDurationSeconds: integer("target_duration_seconds"),
  targetWeightKg: real("target_weight_kg"),
  restBetweenSetsSec: integer("rest_between_sets_sec"),
  restBetweenExercisesSec: integer("rest_between_exercises_sec"),
});

export const workoutDaysRelations = relations(workoutDaysTable, ({ many }) => ({
  exercises: many(workoutDayExercisesTable),
}));

export const workoutDayExercisesRelations = relations(workoutDayExercisesTable, ({ one }) => ({
  workoutDay: one(workoutDaysTable, {
    fields: [workoutDayExercisesTable.workoutDayId],
    references: [workoutDaysTable.id],
  }),
  exercise: one(exercisesTable, {
    fields: [workoutDayExercisesTable.exerciseId],
    references: [exercisesTable.id],
  }),
}));

export const insertWorkoutDaySchema = createInsertSchema(workoutDaysTable).omit({ id: true });
export type InsertWorkoutDay = z.infer<typeof insertWorkoutDaySchema>;
export type WorkoutDay = typeof workoutDaysTable.$inferSelect;

export const insertWorkoutDayExerciseSchema = createInsertSchema(workoutDayExercisesTable).omit({ id: true });
export type InsertWorkoutDayExercise = z.infer<typeof insertWorkoutDayExerciseSchema>;
export type WorkoutDayExercise = typeof workoutDayExercisesTable.$inferSelect;
