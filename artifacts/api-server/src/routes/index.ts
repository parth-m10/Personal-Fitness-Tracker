import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appStateRouter from "./appState";
import exercisesRouter from "./exercises";
import workoutDaysRouter from "./workoutDays";
import workoutLogsRouter from "./workoutLogs";
import exerciseLogsRouter from "./exerciseLogs";
import bodyMetricsRouter from "./bodyMetrics";
import userTargetsRouter from "./userTargets";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/app-state", appStateRouter);
router.use("/exercises", exercisesRouter);
router.use("/workout-days", workoutDaysRouter);
router.use("/workout-logs", workoutLogsRouter);
router.use("/exercise-logs", exerciseLogsRouter);
router.use("/body-metrics", bodyMetricsRouter);
router.use("/user-targets", userTargetsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
