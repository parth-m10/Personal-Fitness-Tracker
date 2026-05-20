import { Router } from "express";
import { db } from "@workspace/db";
import { userTargetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpsertUserTargetBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const targets = await db.select().from(userTargetsTable).orderBy(userTargetsTable.exerciseId);
  res.json(targets);
});

router.put("/", async (req, res) => {
  const parsed = UpsertUserTargetBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const existing = await db.select().from(userTargetsTable).where(eq(userTargetsTable.exerciseId, parsed.data.exerciseId)).limit(1);
  if (existing.length) {
    const updated = await db.update(userTargetsTable).set(parsed.data).where(eq(userTargetsTable.exerciseId, parsed.data.exerciseId)).returning();
    return res.json(updated[0]);
  }
  const inserted = await db.insert(userTargetsTable).values(parsed.data).returning();
  res.json(inserted[0]);
});

export default router;
