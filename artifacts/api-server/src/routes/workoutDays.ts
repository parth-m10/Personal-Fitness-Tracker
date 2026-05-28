import { Router } from "express";
import { db } from "@workspace/db";
import { workoutDaysTable, workoutDayExercisesTable, exercisesTable, userTargetsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

async function getWorkoutDayWithExercises(dayNumber: number) {
  const day = await db.select().from(workoutDaysTable).where(eq(workoutDaysTable.dayNumber, dayNumber)).limit(1);
  if (!day.length) return null;

  const dayExercises = await db
    .select({
      wde: workoutDayExercisesTable,
      exercise: exercisesTable,
    })
    .from(workoutDayExercisesTable)
    .innerJoin(exercisesTable, eq(workoutDayExercisesTable.exerciseId, exercisesTable.id))
    .where(eq(workoutDayExercisesTable.workoutDayId, day[0].id))
    .orderBy(workoutDayExercisesTable.exerciseOrder);

  // Load user overrides; apply for next workout only (does not touch past logs)
  const exerciseIds = dayExercises.map((r) => r.wde.exerciseId);
  const userTargets =
    exerciseIds.length > 0
      ? await db.select().from(userTargetsTable).where(inArray(userTargetsTable.exerciseId, exerciseIds))
      : [];
  const targetMap = new Map(userTargets.map((t) => [t.exerciseId, t]));

  return {
    ...day[0],
    exercises: dayExercises.map((r) => {
      const ut = targetMap.get(r.wde.exerciseId);
      return {
        ...r.wde,
        targetSets: ut?.targetSets ?? r.wde.targetSets,
        // wde.targetReps is text ("8-12"), user_targets.targetReps is integer
        targetReps: ut?.targetReps != null ? String(ut.targetReps) : r.wde.targetReps,
        targetWeightKg: ut?.targetWeightKg ?? r.wde.targetWeightKg,
        targetDurationSeconds: ut?.targetDurationSeconds ?? r.wde.targetDurationSeconds,
        exercise: r.exercise,
      };
    }),
  };
}

router.get("/", async (_req, res) => {
  const days = await db.select().from(workoutDaysTable).orderBy(workoutDaysTable.dayNumber);
  const result = await Promise.all(days.map((d) => getWorkoutDayWithExercises(d.dayNumber)));
  res.json(result.filter(Boolean));
});

router.get("/:dayNumber", async (req, res) => {
  const dayNumber = parseInt(req.params.dayNumber);
  if (isNaN(dayNumber)) return res.status(400).json({ error: "Invalid day number" });
  const result = await getWorkoutDayWithExercises(dayNumber);
  if (!result) return res.status(404).json({ error: "Not found" });
  res.json(result);
});

export default router;
