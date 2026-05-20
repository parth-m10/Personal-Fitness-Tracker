import { Router } from "express";
import { db } from "@workspace/db";
import { workoutDaysTable, workoutDayExercisesTable, exercisesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

  return {
    ...day[0],
    exercises: dayExercises.map((r) => ({ ...r.wde, exercise: r.exercise })),
  };
}

router.get("/", async (req, res) => {
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
