import { Router } from "express";
import { db } from "@workspace/db";
import {
  workoutLogsTable,
  exerciseLogsTable,
  exercisesTable,
  appStateTable,
} from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { CreateWorkoutLogBody, UpdateWorkoutLogBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const { startDate, endDate, dayNumber, status, limit = "50", offset = "0" } = req.query as Record<string, string>;

  let query = db.select().from(workoutLogsTable).$dynamic();
  const conditions = [];
  if (startDate) conditions.push(gte(workoutLogsTable.date, startDate));
  if (endDate) conditions.push(lte(workoutLogsTable.date, endDate));
  if (dayNumber) conditions.push(eq(workoutLogsTable.workoutDayNumber, parseInt(dayNumber)));
  if (status) conditions.push(eq(workoutLogsTable.status, status));

  if (conditions.length) query = query.where(and(...conditions));
  const logs = await query.orderBy(desc(workoutLogsTable.date)).limit(parseInt(limit)).offset(parseInt(offset));
  res.json(logs);
});

router.post("/", async (req, res) => {
  const parsed = CreateWorkoutLogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { exerciseLogs: exerciseLogsData, ...logData } = parsed.data as any;

  const inserted = await db.insert(workoutLogsTable).values(logData).returning();
  const workoutLog = inserted[0];

  if (exerciseLogsData && exerciseLogsData.length > 0) {
    await db.insert(exerciseLogsTable).values(
      exerciseLogsData.map((el: any) => ({ ...el, workoutLogId: workoutLog.id }))
    );
  }

  // Advance app state
  const stateRows = await db.select().from(appStateTable).limit(1);
  if (stateRows.length > 0) {
    const state = stateRows[0];
    let nextDay = state.currentWorkoutDayNumber;
    let nextCycle = state.currentCycleNumber;
    if (logData.status !== "skipped" || logData.workoutDayNumber === state.currentWorkoutDayNumber) {
      if (nextDay >= 5) {
        nextDay = 1;
        nextCycle = state.currentCycleNumber + 1;
      } else {
        nextDay = nextDay + 1;
      }
      await db.update(appStateTable)
        .set({ currentCycleNumber: nextCycle, currentWorkoutDayNumber: nextDay, lastCompletedDate: logData.date })
        .where(eq(appStateTable.id, state.id));
    }
  }

  res.status(201).json(workoutLog);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const log = await db.select().from(workoutLogsTable).where(eq(workoutLogsTable.id, id));
  if (!log.length) return res.status(404).json({ error: "Not found" });

  const exerciseLogs = await db
    .select({ el: exerciseLogsTable, exercise: exercisesTable })
    .from(exerciseLogsTable)
    .innerJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .where(eq(exerciseLogsTable.workoutLogId, id));

  res.json({
    ...log[0],
    exerciseLogs: exerciseLogs.map((r) => ({ ...r.el, exercise: r.exercise })),
  });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateWorkoutLogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const updated = await db.update(workoutLogsTable).set(parsed.data).where(eq(workoutLogsTable.id, id)).returning();
  if (!updated.length) return res.status(404).json({ error: "Not found" });
  res.json(updated[0]);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(workoutLogsTable).where(eq(workoutLogsTable.id, id));
  res.status(204).send();
});

export default router;
