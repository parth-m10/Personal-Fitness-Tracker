import { Router } from "express";
import { db } from "@workspace/db";
import { exerciseLogsTable, exercisesTable, workoutLogsTable } from "@workspace/db";
import { eq, gte, desc, sql } from "drizzle-orm";
import { CreateExerciseLogBody, UpdateExerciseLogBody, FetchExerciseHistoryQueryParams } from "@workspace/api-zod";

const router = Router();

router.post("/", async (req, res) => {
  const parsed = CreateExerciseLogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const inserted = await db.insert(exerciseLogsTable).values(parsed.data as any).returning();
  const withExercise = await db
    .select({ el: exerciseLogsTable, exercise: exercisesTable })
    .from(exerciseLogsTable)
    .innerJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .where(eq(exerciseLogsTable.id, inserted[0].id));
  res.status(201).json({ ...withExercise[0].el, exercise: withExercise[0].exercise });
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateExerciseLogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  await db.update(exerciseLogsTable).set(parsed.data).where(eq(exerciseLogsTable.id, id));
  const updated = await db
    .select({ el: exerciseLogsTable, exercise: exercisesTable })
    .from(exerciseLogsTable)
    .innerJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .where(eq(exerciseLogsTable.id, id));
  if (!updated.length) return res.status(404).json({ error: "Not found" });
  res.json({ ...updated[0].el, exercise: updated[0].exercise });
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  await db.delete(exerciseLogsTable).where(eq(exerciseLogsTable.id, id));
  res.status(204).send();
});

router.get("/by-workout/:workoutLogId", async (req, res) => {
  const workoutLogId = parseInt(req.params.workoutLogId);
  if (isNaN(workoutLogId)) return res.status(400).json({ error: "Invalid id" });
  const logs = await db
    .select({ el: exerciseLogsTable, exercise: exercisesTable })
    .from(exerciseLogsTable)
    .innerJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .where(eq(exerciseLogsTable.workoutLogId, workoutLogId));
  res.json(logs.map((r) => ({ ...r.el, exercise: r.exercise })));
});

router.get("/previous-session", async (req, res) => {
  const dayNumber = parseInt(req.query.dayNumber as string);
  if (isNaN(dayNumber)) return res.status(400).json({ error: "dayNumber is required" });

  // Find the most recent workout log for this day number
  const lastLog = await db
    .select()
    .from(workoutLogsTable)
    .where(eq(workoutLogsTable.workoutDayNumber, dayNumber))
    .orderBy(desc(workoutLogsTable.date))
    .limit(1);

  if (!lastLog.length) {
    return res.json({ date: null, entries: [] });
  }

  const exerciseLogs = await db
    .select()
    .from(exerciseLogsTable)
    .where(eq(exerciseLogsTable.workoutLogId, lastLog[0].id));

  res.json({
    date: lastLog[0].date,
    entries: exerciseLogs.map((el) => ({
      exerciseId: el.exerciseId,
      actualSets: el.actualSets,
      actualReps: el.actualReps,
      actualWeightKg: el.actualWeightKg,
      actualDurationSeconds: el.actualDurationSeconds,
      formQuality: el.formQuality,
    })),
  });
});

router.get("/progress", async (req, res) => {
  const qp = FetchExerciseHistoryQueryParams.safeParse(req.query);
  if (!qp.success) return res.status(400).json({ error: "exerciseId is required" });
  const { exerciseId, days } = qp.data;

  const exercise = await db.select().from(exercisesTable).where(eq(exercisesTable.id, exerciseId)).limit(1);
  if (!exercise.length) return res.status(404).json({ error: "Exercise not found" });

  let dateFilter;
  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    dateFilter = gte(workoutLogsTable.date, cutoffStr);
  }

  let query = db
    .select({ el: exerciseLogsTable, wl: workoutLogsTable })
    .from(exerciseLogsTable)
    .innerJoin(workoutLogsTable, eq(exerciseLogsTable.workoutLogId, workoutLogsTable.id))
    .where(eq(exerciseLogsTable.exerciseId, exerciseId))
    .$dynamic();

  if (dateFilter) query = query.where(dateFilter);
  const rows = await query.orderBy(desc(workoutLogsTable.date));

  const history = rows.map((r) => ({
    date: r.wl.date,
    actualSets: r.el.actualSets,
    actualReps: r.el.actualReps,
    actualWeightKg: r.el.actualWeightKg,
    actualDurationSeconds: r.el.actualDurationSeconds,
    totalVolume: r.el.totalVolume,
    formQuality: r.el.formQuality,
    cycleNumber: r.wl.cycleNumber,
  }));

  const weights = history.map((h) => h.actualWeightKg).filter((w): w is number => w !== null && w !== undefined);
  const reps = history.map((h) => h.actualReps).filter((r): r is number => r !== null && r !== undefined);
  const volumes = history.map((h) => h.totalVolume).filter((v): v is number => v !== null && v !== undefined);

  const personalBestWeight = weights.length ? Math.max(...weights) : null;
  const personalBestReps = reps.length ? Math.max(...reps) : null;
  const personalBestVolume = volumes.length ? Math.max(...volumes) : null;

  const firstWeight = history.slice().reverse().find((h) => h.actualWeightKg)?.actualWeightKg ?? null;
  const latestWeight = weights[0] ?? null;
  let improvementPercent = null;
  if (firstWeight && latestWeight && firstWeight > 0) {
    improvementPercent = ((latestWeight - firstWeight) / firstWeight) * 100;
  }

  res.json({
    exerciseId,
    exerciseName: exercise[0].name,
    history,
    personalBestWeight,
    personalBestReps,
    personalBestVolume,
    lastPerformedDate: rows[0]?.wl.date ?? null,
    firstLoggedWeight: firstWeight,
    improvementPercent,
  });
});

export default router;
