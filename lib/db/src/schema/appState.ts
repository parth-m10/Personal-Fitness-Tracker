import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appStateTable = pgTable("app_state", {
  id: serial("id").primaryKey(),
  currentCycleNumber: integer("current_cycle_number").notNull().default(1),
  currentWorkoutDayNumber: integer("current_workout_day_number").notNull().default(1),
  lastCompletedDate: text("last_completed_date"),
});

export const insertAppStateSchema = createInsertSchema(appStateTable).omit({ id: true });
export type InsertAppState = z.infer<typeof insertAppStateSchema>;
export type AppState = typeof appStateTable.$inferSelect;
