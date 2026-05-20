import { Router } from "express";
import { db } from "@workspace/db";
import { appStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateAppStateBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  let state = await db.select().from(appStateTable).limit(1);
  if (state.length === 0) {
    const inserted = await db.insert(appStateTable).values({ currentCycleNumber: 1, currentWorkoutDayNumber: 1 }).returning();
    return res.json(inserted[0]);
  }
  res.json(state[0]);
});

router.patch("/", async (req, res) => {
  const parsed = UpdateAppStateBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  let state = await db.select().from(appStateTable).limit(1);
  if (state.length === 0) {
    const inserted = await db.insert(appStateTable).values({ currentCycleNumber: 1, currentWorkoutDayNumber: 1 }).returning();
    state = inserted;
  }
  const updated = await db.update(appStateTable).set(parsed.data).where(eq(appStateTable.id, state[0].id)).returning();
  res.json(updated[0]);
});

export default router;
