import { Router } from "express";
import { db } from "@workspace/db";
import {
  workoutLogsTable,
  exerciseLogsTable,
  exercisesTable,
  bodyMetricsTable,
  appStateTable,
  workoutDaysTable,
} from "@workspace/db";
import { eq, and, gte, lte, desc, sql, sum, count, inArray } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const stateRows = await db.select().from(appStateTable).limit(1);
  const state = stateRows[0] ?? { currentCycleNumber: 1, currentWorkoutDayNumber: 1, lastCompletedDate: null };

  const currentDay = await db.select().from(workoutDaysTable).where(eq(workoutDaysTable.dayNumber, state.currentWorkoutDayNumber)).limit(1);
  const currentWorkoutFocus = currentDay[0]?.focus ?? "Workout";

  const latestWeight = await db.select().from(bodyMetricsTable).where(sql`${bodyMetricsTable.weightKg} IS NOT NULL`).orderBy(desc(bodyMetricsTable.date)).limit(1);

  const allLogs = await db.select().from(workoutLogsTable).orderBy(workoutLogsTable.date);

  const totalWorkoutsCompleted = allLogs.filter((l) => l.status === "completed").length;
  const totalCyclesCompleted = Math.max(0, state.currentCycleNumber - 1);
  const missedSkippedCount = allLogs.filter((l) => l.status === "skipped").length;

  // Weekly completion
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekLogs = allLogs.filter((l) => l.date >= weekStartStr);
  const weeklyWorkoutTarget = 5;
  const weeklyCompletionPercent = weekLogs.length > 0 ? Math.min(100, (weekLogs.filter(l => l.status === "completed").length / weeklyWorkoutTarget) * 100) : 0;

  // Monthly completion
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthLogs = allLogs.filter((l) => l.date >= monthStart);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const workingDaysInMonth = Math.ceil(daysInMonth * (5 / 7));
  const monthlyCompletionPercent = monthLogs.length > 0 ? Math.min(100, (monthLogs.filter(l => l.status === "completed").length / workingDaysInMonth) * 100) : 0;

  // Totals
  const totalCaloriesBurned = allLogs.reduce((s, l) => s + (l.totalCalories ?? 0), 0);
  const totalCyclingMinutes = allLogs.reduce((s, l) => s + (l.totalCyclingMinutes ?? 0), 0);

  const volumeRows = await db.select({ total: sum(exerciseLogsTable.totalVolume) }).from(exerciseLogsTable);
  const totalStrengthVolume = Number(volumeRows[0]?.total ?? 0);

  // Streak calculation
  const completedDates = allLogs
    .filter((l) => l.status === "completed")
    .map((l) => l.date)
    .sort()
    .reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  if (completedDates.length > 0) {
    let streak = 1;
    let maxStreak = 1;
    for (let i = 1; i < completedDates.length; i++) {
      const d1 = new Date(completedDates[i - 1]);
      const d2 = new Date(completedDates[i]);
      const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 2) streak++;
      else streak = 1;
      maxStreak = Math.max(maxStreak, streak);
    }
    longestStreak = maxStreak;

    // Current streak: check if last completed is recent
    const lastDate = new Date(completedDates[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) currentStreak = streak;
  }

  res.json({
    currentCycleNumber: state.currentCycleNumber,
    currentWorkoutDayNumber: state.currentWorkoutDayNumber,
    currentWorkoutFocus,
    latestWeightKg: latestWeight[0]?.weightKg ?? null,
    totalWorkoutsCompleted,
    totalCyclesCompleted,
    weeklyCompletionPercent,
    monthlyCompletionPercent,
    totalCaloriesBurned,
    totalCyclingMinutes,
    totalStrengthVolume,
    currentStreak,
    longestStreak,
    missedSkippedCount,
    bestExerciseImprovement: null,
    weeklyWorkoutTarget,
  });
});

router.get("/weekly-stats", async (req, res) => {
  const weeks: { weekLabel: string; completed: number; partial: number; skipped: number; totalCalories: number; totalCyclingMinutes: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);

    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];

    const logs = await db.select().from(workoutLogsTable)
      .where(and(gte(workoutLogsTable.date, startStr), lte(workoutLogsTable.date, endStr)));

    weeks.push({
      weekLabel: `${startStr.slice(5)}`,
      completed: logs.filter((l) => l.status === "completed").length,
      partial: logs.filter((l) => l.status === "partial").length,
      skipped: logs.filter((l) => l.status === "skipped").length,
      totalCalories: logs.reduce((s, l) => s + (l.totalCalories ?? 0), 0),
      totalCyclingMinutes: logs.reduce((s, l) => s + (l.totalCyclingMinutes ?? 0), 0),
    });
  }

  res.json(weeks);
});

router.get("/cycle-comparison", async (req, res) => {
  const allLogs = await db.select().from(workoutLogsTable).orderBy(workoutLogsTable.cycleNumber);
  const cycles: Record<number, { cycleNumber: number; completed: number; partial: number; skipped: number; totalVolume: number; totalCalories: number }> = {};

  for (const log of allLogs) {
    if (!cycles[log.cycleNumber]) {
      cycles[log.cycleNumber] = { cycleNumber: log.cycleNumber, completed: 0, partial: 0, skipped: 0, totalVolume: 0, totalCalories: 0 };
    }
    const c = cycles[log.cycleNumber];
    if (log.status === "completed") c.completed++;
    else if (log.status === "partial") c.partial++;
    else if (log.status === "skipped") c.skipped++;
    c.totalCalories += log.totalCalories ?? 0;

    const elRows = await db.select({ total: sum(exerciseLogsTable.totalVolume) })
      .from(exerciseLogsTable)
      .where(eq(exerciseLogsTable.workoutLogId, log.id));
    c.totalVolume += Number(elRows[0]?.total ?? 0);
  }

  res.json(Object.values(cycles));
});

router.get("/calendar", async (req, res) => {
  const { year, month } = req.query as Record<string, string>;
  const now = new Date();
  const y = year ? parseInt(year) : now.getFullYear();
  const m = month ? parseInt(month) : now.getMonth() + 1;

  // "today" on the server — dates strictly before this can be missed
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const daysInMonth = new Date(y, m, 0).getDate();
  const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
  const endStr = `${y}-${String(m).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // All logs for this month
  const logs = await db.select().from(workoutLogsTable)
    .where(and(gte(workoutLogsTable.date, startStr), lte(workoutLogsTable.date, endStr)));

  const workoutDays = await db.select().from(workoutDaysTable);
  const dayMap = Object.fromEntries(workoutDays.map((d) => [d.dayNumber, d.focus]));

  // Earliest ever log — "expected" period starts from this date
  const firstLogResult = await db
    .select({ minDate: sql<string | null>`MIN(${workoutLogsTable.date})` })
    .from(workoutLogsTable);
  const firstLogDate = firstLogResult[0]?.minDate ?? null;

  // Last log before this month — used to seed the expected day/cycle counter
  let expectedDay = 1;
  let expectedCycle = 1;
  if (firstLogDate) {
    const dayBeforeMonth = new Date(y, m - 1, 0); // Last day of previous month
    const dayBeforeMonthStr = `${dayBeforeMonth.getFullYear()}-${String(dayBeforeMonth.getMonth() + 1).padStart(2, "0")}-${String(dayBeforeMonth.getDate()).padStart(2, "0")}`;

    if (firstLogDate <= dayBeforeMonthStr) {
      const lastBeforeRows = await db
        .select()
        .from(workoutLogsTable)
        .where(and(gte(workoutLogsTable.date, firstLogDate), lte(workoutLogsTable.date, dayBeforeMonthStr)))
        .orderBy(desc(workoutLogsTable.date))
        .limit(1);
      if (lastBeforeRows.length > 0) {
        const last = lastBeforeRows[0];
        expectedDay = last.workoutDayNumber >= 5 ? 1 : last.workoutDayNumber + 1;
        expectedCycle = last.workoutDayNumber >= 5 ? last.cycleNumber + 1 : last.cycleNumber;
      }
    }
  }

  // Exercise summaries for logs in this month (one batch query)
  const logIds = logs.map((l) => l.id);
  const exerciseRows = logIds.length > 0
    ? await db
        .select({
          workoutLogId: exerciseLogsTable.workoutLogId,
          exerciseId: exerciseLogsTable.exerciseId,
          exerciseName: exercisesTable.name,
          status: exerciseLogsTable.status,
        })
        .from(exerciseLogsTable)
        .innerJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
        .where(inArray(exerciseLogsTable.workoutLogId, logIds))
    : [];

  const exercisesByLog = new Map<number, typeof exerciseRows>();
  for (const row of exerciseRows) {
    if (!exercisesByLog.has(row.workoutLogId)) exercisesByLog.set(row.workoutLogId, []);
    exercisesByLog.get(row.workoutLogId)!.push(row);
  }

  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const log = logs.find((l) => l.date === date);

    if (log) {
      result.push({
        date,
        status: log.status,
        workoutDayNumber: log.workoutDayNumber,
        cycleNumber: log.cycleNumber,
        focus: dayMap[log.workoutDayNumber] ?? null,
        workoutLogId: log.id,
        notes: log.notes ?? null,
        totalCalories: log.totalCalories ?? null,
        totalCyclingMinutes: log.totalCyclingMinutes ?? null,
        exerciseSummary: (exercisesByLog.get(log.id) ?? []).map((r) => ({
          exerciseId: r.exerciseId,
          exerciseName: r.exerciseName,
          status: r.status,
        })),
      });
      // Advance expected pointer after each real log
      expectedDay = log.workoutDayNumber >= 5 ? 1 : log.workoutDayNumber + 1;
      expectedCycle = log.workoutDayNumber >= 5 ? log.cycleNumber + 1 : log.cycleNumber;
    } else if (firstLogDate && date >= firstLogDate && date < todayStr) {
      // Missed: past date within the "active" period with no log recorded
      result.push({
        date,
        status: "missed",
        workoutDayNumber: expectedDay,
        cycleNumber: expectedCycle,
        focus: dayMap[expectedDay] ?? null,
        workoutLogId: null,
        notes: null,
        totalCalories: null,
        totalCyclingMinutes: null,
        exerciseSummary: null,
      });
      // Do NOT advance expected pointer — same workout still pending
    } else {
      // Rest / future / before first-ever log
      result.push({
        date,
        status: null,
        workoutDayNumber: null,
        cycleNumber: null,
        focus: null,
        workoutLogId: null,
        notes: null,
        totalCalories: null,
        totalCyclingMinutes: null,
        exerciseSummary: null,
      });
    }
  }

  res.json(result);
});

router.get("/volume-by-exercise", async (req, res) => {
  const rows = await db
    .select({
      exerciseId: exerciseLogsTable.exerciseId,
      exerciseName: exercisesTable.name,
      totalVolume: sum(exerciseLogsTable.totalVolume),
      sessionCount: count(exerciseLogsTable.id),
    })
    .from(exerciseLogsTable)
    .innerJoin(exercisesTable, eq(exerciseLogsTable.exerciseId, exercisesTable.id))
    .where(sql`${exerciseLogsTable.totalVolume} IS NOT NULL AND ${exerciseLogsTable.totalVolume} > 0`)
    .groupBy(exerciseLogsTable.exerciseId, exercisesTable.name)
    .orderBy(sql`SUM(${exerciseLogsTable.totalVolume}) DESC`)
    .limit(15);

  res.json(rows.map((r) => ({
    exerciseId: r.exerciseId,
    exerciseName: r.exerciseName,
    totalVolume: Number(r.totalVolume ?? 0),
    sessionCount: Number(r.sessionCount ?? 0),
  })));
});

router.get("/completion-breakdown", async (req, res) => {
  const rows = await db.select().from(workoutLogsTable);
  const completed = rows.filter((r) => r.status === "completed").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const skipped = rows.filter((r) => r.status === "skipped").length;
  res.json({ completed, partial, skipped, total: rows.length });
});

export default router;
