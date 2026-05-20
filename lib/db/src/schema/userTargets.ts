import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { exercisesTable } from "./exercises";

export const userTargetsTable = pgTable("user_targets", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercisesTable.id).unique(),
  targetSets: integer("target_sets"),
  targetReps: integer("target_reps"),
  targetWeightKg: real("target_weight_kg"),
  targetDurationSeconds: integer("target_duration_seconds"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserTargetSchema = createInsertSchema(userTargetsTable).omit({ id: true });
export type InsertUserTarget = z.infer<typeof insertUserTargetSchema>;
export type UserTarget = typeof userTargetsTable.$inferSelect;
