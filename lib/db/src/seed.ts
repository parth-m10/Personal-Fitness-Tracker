import { config } from "dotenv";
config({ path: "../../.env" });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import {
  exercisesTable,
  workoutDaysTable,
  workoutDayExercisesTable,
  userTargetsTable,
  appStateTable,
} from "./schema/index.js";

const { Pool } = pg;

// ─── Exercise definitions ─────────────────────────────────────────────────────

const EXERCISES = [
  // Warm-up
  { name: "Jumping Jacks",              category: "warmup",   trackingType: "warmup",   defaultSets: null, defaultReps: null, defaultDurationSeconds: 120,  defaultWeightKg: null, formTip: "Full range of motion, land softly" },
  { name: "Steam Engine",               category: "warmup",   trackingType: "duration", defaultSets: null, defaultReps: null, defaultDurationSeconds: 120,  defaultWeightKg: null, formTip: "Stand tall, bring elbow to opposite knee" },
  { name: "Light Cycling",              category: "cardio",   trackingType: "warmup",   defaultSets: null, defaultReps: null, defaultDurationSeconds: 360,  defaultWeightKg: null, formTip: "Keep resistance low, easy pace" },
  { name: "Cycle Warm-Up",              category: "cardio",   trackingType: "warmup",   defaultSets: null, defaultReps: null, defaultDurationSeconds: 300,  defaultWeightKg: null, formTip: "5 min easy cycling before main session" },
  { name: "Arm Circles",                category: "warmup",   trackingType: "warmup",   defaultSets: null, defaultReps: null, defaultDurationSeconds: 120,  defaultWeightKg: null, formTip: "Forward and backward, small to large" },
  // Strength – reps
  { name: "45-Degree Inclined Pushups", category: "strength", trackingType: "reps",     defaultSets: 4,    defaultReps: 10,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Keep core tight, chest to surface, elbows at 45°" },
  { name: "Negative Pushups",           category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 5,    defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Lower slowly over 3-5 seconds, reset at top" },
  { name: "Knee Pushups",               category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 9,    defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Keep hips in line with shoulders and knees" },
  { name: "Standing Shoulder Press",    category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 11,   defaultDurationSeconds: null, defaultWeightKg: 5,    formTip: "Press directly overhead, avoid arching lower back" },
  { name: "Lateral Raises",             category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 13,   defaultDurationSeconds: null, defaultWeightKg: 3,    formTip: "Slight bend in elbows, control the descent" },
  { name: "Squats",                     category: "strength", trackingType: "reps",     defaultSets: 4,    defaultReps: 13,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Knees track over toes, chest up, sit back into heels" },
  { name: "Lying Leg Abductions",       category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 15,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Slow controlled lift, squeeze glutes at the top" },
  { name: "Lying Leg Scissors",         category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 17,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Keep lower back pressed to floor throughout" },
  { name: "Toe Raises",                 category: "strength", trackingType: "reps",     defaultSets: 4,    defaultReps: 17,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Full range of motion, pause at top" },
  { name: "Bridges",                    category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 15,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Squeeze glutes at the top, keep feet flat" },
  { name: "Bicep Curl",                 category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 11,   defaultDurationSeconds: null, defaultWeightKg: 5,    formTip: "Full range of motion, controlled descent" },
  { name: "Hammer Curl",                category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 11,   defaultDurationSeconds: null, defaultWeightKg: 5,    formTip: "Neutral grip, elbows stay at sides" },
  { name: "Cross-Body Hammer Curl",     category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 10,   defaultDurationSeconds: null, defaultWeightKg: 5,    formTip: "Bring dumbbell across to opposite shoulder" },
  { name: "Tricep Kickback",            category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 13,   defaultDurationSeconds: null, defaultWeightKg: 3,    formTip: "Upper arm parallel to floor, extend fully" },
  { name: "Standing Tricep Extension",  category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 11,   defaultDurationSeconds: null, defaultWeightKg: 5,    formTip: "Keep elbows close to head, full extension" },
  { name: "Full Pushup Attempt",        category: "strength", trackingType: "reps",     defaultSets: 4,    defaultReps: 4,    defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Focus on form, lower as far as comfortable" },
  { name: "Wood Chopper",               category: "strength", trackingType: "reps",     defaultSets: 3,    defaultReps: 15,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Rotate through torso, not just arms" },
  // Core – reps
  { name: "Crunches",                   category: "core",     trackingType: "reps",     defaultSets: 3,    defaultReps: 15,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Focus on squeezing abs, not pulling neck" },
  { name: "Bicycle Crunches",           category: "core",     trackingType: "reps",     defaultSets: 3,    defaultReps: 20,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Slow and controlled, full rotation each rep" },
  { name: "Superman",                   category: "core",     trackingType: "reps",     defaultSets: 3,    defaultReps: 13,   defaultDurationSeconds: null, defaultWeightKg: null, formTip: "Lift arms and legs simultaneously, hold briefly" },
  // Core – duration
  { name: "Plank",                      category: "core",     trackingType: "duration", defaultSets: 3,    defaultReps: null, defaultDurationSeconds: 37,   defaultWeightKg: null, formTip: "Neutral spine, breathe steadily, engage core" },
  { name: "Side Planks",                category: "core",     trackingType: "duration", defaultSets: 3,    defaultReps: null, defaultDurationSeconds: 27,   defaultWeightKg: null, formTip: "Stack feet or stagger, hips lifted throughout" },
  { name: "Flutter Kicks",              category: "core",     trackingType: "duration", defaultSets: 3,    defaultReps: null, defaultDurationSeconds: 30,   defaultWeightKg: null, formTip: "Small controlled kicks, lower back pressed down" },
  // Cardio – duration
  { name: "Mountain Climbers",          category: "cardio",   trackingType: "duration", defaultSets: 4,    defaultReps: null, defaultDurationSeconds: 30,   defaultWeightKg: null, formTip: "Keep hips level, fast controlled pace" },
  { name: "Cycle",                      category: "cardio",   trackingType: "cardio",   defaultSets: 1,    defaultReps: null, defaultDurationSeconds: 1650, defaultWeightKg: null, formTip: "Maintain steady cadence, adjust resistance as needed" },
  { name: "Cooldown",                   category: "cardio",   trackingType: "cardio",   defaultSets: 1,    defaultReps: null, defaultDurationSeconds: 540,  defaultWeightKg: null, formTip: "Easy pace, let heart rate drop gradually" },
] as const;

// ─── Workout day definitions ──────────────────────────────────────────────────

const WORKOUT_DAYS = [
  { dayNumber: 1, focus: "Chest + Shoulders + Core" },
  { dayNumber: 2, focus: "Legs + Obliques" },
  { dayNumber: 3, focus: "Arms + Core" },
  { dayNumber: 4, focus: "Chest + Legs + Conditioning" },
  { dayNumber: 5, focus: "Full Body + Core + Longer Cardio" },
] as const;

// ─── Per-day exercise assignments ─────────────────────────────────────────────
// targetReps is TEXT in the DB so ranges like "8-12" are stored as strings.
// restBetweenSetsSec / restBetweenExercisesSec in seconds.

type DayExercise = {
  name: string;
  exerciseOrder: number;
  targetSets: number | null;
  targetReps: string | null;
  targetDurationSeconds: number | null;
  targetWeightKg: number | null;
  restBetweenSetsSec: number | null;
  restBetweenExercisesSec: number | null;
};

const DAY_EXERCISES: Record<number, DayExercise[]> = {
  // ── Day 1: Chest + Shoulders + Core ──────────────────────────────────────
  1: [
    // Warm-up (split individually)
    { name: "Jumping Jacks",              exerciseOrder: 1,  targetSets: 1, targetReps: null,   targetDurationSeconds: 180,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Steam Engine",               exerciseOrder: 2,  targetSets: 1, targetReps: null,   targetDurationSeconds: 120,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Light Cycling",              exerciseOrder: 3,  targetSets: 1, targetReps: null,   targetDurationSeconds: 360,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    // Main workout
    { name: "45-Degree Inclined Pushups", exerciseOrder: 4,  targetSets: 4, targetReps: "8-12", targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Negative Pushups",           exerciseOrder: 5,  targetSets: 3, targetReps: "5-6",  targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Knee Pushups",               exerciseOrder: 6,  targetSets: 3, targetReps: "8-10", targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Standing Shoulder Press",    exerciseOrder: 7,  targetSets: 3, targetReps: "10-12",targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Lateral Raises",             exerciseOrder: 8,  targetSets: 3, targetReps: "12-15",targetDurationSeconds: null, targetWeightKg: 3,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Crunches",                   exerciseOrder: 9,  targetSets: 3, targetReps: "15",   targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Plank",                      exerciseOrder: 10, targetSets: 3, targetReps: null,   targetDurationSeconds: 37,   targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Cycle",                      exerciseOrder: 11, targetSets: 1, targetReps: null,   targetDurationSeconds: 1650, targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Cooldown",                   exerciseOrder: 12, targetSets: 1, targetReps: null,   targetDurationSeconds: 540,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
  ],

  // ── Day 2: Legs + Obliques ────────────────────────────────────────────────
  2: [
    // Warm-up (split individually)
    { name: "Cycle Warm-Up",              exerciseOrder: 1,  targetSets: 1, targetReps: null,    targetDurationSeconds: 300,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Jumping Jacks",              exerciseOrder: 2,  targetSets: 1, targetReps: null,    targetDurationSeconds: 180,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    // Main workout
    { name: "Squats",                     exerciseOrder: 3,  targetSets: 4, targetReps: "12-15", targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Lying Leg Abductions",       exerciseOrder: 4,  targetSets: 3, targetReps: "15",    targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Lying Leg Scissors",         exerciseOrder: 5,  targetSets: 3, targetReps: "15-20", targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Toe Raises",                 exerciseOrder: 6,  targetSets: 4, targetReps: "15-20", targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Bridges",                    exerciseOrder: 7,  targetSets: 3, targetReps: "15",    targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Side Planks",                exerciseOrder: 8,  targetSets: 3, targetReps: null,    targetDurationSeconds: 27,   targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Mountain Climbers",          exerciseOrder: 9,  targetSets: 4, targetReps: null,    targetDurationSeconds: 30,   targetWeightKg: null, restBetweenSetsSec: 30,   restBetweenExercisesSec: 60  },
    { name: "Cycle",                      exerciseOrder: 10, targetSets: 1, targetReps: null,    targetDurationSeconds: 1650, targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Cooldown",                   exerciseOrder: 11, targetSets: 1, targetReps: null,    targetDurationSeconds: 540,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
  ],

  // ── Day 3: Arms + Core ────────────────────────────────────────────────────
  3: [
    // Warm-up (split individually)
    { name: "Cycle Warm-Up",              exerciseOrder: 1,  targetSets: 1, targetReps: null,    targetDurationSeconds: 300,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Arm Circles",                exerciseOrder: 2,  targetSets: 1, targetReps: null,    targetDurationSeconds: 120,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    // Main workout
    { name: "Bicep Curl",                 exerciseOrder: 3,  targetSets: 3, targetReps: "10-12", targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Hammer Curl",                exerciseOrder: 4,  targetSets: 3, targetReps: "10-12", targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Cross-Body Hammer Curl",     exerciseOrder: 5,  targetSets: 3, targetReps: "10",    targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Tricep Kickback",            exerciseOrder: 6,  targetSets: 3, targetReps: "12-15", targetDurationSeconds: null, targetWeightKg: 3,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Standing Tricep Extension",  exerciseOrder: 7,  targetSets: 3, targetReps: "10-12", targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Bicycle Crunches",           exerciseOrder: 8,  targetSets: 3, targetReps: "20",    targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Flutter Kicks",              exerciseOrder: 9,  targetSets: 3, targetReps: null,    targetDurationSeconds: 30,   targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Plank",                      exerciseOrder: 10, targetSets: 3, targetReps: null,    targetDurationSeconds: 37,   targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Cycle",                      exerciseOrder: 11, targetSets: 1, targetReps: null,    targetDurationSeconds: 1950, targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Cooldown",                   exerciseOrder: 12, targetSets: 1, targetReps: null,    targetDurationSeconds: 540,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
  ],

  // ── Day 4: Chest + Legs + Conditioning ───────────────────────────────────
  4: [
    // Warm-up (split individually)
    { name: "Jumping Jacks",              exerciseOrder: 1,  targetSets: 1, targetReps: null,   targetDurationSeconds: 180,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Cycle Warm-Up",              exerciseOrder: 2,  targetSets: 1, targetReps: null,   targetDurationSeconds: 300,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    // Main workout
    { name: "Full Pushup Attempt",        exerciseOrder: 3,  targetSets: 4, targetReps: "3-5",  targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Negative Pushups",           exerciseOrder: 4,  targetSets: 3, targetReps: "5",    targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Knee Pushups",               exerciseOrder: 5,  targetSets: 3, targetReps: "10-12",targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Squats",                     exerciseOrder: 6,  targetSets: 4, targetReps: "12",   targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Bridges",                    exerciseOrder: 7,  targetSets: 3, targetReps: "15",   targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Wood Chopper",               exerciseOrder: 8,  targetSets: 3, targetReps: "15",   targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Steam Engine",               exerciseOrder: 9,  targetSets: 3, targetReps: null,   targetDurationSeconds: 35,   targetWeightKg: null, restBetweenSetsSec: 30,   restBetweenExercisesSec: 60  },
    { name: "Cycle",                      exerciseOrder: 10, targetSets: 1, targetReps: null,   targetDurationSeconds: 1650, targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Cooldown",                   exerciseOrder: 11, targetSets: 1, targetReps: null,   targetDurationSeconds: 540,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
  ],

  // ── Day 5: Full Body + Core + Longer Cardio ───────────────────────────────
  5: [
    // Warm-up (split individually)
    { name: "Cycle Warm-Up",              exerciseOrder: 1,  targetSets: 1, targetReps: null,    targetDurationSeconds: 300,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Jumping Jacks",              exerciseOrder: 2,  targetSets: 1, targetReps: null,    targetDurationSeconds: 180,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    // Main workout
    { name: "Standing Shoulder Press",    exerciseOrder: 3,  targetSets: 3, targetReps: "10-12", targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Lateral Raises",             exerciseOrder: 4,  targetSets: 3, targetReps: "12-15", targetDurationSeconds: null, targetWeightKg: 3,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Bicep Curl",                 exerciseOrder: 5,  targetSets: 3, targetReps: "10-12", targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Standing Tricep Extension",  exerciseOrder: 6,  targetSets: 3, targetReps: "10-12", targetDurationSeconds: null, targetWeightKg: 5,    restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Squats",                     exerciseOrder: 7,  targetSets: 3, targetReps: "15",    targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 60,   restBetweenExercisesSec: 90  },
    { name: "Superman",                   exerciseOrder: 8,  targetSets: 3, targetReps: "12-15", targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Crunches",                   exerciseOrder: 9,  targetSets: 3, targetReps: "15",    targetDurationSeconds: null, targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Side Planks",                exerciseOrder: 10, targetSets: 3, targetReps: null,    targetDurationSeconds: 25,   targetWeightKg: null, restBetweenSetsSec: 45,   restBetweenExercisesSec: 60  },
    { name: "Cycle",                      exerciseOrder: 11, targetSets: 1, targetReps: null,    targetDurationSeconds: 2250, targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
    { name: "Cooldown",                   exerciseOrder: 12, targetSets: 1, targetReps: null,    targetDurationSeconds: 540,  targetWeightKg: null, restBetweenSetsSec: null, restBetweenExercisesSec: null },
  ],
};

// ─── User targets (weighted exercises only) ───────────────────────────────────
// targetReps is INTEGER in user_targets (single midpoint value, not a range)

type UserTarget = {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg: number;
};

const USER_TARGETS: UserTarget[] = [
  { exerciseName: "Standing Shoulder Press",   targetSets: 3, targetReps: 11, targetWeightKg: 5 },
  { exerciseName: "Lateral Raises",            targetSets: 3, targetReps: 13, targetWeightKg: 3 },
  { exerciseName: "Bicep Curl",                targetSets: 3, targetReps: 11, targetWeightKg: 5 },
  { exerciseName: "Hammer Curl",               targetSets: 3, targetReps: 11, targetWeightKg: 5 },
  { exerciseName: "Cross-Body Hammer Curl",    targetSets: 3, targetReps: 10, targetWeightKg: 5 },
  { exerciseName: "Tricep Kickback",           targetSets: 3, targetReps: 13, targetWeightKg: 3 },
  { exerciseName: "Standing Tricep Extension", targetSets: 3, targetReps: 11, targetWeightKg: 5 },
];

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function upsertExercise(
  db: ReturnType<typeof drizzle>,
  data: (typeof EXERCISES)[number]
): Promise<number> {
  const existing = await db
    .select({ id: exercisesTable.id })
    .from(exercisesTable)
    .where(eq(exercisesTable.name, data.name))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(exercisesTable)
      .set({
        category: data.category,
        trackingType: data.trackingType,
        defaultSets: data.defaultSets,
        defaultReps: data.defaultReps,
        defaultDurationSeconds: data.defaultDurationSeconds,
        defaultWeightKg: data.defaultWeightKg,
        formTip: data.formTip,
      })
      .where(eq(exercisesTable.id, existing[0].id));
    return existing[0].id;
  }

  const [inserted] = await db
    .insert(exercisesTable)
    .values({ ...data })
    .returning({ id: exercisesTable.id });
  return inserted.id;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set — check .env at project root");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    // ── 1. Exercises ──────────────────────────────────────────────────────────
    console.log("Seeding exercises...");
    const exerciseIdMap: Record<string, number> = {};
    for (const ex of EXERCISES) {
      exerciseIdMap[ex.name] = await upsertExercise(db, ex);
    }
    console.log(`  ${Object.keys(exerciseIdMap).length} exercises ready`);

    // ── 2. Workout days ───────────────────────────────────────────────────────
    console.log("Seeding workout days...");
    for (const day of WORKOUT_DAYS) {
      await db
        .insert(workoutDaysTable)
        .values(day)
        .onConflictDoUpdate({
          target: workoutDaysTable.dayNumber,
          set: { focus: day.focus },
        });
    }
    console.log(`  ${WORKOUT_DAYS.length} workout days ready`);

    // ── 3. Workout day exercises ──────────────────────────────────────────────
    console.log("Seeding workout day exercises...");
    let totalLinks = 0;
    for (const day of WORKOUT_DAYS) {
      const [dayRow] = await db
        .select({ id: workoutDaysTable.id })
        .from(workoutDaysTable)
        .where(eq(workoutDaysTable.dayNumber, day.dayNumber))
        .limit(1);

      // Delete existing plan entries for this day (safe — not user logs)
      await db
        .delete(workoutDayExercisesTable)
        .where(eq(workoutDayExercisesTable.workoutDayId, dayRow.id));

      const entries = DAY_EXERCISES[day.dayNumber];
      for (const entry of entries) {
        const exerciseId = exerciseIdMap[entry.name];
        if (!exerciseId) throw new Error(`Exercise not found in map: "${entry.name}"`);

        await db.insert(workoutDayExercisesTable).values({
          workoutDayId: dayRow.id,
          exerciseId,
          exerciseOrder: entry.exerciseOrder,
          targetSets: entry.targetSets,
          targetReps: entry.targetReps,
          targetDurationSeconds: entry.targetDurationSeconds,
          targetWeightKg: entry.targetWeightKg,
          restBetweenSetsSec: entry.restBetweenSetsSec,
          restBetweenExercisesSec: entry.restBetweenExercisesSec,
        });
        totalLinks++;
      }
    }
    console.log(`  ${totalLinks} workout-day-exercise links ready`);

    // ── 4. User targets ───────────────────────────────────────────────────────
    console.log("Seeding user targets...");
    for (const t of USER_TARGETS) {
      const exerciseId = exerciseIdMap[t.exerciseName];
      if (!exerciseId) throw new Error(`Exercise not found for target: "${t.exerciseName}"`);

      await db
        .insert(userTargetsTable)
        .values({
          exerciseId,
          targetSets: t.targetSets,
          targetReps: t.targetReps,
          targetWeightKg: t.targetWeightKg,
        })
        .onConflictDoUpdate({
          target: userTargetsTable.exerciseId,
          set: {
            targetSets: t.targetSets,
            targetReps: t.targetReps,
            targetWeightKg: t.targetWeightKg,
            updatedAt: new Date(),
          },
        });
    }
    console.log(`  ${USER_TARGETS.length} user targets ready`);

    // ── 5. App state (only if table is empty — preserves real progress) ───────
    console.log("Seeding app state...");
    const existingState = await db.select().from(appStateTable).limit(1);
    if (existingState.length === 0) {
      await db.insert(appStateTable).values({
        currentCycleNumber: 1,
        currentWorkoutDayNumber: 1,
      });
      console.log("  App state initialised: cycle 1, day 1");
    } else {
      console.log(
        `  App state already exists (cycle ${existingState[0].currentCycleNumber}, day ${existingState[0].currentWorkoutDayNumber}) — skipped`
      );
    }

    console.log("\nSeed complete.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
