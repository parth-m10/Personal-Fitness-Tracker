import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exercisesTable = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  trackingType: text("tracking_type").notNull(),
  defaultSets: integer("default_sets"),
  defaultReps: integer("default_reps"),
  defaultDurationSeconds: integer("default_duration_seconds"),
  defaultWeightKg: real("default_weight_kg"),
  formTip: text("form_tip"),
});

export const insertExerciseSchema = createInsertSchema(exercisesTable).omit({ id: true });
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercisesTable.$inferSelect;
