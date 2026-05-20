import { pgTable, text, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bodyMetricsTable = pgTable("body_metrics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  weightKg: real("weight_kg"),
  waistCm: real("waist_cm"),
  chestCm: real("chest_cm"),
  bellyCm: real("belly_cm"),
  notes: text("notes"),
});

export const insertBodyMetricSchema = createInsertSchema(bodyMetricsTable).omit({ id: true });
export type InsertBodyMetric = z.infer<typeof insertBodyMetricSchema>;
export type BodyMetric = typeof bodyMetricsTable.$inferSelect;
