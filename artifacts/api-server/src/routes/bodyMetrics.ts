import { Router } from "express";
import { db } from "@workspace/db";
import { bodyMetricsTable } from "@workspace/db";
import { eq, gte, desc } from "drizzle-orm";
import { CreateBodyMetricBody, UpdateBodyMetricBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const { days } = req.query as Record<string, string>;
  let query = db.select().from(bodyMetricsTable).$dynamic();
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    query = query.where(gte(bodyMetricsTable.date, cutoff.toISOString().split("T")[0]));
  }
  const metrics = await query.orderBy(desc(bodyMetricsTable.date));
  res.json(metrics);
});

router.post("/", async (req, res) => {
  const parsed = CreateBodyMetricBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const inserted = await db.insert(bodyMetricsTable).values(parsed.data).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateBodyMetricBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const updated = await db.update(bodyMetricsTable).set(parsed.data).where(eq(bodyMetricsTable.id, id)).returning();
  if (!updated.length) return res.status(404).json({ error: "Not found" });
  res.json(updated[0]);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(bodyMetricsTable).where(eq(bodyMetricsTable.id, id));
  res.status(204).send();
});

export default router;
