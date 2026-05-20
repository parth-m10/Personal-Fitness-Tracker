import { Router } from "express";
import { db } from "@workspace/db";
import { exercisesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const exercises = await db.select().from(exercisesTable).orderBy(exercisesTable.id);
  res.json(exercises);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const result = await db.select().from(exercisesTable).where(eq(exercisesTable.id, id));
  if (!result.length) return res.status(404).json({ error: "Not found" });
  res.json(result[0]);
});

export default router;
